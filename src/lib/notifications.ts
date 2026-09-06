import prisma from "./db";
import { Resend } from "resend";
import { messagingApi } from "@line/bot-sdk";
import nodemailer from "nodemailer";

// Initialize Resend with env key
const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Initialize Nodemailer SMTP Client (Gmail or custom SMTP)
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || "587");
const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

const smtpTransporter =
  smtpUser && smtpPass
    ? (smtpHost.includes("gmail") || smtpUser.includes("@gmail.com")
        ? nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          })
        : nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          }))
    : null;

// LINE Messaging API Client
const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
const lineClient = lineChannelAccessToken
  ? new messagingApi.MessagingApiClient({ channelAccessToken: lineChannelAccessToken })
  : null;

export interface NotificationPayload {
  title: string;
  body: string;
  type: "create" | "complete" | "reminder";
  taskTitle: string;
  taskStatus?: string;
  taskDueDate?: string;
}

export async function sendNotifications(payload: NotificationPayload, targetUserId?: string) {
  if (!targetUserId) {
    console.warn("sendNotifications called without targetUserId. Skipping to avoid broadcasting.");
    return;
  }

  try {
    // 1. Fetch specific target user and preferences
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        lineUserId: true,
        notificationPreferences: true,
      },
    });

    if (!user) {
      console.warn(`Target user ${targetUserId} not found. Skipping notification.`);
      return;
    }

    const prefs = (user.notificationPreferences as any) || {
      notifyEmail: true,
      notifyLine: false,
      emailEvents: { taskAssigned: true, deadline: true, teamInvite: true, mention: true, summary: true },
      lineEvents: { taskAssigned: true, deadline: true, teamInvite: true, mention: true, summary: true },
    };

    // Determine event key based on payload type
    const eventKey =
      payload.type === "create"
        ? "taskAssigned"
        : payload.type === "complete"
        ? "taskAssigned" // respects general task activity
        : payload.type === "reminder"
        ? "deadline"
        : null;

    const isEventAllowed = (channelEvents: any, fallbackEvents: any) => {
      if (!eventKey) return true;
      if (channelEvents && channelEvents[eventKey] !== undefined) {
        return Boolean(channelEvents[eventKey]);
      }
      if (fallbackEvents && fallbackEvents[eventKey] !== undefined) {
        return Boolean(fallbackEvents[eventKey]);
      }
      return true;
    };

    // 2. Direct LINE Push Message (ONLY if lineUserId exists, notifyLine is enabled, and event is allowed)
    const lineAllowed = Boolean(prefs.notifyLine) && isEventAllowed(prefs.lineEvents, prefs.events);
    if (lineAllowed && user.lineUserId && lineClient) {
      await sendLinePushMessage(user.lineUserId, payload);
    }

    // 3. Direct Email Message (ONLY if email exists, notifyEmail is enabled, and event is allowed)
    const emailAllowed = Boolean(prefs.notifyEmail) && isEventAllowed(prefs.emailEvents, prefs.events);
    const recipientEmail = prefs.emailRecipient || user.email;
    if (emailAllowed && recipientEmail && (smtpTransporter || resend)) {
      await sendEmailDirect(recipientEmail, payload);
    }
  } catch (error) {
    console.error(`Error sending notification to user ${targetUserId}:`, error);
  }
}

