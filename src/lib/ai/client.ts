import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import type { AiModel } from "@prisma/client";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL_MAP: Record<AiModel, string> = {
  HAIKU: "claude-haiku-4-5-20251001",
  SONNET: "claude-sonnet-4-6",
};

const COST_RATES: Record<AiModel, { input: number; output: number }> = {
  HAIKU: { input: 0.0000008, output: 0.000004 },
  SONNET: { input: 0.000003, output: 0.000015 },
};

interface PromptConfig {
  key: string;
  systemPrompt: string;
  userPromptTemplate: string;
  model: AiModel;
  maxTokens: number;
  temperature: number;
}

export async function getPrompt(key: string): Promise<PromptConfig> {
  const prompt = await prisma.aiPrompt.findUnique({
    where: { key, isActive: true },
  });

  if (prompt) {
    return {
      key: prompt.key,
      systemPrompt: prompt.systemPrompt,
      userPromptTemplate: prompt.userPromptTemplate,
      model: prompt.model,
      maxTokens: prompt.maxTokens,
      temperature: prompt.temperature,
    };
  }

  // Fallback prompts if not in DB
  return getFallbackPrompt(key);
}

function getFallbackPrompt(key: string): PromptConfig {
  const fallbacks: Record<string, PromptConfig> = {
    email_classification: {
      key: "email_classification",
      systemPrompt:
        "You are an email classifier for a construction industry professional. Classify the email into one of these categories: appel_offres, chantier, fournisseur, administratif, commercial, personnel, spam. Also provide a brief suggestion for a response if applicable. Respond in JSON format: {\"classification\": \"...\", \"suggestion\": \"...\"}",
      userPromptTemplate:
        "Subject: {{email_subject}}\n\nPreview: {{email_preview}}",
      model: "HAIKU",
      maxTokens: 256,
      temperature: 0.3,
    },
    email_reply: {
      key: "email_reply",
      systemPrompt:
        "You are a professional AI assistant for construction industry professionals. Generate email replies in the specified tone. The reply should be professional, contextual, and adapted to the construction/trades industry. Reply in {{langue}}.",
      userPromptTemplate:
        "Original email:\n{{email_content}}\n\nTone: {{tone}}\nContext: {{context}}\nUser name: {{user_name}}\nCompany: {{company_name}}\n\nGenerate a professional reply.",
      model: "SONNET",
      maxTokens: 1024,
      temperature: 0.7,
    },
    contract_analysis: {
      key: "contract_analysis",
      systemPrompt:
        "You are an expert contract analyst for the construction industry. Analyze the provided document and extract key information. Respond in {{langue}} with structured JSON.",
      userPromptTemplate: "Analyze this document:\n\n{{document}}",
      model: "SONNET",
      maxTokens: 2048,
      temperature: 0.3,
    },
    ao_extraction: {
      key: "ao_extraction",
      systemPrompt:
        "You are an expert at analyzing construction tenders (appels d'offres). Extract all lots, quantities, deadlines, and evaluation criteria. Respond in {{langue}} with structured JSON.",
      userPromptTemplate:
        "Trade: {{metier}}\n\nDocument:\n{{document}}",
      model: "SONNET",
      maxTokens: 2048,
      temperature: 0.3,
    },
    pv_generation: {
      key: "pv_generation",
      systemPrompt:
        "You are an expert at generating construction completion reports (PV de fin de chantier). Generate a professional report based on the provided data. Respond in {{langue}}.",
      userPromptTemplate:
        "Project data: {{affaire_data}}\nEmails summary: {{emails_summary}}\nReserves: {{reserves}}",
      model: "SONNET",
      maxTokens: 2048,
      temperature: 0.5,
    },
    assistant_system: {
      key: "assistant_system",
      systemPrompt:
        "You are ConductorOS AI Assistant, helping {{user_name}} from {{company_name}} ({{metier}}). You help with construction project management, emails, contracts, tenders, and planning. You have access to their active projects. Respond in {{langue}}. Be concise, professional, and helpful.",
      userPromptTemplate: "Active projects: {{affaires_actives}}",
      model: "SONNET",
      maxTokens: 1024,
      temperature: 0.7,
    },
    supplier_request: {
      key: "supplier_request",
      systemPrompt:
        "You are a professional email generator for construction price requests to suppliers. Generate professional, clear emails. Respond in {{langue}}.",
      userPromptTemplate:
        "Lots: {{lots}}\nTarget prices: {{prix_cibles}}\nCompany: {{company_name}}",
      model: "SONNET",
      maxTokens: 1024,
      temperature: 0.5,
    },
  };

  return (
    fallbacks[key] ?? {
      key,
      systemPrompt: "You are a helpful assistant.",
      userPromptTemplate: "{{input}}",
      model: "HAIKU" as AiModel,
      maxTokens: 512,
      temperature: 0.7,
    }
  );
}

