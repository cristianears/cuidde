import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTrackSectionView } from "@/hooks/useTrackSectionView";
import { COOKIE_CONSENT_KEY } from "@/lib/cookie-consent";

let notify: IntersectionObserverCallback;
const disconnect = vi.fn();
const originalObserver = window.IntersectionObserver;
function Example() {
  const ref = useTrackSectionView("view_pricing", { user_role: "anonymous" });
  return <h2 ref={ref}>Planos</h2>;
}
function intersect(ratio: number) {
  act(() => notify([{ isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry], {} as IntersectionObserver));
}
describe("pricing section visibility", () => {
  beforeEach(() => {
    localStorage.clear();
    window.dataLayer = [];
    window.IntersectionObserver = class {
      constructor(callback: IntersectionObserverCallback) { notify = callback; }
      observe = vi.fn(); disconnect = disconnect;
    } as unknown as typeof IntersectionObserver;
  });
  afterEach(() => { window.IntersectionObserver = originalObserver; });
  it("does not count loading or offscreen plans; counts visible plans once", () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    render(<Example />);
    expect(window.dataLayer).toEqual([]);
    intersect(0); intersect(0.2);
    expect(window.dataLayer).toEqual([]);
    intersect(0.6); intersect(1);
    expect(window.dataLayer?.filter((entry) => (entry as { event?: string }).event === "view_pricing")).toHaveLength(1);
  });
  it("can count a visible section when consent is accepted later", () => {
    render(<Example />);
    intersect(1);
    expect(window.dataLayer).toEqual([]);
    act(() => {
      localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
      window.dispatchEvent(new CustomEvent("cuidde-cookie-consent", { detail: "accepted" }));
    });
    expect(window.dataLayer).toContainEqual({ event: "view_pricing", user_role: "anonymous" });
  });
});
