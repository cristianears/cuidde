import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Calendar, Clock, User, Heart, Pill, Check, UtensilsCrossed, ShowerHead, Droplets, PackageOpen, Loader2, Sun, Sunset, Moon, FileText, ClipboardList, Activity, Thermometer, Wind, Star } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import StarRating from "@/components/shared/StarRating";
import InteractiveStarRating from "@/components/shared/InteractiveStarRating";
import { cn } from "@/lib/utils";
import { useAppointmentDetail, useUpdateAppointmentStatus } from "@/hooks/useAppointments";
import { useCareRoutines } from "@/hooks/useCareRoutine";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useExistingReview, useSubmitReview } from "@/hooks/useReviews";
import type { CareRoutine, VitalSignsData } from "@/types/database";
import {
  appointmentStatusConfig,
  careTypeLabels,
  feedingLabels,
  hydrationLabels,
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

const CRITERIA = [
  { key: "rating_pontualidade" as const, label: "Pontualidade" },
  { key: "rating_competencia" as const, label: "Competência" },
  { key: "rating_comunicacao" as const, label: "Comunicação" },
  { key: "rating_trato" as const, label: "Trato com o idoso" },
  { key: "rating_confianca" as const, label: "Confiança" },
] as const;

type CriteriaKey = (typeof CRITERIA)[number]["key"];

const FamilyAppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: familyProfileData } = useFamilyProfile();
  const { data: appointment, isLoading } = useAppointmentDetail(id);
  const { data: careRoutines, isLoading: isLoadingRoutines } = useCareRoutines(id);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateAppointmentStatus();
  const { data: unread } = useUnreadCounts("family");
  const chatUnread = id ? (unread?.unreadByAppointment[id] ?? 0) : 0;

  const { data: existingReview, isLoading: isLoadingReview } = useExistingReview(
    appointment?.id
  );
  const { mutate: submitReview, isPending: isSubmitting } = useSubmitReview();

  const [activeTab, setActiveTab] = useState("rotina");

  const [criteria, setCriteria] = useState<Record<CriteriaKey, number>>({
    rating_pontualidade: 0,
    rating_competencia: 0,
    rating_comunicacao: 0,
    rating_trato: 0,
    rating_confianca: 0,
  });
  const [comment, setComment] = useState("");

  const allFilled = Object.values(criteria).every((v) => v > 0);
  const avgRating =
    allFilled
      ? Object.values(criteria).reduce((a, b) => a + b, 0) / 5
      : 0;
  const needsComment = avgRating > 0 && avgRating <= 2;
  const commentTooShort = needsComment && comment.trim().length < 20;

  function handleSubmitReview() {
    if (!appointment || !allFilled) return;
    submitReview({
      appointment_id: appointment.id,
      ...criteria,
      comment,
    });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar role="family" userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""} userPhoto={familyProfileData?.photo_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar role="family" userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""} userPhoto={familyProfileData?.photo_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-medium mb-2">Atendimento não encontrado</h2>
            <Button variant="outline" onClick={() => navigate("/family/appointments")}>
              Voltar aos atendimentos
            </Button>
          </div>
        </main>
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
        {(routine.feeding_status || routine.hydration || routine.hygiene_done !== null || routine.mood) && (
          <div className="pl-[3.25rem] flex flex-wrap gap-3 text-xs">
            {routine.feeding_status && (
              <span className={cn("flex items-center gap-1", feedingLabels[routine.feeding_status]?.color)}>
                <UtensilsCrossed className="w-3.5 h-3.5" />
                {feedingLabels[routine.feeding_status]?.text}
              </span>
            )}
            {routine.hydration && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Droplets className="w-3.5 h-3.5" />
                Água: {hydrationLabels[routine.hydration] ?? routine.hydration}
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

        {/* Vital signs */}
        {routine.vital_signs && Object.keys(routine.vital_signs).filter(k => k !== 'recordedAt').length > 0 && (() => {
          const vs = routine.vital_signs as VitalSignsData;
          return (
            <div className="pl-[3.25rem] space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Sinais Vitais
              </p>
              <div className="flex flex-wrap gap-2">
                {vs.bloodPressure && (
                  <Badge variant="secondary" className="text-xs gap-1 font-normal">
                    <Activity className="w-3 h-3 text-blue-500" />
                    PA: {vs.bloodPressure.systolic}/{vs.bloodPressure.diastolic} mmHg
                  </Badge>
                )}
                {vs.temperature != null && (
                  <Badge variant="secondary" className="text-xs gap-1 font-normal">
                    <Thermometer className="w-3 h-3 text-orange-500" />
                    {vs.temperature} °C
                  </Badge>
                )}
                {vs.heartRate != null && (
                  <Badge variant="secondary" className="text-xs gap-1 font-normal">
                    <Heart className="w-3 h-3 text-red-500" />
                    {vs.heartRate} bpm
                  </Badge>
                )}
                {vs.oxygenSaturation != null && (
                  <Badge variant="secondary" className="text-xs gap-1 font-normal">
                    <Wind className="w-3 h-3 text-sky-500" />
                    SpO₂: {vs.oxygenSaturation}%
                  </Badge>
                )}
                {vs.glucose != null && (
                  <Badge variant="secondary" className="text-xs gap-1 font-normal">
                    <Droplets className="w-3 h-3 text-purple-500" />
                    Glicemia: {vs.glucose} mg/dL
                  </Badge>
                )}
              </div>
            </div>
          );
        })()}

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
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="family" userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""} userPhoto={familyProfileData?.photo_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture} />

      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <div className="max-w-3xl space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/family/appointments")}
            className="mb-0 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

      {/* Header card */}
      <div className="border bg-card rounded-xl">
        <div className="p-4 md:p-5">
          {/* Appointment Header */}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-semibold text-foreground">
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
                  Início: {new Date(appointment.start_date + "T00:00:00").toLocaleDateString("pt-BR")}
                </span>
              </div>
              {appointment.description && (
                <p className="text-sm text-muted-foreground leading-relaxed border-t pt-3 mt-1">
                  {appointment.description}
                </p>
              )}
              {appointment.family_notes && (
                <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm">
                  <span className="font-medium text-foreground">Suas observações: </span>
                  <span className="text-muted-foreground">{appointment.family_notes}</span>
                </div>
              )}
              {appointment.status === "finalizado" && !isLoadingReview && !existingReview && (
                <div className="flex gap-2 items-center px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 text-xs">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                  <span className="text-amber-800 dark:text-amber-200">
                    <span className="font-semibold">Avalie este atendimento!</span>{" "}
                    Sua avaliação é muito importante para outras famílias encontrarem o cuidador ideal. Leva menos de 2 minutos e faz toda a diferença!
                  </span>
                </div>
              )}
            </div>

            {isActive && (
              <div className="flex flex-col sm:flex-row lg:justify-end gap-2">
                <Button
                  className="gap-2 relative"
                  onClick={() => navigate(`/chat/${id}?role=family`)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Conversar com o cuidador
                  {chatUnread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                      {chatUnread > 9 ? '9+' : chatUnread}
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    updateStatus(
                      { id: appointment.id, status: "finalizado" },
                      { onSuccess: () => setActiveTab("avaliacao") }
                    )
                  }
                  disabled={isUpdating}
                >
                  <ClipboardList className="h-4 w-4" />
                  Finalizar atendimento
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className={cn(
            "h-auto p-1 bg-muted/70 border border-border rounded-xl grid gap-1",
            appointment?.status === "finalizado" ? "grid-cols-2" : "grid-cols-1"
          )}>
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
            {appointment?.status === "finalizado" && (
              <TabsTrigger
                value="avaliacao"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg py-2.5 px-3 text-sm font-medium transition-all gap-2 relative"
              >
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">Avaliação</span>
                <span className="sm:hidden">Nota</span>
                {existingReview && (
                  <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    ✓
                  </span>
                )}
              </TabsTrigger>
            )}
          </TabsList>


          {/* Tab: Rotina de Cuidados */}
          <TabsContent value="rotina" className="space-y-4">
            {isLoadingRoutines ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : careRoutines && careRoutines.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => navigate(`/family/appointments/${id}/history`)}
                  >
                    <ClipboardList className="h-4 w-4" />
                    Ver Relatório Completo
                  </Button>
                </div>
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

          {/* Tab: Avaliação */}
          {appointment?.status === "finalizado" && (
            <TabsContent value="avaliacao" className="space-y-4">
              {isLoadingReview ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : existingReview ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" />
                      Sua avaliação
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Enviada em {new Date(existingReview.created_at).toLocaleDateString("pt-BR")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <StarRating rating={existingReview.rating} size="lg" showValue />
                      <span className="text-sm text-muted-foreground">nota geral</span>
                    </div>
                    <div className="space-y-2.5">
                      {CRITERIA.map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{label}</span>
                          <StarRating
                            rating={existingReview[key] ?? 0}
                            size="sm"
                            showValue
                          />
                        </div>
                      ))}
                    </div>
                    {existingReview.comment && (
                      <p className="text-sm text-muted-foreground border-t pt-3">
                        {existingReview.comment}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex gap-3 items-start p-4 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                        Avalie este atendimento!
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                        Sua avaliação é muito importante para outras famílias encontrarem o cuidador ideal.
                        Leva menos de 2 minutos e faz toda a diferença!
                      </p>
                    </div>
                  </div>
                  <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Avaliar {appointment.caregiver_name ?? "cuidador"}
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Sua avaliação ajuda outras famílias a encontrar o cuidador certo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Critérios */}
                    <div className="space-y-4">
                      {CRITERIA.map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between gap-4">
                          <span className="text-sm font-medium min-w-[140px]">{label}</span>
                          <div className="flex items-center gap-3">
                            <InteractiveStarRating
                              value={criteria[key]}
                              onChange={(v) =>
                                setCriteria((prev) => ({ ...prev, [key]: v }))
                              }
                            />
                            {criteria[key] > 0 && (
                              <span className="text-sm text-muted-foreground w-6 text-right">
                                {criteria[key].toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Nota geral calculada */}
                    {avgRating > 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                        <span className="text-sm font-medium text-muted-foreground">Nota geral</span>
                        <StarRating rating={avgRating} size="sm" showValue />
                      </div>
                    )}

                    {/* Comentário */}
                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-medium">
                        Comentário{needsComment ? " (obrigatório para notas baixas)" : " (opcional)"}
                      </label>
                      <Textarea
                        placeholder="Conte como foi a experiência com este cuidador..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="resize-none text-sm"
                        rows={3}
                      />
                      {commentTooShort && (
                        <p className="text-xs text-destructive">
                          Para notas ≤ 2, descreva o motivo (mínimo 20 caracteres).
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={handleSubmitReview}
                      disabled={!allFilled || commentTooShort || isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Star className="w-4 h-4 mr-2" />
                      )}
                      Enviar avaliação
                    </Button>
                  </CardContent>
                </Card>
                </>
              )}
            </TabsContent>
          )}

        </Tabs>
        </div>
      </main>
    </div>
  );
};

export default FamilyAppointmentDetails;
