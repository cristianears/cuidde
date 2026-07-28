import { beforeEach, describe, expect, it } from "vitest";
import { COOKIE_CONSENT_KEY } from "@/lib/cookie-consent";
import { initializeTagManager } from "@/lib/tag-manager";

const CONTAINER_ID = "GTM-TEST123";

describe("initializeTagManager", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.dataLayer = [];
    document.getElementById("google-tag-manager")?.remove();
  });

  it("does not load Google Tag Manager without a container ID", () => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");

    initializeTagManager("");

    expect(document.getElementById("google-tag-manager")).not.toBeInTheDocument();
  });

  it("waits for cookie consent before loading Google Tag Manager", () => {
    initializeTagManager(CONTAINER_ID);

    expect(document.getElementById("google-tag-manager")).not.toBeInTheDocument();

    window.dispatchEvent(new CustomEvent("cuidde-cookie-consent", { detail: "accepted" }));

    const script = document.getElementById("google-tag-manager") as HTMLScriptElement | null;
    expect(script).toBeInTheDocument();
    expect(script?.src).toBe(`https://www.googletagmanager.com/gtm.js?id=${CONTAINER_ID}`);
  });

  it("does not load Google Tag Manager when cookies are rejected", () => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");

    initializeTagManager(CONTAINER_ID);

    expect(document.getElementById("google-tag-manager")).not.toBeInTheDocument();
    expect(window.dataLayer).toContainEqual([
      "consent",
      "update",
      expect.objectContaining({ analytics_storage: "denied" }),
    ]);
  });

  it("loads Google Tag Manager immediately when consent was already accepted", () => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");

    initializeTagManager(CONTAINER_ID);

    expect(document.getElementById("google-tag-manager")).toBeInTheDocument();
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: "gtm.js" }));
  });
});
