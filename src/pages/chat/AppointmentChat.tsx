import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, MessageCircle, Loader2, ShieldAlert, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAppointmentDetail } from "@/hooks/useAppointments";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";
import { useChatMessages, useSendMessage, useChatRealtime, useMarkMessagesAsRead } from "@/hooks/useChat";
import { filterContactInfo, hasContactInfo, CONTACT_WARNING_MESSAGE } from "@/lib/contact-filter";
import type { AppointmentStatus } from "@/types/database";

const AppointmentChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const userRole = profile?.role === "caregiver" ? "caregiver" : "family";
  const { data: familyProfile } = useFamilyProfile();
  // Cuidadores nunca são bloqueados; famílias precisam de assinatura ativa
  const canSendMessages =
    userRole === "caregiver" ||
    familyProfile?.subscription_status === "active" ||
    familyProfile?.subscription_status === "past_due";

  const { data: appointment, isLoading: isLoadingAppointment } = useAppointmentDetail(id, { refetchInterval: 15_000 });
  const { data: messages = [], isLoading: isLoadingMessages } = useChatMessages(id);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(id);
  const { mutate: markAsRead } = useMarkMessagesAsRead(id);

  useChatRealtime(id);

  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [contactWarningShown, setContactWarningShown] = useState(false);

  // Status helpers
  const status: AppointmentStatus | undefined = appointment?.status;
  const isWritable = status === "pendente" || status === "ativo";
  const isReadOnly = status === "finalizado" || status === "cancelado";
  const isContactFiltered = status === "pendente";

  // Auto-scroll ao receber novas mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Marcar como lidas ao abrir o chat
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages.length, markAsRead]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !isWritable) return;

    const content = newMessage.trim();

    // Se o filtro está ativo e a mensagem contém contato, avisa o usuário
    if (isContactFiltered && hasContactInfo(content)) {
      setContactWarningShown(true);
    }

    // Envia a mensagem original — o filtro é aplicado na exibição, não no envio
    // Isso preserva o conteúdo original no banco para quando o status mudar para ativo
    sendMessage(content);
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
  };

  // Aplica filtro de contato se necessário
  const getDisplayContent = (content: string): string => {
    if (isContactFiltered) {
      return filterContactInfo(content);
    }
    return content;
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, typeof messages>);

  const handleBack = () => {
    if (userRole === "caregiver") {
      navigate(`/caregiver/appointments/${id}`);
    } else {
      navigate(`/family/appointments/${id}`);
    }
  };

  // Loading state
  if (isLoadingAppointment || isLoadingMessages) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Appointment não encontrado
  if (!appointment) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center gap-4">
        <p className="text-muted-foreground">Agendamento não encontrado.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  const otherPartyName = userRole === "family"
    ? (appointment.caregiver_name ?? "Cuidador")
    : (appointment.family_name ?? "Família");

  const elderlyName = appointment.elderly_name ?? "o idoso";

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary">
              {otherPartyName.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-foreground truncate">
                {otherPartyName}
              </h1>
              <StatusBadge status={status!} size="sm" />
            </div>
            <p className="text-sm text-muted-foreground truncate">
              Cuidado de {elderlyName}
            </p>
          </div>
        </div>
      </header>

      {/* Banner de filtro de contato ativo */}
      {isContactFiltered && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="max-w-3xl mx-auto flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              {CONTACT_WARNING_MESSAGE}
            </p>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <Card className="border-dashed mt-8">
              <CardContent className="py-12 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <MessageCircle className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Este é o início da conversa entre você e o {userRole === "family" ? "cuidador" : "familiar"}.
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date} className="space-y-3">
                {/* Date Separator */}
                <div className="flex items-center justify-center">
                  <span className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                    {formatDate(dateMessages[0].created_at)}
                  </span>
                </div>

                {/* Messages */}
                {dateMessages.map((message) => {
                  const isOwnMessage = message.sender_id === user?.id;

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        isOwnMessage ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5",
                          isOwnMessage
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {getDisplayContent(message.content)}
                        </p>
                        <p
                          className={cn(
                            "text-[10px] mt-1 flex items-center gap-1",
                            isOwnMessage
                              ? "justify-end text-primary-foreground/70"
                              : "justify-end text-muted-foreground"
                          )}
                        >
                          {formatTime(message.created_at)}
                          {isOwnMessage && (
                            message.read_at
                              ? <CheckCheck className="w-3 h-3" />
                              : <Check className="w-3 h-3" />
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Contact warning toast (aparece uma vez quando o filtro bloqueia) */}
      {contactWarningShown && isContactFiltered && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-2">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">
              Sua mensagem foi enviada, mas informações de contato aparecerão como [contato removido] até o atendimento ser confirmado.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2 shrink-0"
              onClick={() => setContactWarningShown(false)}
            >
              OK
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <footer className="sticky bottom-0 bg-card border-t border-border px-4 py-3">
        <div className="max-w-3xl mx-auto">
          {isWritable ? (
            canSendMessages ? (
              <div className="flex items-end gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  className="min-h-[44px] max-h-32 resize-none"
                  rows={1}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  size="icon"
                  className="flex-shrink-0 h-11 w-11"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-2 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Assine um plano para enviar mensagens.
                </p>
                <Button size="sm" onClick={() => navigate("/family/billing")}>
                  Ver planos
                </Button>
              </div>
            )
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">
                {status === "finalizado"
                  ? "O atendimento foi finalizado. Este chat é apenas para consulta do histórico."
                  : "O atendimento foi cancelado. Este chat é apenas para consulta do histórico."
                }
              </p>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default AppointmentChat;