export function renderPrompt(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

interface AiCallOptions {
  userId: string;
  orgId?: string;
  feature: string;
  promptKey: string;
  variables: Record<string, string>;
  stream?: boolean;
}

export async function callAi(options: AiCallOptions): Promise<string> {
  const { userId, orgId, feature, promptKey, variables } = options;

  // Check quota
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { plan: true, aiCallsThisMonth: true },
  });

  const quotaLimit = user.plan === "FREE" ? 20 : user.plan === "PRO" ? 300 : 10000;
  if (user.aiCallsThisMonth >= quotaLimit) {
    throw new Error("QUOTA_EXCEEDED");
  }

  const config = await getPrompt(promptKey);

  // Enforce Haiku-only for free plan
  const model = user.plan === "FREE" ? "HAIKU" : config.model;

  const systemPrompt = renderPrompt(config.systemPrompt, variables);
  const userPrompt = renderPrompt(config.userPromptTemplate, variables);

  const startTime = Date.now();

  const response = await client.messages.create({
    model: MODEL_MAP[model],
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const durationMs = Date.now() - startTime;
  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const rates = COST_RATES[model];
  const costUsd = inputTokens * rates.input + outputTokens * rates.output;

  // Log the call
  await Promise.all([
    prisma.aiCall.create({
      data: {
        userId,
        orgId,
        feature,
        model: MODEL_MAP[model],
        inputTokens,
        outputTokens,
        cacheHit: false,
        costUsd,
        durationMs,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { aiCallsThisMonth: { increment: 1 } },
    }),
  ]);

  const textBlock = response.content.find((c) => c.type === "text");
  return textBlock ? textBlock.text : "";
}

export async function streamAi(options: AiCallOptions): Promise<ReadableStream> {
  const { userId, orgId, feature, promptKey, variables } = options;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { plan: true, aiCallsThisMonth: true },
  });

  const quotaLimit = user.plan === "FREE" ? 20 : user.plan === "PRO" ? 300 : 10000;
  if (user.aiCallsThisMonth >= quotaLimit) {
    throw new Error("QUOTA_EXCEEDED");
  }

  const config = await getPrompt(promptKey);
  const model = user.plan === "FREE" ? "HAIKU" : config.model;
  const systemPrompt = renderPrompt(config.systemPrompt, variables);
  const userPrompt = renderPrompt(config.userPromptTemplate, variables);

  const startTime = Date.now();

  const stream = client.messages.stream({
    model: MODEL_MAP[model],
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  let inputTokens = 0;
  let outputTokens = 0;

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            );
          }
          if (event.type === "message_delta" && event.usage) {
            outputTokens = event.usage.output_tokens;
          }
          if (event.type === "message_start" && event.message.usage) {
            inputTokens = event.message.usage.input_tokens;
          }
        }

        const durationMs = Date.now() - startTime;
        const rates = COST_RATES[model];
        const costUsd = inputTokens * rates.input + outputTokens * rates.output;

        await Promise.all([
          prisma.aiCall.create({
            data: {
              userId,
              orgId,
              feature,
              model: MODEL_MAP[model],
              inputTokens,
              outputTokens,
              cacheHit: false,
              costUsd,
              durationMs,
            },
          }),
          prisma.user.update({
            where: { id: userId },
            data: { aiCallsThisMonth: { increment: 1 } },
          }),
        ]);

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return readable;
}
