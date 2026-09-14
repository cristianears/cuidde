import { COOKIE_CONSENT_KEY } from "@/lib/cookie-consent";

const BLOG_ATTRIBUTION_KEY = "cuidde_blog_attribution";
const CHECKOUT_PLAN_KEY = "cuidde_checkout_plan";
const EVENT_CONTEXT_KEYS = [
  "user_role", "signup_method", "blog_slug", "blog_category", "blog_audience",
  "blog_path", "lead_step", "lead_type", "cta_label", "cta_href", "plan_id", "plan_name",
] as const;

type AnalyticsValue = string | number | boolean | null | undefined;

export type AnalyticsParams = Record<string, AnalyticsValue>;

export type BlogAttribution = {
  blog_slug: string;
  blog_category: string;
  blog_audience: string;
  blog_path: string;
};

export type CheckoutPlanAttribution = {
  plan_id: string;
  plan_name: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function hasAnalyticsConsent() {
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

function cleanParams(params: AnalyticsParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

function getDataLayer() {
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

export function trackEvent(event: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return false;

  // GTM retains flat data-layer values between events unless they are cleared.
  getDataLayer().push(Object.fromEntries(EVENT_CONTEXT_KEYS.map((key) => [key, null])));
  getDataLayer().push({
    event,
    ...cleanParams(params),
  });
  return true;
}

export function setBlogAttribution(attribution: BlogAttribution) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(BLOG_ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    // Analytics attribution is best-effort and must never affect app behavior.
  }
}

export function getBlogAttribution(): Partial<BlogAttribution> {
  if (typeof window === "undefined") return {};

  try {
    const rawValue = window.sessionStorage.getItem(BLOG_ATTRIBUTION_KEY);
    if (!rawValue) return {};
    const parsed = JSON.parse(rawValue) as Partial<BlogAttribution>;

    return {
      blog_slug: parsed.blog_slug,
      blog_category: parsed.blog_category,
      blog_audience: parsed.blog_audience,
      blog_path: parsed.blog_path,
    };
  } catch {
    return {};
  }
}

export function withBlogAttribution(params: AnalyticsParams = {}) {
  return {
    ...getBlogAttribution(),
    ...params,
  };
}

export function setCheckoutPlanAttribution(attribution: CheckoutPlanAttribution) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(CHECKOUT_PLAN_KEY, JSON.stringify(attribution));
  } catch {
    // Analytics attribution is best-effort and must never affect checkout.
  }
}

export function getCheckoutPlanAttribution(): Partial<CheckoutPlanAttribution> {
  if (typeof window === "undefined") return {};

  try {
    const rawValue = window.sessionStorage.getItem(CHECKOUT_PLAN_KEY);
    if (!rawValue) return {};
    const parsed = JSON.parse(rawValue) as Partial<CheckoutPlanAttribution>;

    return {
      plan_id: parsed.plan_id,
      plan_name: parsed.plan_name,
    };
  } catch {
    return {};
  }
}

export function clearCheckoutPlanAttribution() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(CHECKOUT_PLAN_KEY);
  } catch {
    // Analytics attribution is best-effort and must never affect checkout.
  }
}
