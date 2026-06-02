import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { markMatchesSeen } from "@/hooks/useUnreadCounts";
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
import { useUnreadCounts } from "@/hooks/useUnreadCounts";

const TYPE_LABELS: Record<string, string> = {
  "plantão": "Plantão",
  "contínuo": "Contínuo",
  "turno": "Turno",
};

const FamilyMatches = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: familyProfileData } = useFamilyProfile();
  const { data: appointments, isLoading } = useAppointments("family");
  const { data: unread } = useUnreadCounts("family");

  // Marcar solicitações como vistas ao entrar na página
  useEffect(() => {
    if (!user) return;
    markMatchesSeen(user.id);
    qc.invalidateQueries({ queryKey: ['unread_counts', user.id] });
  }, [user, qc]);

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
    const d = dateString.length === 10 ? dateString + "T00:00:00" : dateString;
    return new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const SolicitationCard = ({ appointment }: { appointment: AppointmentWithNames }) => {
    const unreadCount = unread?.unreadByAppointment[appointment.id] ?? 0;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <Avatar className="w-12 h-12 sm:w-14 sm:h-14">
            <AvatarFallback className="bg-primary/10 text-primary text-base sm:text-lg">
              {getInitials(appointment.caregiver_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="grid grid-cols-[1fr_auto] items-start gap-2">
              <h3 className="font-semibold text-foreground truncate">
                {appointment.caregiver_name ?? "Cuidador"}
              </h3>
              {getStatusBadge(appointment.status)}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-xs font-normal">
                {TYPE_LABELS[appointment.type] ?? appointment.type}
              </Badge>
              {appointment.modality && (
                <Badge variant="outline" className="max-w-full text-xs font-normal gap-1 whitespace-normal">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="break-words">{appointment.modality}</span>
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground">
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

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Solicitado em {formatDate(appointment.created_at)}</span>
            </div>

            {appointment.description && (
              <div className="flex items-start gap-1.5 rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">
                <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{appointment.description}</span>
              </div>
            )}

            {appointment.status === "pendente" && (
              <div className="grid grid-cols-[1fr_auto] items-center gap-2 pt-1">
                <p className="text-xs text-muted-foreground">
                  Aguardando resposta do cuidador.
                </p>
                <Button asChild size="sm" variant="outline" className="gap-1.5 relative px-3">
                  <Link to={`/chat/${appointment.id}`}>
                    <MessageCircle className="w-4 h-4" />
                    Chat
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                </Button>
              </div>
            )}
            {appointment.status === "ativo" && (
              <div className="grid grid-cols-[1fr_auto] gap-2 pt-1">
                <Button asChild size="sm" className="gap-2 px-3">
                  <Link to={`/family/appointments/${appointment.id}`}>
                    <CheckCircle className="w-4 h-4" />
                    Acessar atendimento
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="gap-1.5 relative px-3">
                  <Link to={`/chat/${appointment.id}`}>
                    <MessageCircle className="w-4 h-4" />
                    Chat
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
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
  };

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

      <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
        <PageHeader
          title="Solicitações"
          description="Acompanhe o status das suas solicitações enviadas aos cuidadores"
        />

        <Tabs defaultValue="todas" className="mt-6 min-w-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="todas" className="min-w-0 px-1 text-[11px] sm:text-sm">
              Todas
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] sm:h-5 sm:px-1.5 sm:text-xs">
                {allSolicitations.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pendentes" className="min-w-0 px-1 text-[11px] sm:text-sm">
              Pendentes
              {pending.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] sm:h-5 sm:px-1.5 sm:text-xs">
                  {pending.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="aceitas" className="min-w-0 px-1 text-[11px] sm:text-sm">
              Aceitas
              {accepted.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] sm:h-5 sm:px-1.5 sm:text-xs">
                  {accepted.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="recusadas" className="min-w-0 px-1 text-[11px] sm:text-sm">
              Recusadas
              {rejected.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] sm:h-5 sm:px-1.5 sm:text-xs">
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
