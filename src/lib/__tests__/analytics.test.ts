import { beforeEach, describe, expect, it } from "vitest";
import { COOKIE_CONSENT_KEY } from "@/lib/cookie-consent";
import {
  clearCheckoutPlanAttribution,
  getBlogAttribution,
  getCheckoutPlanAttribution,
  setBlogAttribution,
  setCheckoutPlanAttribution,
  trackEvent,
  withBlogAttribution,
} from "@/lib/analytics";

describe("analytics helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.dataLayer = [];
  });

  it("does not push events before analytics consent", () => {
    trackEvent("select_plan", { plan_id: "monthly" });

    expect(window.dataLayer).toEqual([]);
  });

  it("pushes clean events after analytics consent", () => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");

    trackEvent("select_plan", {
      plan_id: "monthly",
      plan_name: "Mensal",
      empty_value: "",
      missing_value: null,
    });

    expect(window.dataLayer).toContainEqual({
      event: "select_plan",
      plan_id: "monthly",
      plan_name: "Mensal",
    });
  });

  it("keeps blog attribution available for later funnel events", () => {
    setBlogAttribution({
      blog_slug: "quanto-custa-cuidador-de-idosos",
      blog_category: "Famílias",
      blog_audience: "familias",
      blog_path: "/blog/quanto-custa-cuidador-de-idosos/",
    });

    expect(getBlogAttribution()).toMatchObject({
      blog_slug: "quanto-custa-cuidador-de-idosos",
      blog_audience: "familias",
    });
    expect(withBlogAttribution({ plan_id: "free" })).toMatchObject({
      blog_slug: "quanto-custa-cuidador-de-idosos",
      plan_id: "free",
    });
  });

  it("keeps checkout plan attribution until it is cleared", () => {
    setCheckoutPlanAttribution({
      plan_id: "quarterly",
      plan_name: "Trimestral",
    });

    expect(getCheckoutPlanAttribution()).toMatchObject({
      plan_id: "quarterly",
      plan_name: "Trimestral",
    });

    clearCheckoutPlanAttribution();

    expect(getCheckoutPlanAttribution()).toEqual({});
  });
});
