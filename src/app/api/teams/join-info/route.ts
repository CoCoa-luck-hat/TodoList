import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Missing invite code" }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { inviteCode: code },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: team.name,
      memberCount: team._count.members,
    });
  } catch (error) {
    console.error("GET Team Join Info error:", error);
    return NextResponse.json({ error: "Failed to fetch invite details" }, { status: 500 });
  }
}
