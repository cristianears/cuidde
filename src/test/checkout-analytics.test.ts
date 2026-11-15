import { describe, expect, it } from "vitest";
import { getVerifiedPurchase } from "../../supabase/functions/checkout-analytics/purchase";

const session = {
  status: "complete", payment_status: "paid", mode: "subscription", metadata: { family_id: "family-1" },
  customer: "cus_1", invoice: "in_1", currency: "brl", amount_total: 23997,
  total_details: { amount_tax: 0, amount_shipping: 0 },
  line_items: { data: [{ quantity: 1, amount_total: 23997, amount_tax: 0,
    price: { recurring: { interval: "month", interval_count: 3 } } }] },
};
describe("checkout purchase verification", () => {
  it("uses the paid Stripe invoice, actual charged amount and plan", () => {
    expect(getVerifiedPurchase(session, "family-1", "cus_1")).toEqual({ transaction_id: "in_1", currency: "BRL", value: 239.97,
      items: [{ item_id: "quarterly", item_name: "Plano Trimestral", price: 239.97, quantity: 1 }] });
  });
  it("blocks another family even if a checkout ID is known", () => {
    expect(() => getVerifiedPurchase(session, "family-2", "cus_1")).toThrow("Forbidden");
    expect(() => getVerifiedPurchase(session, "family-1", "cus_2")).toThrow("Forbidden");
    expect(() => getVerifiedPurchase(session, "family-1", null)).toThrow("Forbidden");
  });
  it("does not turn open, unpaid, trial, zero-price or malformed checkouts into purchases", () => {
    for (const patch of [{ status: "open" }, { payment_status: "unpaid" }, { payment_status: "no_payment_required" },
      { amount_total: 0 }, { invoice: null }, { currency: "usd" }, { line_items: undefined }, { mode: "setup" }]) {
      expect(getVerifiedPurchase({ ...session, ...patch }, "family-1", "cus_1")).toBeNull();
    }
  });
  it("uses discounted totals and excludes tax", () => {
    const discounted = { ...session, amount_total: 21000, total_details: { amount_tax: 1000, amount_shipping: 0 },
      line_items: { data: [{ ...session.line_items.data[0], amount_total: 21000, amount_tax: 1000 }] } };
    expect(getVerifiedPurchase(discounted, "family-1", "cus_1")?.value).toBe(200);
    expect(getVerifiedPurchase({ ...discounted, amount_total: 22000 }, "family-1", "cus_1")).toBeNull();
  });
});
