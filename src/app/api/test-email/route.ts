import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to") || "morporkuatichart@gmail.com";

  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || "587");
  const rawFrom = process.env.EMAIL_FROM || (smtpUser ? `Todo-List <${smtpUser}>` : undefined);
  const from = rawFrom ? rawFrom.replace(/\\"/g, "").trim() : undefined;

  const envStatus = {
    hasSmtpUser: Boolean(smtpUser),
    smtpUserValue: smtpUser ? `${smtpUser.slice(0, 3)}***@${smtpUser.split("@")[1] || ""}` : "MISSING",
    hasSmtpPass: Boolean(smtpPass),
    passLength: smtpPass ? smtpPass.length : 0,
    smtpHost,
    smtpPort,
    from,
  };

  if (!smtpUser || !smtpPass) {
    return NextResponse.json({
      success: false,
      message: "Missing SMTP_USER or SMTP_PASS environment variables on this server.",
      envStatus,
    }, { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const verifyResult = await transporter.verify();
    console.log("[Test Email] SMTP verification:", verifyResult);

    const info = await transporter.sendMail({
      from,
      to,
      subject: "ทดสอบส่งอีเมลจาก Vercel Serverless (สำเร็จ)",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #10b981;">🎉 ทดสอบระบบอีเมลจาก Vercel สำเร็จ!</h2>
          <p>อีเมลนี้ถูกส่งตรงจาก Vercel Serverless Function ของโปรเจกต์ Todo-List</p>
          <p>ส่งไปยัง: <b>${to}</b></p>
          <p>เวลาที่ส่ง: <b>${new Date().toISOString()}</b></p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `Email successfully sent to ${to}`,
      messageId: info.messageId,
      envStatus,
    });
  } catch (error: any) {
    console.error("[Test Email Error]:", error);
    return NextResponse.json({
      success: false,
      message: error?.message || "Failed to send email",
      code: error?.code,
      command: error?.command,
      response: error?.response,
      envStatus,
    }, { status: 500 });
  }
}
