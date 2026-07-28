import { COOKIE_CONSENT_KEY, type CookieConsent } from "@/lib/cookie-consent";

const GTM_SCRIPT_ID = "google-tag-manager";
const GTM_ORIGIN = "https://www.googletagmanager.com";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function getContainerId() {
  return import.meta.env.VITE_GTM_ID?.trim();
}

function readStoredConsent(): CookieConsent | null {
  try {
    const value = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

function ensureDataLayer() {
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

function updateConsent(consent: CookieConsent) {
  ensureDataLayer().push([
    "consent",
    "update",
    {
      ad_storage: consent === "accepted" ? "granted" : "denied",
      ad_user_data: consent === "accepted" ? "granted" : "denied",
      ad_personalization: consent === "accepted" ? "granted" : "denied",
      analytics_storage: consent === "accepted" ? "granted" : "denied",
    },
  ]);
}

function loadTagManager(containerId: string) {
  if (document.getElementById(GTM_SCRIPT_ID)) return;

  ensureDataLayer().push({
    "gtm.start": new Date().getTime(),
    event: "gtm.js",
  });

  const script = document.createElement("script");
  script.id = GTM_SCRIPT_ID;
  script.async = true;
  script.src = `${GTM_ORIGIN}/gtm.js?id=${encodeURIComponent(containerId)}`;
  document.head.appendChild(script);
}

export function initializeTagManager(containerId = getContainerId()) {
  if (typeof window === "undefined" || typeof document === "undefined" || !containerId) return;

  const storedConsent = readStoredConsent();
  if (storedConsent) {
    updateConsent(storedConsent);
  }

  if (storedConsent === "accepted") {
    loadTagManager(containerId);
  }

  window.addEventListener("cuidde-cookie-consent", (event) => {
    const consent = (event as CustomEvent<CookieConsent>).detail;
    if (consent !== "accepted" && consent !== "rejected") return;

    updateConsent(consent);

    if (consent === "accepted") {
      loadTagManager(containerId);
    }
  });
}
