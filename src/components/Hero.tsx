import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import heroBg from "@/assets/hero-bg.jpg";
function normalizeCep(input: string) {
  return input.replace(/\D/g, "").slice(0, 8);
}
function formatCep(digits: string) {
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
const Hero = () => {
  const navigate = useNavigate();
  const [cepRaw, setCepRaw] = useState("");
  const [touched, setTouched] = useState(false);
  const cepDigits = useMemo(() => normalizeCep(cepRaw), [cepRaw]);
  const cepFormatted = useMemo(() => formatCep(cepDigits), [cepDigits]);
  const isCepValid = cepDigits.length === 8;
  const goFamilyFlow = () => {
    setTouched(true);
    if (!isCepValid) return;
    navigate(`/onboarding?type=family&cep=${encodeURIComponent(cepDigits)}`);
  };
  const goCaregiverFlow = () => {
    navigate(`/onboarding?type=caregiver`);
  };
  const goLogin = () => {
    navigate(`/onboarding`);
  };
  return (
    <section className="relative h-[100dvh] flex flex-col pt-16">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
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
            {/* Subtitle */}
            <p className="text-sm md:text-base text-primary-foreground/85 mb-5 md:mb-6 max-w-xl mx-auto leading-relaxed font-light">
              Explore perfis, avaliações e informações enviadas pelos profissionais.
              Quando quiser avançar, você libera o contato e os documentos completos.
            </p>
            {/* CEP Search */}
            <div className="mx-auto max-w-lg">
              <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2 md:gap-3 mb-2">
                <div className="w-full">
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
                    className="w-full rounded-xl px-4 py-3 text-foreground bg-background/95 placeholder:text-muted-foreground/70 border border-white/10 focus:outline-none focus:ring-2 focus:ring-accent shadow-lg text-sm"
                  />
                  {touched && !isCepValid && (
                    <p className="text-xs mt-1.5 text-primary-foreground/70">
                      Informe um CEP válido com 8 números.
                    </p>
                  )}
                </div>
                <Button
                  onClick={goFamilyFlow}
                  className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-5 py-3 text-sm rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Ver disponibilidade
                </Button>
              </div>
              <p className="text-xs text-primary-foreground/55 mb-4">
                Usamos seu CEP para encontrar profissionais na sua região.
              </p>
            </div>
            {/* Secondary CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-3 mb-3">
              <Button
                variant="outline"
                onClick={goCaregiverFlow}
                className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border-white/50 font-semibold px-5 py-3 text-sm rounded-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 shadow-md"
              >
                Sou Profissional — Criar Perfil Grátis
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
            {/* Login Link */}
            <p className="text-xs text-primary-foreground/70">
              Já tem conta?{" "}
              <button
                type="button"
                onClick={goLogin}
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
