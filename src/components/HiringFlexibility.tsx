import { Briefcase, Calendar, FileCheck } from "lucide-react";
const hiringOptions = [
  {
    icon: Calendar,
    title: "Plantão e cobertura pontual",
    description:
      "Para finais de semana, viagens ou situações emergenciais. Encontre profissionais disponíveis na sua região com agenda flexível.",
  },
  {
    icon: Briefcase,
    title: "Acompanhamento contínuo",
    description:
      "Para cuidado diário ou de longo prazo. Conheça o profissional, avalie o perfil e alinhe expectativas diretamente com ele.",
  },
  {
    icon: FileCheck,
    title: "Você define o formato",
    description:
      "A Cuidde conecta famílias e profissionais. A forma de contratação — autônomo, MEI ou outro modelo — é definida diretamente entre as partes.",
  },
];
const HiringFlexibility = () => {
  return (
    <section className="py-12 md:py-16 relative overflow-hidden">
      {/* Warm echo gradient background */}
      <div className="absolute inset-0 bg-echo-warm-visible" />
      {/* Subtle top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-section-divider" />
      <div className="container mx-auto px-6 md:px-10 relative">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-3 tracking-tight">
            Flexibilidade para cuidar do seu jeito
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Seja para uma necessidade pontual ou um cuidado contínuo, a Cuidde facilita a conexão
            entre famílias e profissionais, respeitando a autonomia de cada parte.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 lg:gap-5 max-w-5xl mx-auto">
          {hiringOptions.map((option, index) => (
            <div
              key={index}
              className="group text-center p-5 bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-500 border border-border/30"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <option.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                {option.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {option.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default HiringFlexibility;
