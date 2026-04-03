export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callAi } from "@/lib/ai/client";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { subject, preview } = await request.json();

    const result = await callAi({
      userId: session.user.id,
      orgId: session.user.orgId,
      feature: "email_classification",
      promptKey: "email_classification",
      variables: {
        email_subject: subject ?? "",
        email_preview: preview ?? "",
      },
    });

    const parsed = JSON.parse(result);
    return NextResponse.json(parsed);
  } catch (error) {
    if (error instanceof Error && error.message === "QUOTA_EXCEEDED") {
      return NextResponse.json(
        { error: "Quota exceeded" },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Classification failed" },
      { status: 500 }
    );
  }
}
