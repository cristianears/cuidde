import { beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_CONSENT_KEY } from "@/lib/cookie-consent";

describe("verified purchase analytics", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    window.dataLayer = [];
  });
  const purchase = { transaction_id: "in_verified", currency: "BRL", value: 239.97,
    items: [{ item_id: "quarterly", item_name: "Plano Trimestral", price: 239.97, quantity: 1 }] };

  it("waits for consent and sends the verified payload on the purchase event", async () => {
    const { trackVerifiedPurchase } = await import("@/lib/purchase-analytics");
    expect(trackVerifiedPurchase(purchase)).toBe(false);
    expect(window.dataLayer).toEqual([]);
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    const eventsAtPush: unknown[] = [];
    const queue = window.dataLayer!;
    vi.spyOn(queue, "push").mockImplementation((...entries) => {
      eventsAtPush.push(...structuredClone(entries));
      return Array.prototype.push.apply(queue, entries);
    });
    expect(trackVerifiedPurchase(purchase)).toBe(true);
    expect(eventsAtPush).toContainEqual({ event: "purchase", user_role: "family", plan_id: "quarterly", ecommerce: purchase });
    expect(eventsAtPush).toContainEqual({ ecommerce: null });
    expect(eventsAtPush).toContainEqual({ event: "subscribe_paid_plan", user_role: "family", plan_id: "quarterly" });
    expect(trackVerifiedPurchase(purchase)).toBe(false);
    vi.restoreAllMocks();
    vi.resetModules();
    const fresh = await import("@/lib/purchase-analytics");
    expect(fresh.trackVerifiedPurchase(purchase)).toBe(false);
    expect(queue.filter((entry) => (entry as { event?: string }).event === "purchase")).toHaveLength(1);
    expect(queue.filter((entry) => (entry as { event?: string }).event === "subscribe_paid_plan")).toHaveLength(1);
  });

  it("rejects invalid or zero revenue", async () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    const { trackVerifiedPurchase } = await import("@/lib/purchase-analytics");
    expect(trackVerifiedPurchase({ ...purchase, value: 0 })).toBe(false);
    expect(trackVerifiedPurchase({ ...purchase, currency: "unknown" })).toBe(false);
    expect(trackVerifiedPurchase({ ...purchase, transaction_id: "" })).toBe(false);
    expect(window.dataLayer).toEqual([]);
  });
});
