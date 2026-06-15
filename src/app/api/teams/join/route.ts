import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { inviteCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    // Find team with invite code
    const team = await prisma.team.findUnique({
      where: { inviteCode },
    });

    if (!team) {
      return NextResponse.json({ error: "Invalid invite code or team not found" }, { status: 404 });
    }

    // Check if user is already a member
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: team.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({ success: true, teamId: team.id, alreadyMember: true });
    }

    // Create membership
    await prisma.teamMember.create({
      data: {
        userId,
        teamId: team.id,
        role: "MEMBER",
      },
    });

    return NextResponse.json({ success: true, teamId: team.id });
  } catch (error) {
    console.error("POST Join Team error:", error);
    return NextResponse.json({ error: "Failed to join team" }, { status: 500 });
  }
}
