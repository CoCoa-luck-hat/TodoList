import { NextResponse } from "next/server";
import { Resend } from "resend";
import { TaskAssignedEmail } from "@/emails/TaskAssignedEmail";
import { DailyReportEmail } from "@/emails/DailyReportEmail";
import { DeadlineReminderEmail } from "@/emails/DeadlineReminderEmail";
import prisma from "@/lib/db";

const resend = new Resend(process.env.RESEND_API_KEY);

interface TargetUser {
  id: string;
  email: string | null;
  lineUserId: string | null;
  notificationPreferences: any;
}

async function sendNotificationToUser(
  targetUser: TargetUser,
  type: string,
  data: any,
  appLink: string
) {
  try {
    const prefs = targetUser.notificationPreferences as any || {
      notifyEmail: true,
      notifyLine: false,
      events: {
        taskAssigned: true,
        deadline: true,
        teamInvite: true,
        mention: true,
        summary: true
      }
    };

    // Check if event type is enabled
    const eventKey = type === "TASK_ASSIGNED" ? "taskAssigned" 
                   : type === "DEADLINE" ? "deadline"
                   : type === "TEAM_INVITE" ? "teamInvite"
                   : type === "MENTION" ? "mention"
                   : type === "DAILY_REPORT" ? "summary" : null;

    const emailPromises = [];

    // Helper to check if event type is enabled for a channel
    const isEventEnabled = (channelEvents: any, eventKey: string | null, fallbackEvents: any) => {
      if (!eventKey) return true;
      if (channelEvents && channelEvents[eventKey] !== undefined) {
        return channelEvents[eventKey];
      }
      if (fallbackEvents && fallbackEvents[eventKey] !== undefined) {
        return fallbackEvents[eventKey];
      }
      return true;
    };

    // 1. Send Email (if preferred and enabled for this event)
    const emailEnabled = prefs.notifyEmail && isEventEnabled(prefs.emailEvents, eventKey, prefs.events);
    const recipientEmail = prefs.emailRecipient || targetUser.email;
    if (emailEnabled && recipientEmail) {
      let emailComponent;
      let subject = "New Notification";

      if (type === "TASK_ASSIGNED") {
        subject = `New Task Assigned: ${data.taskTitle}`;
        emailComponent = TaskAssignedEmail({
          taskTitle: data.taskTitle,
          assignedBy: data.assignedBy,
          dueDate: data.dueDate,
          projectOrTeamName: data.projectOrTeamName,
          appLink
        });
      } else if (type === "DEADLINE") {
        subject = `Deadline Reminder: ${data.taskTitle}`;
        emailComponent = DeadlineReminderEmail({
          taskTitle: data.taskTitle,
          dueDate: data.dueDate,
          projectOrTeamName: data.projectOrTeamName,
          appLink
        });
      } else if (type === "DAILY_REPORT") {
        subject = `Daily Status Report from ${data.userName}`;
        emailComponent = DailyReportEmail({
          userName: data.userName,
          reportMessage: data.reportMessage,
          completedTasks: data.completedTasks || [],
          appLink
        });
      }

      if (emailComponent) {
        emailPromises.push(
          resend.emails.send({
            from: "Project To-Do <onboarding@resend.dev>", // TODO: Replace with verified domain
            to: [recipientEmail],
            subject: subject,
            react: emailComponent,
          })
        );
      }
    }

    // 2. Send LINE Notification (if preferred and enabled for this event)
    const lineEnabled = prefs.notifyLine && isEventEnabled(prefs.lineEvents, eventKey, prefs.events);
    if (lineEnabled && targetUser.lineUserId) {
      const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
      if (channelAccessToken) {
        const { messagingApi } = require("@line/bot-sdk");
        const client = new messagingApi.MessagingApiClient({ channelAccessToken });
        
        let messageText = "New Notification!";
        if (type === "TASK_ASSIGNED") {
          messageText = `📝 You have a new task assigned by ${data.assignedBy}:\n"${data.taskTitle}"\n${data.dueDate ? `Due: ${new Date(data.dueDate).toLocaleDateString()}\n` : ""}Link: ${appLink}`;
        } else if (type === "DEADLINE") {
          messageText = `🚨 Deadline Reminder!\nYour task "${data.taskTitle}" is due soon.\n${data.dueDate ? `Due: ${new Date(data.dueDate).toLocaleDateString()}\n` : ""}Link: ${appLink}`;
        } else if (type === "DAILY_REPORT") {
          messageText = `📊 Daily Report from ${data.userName}:\n\n${data.reportMessage}\n\nCompleted: ${data.completedTasks?.length || 0} tasks.`;
        }

        emailPromises.push(
          client.pushMessage({
            to: targetUser.lineUserId,
            messages: [{ type: "text", text: messageText }]
          })
        );
      } else {
        console.warn("LINE_CHANNEL_ACCESS_TOKEN is missing. Cannot send LINE notification.");
      }
    }

    await Promise.all(emailPromises);
  } catch (err) {
    console.error(`Error sending notification to user ${targetUser.id}:`, err);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, type, data, workspaceId, recipientType } = body;

    if (!userId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const appLink = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const notificationPromises = [];

    if (type === "DAILY_REPORT" && recipientType && recipientType !== "self" && workspaceId) {
      if (recipientType === "team") {
        // Find all members of the workspace/team
        const members = await prisma.teamMember.findMany({
          where: { teamId: workspaceId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                lineUserId: true,
                notificationPreferences: true
              }
            }
          }
        });

        for (const m of members) {
          // Send to other members, skip sender
          if (m.user.id !== userId) {
            notificationPromises.push(sendNotificationToUser(m.user, type, data, appLink));
          }
        }
      } else if (recipientType === "manager") {
        // Find owner of the team
        const team = await prisma.team.findUnique({
          where: { id: workspaceId },
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                lineUserId: true,
                notificationPreferences: true
              }
            }
          }
        });

        if (team && team.owner && team.owner.id !== userId) {
          notificationPromises.push(sendNotificationToUser(team.owner, type, data, appLink));
        }
      }
    } else {
      // Default behavior (e.g., TASK_ASSIGNED, DEADLINE, or Personal Space DAILY_REPORT): send to self
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          lineUserId: true,
          notificationPreferences: true
        }
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      notificationPromises.push(sendNotificationToUser(user, type, data, appLink));
    }

    await Promise.all(notificationPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
