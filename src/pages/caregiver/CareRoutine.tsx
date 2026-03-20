import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/shared/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useCaregiverProfile } from "@/hooks/useCaregiverProfile";
import { useAppointmentDetail } from "@/hooks/useAppointments";
import { useCreateCareRoutine, useUpdateCareRoutine } from "@/hooks/useCareRoutine";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  Sun,
  Sunset,
  Moon,
  Droplets,
  Pill,
  UtensilsCrossed,
  Move,
  Stethoscope,
  Eye,
  MoreHorizontal,
  ArrowLeft,
  AlertTriangle,
  Check,
  Clock,
  ShowerHead,
  Smile,
  PackageOpen,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { CareShift, CareType, MedicationItem, FeedingStatus, MoodStatus, ElderlyMedication } from "@/types/database";

const shifts = [
  { id: "morning", label: "Manhã", icon: Sun, time: "06h - 12h" },
  { id: "afternoon", label: "Tarde", icon: Sunset, time: "12h - 18h" },
  { id: "night", label: "Noite", icon: Moon, time: "18h - 06h" },
];

const careTypes = [
  { id: "hygiene", label: "Higiene pessoal", icon: Droplets },
  { id: "medication", label: "Administração de medicamentos", icon: Pill },
  { id: "feeding", label: "Alimentação", icon: UtensilsCrossed },
  { id: "mobility", label: "Mobilização / troca de posição", icon: Move },
  { id: "appointments", label: "Acompanhamento em consultas", icon: Stethoscope },
  { id: "monitoring", label: "Monitoramento geral", icon: Eye },
  { id: "other", label: "Outros", icon: MoreHorizontal },
];

const feedingOptions: { value: FeedingStatus; label: string; color: string; bgColor: string }[] = [
  { value: "full", label: "Comeu tudo", color: "text-green-700 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700" },
  { value: "partial", label: "Comeu pouco", color: "text-amber-700 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700" },
  { value: "refused", label: "Recusou", color: "text-red-700 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700" },
];

const moodOptions: { value: MoodStatus; label: string; emoji: string }[] = [
  { value: "agitated", label: "Agitado", emoji: "😟" },
  { value: "calm", label: "Calmo", emoji: "😊" },
  { value: "sleepy", label: "Sonolento", emoji: "😴" },
];

const commonRunningLowItems = [
  "Fraldas",
  "Luvas descartáveis",
  "Lenços umedecidos",
  "Creme para assaduras",
  "Soro fisiológico",
  "Gaze",
  "Esparadrapo",
];

