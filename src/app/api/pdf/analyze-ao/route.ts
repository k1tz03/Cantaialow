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
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "No text to analyze" },
        { status: 400 }
      );
    }

    const result = await callAi({
      userId: session.user.id,
      orgId: session.user.orgId,
      feature: "ao_extraction",
      promptKey: "ao_extraction",
      variables: {
        document: text,
        metier: "",
        langue: session.user.language?.toLowerCase() ?? "fr",
      },
    });

    let parsed;
    try {
      // Try to extract JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result };
    } catch {
      parsed = { raw: result };
    }

    return NextResponse.json(parsed);
  } catch (error) {
    if (error instanceof Error && error.message === "QUOTA_EXCEEDED") {
      return NextResponse.json({ error: "Quota exceeded" }, { status: 429 });
    }
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
