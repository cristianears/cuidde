import { useState } from "react";
import { Eye, EyeOff, Save, CheckCircle } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// Mock data for appointments
const mockAppointments = [
  { id: "1", elderlyName: "Maria Silva", status: "active" as const },
  { id: "2", elderlyName: "José Santos", status: "active" as const },
  { id: "3", elderlyName: "Ana Oliveira", status: "finished" as const },
];

const statusLabels = {
  active: "Ativo",
  finished: "Finalizado",
};

interface VisibilitySettings {
  // Appointment Info
  showSummary: boolean;
  showDescription: boolean;
  showModality: boolean;
  // Care Routine
  showCareRoutine: boolean;
  showDateAndShift: boolean;
  // History
  showHistory: boolean;
  // Evaluations
  showEvaluations: boolean;
  // Privacy
  hideAll: boolean;
}

const defaultSettings: VisibilitySettings = {
  showSummary: true,
  showDescription: true,
  showModality: true,
  showCareRoutine: true,
  showDateAndShift: true,
  showHistory: true,
  showEvaluations: true,
  hideAll: false,
};

const CaregiverVisibility = () => {
  const { toast } = useToast();
  const [selectedAppointment, setSelectedAppointment] = useState<string>("");
  const [settings, setSettings] = useState<VisibilitySettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof VisibilitySettings) => {
    if (key === "hideAll") {
      const newHideAll = !settings.hideAll;
      if (newHideAll) {
        // Disable all visibility options when hiding all
        setSettings({
          showSummary: false,
          showDescription: false,
          showModality: false,
          showCareRoutine: false,
          showDateAndShift: false,
          showHistory: false,
          showEvaluations: false,
          hideAll: true,
        });
      } else {
        // Reset to defaults when unhiding
        setSettings(defaultSettings);
      }
    } else {
      setSettings((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    }
  };

  const handleSave = async () => {
    if (!selectedAppointment) {
      toast({
        title: "Selecione um atendimento",
        description: "Por favor, selecione um atendimento antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);

    toast({
      title: "Configurações salvas",
      description: "As configurações de visibilidade foram atualizadas com sucesso.",
    });
  };

  const selectedAppointmentData = mockAppointments.find(
    (a) => a.id === selectedAppointment
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar
        role="caregiver"
        userName="Ana Costa"
        verificationStatus="verified"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <PageHeader
          title="Visibilidade para a Família"
          description="Defina quais informações a família poderá visualizar neste atendimento."
        />

        {/* Appointment Selector */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Selecionar Atendimento
            </CardTitle>
            <CardDescription>
              Escolha o atendimento para configurar a visibilidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedAppointment}
              onValueChange={setSelectedAppointment}
            >
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="Selecione um atendimento" />
              </SelectTrigger>
              <SelectContent>
                {mockAppointments.map((appointment) => (
                  <SelectItem key={appointment.id} value={appointment.id}>
                    <span className="flex items-center gap-2">
                      {appointment.elderlyName}
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          appointment.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {statusLabels[appointment.status]}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Privacy Control - Master Toggle */}
        {selectedAppointment && (
          <Card className={cn("mb-6", settings.hideAll && "border-destructive/50 bg-destructive/5")}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-destructive" />
                Privacidade e Controle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="hide-all" className="text-base font-medium">
                    🔒 Ocultar todas as informações para a família
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Ao ativar, nenhuma informação será exibida para a família
                  </p>
                </div>
                <Switch
                  id="hide-all"
                  checked={settings.hideAll}
                  onCheckedChange={() => handleToggle("hideAll")}
                />
              </div>

              {settings.hideAll && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive font-medium flex items-center gap-2">
                    <EyeOff className="w-4 h-4" />
                    A família não poderá visualizar informações deste atendimento.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Visibility Settings Sections */}
        {selectedAppointment && !settings.hideAll && (
          <div className="space-y-6">
            {/* Appointment Info Section */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Informações do Atendimento</CardTitle>
                <CardDescription>
                  Controle quais dados gerais a família pode visualizar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-summary" className="text-sm font-medium">
                      ✅ Exibir Resumo do Atendimento
                    </Label>
                  </div>
                  <Switch
                    id="show-summary"
                    checked={settings.showSummary}
                    onCheckedChange={() => handleToggle("showSummary")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-description" className="text-sm font-medium">
                      ✅ Exibir Descrição do Atendimento
                    </Label>
                  </div>
                  <Switch
                    id="show-description"
                    checked={settings.showDescription}
                    onCheckedChange={() => handleToggle("showDescription")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-modality" className="text-sm font-medium">
                      ✅ Exibir Modalidade de Atendimento
                    </Label>
                  </div>
                  <Switch
                    id="show-modality"
                    checked={settings.showModality}
                    onCheckedChange={() => handleToggle("showModality")}
                  />
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    📌 A família poderá apenas visualizar essas informações, sem possibilidade de edição.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Care Routine Section */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Rotina de Cuidados</CardTitle>
                <CardDescription>
                  Defina o que a família pode ver sobre os cuidados registrados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-care-routine" className="text-sm font-medium">
                      ✅ Permitir que a família visualize a Rotina de Cuidados registrada
                    </Label>
                  </div>
                  <Switch
                    id="show-care-routine"
                    checked={settings.showCareRoutine}
                    onCheckedChange={() => handleToggle("showCareRoutine")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-date-shift" className="text-sm font-medium">
                      ✅ Exibir data e turno (manhã / tarde / noite)
                    </Label>
                  </div>
                  <Switch
                    id="show-date-shift"
                    checked={settings.showDateAndShift}
                    onCheckedChange={() => handleToggle("showDateAndShift")}
                  />
                </div>

                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    ❌ Não é permitido edição ou comentários por parte da família.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    💡 A rotina de cuidados ajuda a família a acompanhar o dia a dia do atendimento.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* History Section */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Histórico do Atendimento</CardTitle>
                <CardDescription>
                  Configure a visualização do histórico de eventos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-history" className="text-sm font-medium">
                      ✅ Exibir Histórico de eventos do atendimento
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Exemplo: início do atendimento, registros realizados, finalização
                    </p>
                  </div>
                  <Switch
                    id="show-history"
                    checked={settings.showHistory}
                    onCheckedChange={() => handleToggle("showHistory")}
                  />
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-700">
                    ⚠️ Dados financeiros, informações contratuais e valores não são exibidos no histórico.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Evaluations Section */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Avaliações</CardTitle>
                <CardDescription>
                  Controle a visibilidade das avaliações do atendimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-evaluations" className="text-sm font-medium">
                      ✅ Permitir que a família visualize avaliações anteriores
                    </Label>
                  </div>
                  <Switch
                    id="show-evaluations"
                    checked={settings.showEvaluations}
                    onCheckedChange={() => handleToggle("showEvaluations")}
                  />
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    ❌ Não é permitido edição ou exclusão de avaliações pelo cuidador.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!selectedAppointment && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Eye className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Selecione um atendimento
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Para configurar as opções de visibilidade, primeiro selecione um atendimento no campo acima.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        {selectedAppointment && (
          <div className="mt-8 flex justify-end">
            <Button
              size="lg"
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-48"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar configurações de visibilidade
                </>
              )}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CaregiverVisibility;
