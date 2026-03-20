import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Calendar, Clock, User, Heart, Pill, Check, UtensilsCrossed, ShowerHead, PackageOpen, Loader2, Sun, Sunset, Moon, FileText, ClipboardList, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/shared/StarRating";
import { cn } from "@/lib/utils";
import { useAppointmentDetail } from "@/hooks/useAppointments";
import { useCareRoutines } from "@/hooks/useCareRoutine";
import type { CareRoutine } from "@/types/database";
import {
  appointmentStatusConfig,
  careTypeLabels,
  feedingLabels,
  moodLabels,
  shiftLabels,
  parseObservations,
} from "@/lib/labels";

const getShiftIcon = (shift: string) => {
  switch (shift) {
    case "morning":
      return <Sun className="w-5 h-5 text-amber-500" />;
    case "afternoon":
      return <Sunset className="w-5 h-5 text-orange-500" />;
    case "night":
      return <Moon className="w-5 h-5 text-indigo-500" />;
    default:
      return <Clock className="w-5 h-5" />;
  }
};

const FamilyAppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: appointment, isLoading } = useAppointmentDetail(id);
  const { data: careRoutines, isLoading: isLoadingRoutines } = useCareRoutines(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium mb-2">Atendimento não encontrado</h2>
          <Button variant="outline" onClick={() => navigate("/family/appointments")}>
            Voltar aos atendimentos
          </Button>
        </div>
      </div>
    );
  }

  const isActive = appointment.status === "ativo";
  const status = appointmentStatusConfig[appointment.status] ?? appointmentStatusConfig.pendente;

  const renderCareRoutineCard = (routine: CareRoutine) => {
    const { otherDescription, cleanObs } = parseObservations(routine.observations);
    return (
    <Card key={routine.id}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            {getShiftIcon(routine.shift)}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground">
                {shiftLabels[routine.shift] ?? routine.shift}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(routine.date + "T00:00:00").toLocaleDateString("pt-BR")}
              </p>
            </div>
            {cleanObs && (
              <p className="text-sm text-muted-foreground">{cleanObs}</p>
            )}
          </div>
        </div>

        {/* Care types performed */}
        {routine.care_types && routine.care_types.length > 0 && (
          <div className="pl-[3.25rem] flex flex-wrap gap-1.5">
            {routine.care_types.map((type) => {
              const config = careTypeLabels[type];
              if (!config) return null;
              const Icon = config.icon;
              const label = type === "other" && otherDescription
                ? `Outros: ${otherDescription}`
                : config.label;
              return (
                <Badge key={type} variant="secondary" className="text-xs gap-1 font-normal">
                  <Icon className="w-3 h-3" />
                  {label}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Medication items */}
        {routine.medication_items && routine.medication_items.length > 0 && (
          <div className="pl-[3.25rem] space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5" />
              Medicamentos
            </p>
            {routine.medication_items.map((med, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                  med.applied ? "border-green-500 bg-green-500" : "border-muted-foreground/30"
                )}>
                  {med.applied && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className={cn("text-sm", med.applied ? "text-foreground" : "text-muted-foreground")}>
                  {med.name}
                </span>
                <span className="text-xs text-muted-foreground">({med.time})</span>
                {med.applied && med.applied_at && (
                  <Badge variant="outline" className="text-[10px] py-0 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                    {new Date(med.applied_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Well-being indicators */}
        {(routine.feeding_status || routine.hygiene_done !== null || routine.mood) && (
          <div className="pl-[3.25rem] flex flex-wrap gap-3 text-xs">
            {routine.feeding_status && (
              <span className={cn("flex items-center gap-1", feedingLabels[routine.feeding_status]?.color)}>
                <UtensilsCrossed className="w-3.5 h-3.5" />
                {feedingLabels[routine.feeding_status]?.text}
              </span>
            )}
            {routine.hygiene_done !== null && (
              <span className={cn(
                "flex items-center gap-1",
                routine.hygiene_done ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              )}>
                <ShowerHead className="w-3.5 h-3.5" />
                Banho: {routine.hygiene_done ? "Sim" : "Não"}
              </span>
            )}
            {routine.mood && (
              <span className="flex items-center gap-1 text-foreground">
                {moodLabels[routine.mood]?.emoji} {moodLabels[routine.mood]?.text}
              </span>
            )}
          </div>
        )}

        {/* Items running low */}
        {routine.items_running_low && routine.items_running_low.length > 0 && (
          <div className="pl-[3.25rem]">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1">
              <PackageOpen className="w-3.5 h-3.5" />
              Itens acabando
            </p>
            <div className="flex flex-wrap gap-1.5">
              {routine.items_running_low.map((item, idx) => (
                <Badge key={idx} variant="outline" className="text-[10px] border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Occurrences */}
        {routine.has_occurrence && routine.occurrence_description && (
          <div className="pl-[3.25rem] p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Ocorrência:</strong> {routine.occurrence_description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/family/appointments")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {/* Appointment Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {appointment.caregiver_name ?? "Cuidador"}
                  </h1>
                  <p className="text-muted-foreground text-sm">{appointment.type}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="outline" className={status.className}>
                  {status.label}
                </Badge>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Início: {new Date(appointment.start_date).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>

            {isActive && (
              <Button
                className="gap-2"
                onClick={() => navigate(`/chat/${id}?role=family`)}
              >
                <MessageCircle className="h-4 w-4" />
                Conversar com o cuidador
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content with Tabs */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="rotina" className="space-y-6">
          <TabsList className="h-auto p-1 bg-muted/70 border border-border rounded-xl grid w-full grid-cols-3 gap-1">
            <TabsTrigger
              value="resumo"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg py-2.5 px-3 text-sm font-medium transition-all gap-2"
            >
              <FileText className="w-4 h-4" />
              Resumo
            </TabsTrigger>
            <TabsTrigger
              value="rotina"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg py-2.5 px-3 text-sm font-medium transition-all gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Rotina de Cuidados</span>
              <span className="sm:hidden">Cuidados</span>
              {careRoutines && careRoutines.length > 0 && (
                <span className="bg-primary/15 text-primary text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {careRoutines.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="historico"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg py-2.5 px-3 text-sm font-medium transition-all gap-2"
            >
              <History className="w-4 h-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Tab: Resumo */}
          <TabsContent value="resumo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Atendimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointment.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Descrição</p>
                    <p className="text-foreground">{appointment.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Modalidade</p>
                  <p className="text-foreground">{appointment.modality ?? appointment.type}</p>
                </div>
                {appointment.family_notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Observações</p>
                    <p className="text-foreground">{appointment.family_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Rotina de Cuidados */}
          <TabsContent value="rotina" className="space-y-4">
            {isLoadingRoutines ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : careRoutines && careRoutines.length > 0 ? (
              <div className="space-y-4">
                {careRoutines.map(renderCareRoutineCard)}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Nenhum cuidado foi registrado até o momento.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Linha do Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-4">
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                      <div>
                        <p className="font-medium text-foreground">Atendimento criado</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(appointment.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    {careRoutines && careRoutines.length > 0 && (
                      <div className="relative pl-8">
                        <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                        <div>
                          <p className="font-medium text-foreground">
                            {careRoutines.length} registro(s) de cuidado
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Último: {new Date(careRoutines[0].date + "T00:00:00").toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FamilyAppointmentDetails;
