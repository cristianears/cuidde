import { useState } from "react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  MapPin,
  Briefcase,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { mockCaregivers } from "@/data/mockData";

const journeyTypes = [
  { id: "plantoes", label: "Plantões avulsos", desc: "Atendimentos pontuais e esporádicos" },
  { id: "diarias", label: "Diárias", desc: "Atendimentos por dia completo" },
  { id: "coberturas", label: "Coberturas temporárias / substituição", desc: "Substituição de outros cuidadores" },
  { id: "finais-semana", label: "Finais de semana", desc: "Disponibilidade aos sábados e domingos" },
  { id: "longo-periodo", label: "Longo período", desc: "Atendimentos contínuos e prolongados" },
];

const areaOptions = [
  { value: "bairro", label: "Somente meu bairro" },
  { value: "cidade", label: "Minha cidade" },
  { value: "proximas", label: "Cidades próximas" },
];

const radiusOptions = [
  { value: "5", label: "Até 5 km" },
  { value: "10", label: "Até 10 km" },
  { value: "20", label: "Até 20 km" },
];

const CaregiverAvailability = () => {
  const navigate = useNavigate();
  const currentUser = mockCaregivers[0];

  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedJourneyTypes, setSelectedJourneyTypes] = useState<string[]>(["diarias"]);
  const [areaType, setAreaType] = useState<"bairro" | "cidade" | "proximas">("cidade");
  const [radius, setRadius] = useState("10");
  const [observations, setObservations] = useState("");

  const toggleJourneyType = (id: string) => {
    setSelectedJourneyTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const handleSave = () => {
    toast.success("Disponibilidade atualizada com sucesso");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="caregiver" userName={currentUser.name} userPhoto={currentUser.photo} />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-3xl space-y-4 md:space-y-6">
          <PageHeader
            title="Disponibilidade para novos atendimentos"
            description="Sinalize se você está disponível para receber novas solicitações. Horários, valores e agenda são combinados diretamente com a família."
          />

          {/* Seção 1 - Status de Disponibilidade */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-base md:text-lg">Status de disponibilidade</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Este status influencia sua exibição nas buscas e na lista de profissionais disponíveis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsAvailable(true)}
                  className={cn(
                    "flex items-center gap-3 p-3 md:p-4 rounded-xl border-2 transition-all flex-1 text-left",
                    isAvailable
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-border hover:border-muted-foreground/30",
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                      isAvailable ? "bg-emerald-500 text-white" : "bg-muted",
                    )}
                  >
                    {isAvailable
                      ? <CheckCircle2 className="w-4 h-4" />
                      : <Circle className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className={cn(
                      "text-sm font-medium",
                      isAvailable ? "text-emerald-700 dark:text-emerald-400" : "text-foreground",
                    )}>
                      🟢 Disponível para novos atendimentos
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Você pode receber novas solicitações de contato.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAvailable(false)}
                  className={cn(
                    "flex items-center gap-3 p-3 md:p-4 rounded-xl border-2 transition-all flex-1 text-left",
                    !isAvailable
                      ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                      : "border-border hover:border-muted-foreground/30",
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                      !isAvailable ? "bg-red-500 text-white" : "bg-muted",
                    )}
                  >
                    {!isAvailable
                      ? <CheckCircle2 className="w-4 h-4" />
                      : <Circle className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className={cn(
                      "text-sm font-medium",
                      !isAvailable ? "text-red-700 dark:text-red-400" : "text-foreground",
                    )}>
                      🔴 Indisponível no momento
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Você ainda aparece no perfil, mas pode reduzir solicitações.
                    </p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Seção 2 - Tipo de Jornada Aceita */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                Tipo de jornada aceita
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Ajuda as famílias a entender o seu formato de trabalho. Não representa contrato nem compromisso fixo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {journeyTypes.map((type) => (
                  <label
                    key={type.id}
                    className={cn(
                      "flex items-start gap-3 p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all",
                      selectedJourneyTypes.includes(type.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30",
                    )}
                  >
                    <Checkbox
                      checked={selectedJourneyTypes.includes(type.id)}
                      onCheckedChange={() => toggleJourneyType(type.id)}
                      className="mt-0.5 shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{type.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{type.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground italic">
                ⚠️ Apenas sinalização de preferência.
              </p>
            </CardContent>
          </Card>

          {/* Seção 3 - Área de Atendimento */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                Área de atendimento
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Indique seu alcance com base no endereço cadastrado. Você pode combinar detalhes de deslocamento diretamente com a família.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <div className="space-y-2">
                <Label className="text-xs md:text-sm">Alcance</Label>
                <div className="flex flex-wrap gap-2">
                  {areaOptions.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => setAreaType(option.value as typeof areaType)}
                      className={cn(
                        "px-3 md:px-4 py-1.5 md:py-2 rounded-full border-2 text-xs md:text-sm font-medium transition-all",
                        areaType === option.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-muted-foreground/30 text-foreground",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {areaType === "proximas" && (
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Raio aproximado</Label>
                  <Select value={radius} onValueChange={setRadius}>
                    <SelectTrigger className="w-full sm:w-48 text-sm">
                      <SelectValue placeholder="Selecione o raio" />
                    </SelectTrigger>
                    <SelectContent>
                      {radiusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Dica: raio maior pode aumentar solicitações — ajuste conforme sua rotina.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seção 4 - Observações */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                Observações
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Opcional — informações curtas que podem ajudar no match.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value.slice(0, 300))}
                placeholder="Ex: Prefiro diárias, não faço pernoite, tenho experiência com Alzheimer…"
                className="min-h-[100px] resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2 text-right">
                {observations.length}/300 caracteres
              </p>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3 pb-4 md:pb-0">
            <Button variant="outline" onClick={() => navigate("/caregiver")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <Button onClick={handleSave} className="flex-1 sm:flex-none">
              Salvar disponibilidade
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CaregiverAvailability;
