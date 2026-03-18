import { Link } from "react-router-dom";
import { Calendar, Clock, User, Search, Briefcase } from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";

import { useAuth } from "@/contexts/AuthContext";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";

// Mock data for family appointments
const mockFamilyAppointments = [
  {
    id: "1",
    elderName: "Maria Santos",
    caregiverName: "Ana Silva",
    serviceType: "Acompanhamento contínuo",
    startDate: "2024-01-15",
    status: "active" as const,
  },
  {
    id: "2",
    elderName: "Maria Santos",
    caregiverName: "Carlos Mendes",
    serviceType: "Plantão diurno",
    startDate: "2024-02-01",
    status: "active" as const,
  },
  {
    id: "3",
    elderName: "Maria Santos",
    caregiverName: "Beatriz Lima",
    serviceType: "Cuidado pós-cirúrgico",
    startDate: "2023-11-10",
    endDate: "2023-12-20",
    status: "finished" as const,
  },
  {
    id: "4",
    elderName: "Maria Santos",
    caregiverName: "Roberto Costa",
    serviceType: "Plantão noturno",
    startDate: "2023-09-01",
    endDate: "2023-10-15",
    status: "finished" as const,
  },
];

const FamilyAppointments = () => {
  const { user } = useAuth();
  const { data: familyProfileData } = useFamilyProfile();
  const activeAppointments = mockFamilyAppointments.filter(a => a.status === "active");
  const finishedAppointments = mockFamilyAppointments.filter(a => a.status === "finished");
  const hasAnyAppointments = mockFamilyAppointments.length > 0;

  const AppointmentCard = ({ appointment }: { appointment: typeof mockFamilyAppointments[0] }) => (
    <Link to={`/family/appointments/${appointment.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{appointment.caregiverName}</p>
                <p className="text-sm text-muted-foreground">{appointment.serviceType}</p>
              </div>
            </div>
            <StatusBadge status={appointment.status} />
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Início: {new Date(appointment.startDate).toLocaleDateString('pt-BR')}</span>
            </div>
            {appointment.endDate && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Fim: {new Date(appointment.endDate).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Idoso: {appointment.elderName}
          </p>
        </CardContent>
      </Card>
    </Link>
  );

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

  if (!hasAnyAppointments) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar role="family" userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""} />

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
      <AppSidebar role="family" userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""} />

      <main className="flex-1 p-6 lg:p-8">
        <PageHeader
          title="Atendimentos"
          description="Acompanhe os atendimentos do seu familiar"
        />

        <Tabs defaultValue="active" className="mt-6">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              Ativos
              {activeAppointments.length > 0 && (
                <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                  {activeAppointments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="finished">Finalizados</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4 space-y-3">
            {activeAppointments.length > 0 ? (
              activeAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))
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
            {finishedAppointments.length > 0 ? (
              finishedAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))
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
