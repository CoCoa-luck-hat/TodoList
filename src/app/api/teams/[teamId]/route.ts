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

    // Verify user is a member of the team
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
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
        },
      },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error("GET Team by ID error:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function PATCH(
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

    // Check if the user is the Owner of the team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden (Owner only)" }, { status: 403 });
    }

    const { name, description, color, inviteCode } = await request.json();

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: name !== undefined ? name : team.name,
        description: description !== undefined ? description : team.description,
        color: color !== undefined ? color : team.color,
        inviteCode: inviteCode !== undefined ? inviteCode : team.inviteCode,
      },
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error("PATCH Team error:", error);
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
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

    // Check if user is the Owner
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden (Owner only)" }, { status: 403 });
    }

    await prisma.team.delete({
      where: { id: teamId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Team error:", error);
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}
