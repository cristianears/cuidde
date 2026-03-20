import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, User, Search, Briefcase, Loader2 } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/contexts/AuthContext";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";
import { useAppointments, type AppointmentWithNames } from "@/hooks/useAppointments";
import { appointmentStatusConfig } from "@/lib/labels";

const FamilyAppointments = () => {
  const { user } = useAuth();
  const { data: familyProfileData } = useFamilyProfile();
  const { data: appointments, isLoading } = useAppointments("family");

  const { active, finished } = useMemo(() => {
    const list = appointments ?? [];
    return {
      active: list.filter((a) => a.status === "ativo" || a.status === "pendente"),
      finished: list.filter((a) => a.status === "finalizado" || a.status === "cancelado"),
    };
  }, [appointments]);

  const hasAny = (appointments ?? []).length > 0;

  const AppointmentCard = ({ appointment }: { appointment: AppointmentWithNames }) => {
    const status = appointmentStatusConfig[appointment.status] ?? statusConfig.pendente;
    return (
      <Link to={`/family/appointments/${appointment.id}`}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {appointment.caregiver_name ?? "Cuidador"}
                  </p>
                  <p className="text-sm text-muted-foreground">{appointment.type}</p>
                </div>
              </div>
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Início: {new Date(appointment.start_date).toLocaleDateString("pt-BR")}</span>
              </div>
              {appointment.end_date && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Fim: {new Date(appointment.end_date).toLocaleDateString("pt-BR")}</span>
                </div>
              )}
            </div>

            {appointment.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                {appointment.description}
              </p>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  };

  const EmptyState = () => (
    <Card className="border-dashed">
      <CardContent className="py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Briefcase className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhum atendimento ainda
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Quando um cuidador aceitar sua solicitação de match, o atendimento aparecerá aqui para acompanhamento.
        </p>
        <Button asChild className="gap-2">
          <Link to="/family/search">
            <Search className="w-4 h-4" />
            Buscar cuidadores
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

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

  if (!hasAny) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar role="family" userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""} userPhoto={familyProfileData?.photo_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture} />
        <main className="flex-1 p-6 lg:p-8">
          <PageHeader
            title="Atendimentos"
            description="Acompanhe os atendimentos do seu familiar"
          />
          <div className="mt-6">
            <EmptyState />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role="family" userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""} userPhoto={familyProfileData?.photo_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture} />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader
          title="Atendimentos"
          description="Acompanhe os atendimentos do seu familiar"
        />

        <Tabs defaultValue="active" className="mt-6">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              Ativos
              {active.length > 0 && (
                <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                  {active.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="finished">Finalizados</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4 space-y-3">
            {active.length > 0 ? (
              active.map((a) => <AppointmentCard key={a.id} appointment={a} />)
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhum atendimento ativo no momento.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="finished" className="mt-4 space-y-3">
            {finished.length > 0 ? (
              finished.map((a) => <AppointmentCard key={a.id} appointment={a} />)
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhum atendimento finalizado.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FamilyAppointments;
