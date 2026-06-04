import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { markSolicitationsSeen } from "@/hooks/useUnreadCounts";
import {
  Calendar, Clock, User, FileText, MapPin, Loader2, CheckCircle, XCircle,
  ClipboardList, MessageSquare, Briefcase, MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useCaregiverProfile } from "@/hooks/useCaregiverProfile";
import { useAppointments, useUpdateAppointmentStatus, type AppointmentWithNames } from "@/hooks/useAppointments";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";

const TYPE_LABELS: Record<string, string> = {
  "plantão": "Plantão",
  "contínuo": "Contínuo",
  "turno": "Turno",
};

const CaregiverSolicitations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profileData } = useCaregiverProfile();
  const { data: appointments, isLoading } = useAppointments("caregiver");
  const { data: unread } = useUnreadCounts("caregiver");
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateAppointmentStatus();

  // Marcar solicitações como vistas ao entrar na página
  useEffect(() => {
    if (!user) return;
    markSolicitationsSeen(user.id);
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

  const handleAccept = (id: string) => {
    updateStatus({ id, status: "ativo" });
  };

  const RejectDialog = ({ appointmentId }: { appointmentId: string }) => {
    const [reason, setReason] = useState("");
    const [open, setOpen] = useState(false);

    const handleReject = () => {
      updateStatus(
        { id: appointmentId, status: "cancelado", cancel_reason: reason.trim() || undefined },
        { onSuccess: () => setOpen(false) }
      );
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full gap-1.5 text-destructive hover:text-destructive sm:w-auto">
            <XCircle className="w-4 h-4" />
            Recusar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recusar solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da recusa (opcional). A família será notificada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Já tenho atendimentos nesse período, agenda cheia..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={300}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isUpdating}>
              {isUpdating ? "Recusando..." : "Confirmar recusa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const SolicitationCard = ({ appointment }: { appointment: AppointmentWithNames }) => {
    const isPending = appointment.status === "pendente";
    const isAccepted = appointment.status === "ativo";
    const unreadCount = unread?.unreadByAppointment[appointment.id] ?? 0;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <Avatar className="w-12 h-12 sm:w-14 sm:h-14">
              <AvatarFallback className="bg-primary/10 text-primary text-base sm:text-lg">
                {getInitials(appointment.family_name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-2">
              {/* Header: nome + status */}
              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {appointment.family_name ?? "Família"}
                  </h3>
                  {appointment.elderly_name && (
                    <p className="text-xs text-muted-foreground truncate">
                      Idoso(a): {appointment.elderly_name}
                    </p>
                  )}
                </div>
                {isPending ? (
                  <Badge variant="secondary" className="gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    Pendente
                  </Badge>
                ) : isAccepted ? (
                  <Badge className="gap-1 bg-green-100 text-green-800 hover:bg-green-100 shrink-0">
                    <CheckCircle className="w-3 h-3" />
                    Aceita
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-muted-foreground shrink-0">
                    <XCircle className="w-3 h-3" />
                    Recusada
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Detalhes da solicitação */}
              <div className="space-y-2">
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
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Início: {formatDate(appointment.start_date)}</span>
                  </div>
                  {appointment.end_date && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Fim: {formatDate(appointment.end_date)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span>Recebida em {formatDate(appointment.created_at)}</span>
                </div>
              </div>

              {/* Descrição do atendimento */}
              {appointment.description && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
                    <FileText className="w-3.5 h-3.5" />
                    Descrição do atendimento
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line break-words">
                    {appointment.description}
                  </p>
                </div>
              )}

              {/* Observações sobre o idoso */}
              {appointment.family_notes && (
                <div className="bg-blue-50/50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Observações sobre o idoso
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line break-words">
                    {appointment.family_notes}
                  </p>
                </div>
              )}

              {/* Motivo da recusa (se recusada) */}
              {appointment.status === "cancelado" && appointment.cancel_reason && (
                <div className="bg-red-50/50 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-destructive mb-1">
                    <XCircle className="w-3.5 h-3.5" />
                    Motivo da recusa
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {appointment.cancel_reason}
                  </p>
                </div>
              )}

              {/* Ações */}
              {isPending && (
                <div className="grid grid-cols-2 gap-2 pt-2 sm:flex sm:flex-wrap">
                  <Button
                    size="sm"
                    className="w-full gap-1.5 sm:w-auto"
                    onClick={() => handleAccept(appointment.id)}
                    disabled={isUpdating}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aceitar
                  </Button>
                  <RejectDialog appointmentId={appointment.id} />
                  <Button
                    size="sm"
                    variant="outline"
                    className="col-span-2 w-full gap-1.5 relative sm:col-span-1 sm:w-auto"
                    onClick={() => navigate(`/chat/${appointment.id}`)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </div>
              )}
              {isAccepted && (
                <div className="grid grid-cols-1 gap-2 pt-2 sm:flex sm:flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1.5 sm:w-auto"
                    onClick={() => navigate(`/caregiver/appointments/${appointment.id}`)}
                  >
                    <Briefcase className="w-4 h-4" />
                    Ver atendimento
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1.5 relative sm:w-auto"
                    onClick={() => navigate(`/chat/${appointment.id}`)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
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
          <ClipboardList className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhuma solicitação recebida
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Quando famílias enviarem solicitações de atendimento, elas aparecerão aqui.
          Complete seu perfil para aumentar sua visibilidade.
        </p>
        <Button variant="secondary" onClick={() => navigate("/caregiver/profile")}>
          Completar perfil
        </Button>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar role="caregiver" userName={profileData?.profiles.full_name ?? user?.email ?? ""} userPhoto={profileData?.photo_url ?? undefined} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  if (allSolicitations.length === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar role="caregiver" userName={profileData?.profiles.full_name ?? user?.email ?? ""} userPhoto={profileData?.photo_url ?? undefined} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <PageHeader
            title="Solicitações"
            description="Solicitações de atendimento recebidas das famílias"
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
      <AppSidebar role="caregiver" userName={profileData?.profiles.full_name ?? user?.email ?? ""} userPhoto={profileData?.photo_url ?? undefined} />

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <PageHeader
          title="Solicitações"
          description="Solicitações de atendimento recebidas das famílias"
        />

        <Tabs defaultValue="pendentes" className="mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="pendentes" className="text-xs md:text-sm">
              Pendentes
              {pending.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                  {pending.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="aceitas" className="text-xs md:text-sm">
              Aceitas
              {accepted.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                  {accepted.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="recusadas" className="text-xs md:text-sm">
              Recusadas
              {rejected.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                  {rejected.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pendentes" className="space-y-3 md:space-y-4">
            {pending.length > 0 ? (
              pending.map((a) => <SolicitationCard key={a.id} appointment={a} />)
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhuma solicitação pendente no momento.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="aceitas" className="space-y-3 md:space-y-4">
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

          <TabsContent value="recusadas" className="space-y-3 md:space-y-4">
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

export default CaregiverSolicitations;
