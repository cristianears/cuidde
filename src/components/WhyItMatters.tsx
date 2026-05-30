import { TrendingUp, Users, AlertTriangle, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
const stats = [
  {
    icon: TrendingUp,
    number: "Milhões",
    label: "de brasileiros têm mais de 60 anos",
    detail: "Esse número cresce ano após ano — e muitas famílias não estão preparadas para essa transição.",
  },
  {
    icon: Users,
    number: "A maioria",
    label: "das famílias encontra cuidadores por indicação",
    detail: "Sem comparar perfis, sem ver referências e sem ter um lugar organizado para decidir com calma.",
  },
  {
    icon: AlertTriangle,
    number: "Muitos",
    label: "profissionais ainda atuam de forma informal",
    detail: "Sem histórico registrado, sem avaliações e sem transparência. A família fica no escuro na hora de decidir.",
  },
  {
    icon: Heart,
    number: "Decisão no aperto",
    label: "é quando a urgência chega sem aviso",
    detail: "Quando a necessidade surge, não há tempo para pesquisar. Quem já conhece a icuide decide com mais tranquilidade.",
  },
];
const WhyItMatters = () => {
  const navigate = useNavigate();
  return (
    <section className="py-16 md:py-20 relative overflow-hidden">
      {/* Warm echo gradient */}
      <div className="absolute inset-0 bg-echo-warm opacity-40" />
      <div className="container mx-auto px-6 md:px-10 relative">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <span className="inline-block text-sm font-semibold text-primary tracking-widest uppercase mb-3">
            Por que isso importa
          </span>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-4 tracking-tight leading-tight">
            Muitas famílias só percebem o problema quando ele já chegou
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Encontrar um cuidador confiável ainda é difícil. A icuide existe para tornar essa decisão mais clara, com
            informação organizada e avaliações reais.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4 lg:gap-6 max-w-5xl mx-auto mb-10">
          {stats.map((item, index) => (
            <div
              key={index}
              className="bg-card p-5 rounded-2xl shadow-card border border-border/30 hover:shadow-card-hover transition-all duration-300 flex gap-4 items-start"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground mb-0.5">{item.number}</p>
                <p className="text-xs font-semibold text-primary mb-1.5">{item.label}</p>
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
        {/* CTA de reforço */}
        <div className="max-w-2xl mx-auto text-center bg-card rounded-2xl p-7 shadow-card border border-border/30">
          <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-3 tracking-tight">
            Não espere a urgência chegar para se preparar
          </h3>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Criar uma conta na icuide é gratuito. Você pode explorar perfis, avaliações e salvar favoritos. Quando quiser
            conversar com o profissional e ver documentos completos, é só liberar o acesso.
          </p>
          <Button
            onClick={() => navigate("/onboarding")}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-3 text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            Criar conta grátis agora
          </Button>
        </div>
      </div>
    </section>
  );
};
export default WhyItMatters;
