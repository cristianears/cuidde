import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Info, CreditCard, FileText, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/query-keys";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { STRIPE_PRICE_IDS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { SubscriptionCancellationReason, SubscriptionPlan } from "@/types/database";

interface Plan {
  id: SubscriptionPlan;
  name: string;
  subtitle: string;
  price: string;
  priceDescription: string;
  priceDiscount?: string;
  priceTotal?: string;
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
    price: "R$ 99",
    priceDescription: "/mês",
    priceDiscount: "22% de desconto",
    priceTotal: "total R$ 297",
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
    price: "R$ 83",
    priceDescription: "/mês",
    priceDiscount: "35% de desconto",
    priceTotal: "total R$ 997",
    features: ["Todos os recursos do plano completo", "Maior economia no longo prazo", "Acesso contínuo durante todo o ano"],
    color: "text-teal-800",
    bgGradient: "from-teal-50 to-teal-100/50",
    borderColor: "border-teal-200",
  },
];

const subscriptionStatusConfig: Record<string, { label: string; className: string }> = {
  free:       { label: "Gratuito",            className: "bg-gray-100 text-gray-600" },
  active:     { label: "Ativo",               className: "bg-emerald-100 text-emerald-700" },
  past_due:   { label: "Pagamento atrasado",  className: "bg-amber-100 text-amber-700" },
  canceled:   { label: "Cancelado",           className: "bg-red-100 text-red-700" },
  incomplete: { label: "Pendente",            className: "bg-blue-100 text-blue-700" },
};

const planNames: Record<SubscriptionPlan, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  annual: "Anual",
};

const ctaLabel: Record<SubscriptionPlan, string> = {
  monthly: "Assinar mensal",
  quarterly: "Assinar 3 meses",
  annual: "Assinar anual",
};

const cancellationReasons: Array<{ value: SubscriptionCancellationReason; label: string }> = [
  { value: "found_caregiver_elsewhere", label: "Encontrei cuidador fora da plataforma" },
  { value: "no_caregivers_region", label: "Não encontrei cuidadores na minha região" },
  { value: "price_high", label: "Achei o valor alto" },
  { value: "temporary_need", label: "Usei apenas por um período específico" },
  { value: "difficult_to_use", label: "Tive dificuldade de usar a plataforma" },
  { value: "missing_features", label: "Faltou algum recurso que eu esperava" },
  { value: "other", label: "Outro motivo" },
];

