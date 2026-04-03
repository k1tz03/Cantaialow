import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendGmailMessage } from "@/lib/email/gmail";
import { sendOutlookMessage } from "@/lib/email/outlook";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { to, subject, body, inReplyTo } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { emailProvider: true },
    });

    if (!user.emailProvider) {
      return NextResponse.json(
        { error: "No email provider connected" },
        { status: 400 }
      );
    }

    if (user.emailProvider === "GMAIL") {
      await sendGmailMessage(session.user.id, to, subject, body, inReplyTo);
    } else {
      await sendOutlookMessage(session.user.id, to, subject, body, inReplyTo);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
