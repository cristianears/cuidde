import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cleanCep, formatCep } from "@/lib/formatters";
import { getLandingCepTarget } from "@/lib/landing-cep-flow";
import heroBg from "@/assets/hero-bg.jpg";
const Hero = () => {
  const navigate = useNavigate();
  const { user, role, isLoading } = useAuth();
  const [cepRaw, setCepRaw] = useState("");
  const [touched, setTouched] = useState(false);
  const cepDigits = cleanCep(cepRaw);
  const cepFormatted = formatCep(cepDigits);
  const isCepValid = cepDigits.length === 8;
  const submitFamilyFlow = () => {
    setTouched(true);
    if (!isCepValid || isLoading) return;
    navigate(getLandingCepTarget({
      cepDigits,
      isAuthenticated: Boolean(user),
      role,
    }));
  };
  const goFamilyFlow = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitFamilyFlow();
  };
  const handleCepKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    submitFamilyFlow();
  };
  return (
    <section className="relative flex h-[100svh] min-h-[600px] flex-col overflow-hidden pt-16">
      {/* Background Image */}
      <div
        className="landing-hero-bg absolute inset-0 bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      {/* Multi-layer Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/45 to-foreground/25 md:bg-foreground/50 md:bg-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/20 to-primary/20" />
      {/* Bottom fade for seamless transition */}
      <div className="absolute bottom-0 left-0 right-0 h-[30svh] min-h-40 bg-gradient-to-t from-background via-background/90 to-transparent lg:h-24 lg:min-h-0 lg:via-transparent" />

      {/* Conteúdo centralizado verticalmente */}
      <div className="relative flex-1 flex items-center">
        <div className="container mx-auto px-8 md:px-12">
          <div className="max-w-2xl mx-auto translate-y-6 text-center text-primary-foreground lg:translate-y-0">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-[1.2] mb-4 tracking-tight">
              Encontre o cuidador certo
              <br />
              <span className="text-primary-foreground/90">com transparência e calma</span>
            </h1>
            {/* CEP Search */}
            <form className="mx-auto max-w-lg" onSubmit={goFamilyFlow}>
              <div className="relative mb-2">
                <label className="sr-only" htmlFor="cep">CEP</label>
                <input
                  id="cep"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="Digite seu CEP"
                  value={cepFormatted}
                  onChange={(e) => {
                    setTouched(true);
                    setCepRaw(e.target.value);
                  }}
                  onKeyDown={handleCepKeyDown}
                  className="h-14 w-full rounded-xl border border-white/10 bg-background/95 py-2 pl-4 pr-[166px] text-sm text-foreground shadow-lg placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-accent sm:pr-[200px]"
                />
                <Button
                  type="submit"
                  className="group absolute right-1.5 top-1/2 h-11 w-auto -translate-y-1/2 rounded-lg bg-accent px-2.5 text-[11px] font-semibold text-accent-foreground shadow-md transition-colors duration-300 hover:bg-accent/90 hover:shadow-lg sm:px-5 sm:text-sm"
                >
                  <CheckCircle className="mr-1 h-3.5 w-3.5 transition-transform group-hover:scale-110 sm:mr-1.5 sm:h-4 sm:w-4" />
                  <span>Buscar profissionais</span>
                </Button>
              </div>
              {touched && !isCepValid && (
                <p className="text-xs mt-1.5 text-primary-foreground/70">
                  Informe um CEP válido com 8 números.
                </p>
              )}
              <p className="mb-2 mt-1.5 text-xs leading-relaxed text-primary-foreground/55">
                Usamos seu CEP para encontrar profissionais
                <br className="sm:hidden" /> na sua região.
              </p>
            </form>
            {/* Secondary CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-3 mb-2">
              <Button
                variant="outline"
                onClick={() => navigate("/para-cuidadores")}
                className="group w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border-white/50 font-semibold px-5 py-3 text-sm rounded-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg shadow-md"
              >
                Sou Profissional — Criar Perfil Grátis
                <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            {/* Login Link */}
            <p className="text-xs text-primary-foreground/70">
              Já tem conta?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-semibold text-primary-foreground/90 underline underline-offset-4 hover:no-underline transition-all"
              >
                Entrar
              </button>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
export default Hero;
