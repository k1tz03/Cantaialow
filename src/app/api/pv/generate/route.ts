export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { streamAi } from "@/lib/ai/client";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { affaireData, emailsSummary, reserves } = await request.json();

    const stream = await streamAi({
      userId: session.user.id,
      orgId: session.user.orgId,
      feature: "pv_generation",
      promptKey: "pv_generation",
      variables: {
        affaire_data: JSON.stringify(affaireData ?? {}),
        emails_summary: emailsSummary ?? "",
        reserves: reserves ?? "",
        langue: session.user.language?.toLowerCase() ?? "fr",
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "QUOTA_EXCEEDED") {
      return NextResponse.json({ error: "Quota exceeded" }, { status: 429 });
    }
    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 }
    );
  }
}
