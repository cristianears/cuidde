import { Heart, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const goTo = (hash: string) => {
    setIsMenuOpen(false);
    // Mantém comportamento de âncora na landing
    window.location.hash = hash;
  };
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-transparent",
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
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
            </div>
            <span
              className={cn(
                "text-xl font-semibold transition-colors duration-300",
                isScrolled ? "text-foreground" : "text-white",
              )}
            >
              cuidde
            </span>
          </button>
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              type="button"
              onClick={() => goTo("#como-funciona")}
              className={cn(
                "text-sm font-medium transition-colors",
                isScrolled ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white",
              )}
            >
              Como Funciona
            </button>
            <button
              type="button"
              onClick={() => goTo("#beneficios")}
              className={cn(
                "text-sm font-medium transition-colors",
                isScrolled ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white",
              )}
            >
              Recursos
            </button>
            <button
              type="button"
              onClick={() => goTo("#planos")}
              className={cn(
                "text-sm font-medium transition-colors",
                isScrolled ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white",
              )}
            >
              Planos
            </button>
            <button
              type="button"
              onClick={() => goTo("#faq")}
              className={cn(
                "text-sm font-medium transition-colors",
                isScrolled ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white",
              )}
            >
              Dúvidas
            </button>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/onboarding")}
              className={cn(
                "transition-colors",
                isScrolled
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                  : "text-white/80 hover:text-white hover:bg-white/10",
              )}
            >
              Entrar
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/onboarding")}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            >
              Criar conta grátis
            </Button>
          </div>
          {/* Mobile Menu Button */}
          <button
            className={cn("md:hidden p-2 transition-colors", isScrolled ? "text-foreground" : "text-white")}
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
              isScrolled ? "bg-muted/95" : "bg-primary/95",
            )}
          >
            <button
              type="button"
              onClick={() => goTo("#como-funciona")}
              className={cn(
                "text-sm font-medium py-2 transition-colors text-left",
                isScrolled ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white",
              )}
            >
              Como Funciona
            </button>
            <button
              type="button"
              onClick={() => goTo("#beneficios")}
              className={cn(
                "text-sm font-medium py-2 transition-colors text-left",
                isScrolled ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white",
              )}
            >
              Recursos
            </button>
            <button
              type="button"
              onClick={() => goTo("#planos")}
              className={cn(
                "text-sm font-medium py-2 transition-colors text-left",
                isScrolled ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white",
              )}
            >
              Planos
            </button>
            <button
              type="button"
              onClick={() => goTo("#faq")}
              className={cn(
                "text-sm font-medium py-2 transition-colors text-left",
                isScrolled ? "text-muted-foreground hover:text-foreground" : "text-white/80 hover:text-white",
              )}
            >
              Dúvidas
            </button>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate("/onboarding");
                }}
                className={cn(
                  "flex-1",
                  isScrolled
                    ? "border-border text-foreground hover:bg-muted"
                    : "border-white/30 text-white hover:bg-white/10",
                )}
              >
                Entrar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate("/onboarding");
                }}
                className="flex-1 bg-accent hover:bg-accent/90 font-semibold"
              >
                Criar conta grátis
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
export default Header;
