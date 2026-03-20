import { useMemo, useState } from "react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Clock, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCaregiverProfile } from "@/hooks/useCaregiverProfile";
import { useAppointments, type AppointmentWithNames } from "@/hooks/useAppointments";
import type { AppointmentStatus, AppointmentType } from "@/types/database";
import { appointmentStatusConfig } from "@/lib/labels";

const CaregiverAppointments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profileData } = useCaregiverProfile();
  const { data: appointments, isLoading } = useAppointments("caregiver");
  const [activeTab, setActiveTab] = useState<"ativos" | "finalizados" | "pendentes">("ativos");

  const appointmentsByTab = useMemo(() => {
    const list = appointments ?? [];
    const ativos = list.filter((a) => a.status === "ativo");
    const finalizados = list.filter((a) => a.status === "finalizado");
    const pendentes = list.filter((a) => a.status === "pendente");
    return { ativos, finalizados, pendentes };
  }, [appointments]);

  const getStatusBadge = (status: AppointmentStatus) => {
    return appointmentStatusConfig[status] ?? appointmentStatusConfig.pendente;
  };

  const getTypeLabel = (type: AppointmentType) => {
    const labels: Record<AppointmentType, string> = {
      "plantão": "Plantão",
      "contínuo": "Contínuo",
      "turno": "Turno",
    };
    return labels[type] ?? type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const AppointmentCard = ({ appointment }: { appointment: AppointmentWithNames }) => {
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
                  <div className="flex flex-col">
                    <span className="text-sm md:text-base font-medium">
                      {appointment.family_name ?? "Família"}
                    </span>
                    {appointment.elderly_name && (
                      <span className="text-xs text-muted-foreground">
                        Idoso(a): {appointment.elderly_name}
                      </span>
                    )}
                  </div>
                </div>
                {appointment.description && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                    <span className="text-xs md:text-sm line-clamp-1">{appointment.description}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 md:gap-4 text-xs md:text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                  <span>Início: {formatDate(appointment.start_date)}</span>
                </div>
                {appointment.end_date && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                    <span>Fim: {formatDate(appointment.end_date)}</span>
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
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    const list = appointmentsByTab[key];

    if (list.length === 0) {
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
        {list.map((appointment) => (
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
