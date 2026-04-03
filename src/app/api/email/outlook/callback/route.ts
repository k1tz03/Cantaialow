import { NextResponse } from "next/server";
import { exchangeOutlookCode } from "@/lib/email/outlook";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const userId = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error || !code || !userId) {
    return NextResponse.redirect(
      new URL("/settings?error=outlook_auth_failed", request.url)
    );
  }

  try {
    const tokens = await exchangeOutlookCode(code);

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailConnected: true,
        emailProvider: "OUTLOOK",
        emailToken: tokens.access_token,
        emailRefreshToken: tokens.refresh_token,
      },
    });

    return NextResponse.redirect(
      new URL("/settings?success=outlook_connected", request.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/settings?error=outlook_auth_failed", request.url)
    );
  }
}
