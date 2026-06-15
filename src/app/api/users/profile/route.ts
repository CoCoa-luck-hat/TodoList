import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        lineUserId: true,
        notificationPreferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Self-healing: if lineUserId is null but a LINE account is linked, link them now!
    if (!user.lineUserId) {
      const lineAccount = await prisma.account.findFirst({
        where: {
          userId: user.id,
          provider: "line"
        }
      });
      if (lineAccount) {
        try {
          // Clear lineUserId from other users to preserve unique constraint
          await prisma.user.updateMany({
            where: {
              lineUserId: lineAccount.providerAccountId,
              id: { not: user.id }
            },
            data: { lineUserId: null }
          });

          // Update current user
          const updated = await prisma.user.update({
            where: { id: user.id },
            data: { lineUserId: lineAccount.providerAccountId },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              lineUserId: true,
              notificationPreferences: true,
            }
          });
          user = updated;
        } catch (err) {
          console.error("Failed to self-heal lineUserId:", err);
        }
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET Profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationPreferences, disconnectLine, name, image } = body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image;

    if (notificationPreferences) {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { notificationPreferences: true }
      });
      const currentPrefs = (currentUser?.notificationPreferences as any) || {};
      updateData.notificationPreferences = {
        ...currentPrefs,
        ...notificationPreferences
      };
    }

    if (disconnectLine) {
      updateData.lineUserId = null;
      // delete OAuth account entry to clean up NextAuth linking state
      await prisma.account.deleteMany({
        where: {
          userId: session.user.id,
          provider: "line"
        }
      });
      // also disable line notifications if disconnected
      const currentPrefs = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { notificationPreferences: true }
      });
      const prefs = (currentPrefs?.notificationPreferences as any) || {
        notifyEmail: true,
        notifyLine: false,
        emailEvents: { taskAssigned: true, deadline: true, teamInvite: true, mention: true, summary: true },
        lineEvents: { taskAssigned: true, deadline: true, teamInvite: true, mention: true, summary: true }
      };
      prefs.notifyLine = false;
      updateData.notificationPreferences = prefs;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        lineUserId: true,
        notificationPreferences: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("PATCH Profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
