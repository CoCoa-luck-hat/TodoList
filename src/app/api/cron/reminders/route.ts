import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  // Add authentication/authorization here for production (e.g. secret header check)
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Calculate the timeframe for "due soon" (e.g., next 24 hours)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find all tasks that are due within the next 24 hours and not yet DONE
    const upcomingTasks = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: tomorrow,
        },
        status: {
          not: "DONE"
        },
        assigneeId: {
          not: null
        }
      },
      include: {
        assignee: true,
        project: {
          include: {
            team: true
          }
        }
      }
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    let sentCount = 0;

    for (const task of upcomingTasks) {
      if (task.assigneeId) {
        let teamName = task.project?.team?.name || "your project";

        // Dispatch notification
        await fetch(`${baseUrl}/api/notifications/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: task.assigneeId,
            type: "DEADLINE",
            data: {
              taskTitle: task.title,
              dueDate: task.dueDate,
              projectOrTeamName: teamName,
            }
          })
        });
        sentCount++;
      }
    }

    return NextResponse.json({ success: true, remindersSent: sentCount });
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json({ error: "Failed to run cron job" }, { status: 500 });
  }
}
