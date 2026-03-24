import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Calendar, Search, Clock, CheckCircle, XCircle, UserCheck, Loader2,
  FileText, MapPin, Briefcase, MessageCircle,
} from "lucide-react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth } from "@/contexts/AuthContext";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";
import { useAppointments, type AppointmentWithNames } from "@/hooks/useAppointments";

const TYPE_LABELS: Record<string, string> = {
  "plantão": "Plantão",
  "contínuo": "Contínuo",
  "turno": "Turno",
};

const FamilyMatches = () => {
  const { user } = useAuth();
  const { data: familyProfileData } = useFamilyProfile();
  const { data: appointments, isLoading } = useAppointments("family");

  const { pending, accepted, rejected } = useMemo(() => {
    const list = appointments ?? [];
    return {
      pending: list.filter((a) => a.status === "pendente"),
      accepted: list.filter((a) => a.status === "ativo"),
      rejected: list.filter((a) => a.status === "cancelado"),
    };
  }, [appointments]);

  const allSolicitations = useMemo(
    () => [...pending, ...accepted, ...rejected],
    [pending, accepted, rejected]
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            Aguardando resposta
          </Badge>
        );
      case "ativo":
        return (
          <Badge className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3" />
            Aceito
          </Badge>
        );
      case "cancelado":
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <XCircle className="w-3 h-3" />
            Recusado
          </Badge>
        );
      default:
        return null;
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const SolicitationCard = ({ appointment }: { appointment: AppointmentWithNames }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-14 h-14">
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {getInitials(appointment.caregiver_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-foreground truncate">
                {appointment.caregiver_name ?? "Cuidador"}
              </h3>
              {getStatusBadge(appointment.status)}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              <Badge variant="secondary" className="text-xs font-normal">
                {TYPE_LABELS[appointment.type] ?? appointment.type}
              </Badge>
              {appointment.modality && (
                <Badge variant="outline" className="text-xs font-normal gap-1">
                  <MapPin className="w-3 h-3" />
                  {appointment.modality}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Início: {formatDate(appointment.start_date)}</span>
              </div>
              {appointment.end_date && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Fim: {formatDate(appointment.end_date)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Calendar className="w-3 h-3" />
              <span>Solicitado em {formatDate(appointment.created_at)}</span>
            </div>

            {appointment.description && (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-2">
                <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{appointment.description}</span>
              </div>
            )}

            {appointment.status === "pendente" && (
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xs text-muted-foreground">
                  Aguardando resposta do cuidador.
                </p>
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link to={`/chat/${appointment.id}`}>
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </Link>
                </Button>
              </div>
            )}
            {appointment.status === "ativo" && (
              <div className="flex gap-2 mt-3">
                <Button asChild size="sm" className="gap-2">
                  <Link to={`/family/appointments/${appointment.id}`}>
                    <CheckCircle className="w-4 h-4" />
                    Acessar atendimento
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link to={`/chat/${appointment.id}`}>
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </Link>
                </Button>
              </div>
            )}
            {appointment.status === "cancelado" && (
              <div className="mt-3">
                {appointment.cancel_reason && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Motivo: {appointment.cancel_reason}
                  </p>
                )}
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link to="/family/search">
                    <Search className="w-4 h-4" />
                    Buscar outros cuidadores
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = () => (
    <Card className="border-dashed">
      <CardContent className="py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <UserCheck className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhuma solicitação enviada
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Quando você solicitar atendimento a um cuidador, o status aparecerá aqui.
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

  if (allSolicitations.length === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar role="family" userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""} userPhoto={familyProfileData?.photo_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture} />
        <main className="flex-1 p-6 lg:p-8">
          <PageHeader
            title="Solicitações"
            description="Acompanhe o status das suas solicitações enviadas aos cuidadores"
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
          title="Solicitações"
          description="Acompanhe o status das suas solicitações enviadas aos cuidadores"
        />

        <Tabs defaultValue="todas" className="mt-6">
          <TabsList>
            <TabsTrigger value="todas">
              Todas
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                {allSolicitations.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pendentes">
              Pendentes
              {pending.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                  {pending.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="aceitas">
              Aceitas
              {accepted.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                  {accepted.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="recusadas">
              Recusadas
              {rejected.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                  {rejected.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todas" className="mt-4 space-y-3">
            {allSolicitations.map((a) => (
              <SolicitationCard key={a.id} appointment={a} />
            ))}
          </TabsContent>

          <TabsContent value="pendentes" className="mt-4 space-y-3">
            {pending.length > 0 ? (
              pending.map((a) => <SolicitationCard key={a.id} appointment={a} />)
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhuma solicitação pendente.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="aceitas" className="mt-4 space-y-3">
            {accepted.length > 0 ? (
              accepted.map((a) => <SolicitationCard key={a.id} appointment={a} />)
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhuma solicitação aceita ainda.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recusadas" className="mt-4 space-y-3">
            {rejected.length > 0 ? (
              rejected.map((a) => <SolicitationCard key={a.id} appointment={a} />)
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <XCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhuma solicitação recusada.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FamilyMatches;
