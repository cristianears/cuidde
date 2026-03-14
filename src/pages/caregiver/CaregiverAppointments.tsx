import { useMemo, useState } from "react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Clock, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mockCaregivers } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useCaregiverProfile } from "@/hooks/useCaregiverProfile";

interface Appointment {
  id: string;
  familyName: string;
  elderlyName: string;
  type: "plantão" | "contínuo" | "turno";
  status: "ativo" | "finalizado" | "pendente";
  startDate: string;
  endDate?: string;
}

const mockAppointments: Appointment[] = [
  {
    id: "1",
    familyName: "Família Silva",
    elderlyName: "Maria Silva",
    type: "contínuo",
    status: "ativo",
    startDate: "2025-01-15",
  },
  {
    id: "2",
    familyName: "Família Santos",
    elderlyName: "José Santos",
    type: "plantão",
    status: "ativo",
    startDate: "2025-01-20",
  },
  {
    id: "3",
    familyName: "Família Oliveira",
    elderlyName: "Ana Oliveira",
    type: "turno",
    status: "finalizado",
    startDate: "2024-11-01",
    endDate: "2024-12-15",
  },
  {
    id: "4",
    familyName: "Família Costa",
    elderlyName: "Pedro Costa",
    type: "contínuo",
    status: "pendente",
    startDate: "2025-02-01",
  },
];

const CaregiverAppointments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profileData } = useCaregiverProfile();
  const [activeTab, setActiveTab] = useState<"ativos" | "finalizados" | "pendentes">("ativos");

  const currentUser = mockCaregivers[0];

  const appointmentsByTab = useMemo(() => {
    const ativos = mockAppointments.filter((a) => a.status === "ativo");
    const finalizados = mockAppointments.filter((a) => a.status === "finalizado");
    const pendentes = mockAppointments.filter((a) => a.status === "pendente");
    return { ativos, finalizados, pendentes };
  }, []);

  const getStatusBadge = (status: Appointment["status"]) => {
    const variants: Record<Appointment["status"], { label: string; className: string }> = {
      ativo: { label: "Ativo", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
      finalizado: { label: "Finalizado", className: "bg-muted text-muted-foreground border-border" },
      pendente: { label: "Pendente", className: "bg-amber-100 text-amber-700 border-amber-200" },
    };
    return variants[status];
  };

  const getTypeLabel = (type: Appointment["type"]) => {
    const labels: Record<Appointment["type"], string> = {
      plantão: "Plantão",
      contínuo: "Contínuo",
      turno: "Turno",
    };
    return labels[type];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const statusBadge = getStatusBadge(appointment.status);
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 md:gap-4">
            <div className="flex-1 space-y-2.5 md:space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={statusBadge.className}>
                  {statusBadge.label}
                </Badge>
                <Badge variant="secondary" className="font-normal">
                  {getTypeLabel(appointment.type)}
                </Badge>
                {appointment.status === "pendente" && (
                  <span className="text-xs text-muted-foreground">
                    Aguardando retorno/combinação com a família
                  </span>
                )}
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <div className="flex items-center gap-2 text-foreground">
                  <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm md:text-base font-medium">{appointment.elderlyName}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                  <span className="text-xs md:text-sm">{appointment.familyName}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 md:gap-4 text-xs md:text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                  <span>Início: {formatDate(appointment.startDate)}</span>
                </div>
                {appointment.endDate && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                    <span>Fim: {formatDate(appointment.endDate)}</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="shrink-0 self-start sm:self-auto text-xs md:text-sm"
              onClick={() => navigate(`/caregiver/appointments/${appointment.id}`)}
            >
              Ver detalhes
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({
    title,
    description,
    ctaLabel,
    ctaHref,
  }: {
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  }) => (
    <div className="flex flex-col items-center justify-center py-10 md:py-16 px-4 text-center">
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-muted flex items-center justify-center mb-3 md:mb-4">
        <Calendar className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base md:text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-xs md:text-sm text-muted-foreground mb-5 md:mb-6 max-w-md">{description}</p>
      <Button variant="secondary" onClick={() => navigate(ctaHref)}>
        {ctaLabel}
      </Button>
    </div>
  );

  const renderTabContent = (key: "ativos" | "finalizados" | "pendentes") => {
    const appointments = appointmentsByTab[key];

    if (appointments.length === 0) {
      if (key === "ativos") {
        return (
          <EmptyState
            title="Nenhum atendimento ativo no momento"
            description="Quando uma família iniciar uma combinação com você, seus atendimentos aparecerão aqui."
            ctaLabel="Ajustar disponibilidade"
            ctaHref="/caregiver/availability"
          />
        );
      }
      if (key === "pendentes") {
        return (
          <EmptyState
            title="Nenhuma solicitação pendente"
            description="Quando houver interesse de famílias, as solicitações aparecerão aqui para você responder com calma."
            ctaLabel="Completar perfil para aumentar visibilidade"
            ctaHref="/caregiver/profile"
          />
        );
      }
      return (
        <EmptyState
          title="Ainda não há atendimentos finalizados"
          description="Assim que você concluir atendimentos, eles ficam registrados aqui como histórico."
          ctaLabel="Registrar atendimentos"
          ctaHref="/caregiver/appointments"
        />
      );
    }

    return (
      <div className="space-y-3 md:space-y-4">
        {appointments.map((appointment) => (
          <AppointmentCard key={appointment.id} appointment={appointment} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="caregiver" userName={profileData?.profiles.full_name ?? user?.email ?? ""} userPhoto={profileData?.photo_url ?? undefined} />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <PageHeader
          title="Atendimentos"
          description="Acompanhe seus atendimentos ativos e o histórico com as famílias."
        />

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="w-full"
        >
          <TabsList className="mb-4 md:mb-6">
            <TabsTrigger value="ativos" className="text-xs md:text-sm">
              Ativos
              <Badge variant="secondary" className="ml-1.5 md:ml-2 h-4 md:h-5 px-1 md:px-1.5 text-xs">
                {appointmentsByTab.ativos.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="finalizados" className="text-xs md:text-sm">
              Finalizados
              <Badge variant="secondary" className="ml-1.5 md:ml-2 h-4 md:h-5 px-1 md:px-1.5 text-xs">
                {appointmentsByTab.finalizados.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pendentes" className="text-xs md:text-sm">
              Pendentes
              <Badge variant="secondary" className="ml-1.5 md:ml-2 h-4 md:h-5 px-1 md:px-1.5 text-xs">
                {appointmentsByTab.pendentes.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ativos">{renderTabContent("ativos")}</TabsContent>
          <TabsContent value="finalizados">{renderTabContent("finalizados")}</TabsContent>
          <TabsContent value="pendentes">{renderTabContent("pendentes")}</TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CaregiverAppointments;
