import { useMemo, useState } from "react";
import { Check, Info, CreditCard, FileText, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { mockFamilies } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";

type PlanType = "monthly" | "quarterly" | "annual";

interface Plan {
  id: PlanType;
  name: string;
  subtitle: string;
  price: string;
  priceDescription: string;
  features: string[];
  color: string;
  bgGradient: string;
  borderColor: string;
  highlight?: { label: string; className: string };
}

const plans: Plan[] = [
  {
    id: "monthly",
    name: "Mensal",
    subtitle: "Acesso completo por 30 dias.",
    price: "R$ 127",
    priceDescription: "/mês",
    features: [
      "Visualização completa de perfis",
      "Veja o que outras famílias dizem antes de contratar",
      "Acesso a documentos enviados pelo profissional (quando disponíveis)",
      "Contato direto ilimitado via chat",
      "Filtros avançados por região e disponibilidade",
      "Favoritar perfis",
    ],
    color: "text-emerald-700",
    bgGradient: "from-emerald-50 to-emerald-100/50",
    borderColor: "border-emerald-200",
  },
  {
    id: "quarterly",
    name: "Trimestral",
    subtitle: "Mais tempo para decidir com tranquilidade",
    price: "R$ 297",
    priceDescription: "(R$ 99/mês)",
    features: ["Todos os recursos do plano mensal", "Melhor custo mensal"],
    color: "text-blue-700",
    bgGradient: "from-blue-50 to-blue-100/50",
    borderColor: "border-blue-200",
    highlight: { label: "Melhor custo-benefício", className: "bg-blue-600 text-white" },
  },
  {
    id: "annual",
    name: "Anual",
    subtitle: "Ideal para cuidado contínuo.",
    price: "R$ 997",
    priceDescription: "(R$ 83/mês)",
    features: ["Todos os recursos do plano completo", "Maior economia no longo prazo", "Acesso contínuo durante todo o ano"],
    color: "text-teal-800",
    bgGradient: "from-teal-50 to-teal-100/50",
    borderColor: "border-teal-200",
  },
];

const planStatusLabels: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-emerald-100 text-emerald-700" },
  trial: { label: "Trial", className: "bg-blue-100 text-blue-700" },
  inactive: { label: "Inativo", className: "bg-gray-100 text-gray-600" },
};