async function sendLinePushMessage(lineUserId: string, payload: NotificationPayload) {
  if (!lineClient) return;

  try {
    const headerColor =
      payload.type === "complete" ? "#10B981" : payload.type === "reminder" ? "#EF4444" : "#6366F1";

    await lineClient.pushMessage({
      to: lineUserId,
      messages: [
        {
          type: "flex",
          altText: `${payload.title}: ${payload.taskTitle}`,
          contents: {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              backgroundColor: headerColor,
              paddingAll: "16px",
              contents: [
                {
                  type: "text",
                  text: payload.title,
                  color: "#ffffff",
                  weight: "bold",
                  size: "md",
                },
              ],
            },
            body: {
              type: "box",
              layout: "vertical",
              spacing: "md",
              paddingAll: "20px",
              contents: [
                {
                  type: "text",
                  text: payload.taskTitle,
                  weight: "bold",
                  size: "md",
                  color: "#111827",
                  wrap: true,
                },
                {
                  type: "text",
                  text: payload.body,
                  size: "sm",
                  color: "#64748b",
                  wrap: true,
                },
                payload.taskDueDate
                  ? {
                      type: "box",
                      layout: "horizontal",
                      margin: "md",
                      contents: [
                        {
                          type: "text",
                          text: "กำหนดส่ง:",
                          color: "#64748b",
                          size: "xs",
                          flex: 2,
                        },
                        {
                          type: "text",
                          text: new Date(payload.taskDueDate).toLocaleDateString("th-TH"),
                          weight: "bold",
                          color: "#ef4444",
                          size: "xs",
                          flex: 4,
                        },
                      ],
                    }
                  : { type: "box", layout: "vertical", contents: [] },
              ],
            },
            footer: {
              type: "box",
              layout: "vertical",
              paddingAll: "14px",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  color: headerColor,
                  height: "sm",
                  action: {
                    type: "uri",
                    label: "เปิดดูงาน",
                    uri: process.env.NEXTAUTH_URL || "http://localhost:3000",
                  },
                },
              ],
            },
          },
        },
      ],
    });
    console.log(`LINE Push message sent successfully to user: ${lineUserId}`);
  } catch (error) {
    console.error(`Failed to push LINE message to ${lineUserId}:`, error);
  }
}

async function sendEmailDirect(recipient: string, payload: NotificationPayload) {
  if (!smtpTransporter && !resend) {
    console.warn("Neither SMTP nor Resend is configured. Skipping email send.");
    return;
  }

  try {
    const subject = `[Todo-List] ${payload.title}: ${payload.taskTitle}`;
    const headerColor =
      payload.type === "complete" ? "#10b981" : payload.type === "reminder" ? "#ef4444" : "#6366f1";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
        <h2 style="color: ${headerColor}; margin-bottom: 20px;">${payload.title}</h2>
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h3 style="margin-top: 0; color: #0f172a;">${payload.taskTitle}</h3>
          <p style="color: #64748b; font-size: 14px; line-height: 1.5;">${payload.body}</p>
          ${
            payload.taskDueDate
              ? `<p style="color: #ef4444; font-size: 12px; font-weight: bold;">Due Date: ${new Date(
                  payload.taskDueDate
                ).toLocaleDateString()}</p>`
              : ""
          }
        </div>
        <div style="margin-top: 20px; text-align: center;">
          <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}" style="display: inline-block; background-color: ${headerColor}; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">เปิดดูงานในระบบ</a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 20px;">Sent automatically from your Todo-List Dashboard</p>
      </div>
    `;

    // 1. Try Gmail SMTP first (allows sending to any user email freely)
    if (smtpTransporter) {
      try {
        const rawFrom = process.env.EMAIL_FROM || (smtpUser ? `Todo-List <${smtpUser}>` : undefined);
        const text = `${payload.title}: ${payload.taskTitle}\n\n${payload.body}\n${
          payload.taskDueDate
            ? `กำหนดส่ง: ${new Date(payload.taskDueDate).toLocaleDateString()}\n`
            : ""
        }\nเปิดดูงานในระบบ: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}\n\nส่งอัตโนมัติจากระบบ Todo-List Dashboard`;

        const info = await smtpTransporter.sendMail({
          from: rawFrom || "Todo-List <noreply@gmail.com>",
          to: recipient,
          replyTo: smtpUser || undefined,
          subject,
          text,
          html,
          headers: {
            "X-Application": "Todo-List-Dashboard",
            "X-Auto-Response-Suppress": "OOF, AutoReply",
          },
        });
        console.log(`[SMTP] Email notification sent successfully to ${recipient} (Message ID: ${info.messageId})`);
        return;
      } catch (smtpErr) {
        console.error(`[SMTP] Failed to send email to ${recipient}:`, smtpErr);
        // Continue to fallback if Resend is configured
      }
    }

    // 2. Fallback to Resend if SMTP is not active or encountered error
    if (resend) {
      const result = await resend.emails.send({
        from: "Todo Dashboard <onboarding@resend.dev>",
        to: [recipient],
        subject,
        html,
      });

      if (result.error) {
        console.error(`Resend email send error to ${recipient}:`, result.error);
      } else {
        console.log(`[Resend] Email notification sent successfully to ${recipient}`);
      }
    }
  } catch (error) {
    console.error(`Failed to send email to ${recipient}:`, error);
  }
}
