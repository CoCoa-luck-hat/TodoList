import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { teamId } = await params;

    // Verify membership of requester
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("GET Members error:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { teamId } = await params;

    const { searchParams } = new URL(request.url);
    const memberUserId = searchParams.get("userId");

    if (!memberUserId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Get team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Allow team owner to remove members, or a member to remove (leave) themselves
    if (team.ownerId !== userId && userId !== memberUserId) {
      return NextResponse.json({ error: "Forbidden (Owner only or self-exit)" }, { status: 403 });
    }

    // Owner cannot leave or delete themselves from team ownership
    if (team.ownerId === memberUserId) {
      return NextResponse.json({ error: "Owner cannot be removed from the team" }, { status: 400 });
    }

    // 1. Delete membership
    await prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId: memberUserId,
          teamId,
        },
      },
    });

    // 2. Clean up task assignments in this team for this member
    await prisma.taskAssignee.deleteMany({
      where: {
        userId: memberUserId,
        task: { teamId },
      },
    });

    // 3. For tasks where assigneeId was this member, reassign to remaining assignee or set null (Unassigned)
    const affectedTasks = await prisma.task.findMany({
      where: { teamId, assigneeId: memberUserId },
      include: {
        assignees: { take: 1 },
      },
    });

    for (const t of affectedTasks) {
      const fallbackAssignee = t.assignees[0]?.userId || null;
      await prisma.task.update({
        where: { id: t.id },
        data: { assigneeId: fallbackAssignee },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Member error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
