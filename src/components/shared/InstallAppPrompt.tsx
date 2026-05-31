import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useInstallApp } from "@/hooks/useInstallApp";

const DISMISSED_KEY = "cuidde_install_prompt_dismissed";

const InstallAppPrompt = () => {
  const { canShowInstallAction, installApp } = useInstallApp();
  const [dismissed, setDismissed] = useState(() =>
    typeof sessionStorage !== "undefined" && sessionStorage.getItem(DISMISSED_KEY) === "true",
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!canShowInstallAction || dismissed) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), 1600);
    return () => window.clearTimeout(timer);
  }, [canShowInstallAction, dismissed]);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  const handleInstall = async () => {
    const result = await installApp();

    if (result === "ios-instructions") {
      toast.info("No iPhone, toque em Compartilhar e escolha Adicionar à Tela de Início.");
    }

    if (result === "browser-instructions") {
      toast.info("Abra o menu do navegador e escolha Instalar app ou Adicionar à tela inicial.");
    }

    dismiss();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-50 md:inset-x-auto md:right-6 md:bottom-6 md:w-[360px]">
      <div className="rounded-xl border border-border bg-background p-3 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary shrink-0">
            <Download className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Instale o app icuide</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Acesse mais rápido pela tela inicial do celular.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="h-8 flex-1 gap-2" onClick={handleInstall}>
                <Download className="h-3.5 w-3.5" />
                Instalar
              </Button>
              <Button size="sm" variant="outline" className="h-8" onClick={dismiss}>
                Agora não
              </Button>
            </div>
          </div>
          <button
            type="button"
            aria-label="Fechar aviso de instalação"
            onClick={dismiss}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallAppPrompt;
