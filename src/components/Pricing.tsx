import { Check } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
const plans = [
  {
    name: "Gratuito",
    description: "Explore a plataforma sem compromisso.",
    price: "0",
    priceLabel: "gratuito",
    features: [
      "Busca limitada de profissionais por mês",
      "Visualização parcial de perfis",
      "Avaliações visíveis",
      "Sem acesso a chat e documentos completos",
    ],
    highlighted: false,
    buttonVariant: "outline" as const,
    gradient: "from-slate-100/95 to-blue-50/80",
    cta: "Criar conta grátis",
    badge: null,
  },
  {
    name: "Mensal",
    description: "Acesso completo por 30 dias.",
    price: "127",
    priceLabel: "/mês",
    features: [
      "Visualização completa de perfis",
      "Veja o que outras famílias dizem antes de contratar",
      "Acesso a documentos enviados pelo profissional (quando disponíveis)",
      "Contato direto ilimitado via chat",
      "Filtros avançados por região e disponibilidade",
      "Favoritar perfis",
    ],
    highlighted: true,
    buttonVariant: "default" as const,
    gradient: "from-amber-100/95 to-orange-50/80",
    cta: "Assinar mensal",
    badge: null,
  },
  {
    name: "Trimestral",
    description: "Mais tempo para decidir com tranquilidade.",
    price: "297",
    priceLabel: " (R$ 99/mês)",
    features: [
      "Todos os recursos do plano mensal",
      "Melhor custo mensal",
    ],
    highlighted: false,
    buttonVariant: "outline" as const,
    gradient: "from-indigo-100/95 to-purple-50/80",
    cta: "Assinar 3 meses",
    badge: "Melhor custo-benefício",
  },
  {
    name: "Anual",
    description: "Ideal para cuidado contínuo.",
    price: "997",
    priceLabel: " (R$ 83/mês)",
    features: [
      "Todos os recursos do plano completo",
      "Maior economia no longo prazo",
      "Acesso contínuo durante todo o ano",
    ],
    highlighted: false,
    buttonVariant: "outline" as const,
    gradient: "from-emerald-100/95 to-teal-50/80",
    cta: "Assinar anual",
    badge: null,
  },
];
const Pricing = () => {
  const navigate = useNavigate();
  return (
    <section id="planos" className="py-12 md:py-14 bg-background relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-section-divider" />
      <div className="container mx-auto px-6 md:px-10">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-2 tracking-tight">
            Planos e investimento
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Comece gratuitamente. Quando quiser liberar chat e documentos completos, escolha o tempo de acesso ideal para você.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1.5">
            Cancele quando quiser. Sem fidelidade.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-5xl mx-auto items-stretch">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-xl p-4 h-full flex flex-col bg-gradient-to-br ${plan.gradient} border transition-all duration-300 ${
                plan.highlighted
                  ? "ring-2 ring-primary shadow-xl border-primary/20"
                  : "shadow-card border-border/30 hover:shadow-card-hover"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full shadow-md whitespace-nowrap">
                  {plan.badge}
                </span>
              )}
              <div className="mb-2.5 mt-1">
                <h3 className="text-sm font-semibold text-foreground mb-0.5">{plan.name}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <div className="mb-2.5">
                {plan.price === "0" ? (
                  <span className="text-xl font-bold text-foreground">Grátis</span>
                ) : (
                  <>
                    <span className="text-xl font-bold text-foreground">R$ {plan.price}</span>
                    <span className="text-muted-foreground ml-1 text-xs">{plan.priceLabel}</span>
                  </>
                )}
              </div>
              <ul className="space-y-1.5 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-foreground text-xs md:text-sm">
                    <Check className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-3">
                <Button
                  onClick={() => navigate("/onboarding")}
                  variant={plan.buttonVariant}
                  className={`w-full rounded-lg py-2 text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
                    plan.highlighted
                      ? "bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
                      : "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          A Cuidde é uma plataforma de conexão. A contratação e o pagamento do profissional são realizados diretamente
          entre família e profissional.
        </p>
      </div>
    </section>
  );
};
export default Pricing;
