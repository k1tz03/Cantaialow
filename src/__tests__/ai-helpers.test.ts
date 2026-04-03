import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock prisma before importing
vi.mock("@/lib/db", () => ({
  prisma: {
    aiPrompt: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    aiCall: { create: vi.fn() },
    user: { findUniqueOrThrow: vi.fn() },
  },
}));

// Mock Anthropic SDK
vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "test response" }],
        usage: { input_tokens: 10, output_tokens: 20 },
      }),
    };
  },
}));

let renderPrompt: (template: string, variables: Record<string, string>) => string;
let getPrompt: (key: string) => Promise<{ key: string; model: string; maxTokens: number }>;

beforeAll(async () => {
  const mod = await import("@/lib/ai/client");
  renderPrompt = mod.renderPrompt;
  getPrompt = mod.getPrompt as typeof getPrompt;
});

describe("renderPrompt", () => {
  it("replaces single variable", () => {
    const result = renderPrompt("Hello {{name}}", { name: "Alice" });
    expect(result).toBe("Hello Alice");
  });

  it("replaces multiple variables", () => {
    const result = renderPrompt("{{greeting}} {{name}}, welcome to {{place}}", {
      greeting: "Hi",
      name: "Bob",
      place: "ConductorOS",
    });
    expect(result).toBe("Hi Bob, welcome to ConductorOS");
  });

  it("replaces repeated variables", () => {
    const result = renderPrompt("{{x}} and {{x}}", { x: "foo" });
    expect(result).toBe("foo and foo");
  });

  it("leaves unreplaced variables intact", () => {
    const result = renderPrompt("Hello {{name}}, {{unknown}}", { name: "Test" });
    expect(result).toBe("Hello Test, {{unknown}}");
  });

  it("handles empty variables object", () => {
    const result = renderPrompt("No vars here", {});
    expect(result).toBe("No vars here");
  });
});

describe("getFallbackPrompt via getPrompt", () => {
  it("returns email_classification fallback", async () => {
    const prompt = await getPrompt("email_classification");
    expect(prompt.key).toBe("email_classification");
    expect(prompt.model).toBe("HAIKU");
    expect(prompt.maxTokens).toBe(256);
  });

  it("returns email_reply fallback", async () => {
    const prompt = await getPrompt("email_reply");
    expect(prompt.key).toBe("email_reply");
    expect(prompt.model).toBe("SONNET");
  });

  it("returns generic fallback for unknown key", async () => {
    const prompt = await getPrompt("unknown_key_xyz");
    expect(prompt.key).toBe("unknown_key_xyz");
    expect(prompt.model).toBe("HAIKU");
    expect(prompt.maxTokens).toBe(512);
  });
});
