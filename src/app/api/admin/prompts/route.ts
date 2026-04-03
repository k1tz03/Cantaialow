export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const prompts = await prisma.aiPrompt.findMany({
    orderBy: { key: "asc" },
  });

  return NextResponse.json({ prompts });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { id, systemPrompt, userPromptTemplate, model, maxTokens, temperature, isActive } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing prompt id" }, { status: 400 });
  }

  const existing = await prisma.aiPrompt.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  // Create history record before updating
  await prisma.aiPromptHistory.create({
    data: {
      promptId: existing.id,
      systemPrompt: existing.systemPrompt,
      userPromptTemplate: existing.userPromptTemplate,
      model: existing.model,
      maxTokens: existing.maxTokens,
      temperature: existing.temperature,
      modifiedBy: session.user.id,
    },
  });

  const updated = await prisma.aiPrompt.update({
    where: { id },
    data: {
      systemPrompt: systemPrompt ?? existing.systemPrompt,
      userPromptTemplate: userPromptTemplate ?? existing.userPromptTemplate,
      model: model ?? existing.model,
      maxTokens: maxTokens ?? existing.maxTokens,
      temperature: temperature ?? existing.temperature,
      isActive: isActive ?? existing.isActive,
      version: existing.version + 1,
      updatedBy: session.user.id,
    },
  });

  return NextResponse.json({ prompt: updated });
}
