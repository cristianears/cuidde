import { TrendingUp, Users, AlertTriangle, Heart } from "lucide-react";
import { Button } from "./ui/button";

const stats = [
  {
    icon: TrendingUp,
    number: "32 milhões",
    label: "de brasileiros têm mais de 60 anos",
    detail: "Um número que dobra até 2050 — e a maioria das famílias não está preparada para essa transição.",
  },
  {
    icon: Users,
    number: "7 em cada 10",
    label: "famílias encontram cuidadores só por indicação",
    detail: "Sem ver documentos, sem checar referências, sem saber nada sobre quem vai cuidar de quem mais amam.",
  },
  {
    icon: AlertTriangle,
    number: "Mais de 60%",
    label: "dos cuidadores no Brasil atuam informalmente",
    detail: "Sem registro, sem histórico verificável, sem avaliações. A família fica no escuro na hora de decidir.",
  },
  {
    icon: Heart,
    number: "1ª decisão",
    label: "que a maioria das famílias toma no desespero",
    detail: "Quando a necessidade surge, não há tempo para pesquisar. Quem já tem a ditti, já está pronto.",
  },
];

const WhyItMatters = () => {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Warm echo gradient */}
      <div className="absolute inset-0 bg-echo-warm opacity-40" />

      <div className="container mx-auto px-6 md:px-10 relative">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <span className="inline-block text-sm font-semibold text-primary tracking-widest uppercase mb-4">
            Por que isso importa
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight leading-tight">
            A maioria das famílias só percebe o problema quando ele já chegou
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Encontrar um cuidador confiável no Brasil ainda é uma loteria. A ditti existe para mudar isso.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto mb-16">
          {stats.map((item, index) => (
            <div
              key={index}
              className="bg-card p-8 rounded-3xl shadow-card border border-border/30 hover:shadow-card-hover transition-all duration-300 flex gap-6 items-start"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground mb-1">{item.number}</p>
                <p className="text-sm font-semibold text-primary mb-2">{item.label}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA de reforço */}
        <div className="max-w-2xl mx-auto text-center bg-card rounded-3xl p-10 shadow-card border border-border/30">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Não espere a urgência chegar para se preparar
          </h3>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Criar uma conta na ditti é gratuito. Quando você precisar, as informações que importam já estarão na sua
            mão.
          </p>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-10 py-6 text-base rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
            Criar conta grátis agora
          </Button>
        </div>
      </div>
    </section>
  );
};

export default WhyItMatters;