const FamilyBilling = () => {
  const { user } = useAuth();
  const { data: familyProfileData } = useFamilyProfile();
  const {
    plan,
    pendingPlan,
    subscriptionStatus,
    cancelAtPeriodEnd,
    currentPeriodEnd,
    stripeSubscriptionId,
    isLoading,
    startCheckout,
    cancelSubscription,
    reactivateSubscription,
  } = useSubscription();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<SubscriptionCancellationReason | "">("");
  const [cancelReasonDetails, setCancelReasonDetails] = useState("");

  const featuredPlanId: SubscriptionPlan = "quarterly";

  const resetCancellationFeedback = () => {
    setCancelReason("");
    setCancelReasonDetails("");
  };

  // Feedback de retorno do Stripe Checkout
  useEffect(() => {
    if (!user) return
    if (searchParams.get("success") === "true") {
      toast.success("Assinatura realizada com sucesso! Bem-vinda à plataforma.");
      setSearchParams({}, { replace: true });
      queryClient.invalidateQueries({ queryKey: queryKeys.familyProfile(user.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices(user.id) });
    } else if (searchParams.get("canceled") === "true") {
      toast.info("Checkout cancelado. Você pode assinar a qualquer momento.");
      setSearchParams({}, { replace: true });
    }
  }, [user, searchParams, setSearchParams, queryClient]);

  const handleSelectPlan = (p: Plan) => {
    setSelectedPlan(p);
    setIsConfirmOpen(true);
  };

  const handleConfirmCheckout = () => {
    if (!selectedPlan) return;
    const priceId = STRIPE_PRICE_IDS[selectedPlan.id];
    if (!priceId) {
      toast.error("Plano não configurado. Contate o suporte.");
      return;
    }
    setIsConfirmOpen(false);
    startCheckout.mutate(priceId);
  };

  const submitCancellationFeedback = useMutation({
    mutationFn: async () => {
      if (!user || !cancelReason) {
        throw new Error("Selecione um motivo para continuar.");
      }

      if (cancelReason === "other" && cancelReasonDetails.trim().length < 3) {
        throw new Error("Conte em poucas palavras o motivo do cancelamento.");
      }

      const selectedReason = cancellationReasons.find((reason) => reason.value === cancelReason);
      if (!selectedReason) {
        throw new Error("Motivo de cancelamento inválido.");
      }

      const { error } = await supabase
        .from("subscription_cancellation_feedback")
        .insert({
          family_id: user.id,
          reason_code: selectedReason.value,
          reason_label: selectedReason.label,
          reason_details: cancelReasonDetails.trim() || null,
          plan,
          subscription_status: subscriptionStatus,
          cancel_at_period_end: cancelAtPeriodEnd,
          current_period_end: currentPeriodEnd,
        });

      if (error) throw error;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar o motivo. Tente novamente.");
    },
  });

  const handleConfirmCancel = async () => {
    try {
      await submitCancellationFeedback.mutateAsync();
      setIsCancelOpen(false);
      resetCancellationFeedback();
      cancelSubscription.mutate();
    } catch {
      // O toast de erro fica no onError da mutation, próximo da ação do usuário.
    }
  };

  const handleCancelDialogOpenChange = (open: boolean) => {
    if (submitCancellationFeedback.isPending || cancelSubscription.isPending) return;
    setIsCancelOpen(open);
    if (!open) resetCancellationFeedback();
  };

  const canConfirmCancel =
    !!cancelReason &&
    (cancelReason !== "other" || cancelReasonDetails.trim().length >= 3) &&
    !submitCancellationFeedback.isPending &&
    !cancelSubscription.isPending;

  const currentPlanDetails = plans.find((p) => p.id === plan) ?? null;
  const statusConfig = subscriptionStatusConfig[subscriptionStatus] ?? subscriptionStatusConfig.free;

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar role="family" userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role="family"
        userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""}
        userPhoto={familyProfileData?.photo_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture}
      />

      <main className="flex-1 p-4 md:p-6">
        <PageHeader
          title="Plano & Assinatura"
          description="Escolha o plano ideal para sua família e use a plataforma com clareza e transparência."
        />

        <div className="space-y-6 max-w-4xl">
          {/* Plano Atual */}
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base md:text-lg">
                      {currentPlanDetails ? `Plano ${planNames[plan!]}` : "Sem plano ativo"}
                    </CardTitle>
                    {currentPlanDetails && (
                      <div className="text-sm text-muted-foreground">
                        <span>{currentPlanDetails.price}</span>
                        {currentPlanDetails.priceDescription ? (
                          <span> {currentPlanDetails.priceDescription}</span>
                        ) : null}
                        {currentPlanDetails.priceDiscount && currentPlanDetails.priceTotal ? (
                          <div className="flex flex-wrap items-center gap-x-1 text-xs">
                            <span className="whitespace-nowrap">{currentPlanDetails.priceDiscount}</span>
                            <span aria-hidden="true">•</span>
                            <span className="whitespace-nowrap">{currentPlanDetails.priceTotal}</span>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
                <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {subscriptionStatus === "past_due" && (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Há um pagamento pendente. Regularize para manter o acesso.
                </div>
              )}

              {cancelAtPeriodEnd && subscriptionStatus === "active" && stripeSubscriptionId && (
                <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    Sua assinatura será cancelada
                    {currentPeriodEnd && (
                      <> em <strong>{new Date(currentPeriodEnd).toLocaleDateString("pt-BR")}</strong></>
                    )}
                    . Você continua com acesso completo até lá.
                  </div>
                </div>
              )}

              {pendingPlan && subscriptionStatus === "active" && (
                <div className="flex items-start gap-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    Seu plano mudará para <strong>{planNames[pendingPlan]}</strong>
                    {currentPeriodEnd && (
                      <> a partir de <strong>{new Date(currentPeriodEnd).toLocaleDateString("pt-BR")}</strong></>
                    )}
                    . Você mantém o acesso completo do plano atual até lá.
                  </div>
                </div>
              )}

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
                  {subscriptionStatus === "active" ? "Alterar plano" : "Ver planos"}
                </Button>

                <Button variant="outline" asChild>
                  <Link to="/family/invoices">
                    <FileText className="w-4 h-4 mr-2" />
                    Ver faturas
                  </Link>
                </Button>

                {subscriptionStatus === "active" && !cancelAtPeriodEnd && (
                  <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setIsCancelOpen(true)}
                    disabled={cancelSubscription.isPending}
                  >
                    {cancelSubscription.isPending ? (
                      <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin mr-2" />
                    ) : null}
                    Cancelar assinatura
                  </Button>
                )}

                {subscriptionStatus === "active" && cancelAtPeriodEnd && stripeSubscriptionId && (
                  <Button
                    variant="outline"
                    onClick={() => reactivateSubscription.mutate()}
                    disabled={reactivateSubscription.isPending}
                  >
                    {reactivateSubscription.isPending ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    ) : null}
                    Reativar assinatura
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Planos Disponíveis */}
          <div id="plans-section" className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Planos disponíveis</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              {plans.map((p) => {
                const isCurrentPlan = p.id === plan && subscriptionStatus === "active";
                const isPendingPlan = p.id === pendingPlan && subscriptionStatus === "active";
                const canKeepCurrentPlan = isCurrentPlan && !!pendingPlan;
                const isFeatured = p.id === featuredPlanId;

                const cardClass = [
                  "relative flex flex-col transition-all duration-200 hover:shadow-md",
                  p.borderColor,
                  isCurrentPlan ? "ring-2 ring-primary ring-offset-2" : "",
                  isFeatured ? "shadow-lg ring-2 ring-blue-500/30" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                const headerClass = [
                  "rounded-t-lg bg-gradient-to-br pb-4",
                  p.bgGradient,
                ]
                  .filter(Boolean)
                  .join(" ");

                const buttonVariant: "default" | "secondary" | "outline" =
                  isCurrentPlan ? "secondary" : p.id === "monthly" ? "default" : "outline";

                const buttonClass =
                  !isCurrentPlan && p.id === "monthly"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : !isCurrentPlan && isFeatured
                      ? "border-blue-600 text-blue-700 hover:bg-blue-50"
                      : "";

                return (
                  <Card key={p.id} className={cardClass}>
                    <CardHeader className={headerClass}>
                      {/* Badges dentro do header, sem posição absoluta */}
                      {(p.highlight || isCurrentPlan || isPendingPlan) && (
                        <div className="flex gap-2 flex-wrap mb-2">
                          {p.highlight && (
                            <Badge className={`${p.highlight.className} text-xs`}>
                              <Sparkles className="w-3 h-3 mr-1" />
                              {p.highlight.label}
                            </Badge>
                          )}
                          {isCurrentPlan && (
                            <Badge variant="outline" className="border-primary text-primary bg-primary/10 text-xs">
                              Plano atual
                            </Badge>
                          )}
                          {isPendingPlan && (
                            <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50 text-xs">
                              Agendado
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <CardTitle className={`text-base font-semibold ${p.color}`}>{p.name}</CardTitle>
                        <CardDescription className="text-foreground/70 text-xs">{p.subtitle}</CardDescription>
                      </div>
                      <div className="pt-3">
                        <span className={`text-2xl font-bold ${p.color}`}>{p.price}</span>
                        {p.priceDescription ? (
                          <span className="text-xs text-muted-foreground ml-1">{p.priceDescription}</span>
                        ) : null}
                        {p.priceDiscount && p.priceTotal ? (
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
                            <span className="whitespace-nowrap">{p.priceDiscount}</span>
                            <span aria-hidden="true">•</span>
                            <span className="whitespace-nowrap">{p.priceTotal}</span>
                          </div>
                        ) : null}
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 pt-4 space-y-3">
                      <ul className="space-y-2">
                        {p.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${p.color}`} />
                            <span className="text-xs text-foreground/80">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-2 mt-auto">
                        <Button
                          className={`w-full text-sm ${buttonClass}`}
                          variant={isCurrentPlan || isPendingPlan ? "secondary" : buttonVariant}
                          disabled={(!canKeepCurrentPlan && (isCurrentPlan || isPendingPlan)) || startCheckout.isPending}
                          onClick={() => handleSelectPlan(p)}
                        >
                          {startCheckout.isPending && selectedPlan?.id === p.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          ) : null}
                          {canKeepCurrentPlan ? "Manter plano atual" : isCurrentPlan ? "Plano atual" : isPendingPlan ? "Agendado" : ctaLabel[p.id]}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Transparência */}
          <Card className="bg-muted/30 border-dashed">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Info className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-sm md:text-base">Como funcionam os pagamentos?</CardTitle>
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

      {/* Modal: confirmar checkout */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPlan?.id === plan && pendingPlan ? "Manter plano atual" : "Confirmar assinatura"}
            </DialogTitle>
            <DialogDescription className="text-pretty">
              {selectedPlan?.id === plan && pendingPlan
                ? "A troca agendada será cancelada e sua assinatura continuará no plano atual."
                : "Você será redirecionada para o Stripe para finalizar o pagamento com segurança."}
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div
              className={`p-4 rounded-lg bg-gradient-to-br ${selectedPlan.bgGradient} border ${selectedPlan.borderColor}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-semibold ${selectedPlan.color}`}>Plano {selectedPlan.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedPlan.subtitle}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-bold ${selectedPlan.color}`}>{selectedPlan.price}</span>
                  {selectedPlan.priceDescription ? (
                    <p className="text-xs text-muted-foreground">{selectedPlan.priceDescription}</p>
                  ) : null}
                  {selectedPlan.priceDiscount && selectedPlan.priceTotal ? (
                    <div className="mt-0.5 flex flex-wrap justify-end gap-x-1 text-xs text-muted-foreground">
                      <span className="whitespace-nowrap">{selectedPlan.priceDiscount}</span>
                      <span aria-hidden="true">•</span>
                      <span className="whitespace-nowrap">{selectedPlan.priceTotal}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmCheckout} disabled={startCheckout.isPending}>
              {startCheckout.isPending ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              ) : null}
              {selectedPlan?.id === plan && pendingPlan ? "Confirmar" : "Ir para pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: confirmar cancelamento */}
      <Dialog open={isCancelOpen} onOpenChange={handleCancelDialogOpenChange}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-balance">Antes de cancelar, conte o motivo</DialogTitle>
            <DialogDescription className="text-pretty">
              A assinatura será cancelada no fim do período já pago. Você continua com acesso completo até lá
              e pode reativar a qualquer momento antes disso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup
              value={cancelReason}
              onValueChange={(value) => setCancelReason(value as SubscriptionCancellationReason)}
              className="gap-2"
            >
              {cancellationReasons.map((reason) => {
                const optionId = `cancel-reason-${reason.value}`;
                const checked = cancelReason === reason.value;

                return (
                  <Label
                    key={reason.value}
                    htmlFor={optionId}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-3 text-sm leading-5 transition-colors",
                      checked
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-foreground/80 hover:bg-muted/50"
                    )}
                  >
                    <RadioGroupItem id={optionId} value={reason.value} className="mt-0.5 shrink-0" />
                    <span>{reason.label}</span>
                  </Label>
                );
              })}
            </RadioGroup>

            {cancelReason === "other" && (
              <div className="space-y-2">
                <Label htmlFor="cancel-reason-details">Conte em poucas palavras</Label>
                <Textarea
                  id="cancel-reason-details"
                  value={cancelReasonDetails}
                  onChange={(event) => setCancelReasonDetails(event.target.value.slice(0, 240))}
                  placeholder="Ex.: não encontrei o tipo de atendimento que precisava"
                  className="min-h-24 text-base md:text-sm"
                  maxLength={240}
                />
                <p className="text-xs text-muted-foreground">{cancelReasonDetails.length}/240</p>
              </div>
            )}

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
              O cancelamento será agendado para o fim do período já pago. Você continua com acesso completo
              até lá.
            </div>

            {submitCancellationFeedback.error && (
              <p className="text-sm text-destructive">
                {submitCancellationFeedback.error instanceof Error
                  ? submitCancellationFeedback.error.message
                  : "Não foi possível registrar o motivo. Tente novamente."}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => handleCancelDialogOpenChange(false)}
              disabled={submitCancellationFeedback.isPending || cancelSubscription.isPending}
            >
              Manter assinatura
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleConfirmCancel()}
              disabled={!canConfirmCancel}
            >
              {submitCancellationFeedback.isPending || cancelSubscription.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyBilling;
