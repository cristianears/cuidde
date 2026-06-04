import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { COOKIE_CONSENT_KEY } from "@/lib/cookie-consent";
import CookieConsentBanner from "../CookieConsentBanner";

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows explicit accept and reject actions when there is no saved choice", () => {
    render(<CookieConsentBanner />);

    expect(screen.getByRole("dialog", { name: /consentimento de cookies/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /aceitar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rejeitar/i })).toBeInTheDocument();
  });

  it("saves acceptance and hides the banner", () => {
    render(<CookieConsentBanner />);

    fireEvent.click(screen.getByRole("button", { name: /aceitar/i }));

    expect(window.localStorage.getItem(COOKIE_CONSENT_KEY)).toBe("accepted");
    expect(screen.queryByRole("dialog", { name: /consentimento de cookies/i })).not.toBeInTheDocument();
  });

  it("saves rejection and does not show again", () => {
    render(<CookieConsentBanner />);

    fireEvent.click(screen.getByRole("button", { name: /rejeitar/i }));

    expect(window.localStorage.getItem(COOKIE_CONSENT_KEY)).toBe("rejected");

    render(<CookieConsentBanner />);
    expect(screen.queryByRole("dialog", { name: /consentimento de cookies/i })).not.toBeInTheDocument();
  });
});
