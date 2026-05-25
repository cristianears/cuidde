import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/shared/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useCaregiverProfile } from "@/hooks/useCaregiverProfile";
import { useAppointmentDetail, useUpdateAppointmentStatus } from "@/hooks/useAppointments";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useCareRoutines, useDeleteCareRoutine } from "@/hooks/useCareRoutine";
import { supabase } from "@/lib/supabase";
import { useAppointmentHasReview } from "@/hooks/useReviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  History,
  FileText,
  Sun,
  Moon,
  Sunset,
  MessageSquare,
  MapPin,
  Pill,
  Check,
  UtensilsCrossed,
  ShowerHead,
  PackageOpen,
  Loader2,
  CheckCircle,
  XCircle,
  Heart,
  Stethoscope,
  AlertTriangle,
  Pencil,
  Trash2,
  User,
  Activity,
  ClipboardList,
  MessageCircle,
  Thermometer,
  Droplets,
  Wind,
  Star,
} from "lucide-react";
import type { AppointmentStatus, CareRoutine, CareType, ElderlyMedication, FamilyProfile, VitalSignsData } from "@/types/database";
import {
  appointmentStatusConfig,
  careTypeLabels,
  feedingLabels,
  hydrationLabels,
  moodLabels,
  shiftLabels,
  parseObservations,
} from "@/lib/labels";

const getStatusBadge = (status: AppointmentStatus) => {
  const variants: Record<AppointmentStatus, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
    ativo: { variant: "default", label: "Ativo" },
    finalizado: { variant: "secondary", label: "Finalizado" },
    pendente: { variant: "outline", label: "Pendente" },
    cancelado: { variant: "destructive", label: "Cancelado" },
  };
  return variants[status] ?? variants.pendente;
};

