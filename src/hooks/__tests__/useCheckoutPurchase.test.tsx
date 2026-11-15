import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_CONSENT_KEY } from "@/lib/cookie-consent";
import { useCheckoutPurchase } from "@/hooks/useCheckoutPurchase";

const mocks = vi.hoisted(() => ({ invoke: vi.fn(), record: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabase: { functions: { invoke: mocks.invoke } } }));
vi.mock("@/lib/purchase-analytics", () => ({ trackVerifiedPurchase: mocks.record }));
const purchase = { transaction_id: "in_verified", currency: "BRL", value: 127,
  items: [{ item_id: "monthly", item_name: "Plano Mensal", price: 127, quantity: 1 }] };
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
}
describe("checkout purchase reporting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.invoke.mockResolvedValue({ data: { purchase }, error: null });
  });
  it("waits for authentication, active subscription and consent", () => {
    renderHook(() => useCheckoutPurchase(undefined, "cs_live_verified", false), { wrapper });
    renderHook(() => useCheckoutPurchase("family-1", "cs_live_verified", true), { wrapper });
    expect(mocks.invoke).not.toHaveBeenCalled();
    expect(mocks.record).not.toHaveBeenCalled();
  });
  it("reports the server-confirmed purchase even after the success query is cleared by the page", async () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    renderHook(() => useCheckoutPurchase("family-1", "cs_live_verified", true), { wrapper });
    await waitFor(() => expect(mocks.record).toHaveBeenCalledWith(purchase));
    expect(mocks.invoke).toHaveBeenCalledWith("checkout-analytics", { body: { session_id: "cs_live_verified" } });
    expect(mocks.record).toHaveBeenCalledTimes(1);
  });
  it("can start verification after late consent", async () => {
    renderHook(() => useCheckoutPurchase("family-1", "cs_live_verified", true), { wrapper });
    expect(mocks.invoke).not.toHaveBeenCalled();
    act(() => {
      localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
      window.dispatchEvent(new CustomEvent("cuidde-cookie-consent", { detail: "accepted" }));
    });
    await waitFor(() => expect(mocks.record).toHaveBeenCalledWith(purchase));
  });
  it("does not report revenue for an unverified checkout", async () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    mocks.invoke.mockResolvedValue({ data: { purchase: null }, error: null });
    renderHook(() => useCheckoutPurchase("family-1", "cs_live_verified", true), { wrapper });
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledTimes(1));
    expect(mocks.record).not.toHaveBeenCalled();
  });
});
