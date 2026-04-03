export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { streamAi } from "@/lib/ai/client";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { message } = (await request.json()) as {
      message: string;
      history?: Array<{ role: string; content: string }>;
    };

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    // Fetch org and user context for the prompt variables
    const [org, activeAffaires] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: session.user.orgId },
        select: { name: true },
      }),
      prisma.affaire.findMany({
        where: { orgId: session.user.orgId, statut: "EN_COURS" },
        select: { titre: true, client: true, statut: true },
        take: 20,
      }),
    ]);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, metier: true, language: true },
    });

    const langueMap: Record<string, string> = {
      FR: "French",
      EN: "English",
      ES: "Spanish",
      PT: "Portuguese",
    };

    const readable = await streamAi({
      userId: session.user.id,
      orgId: session.user.orgId,
      feature: "assistant",
      promptKey: "assistant_system",
      variables: {
        user_name: user?.name ?? session.user.name ?? "User",
        company_name: org?.name ?? "My Company",
        metier: user?.metier ?? "BTP",
        affaires_actives: JSON.stringify(activeAffaires),
        langue: langueMap[user?.language ?? "FR"] ?? "French",
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "QUOTA_EXCEEDED") {
      return NextResponse.json(
        { error: "Quota exceeded" },
        { status: 429 }
      );
    }
    console.error("Assistant error:", error);
    return NextResponse.json(
      { error: "Assistant request failed" },
      { status: 500 }
    );
  }
}
