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
    let recipientEmail = prefs.emailRecipient || targetUser.email;
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
        
        let messagePayload: any = { type: "text", text: "New Notification!" };

        if (type === "TASK_ASSIGNED") {
          messagePayload = {
            type: "flex",
            altText: `📌 มอบหมายงานใหม่: ${data.taskTitle}`,
            contents: {
              type: "bubble",
              header: {
                type: "box",
                layout: "vertical",
                backgroundColor: "#4F46E5",
                paddingAll: "16px",
                contents: [
                  {
                    type: "text",
                    text: "📝 มอบหมายงานใหม่",
                    weight: "bold",
                    color: "#FFFFFF",
                    size: "md"
                  }
                ]
              },
              body: {
                type: "box",
                layout: "vertical",
                spacing: "md",
                paddingAll: "20px",
                contents: [
                  {
                    type: "text",
                    text: data.taskTitle || "ไม่มีชื่อโครงการ",
                    weight: "bold",
                    size: "md",
                    color: "#111827",
                    wrap: true
                  },
                  {
                    type: "separator",
                    color: "#E5E7EB"
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    spacing: "xs",
                    contents: [
                      {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                          {
                            type: "text",
                            text: "ผู้มอบหมาย:",
                            color: "#6B7280",
                            size: "sm",
                            flex: 2
                          },
                          {
                            type: "text",
                            text: data.assignedBy || "ระบบ",
                            weight: "bold",
                            color: "#4B5563",
                            size: "sm",
                            flex: 3
                          }
                        ]
                      },
                      {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                          {
                            type: "text",
                            text: "กำหนดส่ง:",
                            color: "#6B7280",
                            size: "sm",
                            flex: 2
                          },
                          {
                            type: "text",
                            text: data.dueDate ? new Date(data.dueDate).toLocaleDateString("th-TH") : "ไม่ระบุ",
                            weight: "bold",
                            color: "#4B5563",
                            size: "sm",
                            flex: 3
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              footer: {
                type: "box",
                layout: "vertical",
                paddingAll: "16px",
                contents: [
                  {
                    type: "button",
                    style: "primary",
                    color: "#4F46E5",
                    height: "sm",
                    action: {
                      type: "uri",
                      label: "เปิดดูงาน",
                      uri: appLink
                    }
                  }
                ]
              }
            }
          };
        } else if (type === "DEADLINE") {
          messagePayload = {
            type: "flex",
            altText: `⏰ งานใกล้ครบกำหนดส่ง: ${data.taskTitle}`,
            contents: {
              type: "bubble",
              header: {
                type: "box",
                layout: "vertical",
                backgroundColor: "#EF4444",
                paddingAll: "16px",
                contents: [
                  {
                    type: "text",
                    text: "⏰ แจ้งเตือนครบกำหนดส่ง",
                    weight: "bold",
                    color: "#FFFFFF",
                    size: "md"
                  }
                ]
              },
              body: {
                type: "box",
                layout: "vertical",
                spacing: "md",
                paddingAll: "20px",
                contents: [
                  {
                    type: "text",
                    text: data.taskTitle || "งานที่มอบหมาย",
                    weight: "bold",
                    size: "md",
                    color: "#111827",
                    wrap: true
                  },
                  {
                    type: "separator",
                    color: "#E5E7EB"
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "text",
                        text: "กำหนดส่ง:",
                        color: "#6B7280",
                        size: "sm",
                        flex: 2
                      },
                      {
                        type: "text",
                        text: data.dueDate ? new Date(data.dueDate).toLocaleDateString("th-TH", { day: 'numeric', month: 'long', year: 'numeric' }) : "วันนี้",
                        weight: "bold",
                        color: "#EF4444",
                        size: "sm",
                        flex: 3
                      }
                    ]
                  }
                ]
              },
              footer: {
                type: "box",
                layout: "vertical",
                paddingAll: "16px",
                contents: [
                  {
                    type: "button",
                    style: "primary",
                    color: "#EF4444",
                    height: "sm",
                    action: {
                      type: "uri",
                      label: "เปิดดูบอร์ดงาน",
                      uri: appLink
                    }
                  }
                ]
              }
            }
          };
        } else if (type === "DAILY_REPORT") {
          const completedCount = data.completedTasks?.length || 0;
          messagePayload = {
            type: "flex",
            altText: `📊 รายงานสถานะประจำวันของ ${data.userName}`,
            contents: {
              type: "bubble",
              header: {
                type: "box",
                layout: "vertical",
                backgroundColor: "#6366F1",
                paddingAll: "16px",
                contents: [
                  {
                    type: "text",
                    text: "📊 DAILY STATUS REPORT",
                    weight: "bold",
                    color: "#FFFFFF",
                    size: "md",
                    align: "center"
                  }
                ]
              },
              body: {
                type: "box",
                layout: "vertical",
                spacing: "md",
                paddingAll: "20px",
                contents: [
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "text",
                        text: "ผู้ส่งรายงาน:",
                        color: "#6B7280",
                        size: "sm",
                        flex: 2
                      },
                      {
                        type: "text",
                        text: data.userName || "ผู้ใช้",
                        weight: "bold",
                        color: "#111827",
                        size: "sm",
                        flex: 3
                      }
                    ]
                  },
                  {
                    type: "separator",
                    color: "#E5E7EB"
                  },
                  {
                    type: "text",
                    text: "📝 รายละเอียดอัปเดตงาน:",
                    weight: "bold",
                    size: "sm",
                    color: "#374151"
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#F9FAFB",
                    paddingAll: "12px",
                    cornerRadius: "8px",
                    borderWidth: "1px",
                    borderColor: "#E5E7EB",
                    contents: [
                      {
                        type: "text",
                        text: data.reportMessage || "ไม่มีรายละเอียดระบุไว้",
                        wrap: true,
                        size: "sm",
                        color: "#4B5563"
                      }
                    ]
                  },
                  {
                    type: "separator",
                    color: "#E5E7EB"
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "text",
                        text: "งานที่เสร็จวันนี้:",
                        color: "#6B7280",
                        size: "sm",
                        flex: 2
                      },
                      {
                        type: "text",
                        text: `${completedCount} งาน`,
                        weight: "bold",
                        color: completedCount > 0 ? "#10B981" : "#EF4444",
                        size: "sm",
                        flex: 1,
                        align: "end"
                      }
                    ]
                  }
                ]
              },
              footer: {
                type: "box",
                layout: "vertical",
                paddingAll: "16px",
                contents: [
                  {
                    type: "button",
                    style: "primary",
                    color: "#6366F1",
                    height: "sm",
                    action: {
                      type: "uri",
                      label: "เปิดดูบอร์ดงาน",
                      uri: appLink
                    }
                  }
                ]
              }
            }
          };
        }

        emailPromises.push(
          client.pushMessage({
            to: targetUser.lineUserId,
            messages: [messagePayload]
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
