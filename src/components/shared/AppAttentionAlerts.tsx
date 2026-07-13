import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Briefcase, ClipboardCheck, MessageCircle } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useAppointments } from "@/hooks/useAppointments";
import { useCareRoutineTodayStatus } from "@/hooks/useCareRoutine";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AttentionAlert = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  icon: typeof Bell;
  count: number;
};

type NavigatorWithBadging = Navigator & {
  setAppBadge?: (contents?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

function appAttentionDismissKey(userId: string) {
  return `cuidde_attention_alert_dismissed_${userId}`;
}

function usePwaAppBadge(count: number) {
  useEffect(() => {
    const nav = navigator as NavigatorWithBadging;

    if (count > 0 && typeof nav.setAppBadge === "function") {
      void nav.setAppBadge(count).catch(() => undefined);
    } else if (count === 0 && typeof nav.clearAppBadge === "function") {
      void nav.clearAppBadge().catch(() => undefined);
    }

    return () => {
      if (typeof nav.clearAppBadge === "function") {
        void nav.clearAppBadge().catch(() => undefined);
      }
    };
  }, [count]);
}

function getFirstUnreadAppointmentId(unreadByAppointment: Record<string, number>) {
  return Object.entries(unreadByAppointment)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
}

function AuthenticatedAttentionAlerts({ role }: { role: "caregiver" | "family" }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: unread } = useUnreadCounts(role);
  const { data: appointments = [] } = useAppointments(role);

  const activeCaregiverAppointmentIds = useMemo(
    () => role === "caregiver"
      ? appointments.filter((appointment) => appointment.status === "ativo").map((appointment) => appointment.id)
      : [],
    [appointments, role],
  );
  const { data: routineTodayStatus = {}, isLoading: isLoadingRoutineStatus } =
    useCareRoutineTodayStatus(activeCaregiverAppointmentIds);

  const firstMissingRoutineAppointment = useMemo(() => {
    if (role !== "caregiver" || isLoadingRoutineStatus) return undefined;
    return appointments.find(
      (appointment) => appointment.status === "ativo" && routineTodayStatus[appointment.id] !== true,
    );
  }, [appointments, isLoadingRoutineStatus, role, routineTodayStatus]);

  const alerts = useMemo<AttentionAlert[]>(() => {
    const nextAlerts: AttentionAlert[] = [];

    if (unread?.totalUnreadMessages) {
      const appointmentId = getFirstUnreadAppointmentId(unread.unreadByAppointment);
      nextAlerts.push({
        id: `messages:${appointmentId ?? "all"}:${unread.totalUnreadMessages}`,
        title: unread.totalUnreadMessages === 1 ? "Você tem uma nova mensagem" : "Você tem novas mensagens",
        description: "Abra a conversa para responder e manter o atendimento alinhado.",
        actionLabel: "Ver conversa",
        href: appointmentId ? `/chat/${appointmentId}` : role === "caregiver" ? "/caregiver/solicitations" : "/family/matches",
        icon: MessageCircle,
        count: unread.totalUnreadMessages,
      });
    }

    const solicitationCount = role === "caregiver"
      ? unread?.newSolicitations ?? 0
      : unread?.updatedSolicitations ?? 0;

    if (solicitationCount > 0) {
      nextAlerts.push({
        id: `solicitations:${role}:${solicitationCount}`,
        title: role === "caregiver" ? "Você recebeu uma nova solicitação" : "Sua solicitação teve uma atualização",
        description: role === "caregiver"
          ? "Veja os detalhes para conversar com a família e decidir se aceita o atendimento."
          : "Confira se o cuidador respondeu ou se houve mudança no atendimento.",
        actionLabel: role === "caregiver" ? "Ver solicitação" : "Ver atualização",
        href: role === "caregiver" ? "/caregiver/solicitations" : "/family/matches",
        icon: ClipboardCheck,
        count: solicitationCount,
      });
    }

    if (firstMissingRoutineAppointment) {
      nextAlerts.push({
        id: `routine:${firstMissingRoutineAppointment.id}`,
        title: "Você tem uma rotina para registrar",
        description: "Registre a rotina de hoje para manter a família informada sobre o atendimento.",
        actionLabel: "Registrar rotina",
        href: `/caregiver/appointments/${firstMissingRoutineAppointment.id}/care-routine`,
        icon: Briefcase,
        count: 1,
      });
    }

    return nextAlerts;
  }, [firstMissingRoutineAppointment, role, unread]);

  const appBadgeCount = alerts.reduce((total, alert) => total + alert.count, 0);
  usePwaAppBadge(appBadgeCount);

  const primaryAlert = alerts[0];
  const alertSignature = alerts.map((alert) => alert.id).join("|");
  const [dismissedSignature, setDismissedSignature] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    setDismissedSignature(sessionStorage.getItem(appAttentionDismissKey(user.id)));
  }, [user?.id]);

  if (!user || !primaryAlert || dismissedSignature === alertSignature) {
    return null;
  }

  const Icon = primaryAlert.icon;
  const currentPath = `${location.pathname}${location.search}`;
  const isAlreadyOnTarget = currentPath === primaryAlert.href;

  if (isAlreadyOnTarget) {
    return null;
  }

  function dismiss() {
    if (!user) return;
    sessionStorage.setItem(appAttentionDismissKey(user.id), alertSignature);
    setDismissedSignature(alertSignature);
  }

  function goToAlert() {
    dismiss();
    if (!isAlreadyOnTarget) {
      navigate(primaryAlert.href);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && dismiss()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm rounded-lg p-4 sm:max-w-md sm:p-6">
        <DialogHeader className="space-y-3 text-left">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1.5">
            <DialogTitle className="text-lg leading-snug">{primaryAlert.title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {primaryAlert.description}
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={dismiss} className="w-full sm:w-auto">
            Agora não
          </Button>
          <Button type="button" onClick={goToAlert} className="w-full sm:w-auto">
            {primaryAlert.actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AppAttentionAlerts() {
  const { role, isLoading } = useAuth();

  if (isLoading || (role !== "caregiver" && role !== "family")) {
    return null;
  }

  return <AuthenticatedAttentionAlerts role={role} />;
}
