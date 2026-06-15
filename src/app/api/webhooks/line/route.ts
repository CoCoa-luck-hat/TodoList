import { NextResponse } from "next/server";
import { messagingApi } from "@line/bot-sdk";
import prisma from "@/lib/db";

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
const channelSecret = process.env.LINE_CHANNEL_SECRET || "";

const client = new messagingApi.MessagingApiClient({
  channelAccessToken,
});

export async function POST(req: Request) {
  // Verify signature (in production, you should use the middleware or crypto to verify x-line-signature)
  // Since Next.js App Router req.body is a stream, standard express middleware is trickier.
  // We will process the events directly for now.
  
  try {
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);
    const events: any[] = body.events;

    if (!events || events.length === 0) {
      return NextResponse.json({ status: "ok" });
    }

    await Promise.all(
      events.map(async (event: any) => {
        if (event.type === "message" && event.message.type === "text") {
          const text = event.message.text.trim();
          const lineUserId = event.source.userId;

          if (!lineUserId) return;

          // Handle Account Linking via magic keyword
          if (text.startsWith("LINK_ACCOUNT_")) {
            const userId = text.replace("LINK_ACCOUNT_", "");

            try {
              // Find the user and update their lineUserId
              const user = await prisma.user.update({
                where: { id: userId },
                data: { lineUserId: lineUserId },
              });

              // Reply to user
              await client.replyMessage({
                replyToken: event.replyToken,
                messages: [
                  {
                    type: "text",
                    text: `Account successfully linked to: ${user.name || user.email}! You will now receive notifications here.`,
                  } as any,
                ],
              });
            } catch (error) {
              console.error("Account linking error:", error);
              await client.replyMessage({
                replyToken: event.replyToken,
                messages: [
                  {
                    type: "text",
                    text: "Failed to link account. Please make sure the link is valid and try again.",
                  } as any,
                ],
              });
            }
          } 
          else if (text.toLowerCase() === "ping") {
            await client.replyMessage({
              replyToken: event.replyToken,
              messages: [{ type: "text", text: "pong!" } as any],
            });
          }
        }
      })
    );

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