const FamilyBilling = () => {
  const { user } = useAuth();
  const { data: familyProfileData } = useFamilyProfile();
  const currentUser = mockFamilies[0];

  // Mock current plan state (começa no Mensal)
  const [currentPlan, setCurrentPlan] = useState<PlanType>("monthly");
  const [planStatus] = useState<"active" | "trial" | "inactive">("active");

  // Modal state
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ "Featured" igual à imagem (Trimestral)
  const featuredPlanId: PlanType = "quarterly";

  const getCurrentPlanDetails = () => plans.find((p) => p.id === currentPlan) || plans[0];

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleConfirmPlan = () => {
    if (selectedPlan) {
      setCurrentPlan(selectedPlan.id);
      setIsModalOpen(false);
      toast.success("Plano selecionado com sucesso!");
    }
  };

  const currentPlanDetails = getCurrentPlanDetails();

  const ctaLabel = useMemo(() => {
    return {
      monthly: "Assinar mensal",
      quarterly: "Assinar 3 meses",
      annual: "Assinar anual",
    } as const;
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="family" userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""} />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader
          title="Plano & Assinatura"
          description="Escolha o plano ideal para sua família e use a plataforma com clareza e transparência."
        />

        <div className="space-y-8 max-w-6xl">
          {/* Seção — Plano Atual */}
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Plano {currentPlanDetails.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {currentPlanDetails.price} {currentPlanDetails.priceDescription}
                    </p>
                  </div>
                </div>
                <Badge className={planStatusLabels[planStatus].className}>{planStatusLabels[planStatus].label}</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Este plano se refere ao <strong>uso da plataforma</strong> (acesso, filtros e recursos).
                <br />
                <strong className="text-foreground">
                  A contratação, negociação e pagamento do cuidador são combinados diretamente entre família e profissional.
                </strong>
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    const section = document.getElementById("plans-section");
                    section?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Alterar plano
                </Button>

                <Button variant="outline" asChild>
                  <Link to="/family/invoices">
                    <FileText className="w-4 h-4 mr-2" />
                    Ver faturas
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Seção — Planos Disponíveis */}
          <div id="plans-section" className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Planos disponíveis</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {plans.map((plan) => {
                const isCurrentPlan = plan.id === currentPlan;
                const isFeatured = plan.id === featuredPlanId;

                // ✅ Ajuste visual "bem SaaS":
                // - Featured: maior, mais sombra, borda/anel, leve scale
                // - Mensal: botão verde preenchido
                // - Outros: botão outline
                const cardClass = [
                  "relative flex flex-col transition-all duration-200",
                  "hover:shadow-lg",
                  plan.borderColor,
                  isCurrentPlan ? "ring-2 ring-primary ring-offset-2" : "",
                  isFeatured ? "md:-mt-2 md:scale-[1.03] shadow-xl ring-2 ring-blue-500/30" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                const headerClass = [
                  "rounded-t-lg",
                  "bg-gradient-to-br",
                  plan.bgGradient,
                  isFeatured ? "pb-6" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                const buttonVariant =
                  isCurrentPlan ? "secondary" : plan.id === "monthly" ? "default" : "outline";

                const buttonClass =
                  !isCurrentPlan && plan.id === "monthly"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : !isCurrentPlan && isFeatured
                      ? "border-blue-600 text-blue-700 hover:bg-blue-50"
                      : "";

                return (
                  <Card key={plan.id} className={cardClass}>
                    {/* Top badges (Featured / Current) */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-2">
                      {plan.highlight && (
                        <Badge className={plan.highlight.className}>
                          <Sparkles className="w-3.5 h-3.5 mr-1" />
                          {plan.highlight.label}
                        </Badge>
                      )}
                      {isCurrentPlan && <Badge className="bg-primary text-primary-foreground">Plano atual</Badge>}
                    </div>

                    <CardHeader className={headerClass}>
                      <div className="space-y-1">
                        <CardTitle className={`text-lg ${plan.color}`}>{plan.name}</CardTitle>
                        <CardDescription className="text-foreground/70">{plan.subtitle}</CardDescription>
                      </div>

                      <div className="pt-4">
                        <span className={`text-3xl font-bold ${plan.color}`}>{plan.price}</span>
                        <span className="text-sm text-muted-foreground ml-1">{plan.priceDescription}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 pt-6 space-y-4">
                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.color}`} />
                            <span className="text-sm text-foreground/80">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-4 mt-auto">
                        <Button
                          className={`w-full ${buttonClass}`}
                          variant={buttonVariant as any}
                          disabled={isCurrentPlan}
                          onClick={() => handleSelectPlan(plan)}
                        >
                          {isCurrentPlan ? "Plano atual" : ctaLabel[plan.id]}
                        </Button>
                      </div>

                      {/* ✅ Pequena linha "economia" para featured, igual sensação da imagem */}
                      {isFeatured && (
                        <p className="text-xs text-muted-foreground text-center">
                          Melhor custo mensal em comparação ao Mensal.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Seção — Transparência de Pagamento */}
          <Card className="bg-muted/30 border-dashed">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Como funcionam os pagamentos?</CardTitle>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A plataforma cobra apenas pelo <strong>plano de assinatura</strong> (uso e recursos).
                <br />
                <br />
                <strong className="text-foreground">
                  O valor do serviço do cuidador é negociado e pago diretamente entre a família e o profissional, sem intermediação da plataforma.
                </strong>
                <br />
                <span className="text-xs text-muted-foreground">
                  Observação: documentos e certificações aparecem conforme envio e disponibilidade no perfil do profissional.
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de Confirmação */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar seleção de plano</DialogTitle>
            <DialogDescription>Você está selecionando o plano abaixo:</DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className={`p-4 rounded-lg bg-gradient-to-br ${selectedPlan.bgGradient} border ${selectedPlan.borderColor}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-semibold ${selectedPlan.color}`}>Plano {selectedPlan.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedPlan.subtitle}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-bold ${selectedPlan.color}`}>{selectedPlan.price}</span>
                  <p className="text-xs text-muted-foreground">{selectedPlan.priceDescription}</p>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">No MVP, esta é uma simulação. Nenhum pagamento será processado.</p>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPlan}>Confirmar plano</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyBilling;