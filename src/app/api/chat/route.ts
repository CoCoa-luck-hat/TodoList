import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId") || null;

    if (teamId) {
      // Verify membership
      const isMember = await prisma.teamMember.findFirst({
        where: { teamId, userId },
      });
      if (!isMember) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        teamId: teamId,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 50, // Limit to recent messages
    });

    if (teamId) {
      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId },
        select: { userId: true, lastReadAt: true },
      });
      return NextResponse.json({ messages, teamMembers });
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error("GET Chat Messages error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { text, teamId } = body;

    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    if (teamId) {
      // Verify membership
      const isMember = await prisma.teamMember.findFirst({
        where: { teamId, userId },
      });
      if (!isMember) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        user: session.user.name || session.user.email || "User",
        text,
        userId: session.user.id,
        teamId: teamId || null,
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("POST Chat Message error:", error);
    return NextResponse.json({ error: "Failed to post message" }, { status: 500 });
  }
}