const getShiftIcon = (shift: string) => {
  switch (shift) {
    case "morning":
      return <Sun className="w-4 h-4 text-amber-500" />;
    case "afternoon":
      return <Sunset className="w-4 h-4 text-orange-500" />;
    case "night":
      return <Moon className="w-4 h-4 text-indigo-500" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profileData } = useCaregiverProfile();
  const { data: appointment, isLoading } = useAppointmentDetail(id);
  const { data: careRoutines, isLoading: isLoadingRoutines } = useCareRoutines(id);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateAppointmentStatus();
  const { data: unread } = useUnreadCounts("caregiver");
  const chatUnread = id ? (unread?.unreadByAppointment[id] ?? 0) : 0;
  const { mutate: deleteRoutine, isPending: isDeleting } = useDeleteCareRoutine();
  const { data: hasReview } = useAppointmentHasReview(appointment?.id);

  // Elderly profile from family
  const [familyProfile, setFamilyProfile] = useState<Partial<FamilyProfile> | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    if (!appointment) return;
    setIsLoadingProfile(true);
    supabase
      .from("family_profiles")
      .select("elderly_name, elderly_age, elderly_conditions, blood_type, pre_existing_conditions, allergies, continuous_medications, elderly_medications, responsible_doctor, health_insurance, care_needs")
      .eq("id", appointment.family_id)
      .single()
      .then(({ data }) => {
        setFamilyProfile(data);
        setIsLoadingProfile(false);
      });
  }, [appointment]);

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar role="caregiver" userName={profileData?.profiles.full_name ?? user?.email ?? ""} userPhoto={profileData?.photo_url ?? undefined} />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!appointment) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar role="caregiver" userName={profileData?.profiles.full_name ?? user?.email ?? ""} userPhoto={profileData?.photo_url ?? undefined} />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-lg font-medium mb-2">Atendimento não encontrado</h2>
              <Button variant="outline" onClick={() => navigate("/caregiver/appointments")}>
                Voltar aos atendimentos
              </Button>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const statusInfo = getStatusBadge(appointment.status);
  const isActive = appointment.status === "ativo";

  const handleAccept = () => updateStatus({ id: appointment.id, status: "ativo" });
  const handleReject = () => {
    const reason = prompt("Motivo da recusa (opcional):");
    updateStatus({ id: appointment.id, status: "cancelado", cancel_reason: reason ?? undefined });
  };
  const handleFinalize = () => updateStatus({ id: appointment.id, status: "finalizado" });

  const handleDeleteRoutine = (routineId: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro de cuidado?")) return;
    deleteRoutine({ id: routineId, appointmentId: appointment.id });
  };

  const renderCareRoutineCard = (care: CareRoutine) => {
    const { otherDescription, cleanObs } = parseObservations(care.observations);
    return (
    <Card key={care.id}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
            {getShiftIcon(care.shift)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">
                {new Date(care.date + "T00:00:00").toLocaleDateString("pt-BR")}
              </span>
              <Badge variant="outline" className="text-xs">
                {shiftLabels[care.shift] ?? care.shift}
              </Badge>
            </div>
            {cleanObs && (
              <p className="text-sm text-muted-foreground">{cleanObs}</p>
            )}
          </div>

          {/* Edit / Delete buttons */}
          {isActive && (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => navigate(`/caregiver/appointments/${id}/care-routine?edit=${care.id}`)}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDeleteRoutine(care.id)}
                disabled={isDeleting}
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Care types performed */}
        {care.care_types && care.care_types.length > 0 && (
          <div className="pl-14 flex flex-wrap gap-1.5">
            {care.care_types.map((type) => {
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
        {care.medication_items && care.medication_items.length > 0 && (
          <div className="pl-14 space-y-1">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5" />
              Medicamentos
            </p>
            {care.medication_items.map((med, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                  med.applied ? "border-green-500 bg-green-500" : "border-muted-foreground/30"
                )}>
                  {med.applied && <Check className="w-3 h-3 text-white" />}
                </div>
                <span>{med.name}</span>
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
        {(care.feeding_status || care.hydration || care.hygiene_done !== null || care.mood) && (
          <div className="pl-14 flex flex-wrap gap-3 text-xs">
            {care.feeding_status && (
              <span className={cn("flex items-center gap-1", feedingLabels[care.feeding_status]?.color)}>
                <UtensilsCrossed className="w-3.5 h-3.5" />
                {feedingLabels[care.feeding_status]?.text}
              </span>
            )}
            {care.hydration && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Droplets className="w-3.5 h-3.5" />
                Água: {hydrationLabels[care.hydration] ?? care.hydration}
              </span>
            )}
            {care.hygiene_done !== null && (
              <span className={cn(
                "flex items-center gap-1",
                care.hygiene_done ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              )}>
                <ShowerHead className="w-3.5 h-3.5" />
                Banho: {care.hygiene_done ? "Sim" : "Não"}
              </span>
            )}
            {care.mood && (
              <span className="flex items-center gap-1 text-foreground">
                {moodLabels[care.mood]?.emoji} {moodLabels[care.mood]?.text}
              </span>
            )}
          </div>
        )}

        {/* Vital signs */}
        {care.vital_signs && Object.keys(care.vital_signs).filter(k => k !== 'recordedAt').length > 0 && (() => {
          const vs = care.vital_signs as VitalSignsData;
          return (
            <div className="pl-14 space-y-1.5">
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
        {care.items_running_low && care.items_running_low.length > 0 && (
          <div className="pl-14">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1">
              <PackageOpen className="w-3.5 h-3.5" />
              Itens acabando
            </p>
            <div className="flex flex-wrap gap-1.5">
              {care.items_running_low.map((item, idx) => (
                <Badge key={idx} variant="outline" className="text-[10px] border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Occurrence */}
        {care.has_occurrence && care.occurrence_description && (
          <div className="pl-14 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Ocorrência:</strong> {care.occurrence_description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
  };

  const elderlyConditionLabels: Record<string, string> = {
    alzheimer: "Alzheimer",
    parkinson: "Parkinson",
    demencia: "Demência",
    acamado: "Acamado",
    cadeirante: "Cadeirante",
    diabetes: "Diabetes",
    hipertensao: "Hipertensão",
    avc: "AVC",
    cancer: "Câncer",
    depressao: "Depressão",
    cardiopatia: "Cardiopatia",
    osteoporose: "Osteoporose",
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar role="caregiver" userName={profileData?.profiles.full_name ?? user?.email ?? ""} userPhoto={profileData?.photo_url ?? undefined} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="max-w-3xl space-y-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/caregiver/appointments")}
            className="mb-0 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos atendimentos
          </Button>

          {/* Header Card */}
          <Card className="mb-6">
            <CardContent className="p-4 md:p-5">
              <div className="flex flex-col gap-4">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge variant={statusInfo.variant} className="text-sm">
                      {statusInfo.label}
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      {appointment.type}
                    </Badge>
                  </div>
                  <div>
                    <h1 className="text-lg md:text-xl font-semibold text-foreground">
                      {appointment.family_name ?? "Família"}
                    </h1>
                    {familyProfile?.elderly_name && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Idoso: <span className="font-medium text-foreground">{familyProfile.elderly_name}</span>
                        {familyProfile.elderly_age ? `, ${familyProfile.elderly_age} anos` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Início: {new Date(appointment.start_date + "T00:00:00").toLocaleDateString("pt-BR")}
                    </span>
                    {appointment.modality && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {appointment.modality}
                      </span>
                    )}
                  </div>
                  {appointment.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed border-t pt-3 mt-1">
                      {appointment.description}
                    </p>
                  )}
                  {appointment.family_notes && (
                    <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium text-foreground">Obs. da família: </span>
                      <span className="text-muted-foreground">{appointment.family_notes}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons based on status */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {appointment.status === "pendente" && (
                    <>
                      <Button size="sm" onClick={handleAccept} disabled={isUpdating} className="gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Aceitar
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleReject} disabled={isUpdating} className="gap-2 text-destructive hover:text-destructive">
                        <XCircle className="w-4 h-4" />
                        Recusar
                      </Button>
                    </>
                  )}
                  {isActive && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/chat/${appointment.id}`)} className="gap-2 relative">
                        <MessageCircle className="w-4 h-4" />
                        Conversar com família
                        {chatUnread > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                            {chatUnread > 9 ? '9+' : chatUnread}
                          </span>
                        )}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleFinalize} disabled={isUpdating}>
                        <History className="w-4 h-4 mr-2" />
                        Finalizar atendimento
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Banner: aguardando avaliação da família */}
          {appointment.status === "finalizado" && !hasReview && (
            <div className="flex gap-3 items-start p-4 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
              <Star className="w-5 h-5 text-blue-500 fill-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Aguardando avaliação da família
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                  Atendimento finalizado! Incentive a família a avaliar — avaliações aumentam sua visibilidade para novas famílias.
                </p>
              </div>
            </div>
          )}

          {/* Tabs — enhanced styling */}
          <Tabs defaultValue="rotina" className="space-y-6">
            <TabsList className="h-auto p-1 bg-muted/70 border border-border rounded-xl grid w-full grid-cols-2 gap-1">
              <TabsTrigger
                value="perfil"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg py-2.5 px-3 text-sm font-medium transition-all gap-2"
              >
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Perfil do Idoso</span>
                <span className="sm:hidden">Idoso</span>
              </TabsTrigger>
              <TabsTrigger
                value="rotina"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg py-2.5 px-3 text-sm font-medium transition-all gap-2"
              >
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Registro de Cuidados</span>
                <span className="sm:hidden">Cuidados</span>
                {careRoutines && careRoutines.length > 0 && (
                  <span className="bg-primary/15 text-primary text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {careRoutines.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Tab: Perfil do Idoso */}
            <TabsContent value="perfil" className="space-y-4">
              {isLoadingProfile ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : familyProfile ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Personal Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        Dados Pessoais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Nome</p>
                        <p className="text-sm font-medium">{familyProfile.elderly_name || "Não informado"}</p>
                      </div>
                      {familyProfile.elderly_age && (
                        <div>
                          <p className="text-xs text-muted-foreground">Idade</p>
                          <p className="text-sm font-medium">{familyProfile.elderly_age} anos</p>
                        </div>
                      )}
                      {familyProfile.blood_type && (
                        <div>
                          <p className="text-xs text-muted-foreground">Tipo sanguíneo</p>
                          <p className="text-sm font-medium">{familyProfile.blood_type}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Health Conditions */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        Condições de Saúde
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {familyProfile.elderly_conditions && familyProfile.elderly_conditions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {familyProfile.elderly_conditions.map((cond, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {elderlyConditionLabels[cond] ?? cond}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma condição registrada.</p>
                      )}
                      {familyProfile.pre_existing_conditions && (
                        <div>
                          <p className="text-xs text-muted-foreground">Condições pré-existentes</p>
                          <p className="text-sm">{familyProfile.pre_existing_conditions}</p>
                        </div>
                      )}
                      {familyProfile.allergies && (
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            Alergias
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-400">{familyProfile.allergies}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Medications */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Pill className="w-4 h-4 text-primary" />
                        Medicamentos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {familyProfile.elderly_medications && (familyProfile.elderly_medications as ElderlyMedication[]).length > 0 ? (
                        <div className="space-y-2">
                          {(familyProfile.elderly_medications as ElderlyMedication[]).map((med, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                              <span className="text-sm font-medium">{med.name}</span>
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {med.time}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhum medicamento cadastrado.</p>
                      )}
                      {familyProfile.continuous_medications && (
                        <div>
                          <p className="text-xs text-muted-foreground">Medicação contínua</p>
                          <p className="text-sm">{familyProfile.continuous_medications}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Medical Follow-up + Care Needs */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-primary" />
                        Acompanhamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {familyProfile.responsible_doctor && (
                        <div>
                          <p className="text-xs text-muted-foreground">Médico responsável</p>
                          <p className="text-sm font-medium">{familyProfile.responsible_doctor}</p>
                        </div>
                      )}
                      {familyProfile.health_insurance && (
                        <div>
                          <p className="text-xs text-muted-foreground">Convênio</p>
                          <p className="text-sm font-medium">{familyProfile.health_insurance}</p>
                        </div>
                      )}
                      {familyProfile.care_needs && (
                        <div>
                          <p className="text-xs text-muted-foreground">Necessidades de cuidado</p>
                          <p className="text-sm leading-relaxed">{familyProfile.care_needs}</p>
                        </div>
                      )}
                      {!familyProfile.responsible_doctor && !familyProfile.health_insurance && !familyProfile.care_needs && (
                        <p className="text-sm text-muted-foreground">Nenhuma informação de acompanhamento registrada.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      Perfil do idoso ainda não preenchido pela família.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>


            {/* Tab: Registro de cuidados */}
            <TabsContent value="rotina" className="space-y-4">
              {isActive && (
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => navigate(`/caregiver/appointments/${id}/care-routine`)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar cuidado
                  </Button>
                </div>
              )}

              {isLoadingRoutines ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : careRoutines && careRoutines.length > 0 ? (
                <div className="space-y-3">
                  {careRoutines.map(renderCareRoutineCard)}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1">Nenhum registro ainda</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Registre aqui os cuidados realizados durante o atendimento.
                    </p>
                    {isActive && (
                      <Button size="sm" onClick={() => navigate(`/caregiver/appointments/${id}/care-routine`)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Registrar cuidado
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

          </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AppointmentDetails;
