import { ChevronRight, Download, Menu, X, User } from "lucide-react";
import BrandMark from "@/components/shared/BrandMark";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getFirstName, getInitials } from "@/lib/display-name";
import { useInstallApp } from "@/hooks/useInstallApp";
import { toast } from "sonner";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, role, isLoading } = useAuth();
  const { canShowInstallAction, installApp } = useInstallApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const fullName = profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email;
  const displayName = getFirstName(fullName, 'Meu painel');
  const userInitials = getInitials(fullName);
  const roleLabel =
    role === 'admin'
      ? 'Area administrativa'
      : role === 'family'
        ? 'Area da familia'
        : role === 'caregiver'
          ? 'Area do cuidador'
          : 'Conta icuide';
  const dashboardPath = role === 'admin' ? '/admin' : role === 'family' ? '/family' : role === 'caregiver' ? '/caregiver' : '/login';
  const isCaregiverLanding = location.pathname === "/para-cuidadores";
  const usesTransparentHero = location.pathname === "/" || isCaregiverLanding;
  const isSolid = isScrolled || !usesTransparentHero;
  const signupPath = isCaregiverLanding ? "/onboarding?type=caregiver" : "/onboarding";
  const signupLabel = isCaregiverLanding ? "Criar perfil grátis" : "Criar conta grátis";
  const navItems: Array<{ label: string; hash?: string; href?: string }> = isCaregiverLanding
    ? [
        { label: "Como Funciona", hash: "#como-funciona-cuidador" },
        { label: "Benefícios", hash: "#beneficios-cuidador" },
        { label: "Perfil Forte", hash: "#perfil-forte" },
        { label: "Dúvidas", hash: "#duvidas-cuidadores" },
        { label: "Blog", href: "/blog" },
      ]
    : [
        { label: "Como Funciona", hash: "#como-funciona" },
        { label: "Recursos", hash: "#beneficios" },
        { label: "Planos", hash: "#planos" },
        { label: "Dúvidas", hash: "#faq" },
        { label: "Blog", href: "/blog" },
      ];
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const goTo = (item: { hash?: string; href?: string }) => {
    setIsMenuOpen(false);
    if (item.href) {
      navigate(item.href);
      return;
    }
    if (!item.hash) return;
    if (isCaregiverLanding) {
      document.querySelector(item.hash)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (location.pathname === "/") {
      document.querySelector(item.hash)?.scrollIntoView({ behavior: "smooth" });
      window.history.replaceState(null, "", item.hash);
      return;
    }
    navigate(`/${item.hash}`);
  };
  const handleInstallApp = async () => {
    const result = await installApp();

    if (result === "ios-instructions") {
      toast.info("No iPhone, toque em Compartilhar e escolha Adicionar à Tela de Início.");
      return;
    }

    if (result === "browser-instructions") {
      toast.info("Abra o menu do navegador e escolha Instalar app ou Adicionar à tela inicial.");
    }
  };
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isSolid ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-transparent",
      )}
    >
      <div className="container mx-auto px-6 md:px-10 py-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              navigate("/");
            }}
            className="flex items-center gap-2"
          >
            <BrandMark
              size={36}
              wordmarkClassName={cn(
                "transition-colors duration-300",
                isSolid ? "text-foreground" : "text-white",
              )}
            />
          </button>
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.hash ?? item.href}
                type="button"
                onClick={() => goTo(item)}
                className={cn(
                  "text-sm font-medium transition-colors",
                  isSolid ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white",
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            {canShowInstallAction && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleInstallApp}
                className={cn(
                  "transition-colors gap-2",
                  isSolid
                    ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                    : "text-white/80 hover:text-white hover:bg-white/10",
                )}
              >
                <Download className="w-4 h-4" />
                Instalar app
              </Button>
            )}
            {isLoading ? (
              <div
                aria-label="Carregando conta"
                className={cn(
                  "h-9 w-28 rounded-md animate-pulse",
                  isSolid ? "bg-muted" : "bg-white/20",
                )}
              />
            ) : user ? (
              <Button
                size="sm"
                onClick={() => navigate(dashboardPath)}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold gap-2"
              >
                <User className="w-4 h-4" />
                {displayName}
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                  className={cn(
                    "transition-colors",
                    isSolid
                      ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                      : "text-white/80 hover:text-white hover:bg-white/10",
                  )}
                >
                  Entrar
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate(signupPath)}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                >
                  {signupLabel}
                </Button>
              </>
            )}
          </div>
          {/* Mobile Menu Button */}
          <button
            className={cn("lg:hidden p-2 transition-colors cursor-pointer", isSolid ? "text-foreground" : "text-white")}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button"
            aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav
            className={cn(
              "lg:hidden -mx-2 mt-4 flex flex-col gap-2 rounded-2xl border p-3 shadow-xl backdrop-blur-md",
              isSolid
                ? "border-border bg-background/95"
                : "border-white/20 bg-background/95",
            )}
          >
            {navItems.map((item) => (
              <button
                key={item.hash ?? item.href}
                type="button"
                onClick={() => goTo(item)}
                className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </button>
            ))}
            <div className="mt-1 flex flex-col gap-2 border-t border-border pt-3">
              {canShowInstallAction && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsMenuOpen(false);
                    void handleInstallApp();
                  }}
                  className="w-full justify-center gap-2 border-border text-foreground hover:bg-muted"
                >
                  <Download className="w-4 h-4" />
                  Instalar app
                </Button>
              )}
              {isLoading ? (
                <div
                  aria-label="Carregando conta"
                  className="h-16 w-full rounded-xl bg-muted animate-pulse"
                />
              ) : user ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate(dashboardPath);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl bg-accent/15 p-3 text-left text-foreground ring-1 ring-accent/30 transition-colors hover:bg-accent/20"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                    {userInitials || <User className="h-5 w-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold leading-5">{displayName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{roleLabel}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate("/login");
                    }}
                    className="w-full border-border text-foreground hover:bg-muted"
                  >
                    Entrar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate(signupPath);
                    }}
                    className="w-full bg-accent hover:bg-accent/90 font-semibold"
                  >
                    {signupLabel}
                  </Button>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
export default Header;
