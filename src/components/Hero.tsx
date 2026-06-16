import { useState } from "react";
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
  const goFamilyFlow = () => {
    setTouched(true);
    if (!isCepValid || isLoading) return;
    navigate(getLandingCepTarget({
      cepDigits,
      isAuthenticated: Boolean(user),
      role,
    }));
  };
  return (
    <section className="relative h-[100dvh] flex flex-col pt-16">
      {/* Background Image */}
      <div
        className="landing-hero-bg absolute inset-0 bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      {/* Multi-layer Overlay for depth */}
      <div className="absolute inset-0 bg-foreground/50" />
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/20 to-primary/20" />
      {/* Bottom fade for seamless transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />

      {/* Conteúdo centralizado verticalmente */}
      <div className="relative flex-1 flex items-center">
        <div className="container mx-auto px-8 md:px-12">
          <div className="max-w-2xl mx-auto text-center text-primary-foreground">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-[1.2] mb-3 md:mb-4 tracking-tight">
              Encontre o cuidador certo
              <br />
              <span className="text-primary-foreground/90">com transparência e calma</span>
            </h1>
            {/* CEP Search */}
            <div className="mx-auto max-w-lg">
              <div className="relative mb-2">
                <label className="sr-only" htmlFor="cep">CEP</label>
                <input
                  id="cep"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="Digite seu CEP (ex: 12236-063)"
                  value={cepFormatted}
                  onChange={(e) => {
                    setTouched(true);
                    setCepRaw(e.target.value);
                  }}
                  className="w-full rounded-xl pl-4 pr-2 py-2 text-foreground bg-background/95 placeholder:text-muted-foreground/70 border border-white/10 focus:outline-none focus:ring-2 focus:ring-accent shadow-lg text-sm h-14 sm:pr-[200px]"
                />
                <Button
                  onClick={goFamilyFlow}
                  className="mt-2 w-full sm:mt-0 sm:absolute sm:right-1.5 sm:top-1/2 sm:-translate-y-1/2 sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-5 text-sm rounded-lg shadow-md hover:shadow-lg transition-colors duration-300 h-11 group animate-soft-pulse"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" />
                  Buscar profissionais
                </Button>
              </div>
              {touched && !isCepValid && (
                <p className="text-xs mt-1.5 text-primary-foreground/70">
                  Informe um CEP válido com 8 números.
                </p>
              )}
              <p className="text-xs text-primary-foreground/55 mb-4 mt-2">
                Usamos seu CEP para encontrar profissionais na sua região.
              </p>
            </div>
            {/* Secondary CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-3 mb-3">
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
