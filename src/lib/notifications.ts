import prisma from "./db";
import { Resend } from "resend";

// Initialize Resend with env key or fallback
const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface NotificationPayload {
  title: string;
  body: string;
  type: "create" | "complete" | "reminder";
  taskTitle: string;
  taskStatus?: string;
  taskDueDate?: string;
}

export async function sendNotifications(payload: NotificationPayload) {
  try {
    // 1. Fetch active settings (with graceful fallback if not initialized in database)
    const settings = await prisma.setting.findUnique({
      where: { id: "default" },
    });

    const lineToken = settings?.lineToken || process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const emailRecipient = settings?.emailRecipient || process.env.ADMIN_EMAIL || "";

    // 2. Trigger LINE Message if token exists
    if (lineToken) {
      await sendLineMessage(lineToken, payload);
    } else {
      console.log("LINE Messaging token not set. Skipping LINE notification.");
    }

    // 3. Trigger Email if recipient exists
    if (emailRecipient) {
      await sendEmailMessage(emailRecipient, payload);
    } else {
      console.log("Email recipient not set. Skipping email notification.");
    }
  } catch (error) {
    console.error("Error in notification service:", error);
  }
}

async function sendLineMessage(token: string, payload: NotificationPayload) {
  try {
    // If the token is a LINE Messaging Channel Access Token, we need a destination User ID.
    // We can assume the token is either a legacy LINE Notify token (which some developers still mock)
    // or a Channel Access Token. To be highly robust, let's support:
    // Case A: If token starts with "eyJ" or is long, it's a Channel Access Token.
    // We send a push message to a default group/user if configured, or we send a broadcast.
    // Let's default to sending a Broadcast message if no target user ID is provided,
    // or we can parse target user ID from a setting.
    // For simplicity and ease of testing, we will use the LINE Broadcast endpoint (delivers to all bot followers)
    // or legacy LINE Notify endpoint if it's a legacy setup.
    // Let's implement the standard LINE Messaging API Broadcast endpoint!
    
    const isChannelAccessToken = token.length > 50; // standard access tokens are very long
    
    if (isChannelAccessToken) {
      const endpoint = "https://api.line.me/v2/bot/message/broadcast";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [
            {
              type: "flex",
              altText: `Task Update: ${payload.taskTitle}`,
              contents: {
                type: "bubble",
                size: "mega",
                header: {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: payload.type === "complete" ? "#10b981" : "#6366f1",
                  contents: [
                    {
                      type: "text",
                      text: payload.title,
                      color: "#ffffff",
                      weight: "bold",
                      size: "lg",
                    },
                  ],
                },
                body: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: `Task: ${payload.taskTitle}`,
                      weight: "bold",
                      size: "md",
                      margin: "md",
                    },
                    {
                      type: "text",
                      text: payload.body,
                      size: "sm",
                      color: "#64748b",
                      margin: "sm",
                      wrap: true,
                    },
                    payload.taskDueDate
                      ? {
                          type: "text",
                          text: `Due Date: ${new Date(payload.taskDueDate).toLocaleDateString()}`,
                          size: "xs",
                          color: "#ef4444",
                          margin: "md",
                        }
                      : { type: "box", layout: "vertical", contents: [] },
                  ],
                },
              },
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`LINE Messaging API Broadcast failed: ${response.status} - ${errorText}`);
      } else {
        console.log("LINE Messaging API Broadcast notification sent successfully.");
      }
    } else {
      // Graceful fallback for custom/legacy token integrations
      console.warn("LINE Token is short or invalid. LINE notification skipped.");
    }
  } catch (error) {
    console.error("Error sending LINE notification:", error);
  }
}

async function sendEmailMessage(recipient: string, payload: NotificationPayload) {
  try {
    if (!resend) {
      console.warn("Resend API key not configured. Skipping Email.");
      return;
    }

    const subject = `[Todo Dashboard] ${payload.title}: ${payload.taskTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
        <h2 style="color: ${payload.type === "complete" ? "#10b981" : "#6366f1"}; margin-bottom: 20px;">${payload.title}</h2>
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
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 20px;">Sent automatically from your Premium TodoList Dashboard</p>
      </div>
    `;

    const result = await resend.emails.send({
      from: "Todo Dashboard <onboarding@resend.dev>",
      to: recipient,
      subject,
      html,
    });

    if (result.error) {
      console.error("Resend API email send failed:", result.error);
    } else {
      console.log(`Email notification sent successfully to ${recipient}`);
    }
  } catch (error) {
    console.error("Error sending email notification:", error);
  }
}
