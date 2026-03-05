import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
const FinalCTA = () => {
  const navigate = useNavigate();
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-section-divider" />
      <div className="container mx-auto px-6 md:px-10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-4 tracking-tight leading-snug">
            A decisão mais importante começa com a informação certa
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-4 leading-relaxed">
            Crie sua conta gratuitamente e explore perfis, avaliações e favoritos.
            Quando quiser conversar com o profissional e visualizar documentos completos,
            você libera o acesso em poucos cliques.
          </p>
          <p className="text-xs text-muted-foreground/60 mb-8">
            Comece grátis. Cancele quando quiser.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/onboarding")}
            className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl px-8 py-3 text-sm font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5"
          >
            Criar minha conta grátis
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
export default FinalCTA;
