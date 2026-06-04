import { useState } from "react";
import { Cookie, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COOKIE_CONSENT_KEY, type CookieConsent } from "@/lib/cookie-consent";

function readConsent(): CookieConsent | null {
  try {
    const value = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

function saveConsent(value: CookieConsent) {
  window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent("cuidde-cookie-consent", { detail: value }));
}

const CookieConsentBanner = () => {
  const [consent, setConsent] = useState<CookieConsent | null>(() =>
    typeof window === "undefined" ? null : readConsent(),
  );

  const handleChoice = (value: CookieConsent) => {
    saveConsent(value);
    setConsent(value);
  };

  if (consent) return null;

  return (
    <section
      role="dialog"
      aria-live="polite"
      aria-label="Consentimento de cookies"
      className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[60] md:inset-x-auto md:bottom-6 md:right-6 md:w-[430px]"
    >
      <div className="rounded-xl border border-border bg-background p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
            <Cookie className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Controle de cookies</p>
              <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Usamos cookies necessarios para manter o app funcionando e salvar sua preferencia.
              Voce pode aceitar ou rejeitar cookies nao essenciais.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9"
                onClick={() => handleChoice("rejected")}
              >
                Rejeitar
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-9"
                onClick={() => handleChoice("accepted")}
              >
                Aceitar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CookieConsentBanner;
