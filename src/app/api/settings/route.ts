import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    let settings = await prisma.setting.findUnique({
      where: { id: "default" },
    });

    // Initialize with default values if not exists
    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          id: "default",
          lineToken: "",
          emailRecipient: "",
          pomodoroDuration: 25,
          pomodoroBreak: 5,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET Settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lineToken, emailRecipient, pomodoroDuration, pomodoroBreak } = body;

    const settings = await prisma.setting.upsert({
      where: { id: "default" },
      update: {
        lineToken,
        emailRecipient,
        pomodoroDuration: Number(pomodoroDuration) || 25,
        pomodoroBreak: Number(pomodoroBreak) || 5,
      },
      create: {
        id: "default",
        lineToken,
        emailRecipient,
        pomodoroDuration: Number(pomodoroDuration) || 25,
        pomodoroBreak: Number(pomodoroBreak) || 5,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("POST Settings error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
