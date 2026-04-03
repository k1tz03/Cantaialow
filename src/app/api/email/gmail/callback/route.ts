import { NextResponse } from "next/server";
import { exchangeGmailCode } from "@/lib/email/gmail";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const userId = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error || !code || !userId) {
    return NextResponse.redirect(
      new URL("/settings?error=gmail_auth_failed", request.url)
    );
  }

  try {
    const tokens = await exchangeGmailCode(code);

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailConnected: true,
        emailProvider: "GMAIL",
        emailToken: tokens.access_token,
        emailRefreshToken: tokens.refresh_token,
      },
    });

    return NextResponse.redirect(
      new URL("/settings?success=gmail_connected", request.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/settings?error=gmail_auth_failed", request.url)
    );
  }
}
