export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({ success: true });

    if (!email) return successResponse;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase(), deletedAt: null },
    });

    if (!user) return successResponse;

    // Rate limit: max 3 per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTokens = await prisma.passwordResetToken.count({
      where: {
        userId: user.id,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentTokens >= 3) return successResponse;

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // In production, send email with the reset link
    // For now, log it (would use SMTP in production)
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${rawToken}`;
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("Reset URL:", resetUrl);
    }

    return successResponse;
  } catch {
    return NextResponse.json({ success: true });
  }
}
