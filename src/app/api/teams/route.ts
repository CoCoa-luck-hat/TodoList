import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // Fetch teams the user belongs to
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error("GET Teams error:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { name, description, color } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    // Create team and add the owner as a member
    const team = await prisma.team.create({
      data: {
        name,
        description,
        color: color || "#6366f1",
        ownerId: userId,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
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
    console.error("POST Create Team error:", error);
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}
