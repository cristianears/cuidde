import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

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

const CareRoutine = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [date, setDate] = useState<Date>(new Date());
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [selectedCareTypes, setSelectedCareTypes] = useState<string[]>([]);
  const [observations, setObservations] = useState("");
  const [hasOccurrence, setHasOccurrence] = useState(false);
  const [occurrenceDescription, setOccurrenceDescription] = useState("");

  // Mock data - elderly name from appointment
  const elderlyName = "Maria Santos";

  const handleCareTypeToggle = (careId: string) => {
    setSelectedCareTypes((prev) =>
      prev.includes(careId)
        ? prev.filter((id) => id !== careId)
        : [...prev, careId]
    );
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

    // Mock save
    toast.success("Registro de cuidado salvo com sucesso!");
    navigate(`/caregiver/appointments/${id}`);
  };

  const handleCancel = () => {
    navigate(`/caregiver/appointments/${id}`);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar role="caregiver" />
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
            title="Registrar Rotina de Cuidados"
            description="Documente os cuidados realizados neste atendimento."
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
                      Descreva a ocorrência
                    </Label>
                    <Textarea
                      placeholder="Informe o que aconteceu durante o atendimento…"
                      value={occurrenceDescription}
                      onChange={(e) => setOccurrenceDescription(e.target.value)}
                      className="min-h-[100px] resize-none border-amber-200 focus:ring-amber-500"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 pb-8">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 sm:flex-none sm:min-w-[200px]"
              >
                Salvar registro
              </Button>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CareRoutine;
