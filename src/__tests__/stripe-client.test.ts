import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("stripe", () => ({
  default: class MockStripe {
    _key: string;
    checkout = { sessions: { create: vi.fn() } };
    billingPortal = { sessions: { create: vi.fn() } };
    webhooks = { constructEvent: vi.fn() };
    constructor(key: string) {
      this._key = key;
    }
  },
}));

describe("getStripe", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns a Stripe instance", async () => {
    const { getStripe } = await import("@/lib/stripe/client");
    const stripe = getStripe();
    expect(stripe).toBeDefined();
  });

  it("returns the same instance on multiple calls (singleton)", async () => {
    const { getStripe } = await import("@/lib/stripe/client");
    const a = getStripe();
    const b = getStripe();
    expect(a).toBe(b);
  });
});
