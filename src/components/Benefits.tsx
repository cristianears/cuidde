import { ShieldCheck, Heart, FileText, Clock, Star, MessageCircle, Activity } from "lucide-react";
const benefits = [
  {
    icon: ShieldCheck,
    title: "Perfis com documentos disponíveis",
    description:
      "Veja certificações, referências e documentos enviados pelo profissional (incluindo certidões ou declarações, quando anexadas). Você decide com informação organizada.",
  },
  {
    icon: Star,
    title: "Avaliações reais de famílias",
    description:
      "Cada profissional pode acumular avaliações de quem já contratou. Reputação construída com o tempo.",
  },
  {
    icon: Clock,
    title: "Flexibilidade total",
    description:
      "Encontre profissionais disponíveis por plantão, diária, meio período ou contrato contínuo — no seu ritmo.",
  },
  {
    icon: FileText,
    title: "Informações e histórico no perfil",
    description:
      "Consulte especialidades, experiências e informações registradas na plataforma antes de tomar sua decisão.",
  },
  {
    icon: MessageCircle,
    title: "Contato direto e seguro",
    description:
      "Converse com o profissional dentro da plataforma antes de fechar qualquer acordo. Você decide quando avançar.",
  },
  {
    icon: Activity,
    title: "Acompanhe a rotina do seu familiar de perto",
    description:
      "Alimentação, hidratação, diário de bem-estar e sinais vitais registrados pelo cuidador — para você ter paz, mesmo trabalhando ou morando longe.",
  },
];
const Benefits = () => {
  return (
    <section id="beneficios" className="py-12 md:py-14 relative overflow-hidden">
      <div className="absolute inset-0 bg-echo-primary-soft" />
      <div className="absolute top-0 left-0 right-0 h-px bg-section-divider" />
      <div className="container mx-auto px-6 md:px-10 relative">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-2 tracking-tight">
            Por que escolher a ditti?
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto">
            Mais informação e mais transparência para você tomar a decisão certa — com calma e autonomia.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="group bg-card p-4 rounded-xl shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 border border-border/30 hover:border-primary/20"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <benefit.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{benefit.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default Benefits;
