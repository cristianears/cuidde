import { useState, useEffect } from "react";
import { Save, DollarSign, Eye, AlertCircle, MessageSquare } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useCaregiverProfile, useUpdatePricing } from "@/hooks/useCaregiverProfile";

const CaregiverPricing = () => {
  const { user } = useAuth()
  const { data: profileData } = useCaregiverProfile()
  const updatePricing = useUpdatePricing()

  const [pricePerHour, setPricePerHour] = useState<number | "">("");
  const [pricePerDay, setPricePerDay] = useState<number | "">("");
  const [pricingNote, setPricingNote] = useState("");

  // Sincronizar com dados reais quando carregarem
  useEffect(() => {
    if (profileData) {
      setPricePerHour(profileData.price_per_hour ?? "")
      setPricePerDay(profileData.price_per_day ?? "")
      setPricingNote(profileData.pricing_note ?? "")
    }
  }, [profileData])

  const isComplete = pricePerHour !== "" && pricePerDay !== "";
  const isValidNumber = (v: number | "") => v !== "" && Number.isFinite(v) && v > 0;
  const canSave = isValidNumber(pricePerHour) && isValidNumber(pricePerDay);

  const handleSave = () => {
    if (!canSave) return
    updatePricing.mutate({
      price_per_hour: pricePerHour as number,
      price_per_day: pricePerDay as number,
      pricing_note: pricingNote,
    })
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        role="caregiver"
        userName={profileData?.profiles.full_name ?? user?.email ?? ""}
        userPhoto={profileData?.photo_url ?? undefined}
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <PageHeader
          title="Valores de atendimento"
          description="Defina valores de referência para ajudar famílias a entenderem seu perfil. A combinação final é feita diretamente entre você e a família."
        />

        <div className="max-w-2xl space-y-4 md:space-y-6">

          {/* Pricing Card */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                Seus valores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {/* Valor por hora */}
                <div className="space-y-2">
                  <Label htmlFor="pricePerHour" className="text-xs md:text-sm">
                    Valor por hora (referência)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                      R$
                    </span>
                    <Input
                      id="pricePerHour"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(e.target.value ? Number(e.target.value) : "")}
                      className="pl-10 text-base md:text-lg h-11 md:h-12"
                    />
                  </div>
                </div>

                {/* Valor por diária */}
                <div className="space-y-2">
                  <Label htmlFor="pricePerDay" className="text-xs md:text-sm">
                    Diária / plantão (12h) — referência
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                      R$
                    </span>
                    <Input
                      id="pricePerDay"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={pricePerDay}
                      onChange={(e) => setPricePerDay(e.target.value ? Number(e.target.value) : "")}
                      className="pl-10 text-base md:text-lg h-11 md:h-12"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Você pode combinar outros formatos com a família (ex.: 6h, 8h, pernoite, mensalista).
                  </p>
                </div>
              </div>

              {/* Observação de valores */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                  <Label htmlFor="pricingNote" className="text-xs md:text-sm">
                    Observação de valores (opcional)
                  </Label>
                </div>
                <Textarea
                  id="pricingNote"
                  value={pricingNote}
                  onChange={(e) => setPricingNote(e.target.value.slice(0, 240))}
                  placeholder="Ex: valores podem variar conforme complexidade do cuidado, pernoite e deslocamento."
                  className="min-h-[90px] resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground text-right">{pricingNote.length}/240</p>
              </div>
            </CardContent>
          </Card>

          {/* Info Block */}
          <div className="bg-muted/50 rounded-xl p-3 md:p-4 border border-border/50">
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              Esses valores são exibidos no seu perfil e podem aparecer em filtros de busca.{" "}
              <span className="text-foreground/80">
                A negociação e o pagamento do serviço acontecem diretamente entre você e a família (fora da plataforma).
              </span>
            </p>
          </div>

          {/* Visibility Status */}
          <div className="flex items-center gap-2">
            {isComplete ? (
              <Badge
                variant="secondary"
                className="gap-1.5 py-1.5 px-3 bg-accent/10 text-accent border-accent/20"
              >
                <Eye className="w-3.5 h-3.5" />
                Valores visíveis para as famílias
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="gap-1.5 py-1.5 px-3 bg-amber-500/10 text-amber-600 border-amber-500/20"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Valores incompletos — seu perfil pode aparecer menos nas buscas
              </Badge>
            )}
          </div>

          {/* Save Button */}
          <div className="pb-4 md:pb-0">
            <Button
              onClick={handleSave}
              disabled={!canSave || updatePricing.isPending}
              className="w-full sm:w-auto gap-2 bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-60"
              size="lg"
            >
              {updatePricing.isPending ? (
                <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar valores
            </Button>
            {!canSave && (
              <p className="text-xs text-muted-foreground mt-2">
                Para salvar, preencha valores maiores que zero.
              </p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default CaregiverPricing;
