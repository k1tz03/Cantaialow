import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncEmails } from "@/lib/email/sync";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncEmails(session.user.id, session.user.orgId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
