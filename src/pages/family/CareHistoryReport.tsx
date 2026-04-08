import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";
import { useAppointmentDetail } from "@/hooks/useAppointments";
import { useCareRoutines } from "@/hooks/useCareRoutine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Download,
  Calendar,
  Sun,
  Sunset,
  Moon,
  Clock,
  Pill,
  Check,
  UtensilsCrossed,
  ShowerHead,
  Droplets,
  PackageOpen,
  AlertTriangle,
  Activity,
  Thermometer,
  Heart,
  Wind,
  Loader2,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import { format, subDays, isAfter, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CareRoutine, VitalSignsData, MoodStatus, FeedingStatus } from "@/types/database";
import {
  careTypeLabels,
  feedingLabels,
  hydrationLabels,
  moodLabels,
  shiftLabels,
  parseObservations,
} from "@/lib/labels";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";
import CareReportPDF from "./CareReportPDF";

const periodOptions = [
  { label: "7 dias", days: 7 },
  { label: "15 dias", days: 15 },
  { label: "30 dias", days: 30 },
  { label: "Tudo", days: 0 },
];

const getShiftIcon = (shift: string) => {
  switch (shift) {
    case "morning": return <Sun className="w-4 h-4 text-amber-500" />;
    case "afternoon": return <Sunset className="w-4 h-4 text-orange-500" />;
    case "night": return <Moon className="w-4 h-4 text-indigo-500" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

interface PeriodSummary {
  totalRecords: number;
  medicationRate: number | null;
  feedingBreakdown: Record<string, number>;
  moodBreakdown: Record<string, number>;
  predominantMood: string | null;
  occurrences: number;
  avgSystolic: number | null;
  avgDiastolic: number | null;
  avgHeartRate: number | null;
  avgTemperature: number | null;
  avgGlucose: number | null;
  avgSpO2: number | null;
}

function computeSummary(routines: CareRoutine[]): PeriodSummary {
  const totalRecords = routines.length;

  // Medication rate
  let totalMeds = 0;
  let appliedMeds = 0;
  routines.forEach((r) => {
    if (r.medication_items?.length) {
      totalMeds += r.medication_items.length;
      appliedMeds += r.medication_items.filter((m) => m.applied).length;
    }
  });
  const medicationRate = totalMeds > 0 ? Math.round((appliedMeds / totalMeds) * 100) : null;

  // Feeding breakdown
  const feedingBreakdown: Record<string, number> = {};
  routines.forEach((r) => {
    if (r.feeding_status) {
      feedingBreakdown[r.feeding_status] = (feedingBreakdown[r.feeding_status] || 0) + 1;
    }
  });

  // Mood breakdown
  const moodBreakdown: Record<string, number> = {};
  routines.forEach((r) => {
    if (r.mood) {
      moodBreakdown[r.mood] = (moodBreakdown[r.mood] || 0) + 1;
    }
  });
  const predominantMood = Object.entries(moodBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Occurrences
  const occurrences = routines.filter((r) => r.has_occurrence).length;

  // Vital signs averages
  const vsList = routines.map((r) => r.vital_signs).filter(Boolean) as VitalSignsData[];
  const avg = (vals: number[]) => vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  const avgSystolic = avg(vsList.filter((v) => v.bloodPressure).map((v) => v.bloodPressure!.systolic));
  const avgDiastolic = avg(vsList.filter((v) => v.bloodPressure).map((v) => v.bloodPressure!.diastolic));
  const avgHeartRate = avg(vsList.filter((v) => v.heartRate != null).map((v) => v.heartRate!));
  const avgTemperature = avg(vsList.filter((v) => v.temperature != null).map((v) => v.temperature!));
  const avgGlucose = avg(vsList.filter((v) => v.glucose != null).map((v) => v.glucose!));
  const avgSpO2 = avg(vsList.filter((v) => v.oxygenSaturation != null).map((v) => v.oxygenSaturation!));

  return {
    totalRecords, medicationRate, feedingBreakdown, moodBreakdown,
    predominantMood, occurrences,
    avgSystolic, avgDiastolic, avgHeartRate, avgTemperature, avgGlucose, avgSpO2,
  };
}

function groupByDate(routines: CareRoutine[]): Record<string, CareRoutine[]> {
  const groups: Record<string, CareRoutine[]> = {};
  const shiftOrder = { morning: 0, afternoon: 1, night: 2 };
  routines.forEach((r) => {
    if (!groups[r.date]) groups[r.date] = [];
    groups[r.date].push(r);
  });
  Object.values(groups).forEach((arr) =>
    arr.sort((a, b) => (shiftOrder[a.shift as keyof typeof shiftOrder] ?? 9) - (shiftOrder[b.shift as keyof typeof shiftOrder] ?? 9))
  );
  return groups;
}

const CareHistoryReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: familyProfile } = useFamilyProfile();
  const { data: appointment } = useAppointmentDetail(id);
  const { data: allRoutines, isLoading } = useCareRoutines(id);
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [isExporting, setIsExporting] = useState(false);

  const filteredRoutines = useMemo(() => {
    if (!allRoutines) return [];
    if (selectedPeriod === 0) return allRoutines;
    const cutoff = startOfDay(subDays(new Date(), selectedPeriod));
    return allRoutines.filter((r) => {
      const d = new Date(r.date + "T00:00:00");
      return isAfter(d, cutoff) || d.getTime() === cutoff.getTime();
    });
  }, [allRoutines, selectedPeriod]);

  const summary = useMemo(() => computeSummary(filteredRoutines), [filteredRoutines]);
  const grouped = useMemo(() => groupByDate(filteredRoutines), [filteredRoutines]);
  const sortedDates = useMemo(
    () => Object.keys(grouped).sort((a, b) => b.localeCompare(a)),
    [grouped]
  );

  const handleExportPDF = async () => {
    if (!appointment || filteredRoutines.length === 0) return;
    setIsExporting(true);
    try {
      const blob = await pdf(
        <CareReportPDF
          elderlyName={familyProfile?.elderly_name ?? "—"}
          elderlyAge={familyProfile?.elderly_age ?? undefined}
          elderlyConditions={familyProfile?.elderly_conditions ?? []}
          caregiverName={appointment.caregiver_name ?? "Cuidador"}
          periodLabel={selectedPeriod === 0 ? "Todos os registros" : `Últimos ${selectedPeriod} dias`}
          routines={filteredRoutines}
          summary={summary}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-cuidados-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      toast.error("Erro ao gerar o PDF. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  const renderRoutineCard = (routine: CareRoutine) => {
    const { otherDescription, cleanObs } = parseObservations(routine.observations);
    const vs = routine.vital_signs as VitalSignsData | null;

    return (
      <div key={routine.id} className="pl-6 border-l-2 border-border py-3 space-y-2">
        <div className="flex items-center gap-2">
          {getShiftIcon(routine.shift)}
          <span className="text-sm font-medium">{shiftLabels[routine.shift]}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {new Date(routine.recorded_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Care types */}
        {routine.care_types?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {routine.care_types.map((type) => {
              const config = careTypeLabels[type];
              if (!config) return null;
              const label = type === "other" && otherDescription ? `Outros: ${otherDescription}` : config.label;
              return (
                <Badge key={type} variant="secondary" className="text-xs gap-1 font-normal">
                  {label}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Medications */}
        {routine.medication_items?.length > 0 && (
          <div className="space-y-1">
            {routine.medication_items.map((med, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div className={cn(
                  "w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0",
                  med.applied ? "border-green-500 bg-green-500" : "border-muted-foreground/30"
                )}>
                  {med.applied && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className={cn("text-xs", med.applied ? "text-foreground" : "text-muted-foreground")}>
                  {med.name}
                </span>
                <span className="text-[10px] text-muted-foreground">({med.time})</span>
                {med.applied && med.applied_at && (
                  <span className="text-[10px] text-green-600 dark:text-green-400">
                    {new Date(med.applied_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Well-being row */}
        <div className="flex flex-wrap gap-3 text-xs">
          {routine.feeding_status && (
            <span className={cn("flex items-center gap-1", feedingLabels[routine.feeding_status]?.color)}>
              <UtensilsCrossed className="w-3 h-3" />
              {feedingLabels[routine.feeding_status]?.text}
            </span>
          )}
          {routine.hydration && (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Droplets className="w-3 h-3" />
              Água: {hydrationLabels[routine.hydration] ?? routine.hydration}
            </span>
          )}
          {routine.hygiene_done !== null && (
            <span className={cn("flex items-center gap-1", routine.hygiene_done ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
              <ShowerHead className="w-3 h-3" />
              Banho: {routine.hygiene_done ? "Sim" : "Não"}
            </span>
          )}
          {routine.mood && (
            <span className="flex items-center gap-1">
              {moodLabels[routine.mood]?.emoji} {moodLabels[routine.mood]?.text}
            </span>
          )}
        </div>

        {/* Vital signs */}
        {vs && Object.keys(vs).filter((k) => k !== "recordedAt").length > 0 && (
          <div className="flex flex-wrap gap-2">
            {vs.bloodPressure && (
              <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
                <Activity className="w-3 h-3 text-blue-500" /> PA: {vs.bloodPressure.systolic}/{vs.bloodPressure.diastolic}
              </Badge>
            )}
            {vs.temperature != null && (
              <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
                <Thermometer className="w-3 h-3 text-orange-500" /> {vs.temperature}°C
              </Badge>
            )}
            {vs.heartRate != null && (
              <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
                <Heart className="w-3 h-3 text-red-500" /> {vs.heartRate} bpm
              </Badge>
            )}
            {vs.oxygenSaturation != null && (
              <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
                <Wind className="w-3 h-3 text-sky-500" /> SpO₂: {vs.oxygenSaturation}%
              </Badge>
            )}
            {vs.glucose != null && (
              <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
                <Droplets className="w-3 h-3 text-purple-500" /> Glicemia: {vs.glucose}
              </Badge>
            )}
          </div>
        )}

        {/* Items running low */}
        {routine.items_running_low?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <PackageOpen className="w-3 h-3 text-amber-500 mt-0.5" />
            {routine.items_running_low.map((item, idx) => (
              <Badge key={idx} variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-400 dark:border-amber-700">
                {item}
              </Badge>
            ))}
          </div>
        )}

        {/* Occurrence */}
        {routine.has_occurrence && routine.occurrence_description && (
          <div className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1 mb-1">
              <AlertTriangle className="w-3 h-3" /> Ocorrência
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-300">{routine.occurrence_description}</p>
          </div>
        )}

        {/* Observations */}
        {cleanObs && (
          <p className="text-xs text-muted-foreground italic">{cleanObs}</p>
        )}
      </div>
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar
          role="family"
          userName={familyProfile?.profiles?.full_name ?? user?.email ?? ""}
          userPhoto={familyProfile?.photo_url ?? undefined}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/family/appointments/${id}`)}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar ao atendimento
          </Button>

          <PageHeader
            title="Histórico de Cuidados"
            description={appointment ? `${appointment.caregiver_name ?? "Cuidador"} — ${familyProfile?.elderly_name ?? "Idoso"}` : ""}
          >
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleExportPDF}
              disabled={isExporting || filteredRoutines.length === 0}
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Exportar PDF
            </Button>
          </PageHeader>

          <div className="max-w-3xl space-y-6">
            {/* Period filter */}
            <div className="flex flex-wrap gap-2">
              {periodOptions.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => setSelectedPeriod(opt.days)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium border-2 transition-all",
                    selectedPeriod === opt.days
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50 hover:bg-muted/50 text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRoutines.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <ClipboardList className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum registro neste período</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Não há registros de cuidado nos últimos {selectedPeriod} dias.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Resumo do período
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Registros</p>
                        <p className="font-semibold text-lg">{summary.totalRecords}</p>
                      </div>
                      {summary.medicationRate !== null && (
                        <div>
                          <p className="text-muted-foreground text-xs">Medicamentos aplicados</p>
                          <p className="font-semibold text-lg">{summary.medicationRate}%</p>
                        </div>
                      )}
                      {summary.predominantMood && (
                        <div>
                          <p className="text-muted-foreground text-xs">Humor predominante</p>
                          <p className="font-semibold">
                            {moodLabels[summary.predominantMood as MoodStatus]?.emoji}{" "}
                            {moodLabels[summary.predominantMood as MoodStatus]?.text}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({summary.moodBreakdown[summary.predominantMood]}x)
                            </span>
                          </p>
                        </div>
                      )}
                      {Object.keys(summary.feedingBreakdown).length > 0 && (
                        <div>
                          <p className="text-muted-foreground text-xs">Alimentação</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {Object.entries(summary.feedingBreakdown).map(([key, count]) => (
                              <span key={key} className={cn("text-xs", feedingLabels[key as FeedingStatus]?.color)}>
                                {feedingLabels[key as FeedingStatus]?.text}: {count}x
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {summary.occurrences > 0 && (
                        <div>
                          <p className="text-muted-foreground text-xs">Ocorrências</p>
                          <p className="font-semibold text-amber-600">{summary.occurrences}</p>
                        </div>
                      )}
                      {(summary.avgSystolic !== null || summary.avgHeartRate !== null || summary.avgGlucose !== null) && (
                        <div className="col-span-2 sm:col-span-3">
                          <p className="text-muted-foreground text-xs mb-1">Médias — Sinais vitais</p>
                          <div className="flex flex-wrap gap-3 text-xs">
                            {summary.avgSystolic !== null && (
                              <span className="flex items-center gap-1">
                                <Activity className="w-3 h-3 text-blue-500" />
                                PA: {summary.avgSystolic}/{summary.avgDiastolic}
                              </span>
                            )}
                            {summary.avgHeartRate !== null && (
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3 text-red-500" />
                                FC: {summary.avgHeartRate} bpm
                              </span>
                            )}
                            {summary.avgTemperature !== null && (
                              <span className="flex items-center gap-1">
                                <Thermometer className="w-3 h-3 text-orange-500" />
                                {summary.avgTemperature}°C
                              </span>
                            )}
                            {summary.avgSpO2 !== null && (
                              <span className="flex items-center gap-1">
                                <Wind className="w-3 h-3 text-sky-500" />
                                SpO₂: {summary.avgSpO2}%
                              </span>
                            )}
                            {summary.avgGlucose !== null && (
                              <span className="flex items-center gap-1">
                                <Droplets className="w-3 h-3 text-purple-500" />
                                Glicemia: {summary.avgGlucose}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Day-by-day records */}
                {sortedDates.map((date) => (
                  <Card key={date}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(date + "T00:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {grouped[date].map(renderRoutineCard)}
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CareHistoryReport;
