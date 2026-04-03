import { describe, it, expect } from "vitest";
import { compressForAi } from "@/lib/pdf/extract";

describe("compressForAi", () => {
  it("returns short text unchanged", () => {
    const text = "Short text here.";
    expect(compressForAi(text)).toBe(text);
  });

  it("truncates text exceeding maxLength", () => {
    const text = "a".repeat(60000);
    const result = compressForAi(text, 50000);
    expect(result.length).toBeLessThan(60000);
    expect(result).toContain("[... document truncated ...]");
  });

  it("preserves beginning and end of text", () => {
    // Use unique markers that won't be collapsed by whitespace normalization
    const text = "START_MARKER" + "x".repeat(60000) + "END_MARKER";
    const result = compressForAi(text, 1000);
    expect(result.startsWith("START_MARKER")).toBe(true);
    expect(result.endsWith("END_MARKER")).toBe(true);
  });

  it("normalizes whitespace", () => {
    const text = "hello   world\n\n\n\nfoo";
    expect(compressForAi(text)).toBe("hello world\n\nfoo");
  });

  it("uses default maxLength of 50000", () => {
    const text = "b".repeat(100000);
    const result = compressForAi(text);
    expect(result.length).toBeLessThan(60000);
  });
});
