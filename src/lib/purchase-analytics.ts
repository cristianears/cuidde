import { hasAnalyticsConsent, trackEvent, withBlogAttribution } from "@/lib/analytics";

export type VerifiedPurchase = {
  transaction_id: string;
  currency: string;
  value: number;
  items: Array<{ item_id: string; item_name: string; price: number; quantity: number }>;
};

const sentTransactions = new Set<string>();
const STORAGE_KEY = "cuidde_analytics_purchases";

export function trackVerifiedPurchase(purchase: VerifiedPurchase) {
  if (!hasAnalyticsConsent() || !purchase.transaction_id || purchase.currency !== "BRL"
    || !Number.isFinite(purchase.value) || purchase.value <= 0 || !purchase.items.length) return false;
  let stored: string[] = [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (Array.isArray(parsed)) stored = parsed.filter((id): id is string => typeof id === "string");
  } catch { /* Storage is best-effort; GA4 also deduplicates by transaction_id. */ }
  if (sentTransactions.has(purchase.transaction_id) || stored.includes(purchase.transaction_id)) return false;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  const context = withBlogAttribution({ user_role: "family", plan_id: purchase.items[0].item_id });
  trackEvent("purchase", context, purchase);
  trackEvent("subscribe_paid_plan", context);
  sentTransactions.add(purchase.transaction_id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...stored, purchase.transaction_id].slice(-100)));
  } catch { /* Keep the in-memory and GA4 transaction guards when storage is unavailable. */ }
  return true;
}