const CareRoutine = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const { user } = useAuth();
  const { data: profileData } = useCaregiverProfile();
  const { data: appointment } = useAppointmentDetail(id);
  const { mutate: createCareRoutine, isPending: isCreating } = useCreateCareRoutine();
  const { mutate: updateCareRoutine, isPending: isUpdating } = useUpdateCareRoutine();
  const isSaving = isCreating || isUpdating;

  const [date, setDate] = useState<Date>(new Date());
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [selectedCareTypes, setSelectedCareTypes] = useState<string[]>([]);
  const [observations, setObservations] = useState("");
  const [hasOccurrence, setHasOccurrence] = useState(false);
  const [occurrenceDescription, setOccurrenceDescription] = useState("");
  const [otherCareDescription, setOtherCareDescription] = useState("");

  // Medication checklist
  const [medicationItems, setMedicationItems] = useState<MedicationItem[]>([]);
  const [editDataLoaded, setEditDataLoaded] = useState(false);

  // Load existing care routine data when editing
  useEffect(() => {
    if (!editId || editDataLoaded) return;
    const loadEditData = async () => {
      const { data } = await supabase
        .from("care_routines")
        .select("*")
        .eq("id", editId)
        .single();
      if (!data) return;

      setDate(new Date(data.date + "T00:00:00"));
      setSelectedShift(data.shift);
      setSelectedCareTypes(data.care_types ?? []);

      // Parse observations: extract [Outros] prefix if present
      const rawObs = data.observations ?? "";
      const otherMatch = rawObs.match(/^\[Outros\]\s*([^\n]+)/);
      if (otherMatch) {
        setOtherCareDescription(otherMatch[1]);
        setObservations(rawObs.replace(/^\[Outros\]\s*[^\n]+\n?/, "").trim());
      } else {
        setObservations(rawObs);
      }
      setHasOccurrence(data.has_occurrence ?? false);
      setOccurrenceDescription(data.occurrence_description ?? "");
      setFeedingStatus(data.feeding_status ?? null);
      setHygieneDone(data.hygiene_done ?? null);
      setMood(data.mood ?? null);
      setItemsRunningLow(data.items_running_low ?? []);
      if (data.medication_items && data.medication_items.length > 0) {
        setMedicationItems(data.medication_items);
      }
      setEditDataLoaded(true);
    };
    loadEditData();
  }, [editId, editDataLoaded]);

  // Load medications from the family profile when appointment data is available (new mode only)
  useEffect(() => {
    if (!appointment) return;
    const loadFamilyData = async () => {
      const { data } = await supabase
        .from("family_profiles")
        .select("elderly_medications, elderly_name")
        .eq("id", appointment.family_id)
        .single();
      // Only set medications from family profile if NOT editing (edit loads its own)
      if (data?.elderly_medications && !isEditMode) {
        const meds = data.elderly_medications as ElderlyMedication[];
        setMedicationItems(
          meds.map((med) => ({ name: med.name, time: med.time, applied: false, applied_at: null }))
        );
      }
      if (data?.elderly_name) setElderlyName(data.elderly_name);
    };
    loadFamilyData();
  }, [appointment, isEditMode]);

  // Feeding status
  const [feedingStatus, setFeedingStatus] = useState<FeedingStatus | null>(null);

  // Well-being diary
  const [hygieneDone, setHygieneDone] = useState<boolean | null>(null);
  const [mood, setMood] = useState<MoodStatus | null>(null);

  // Items running low
  const [itemsRunningLow, setItemsRunningLow] = useState<string[]>([]);
  const [customItem, setCustomItem] = useState("");

  // Elderly name from appointment's family profile
  const [elderlyName, setElderlyName] = useState(appointment?.family_name ?? "");

  const handleCareTypeToggle = (careId: string) => {
    setSelectedCareTypes((prev) =>
      prev.includes(careId)
        ? prev.filter((id) => id !== careId)
        : [...prev, careId]
    );
  };

  const handleMedicationToggle = (index: number) => {
    setMedicationItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              applied: !item.applied,
              applied_at: !item.applied ? new Date().toISOString() : null,
            }
          : item
      )
    );
  };

  const toggleRunningLowItem = (item: string) => {
    setItemsRunningLow((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleAddCustomItem = () => {
    if (!customItem.trim()) return;
    if (!itemsRunningLow.includes(customItem.trim())) {
      setItemsRunningLow((prev) => [...prev, customItem.trim()]);
    }
    setCustomItem("");
  };

  const handleSave = () => {
    if (!selectedShift) {
      toast.error("Selecione o turno do cuidado");
      return;
    }
    if (selectedCareTypes.length === 0) {
      toast.error("Selecione pelo menos um tipo de cuidado");
      return;
    }
    if (hasOccurrence && !occurrenceDescription.trim()) {
      toast.error("Descreva a ocorrência antes de salvar");
      return;
    }
    if (selectedCareTypes.includes("other") && !otherCareDescription.trim()) {
      toast.error("Descreva o cuidado realizado em 'Outros'");
      return;
    }
    if (!id) return;

    const isOtherSelected = selectedCareTypes.includes("other");
    const combinedObservations = [
      isOtherSelected && otherCareDescription.trim() ? `[Outros] ${otherCareDescription.trim()}` : null,
      observations.trim() || null,
    ].filter(Boolean).join("\n") || null;

    const payload = {
      appointment_id: id,
      date: format(date, "yyyy-MM-dd"),
      shift: selectedShift as CareShift,
      care_types: selectedCareTypes as CareType[],
      observations: combinedObservations,
      has_occurrence: hasOccurrence,
      occurrence_description: hasOccurrence ? occurrenceDescription.trim() || null : null,
      medication_items: isMedicationSelected ? medicationItems : [],
      feeding_status: isFeedingSelected ? feedingStatus : null,
      hygiene_done: hygieneDone,
      mood,
      items_running_low: itemsRunningLow,
    };

    const onSuccess = () => navigate(`/caregiver/appointments/${id}`);

    if (isEditMode && editId) {
      updateCareRoutine({ ...payload, id: editId }, { onSuccess });
    } else {
      createCareRoutine(payload, { onSuccess });
    }
  };

  const handleCancel = () => {
    navigate(`/caregiver/appointments/${id}`);
  };

  const isMedicationSelected = selectedCareTypes.includes("medication");
  const isFeedingSelected = selectedCareTypes.includes("feeding");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar role="caregiver" userName={profileData?.profiles.full_name ?? user?.email ?? ""} userPhoto={profileData?.photo_url ?? undefined} />
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/caregiver/appointments/${id}`)}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar ao atendimento
          </Button>

          <PageHeader
            title={isEditMode ? "Editar Registro de Cuidado" : "Registrar Rotina de Cuidados"}
            description={isEditMode ? "Altere as informações do registro." : "Documente os cuidados realizados neste atendimento."}
          />

          <div className="max-w-2xl space-y-6">
            {/* Header Info Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Idoso atendido</p>
                    <p className="text-lg font-semibold">{elderlyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Data do atendimento</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[200px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(d) => d && setDate(d)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shift Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Turno do Cuidado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {shifts.map((shift) => {
                    const Icon = shift.icon;
                    const isSelected = selectedShift === shift.id;
                    return (
                      <button
                        key={shift.id}
                        onClick={() => setSelectedShift(shift.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-8 w-8 mb-2",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        <span
                          className={cn(
                            "font-medium",
                            isSelected ? "text-primary" : "text-foreground"
                          )}
                        >
                          {shift.label}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {shift.time}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Care Types */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cuidados Realizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {careTypes.map((care) => {
                    const Icon = care.icon;
                    const isChecked = selectedCareTypes.includes(care.id);
                    return (
                      <div
                        key={care.id}
                        onClick={() => handleCareTypeToggle(care.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                          isChecked
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <Checkbox
                          id={care.id}
                          checked={isChecked}
                          onCheckedChange={() => handleCareTypeToggle(care.id)}
                          className="pointer-events-none"
                        />
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            isChecked ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        <Label
                          htmlFor={care.id}
                          className="flex-1 cursor-pointer font-normal"
                        >
                          {care.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>

                {/* Conditional field for "Outros" */}
                {selectedCareTypes.includes("other") && (
                  <div className="mt-4 space-y-2 pt-4 border-t">
                    <Label className="text-sm text-muted-foreground">
                      Descreva o cuidado realizado <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      placeholder="Informe qual cuidado foi realizado..."
                      value={otherCareDescription}
                      onChange={(e) => setOtherCareDescription(e.target.value)}
                      className={cn(
                        "min-h-[80px] resize-none",
                        selectedCareTypes.includes("other") && !otherCareDescription.trim()
                          ? "border-destructive/50 focus:ring-destructive"
                          : ""
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medication Checklist — visible when "medication" is selected */}
            {isMedicationSelected && (
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Pill className="h-5 w-5 text-primary" />
                    Checklist de Medicamentos
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Marque cada medicamento conforme for aplicado. O horário real é registrado automaticamente.
                  </p>
                </CardHeader>
                <CardContent>
                  {medicationItems.length > 0 ? (
                    <div className="space-y-2">
                      {medicationItems.map((med, index) => (
                        <button
                          key={index}
                          onClick={() => handleMedicationToggle(index)}
                          className={cn(
                            "w-full flex items-center justify-between gap-3 p-3 rounded-lg border transition-all text-left",
                            med.applied
                              ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                              med.applied
                                ? "border-green-500 bg-green-500"
                                : "border-muted-foreground/30"
                            )}>
                              {med.applied && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <span className={cn(
                              "text-sm font-medium truncate",
                              med.applied && "line-through text-muted-foreground"
                            )}>
                              {med.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Previsto: {med.time}
                            </span>
                            {med.applied && med.applied_at && (
                              <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-300 dark:border-green-700">
                                Aplicado {format(new Date(med.applied_at), "HH:mm")}
                              </Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum medicamento cadastrado pela família. Os medicamentos são cadastrados no perfil da família.
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-3">
                    O registro é meramente informativo. A plataforma não realiza prescrições médicas.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Feeding Status — visible when "feeding" is selected */}
            {isFeedingSelected && (
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                    Status da Alimentação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {feedingOptions.map((option) => {
                      const isSelected = feedingStatus === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setFeedingStatus(isSelected ? null : option.value)}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                            isSelected
                              ? option.bgColor
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          <span className={cn(
                            "text-sm font-medium",
                            isSelected ? option.color : "text-foreground"
                          )}>
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Well-being Diary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smile className="h-5 w-5 text-primary" />
                  Diário de Bem-Estar
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Registro rápido do estado geral do idoso neste turno.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Hygiene */}
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                    <ShowerHead className="w-4 h-4 text-muted-foreground" />
                    Banho realizado?
                  </Label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setHygieneDone(hygieneDone === true ? null : true)}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
                        hygieneDone === true
                          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setHygieneDone(hygieneDone === false ? null : false)}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
                        hygieneDone === false
                          ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {/* Mood */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Humor do idoso</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {moodOptions.map((option) => {
                      const isSelected = mood === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setMood(isSelected ? null : option.value)}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          <span className="text-2xl mb-1">{option.emoji}</span>
                          <span className={cn(
                            "text-xs font-medium",
                            isSelected ? "text-primary" : "text-foreground"
                          )}>
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Running Low */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PackageOpen className="h-5 w-5 text-primary" />
                  Itens em Falta / Acabando
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Informe à família quais itens precisam ser repostos.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {commonRunningLowItems.map((item) => {
                    const isSelected = itemsRunningLow.includes(item);
                    return (
                      <Badge
                        key={item}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-all text-xs",
                          isSelected
                            ? "bg-amber-500 hover:bg-amber-600 text-white"
                            : "hover:bg-muted"
                        )}
                        onClick={() => toggleRunningLowItem(item)}
                      >
                        {item}
                      </Badge>
                    );
                  })}
                </div>
                {/* Custom items already added */}
                {itemsRunningLow
                  .filter((item) => !commonRunningLowItems.includes(item))
                  .map((item) => (
                    <Badge
                      key={item}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs cursor-pointer gap-1"
                      onClick={() => toggleRunningLowItem(item)}
                    >
                      {item}
                      <X className="w-3 h-3" />
                    </Badge>
                  ))}
                <div className="flex gap-2">
                  <Input
                    value={customItem}
                    onChange={(e) => setCustomItem(e.target.value)}
                    placeholder="Outro item..."
                    className="text-sm flex-1"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomItem())}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustomItem}
                    className="shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Observations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Descreva detalhes importantes do cuidado realizado…"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {observations.length} caracteres
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Occurrences */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Ocorrências
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="occurrence-toggle" className="font-normal">
                    Houve alguma ocorrência neste turno?
                  </Label>
                  <Switch
                    id="occurrence-toggle"
                    checked={hasOccurrence}
                    onCheckedChange={setHasOccurrence}
                  />
                </div>

                {hasOccurrence && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-sm text-muted-foreground">
                      Descreva a ocorrência <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      placeholder="Informe o que aconteceu durante o atendimento…"
                      value={occurrenceDescription}
                      onChange={(e) => setOccurrenceDescription(e.target.value)}
                      className={cn(
                        "min-h-[100px] resize-none",
                        hasOccurrence && !occurrenceDescription.trim()
                          ? "border-destructive focus:ring-destructive"
                          : "border-amber-200 focus:ring-amber-500"
                      )}
                    />
                    {hasOccurrence && !occurrenceDescription.trim() && (
                      <p className="text-xs text-destructive">
                        A descrição da ocorrência é obrigatória.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons + Signature */}
            <div className="space-y-3 pt-4 pb-8">
              <p className="text-xs text-muted-foreground text-center italic">
                Ao salvar, você confirma que as informações acima são verídicas e refletem o atendimento realizado.
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1 sm:flex-none"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none sm:min-w-[200px]"
                >
                  {isSaving ? "Salvando..." : isEditMode ? "Atualizar registro" : "Salvar registro"}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CareRoutine;
