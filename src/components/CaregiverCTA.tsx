import { ArrowRight, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import BrandMark from "./shared/BrandMark";

const badges = [
  "Perfil gratuito",
  "Controle total da sua disponibilidade",
  "Negociação direta com a família",
];

const CaregiverCTA = () => {
  return (
    <section className="py-16 md:py-20 bg-cta-gradient relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="container mx-auto px-6 md:px-10 relative">
        <div className="max-w-2xl mx-auto text-center text-primary-foreground">
          <div className="w-16 h-16 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto mb-5 backdrop-blur-sm animate-float-up">
            <BrandMark size={40} showWordmark={false} />
          </div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 tracking-tight max-w-lg mx-auto leading-snug">
            É cuidador? Conecte-se a famílias que valorizam seu trabalho
          </h2>
          <p className="text-sm md:text-base text-primary-foreground/85 mb-6 leading-relaxed">
            Crie seu perfil gratuitamente, apresente sua experiência, formação e disponibilidade.
            Seja encontrado por quem precisa de você.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5 mb-6">
            {badges.map((label) => (
              <span key={label} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold shadow-md">
                <Check className="w-3.5 h-3.5" />
                {label}
              </span>
            ))}
          </div>
          <p className="text-xs text-primary-foreground/60 mb-8 max-w-sm mx-auto">
            Você define sua região, jornada e formato. A negociação é direta — sem comissão sobre seus ganhos.
          </p>
          <Link to="/para-cuidadores">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-3 text-sm rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
            >
              Criar meu perfil
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
export default CaregiverCTA;
