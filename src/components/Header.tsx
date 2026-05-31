import { Download, Menu, X, User } from "lucide-react";
import BrandMark from "@/components/shared/BrandMark";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getFirstName } from "@/lib/display-name";
import { useInstallApp } from "@/hooks/useInstallApp";
import { toast } from "sonner";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, role } = useAuth();
  const { canShowInstallAction, installApp } = useInstallApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const displayName = getFirstName(profile?.full_name ?? user?.user_metadata?.full_name, 'Meu painel');
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
          <nav className="hidden md:flex items-center gap-8">
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
          <div className="hidden md:flex items-center gap-3">
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
            {user ? (
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
            className={cn("md:hidden p-2 transition-colors cursor-pointer", isSolid ? "text-foreground" : "text-white")}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav
            className={cn(
              "md:hidden pt-4 pb-2 flex flex-col gap-3 -mx-4 px-4 mt-4 rounded-xl backdrop-blur-md",
              isSolid ? "bg-muted/95" : "bg-primary/95",
            )}
          >
            {navItems.map((item) => (
              <button
                key={item.hash ?? item.href}
                type="button"
                onClick={() => goTo(item)}
                className={cn(
                  "text-sm font-medium py-2 transition-colors text-left",
                  isSolid ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white",
                )}
              >
                {item.label}
              </button>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              {canShowInstallAction && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsMenuOpen(false);
                    void handleInstallApp();
                  }}
                  className={cn(
                    "flex-1 gap-2",
                    isSolid
                      ? "border-border text-foreground hover:bg-muted"
                      : "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white",
                  )}
                >
                  <Download className="w-4 h-4" />
                  Instalar app
                </Button>
              )}
              {user ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate(dashboardPath);
                  }}
                  className="flex-1 bg-accent hover:bg-accent/90 font-semibold gap-2"
                >
                  <User className="w-4 h-4" />
                  {displayName}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate("/login");
                    }}
                    className={cn(
                      "flex-1",
                      isSolid
                        ? "border-border text-foreground hover:bg-muted"
                        : "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white",
                    )}
                  >
                    Entrar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate(signupPath);
                    }}
                    className="flex-1 bg-accent hover:bg-accent/90 font-semibold"
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
