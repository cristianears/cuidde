import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send, User, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

type MessageSender = "family" | "caregiver";

interface ChatMessage {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
}

interface AppointmentInfo {
  id: string;
  elderlyName: string;
  caregiverName: string;
  caregiverPhoto?: string;
  familyName: string;
  status: "active" | "finished";
}

// Mock data
const mockAppointmentInfo: AppointmentInfo = {
  id: "1",
  elderlyName: "Dona Maria",
  caregiverName: "Maria Silva",
  caregiverPhoto: "",
  familyName: "João Oliveira",
  status: "active",
};

const mockMessages: ChatMessage[] = [
  {
    id: "1",
    sender: "family",
    content: "Olá Maria! Tudo bem? Queria saber se a mamãe tomou os remédios hoje de manhã.",
    timestamp: "2024-01-25T09:30:00",
  },
  {
    id: "2",
    sender: "caregiver",
    content: "Bom dia, João! Sim, ela tomou todos os medicamentos no horário correto. Está bem disposta hoje!",
    timestamp: "2024-01-25T09:35:00",
  },
  {
    id: "3",
    sender: "family",
    content: "Que ótimo! E como está o apetite dela?",
    timestamp: "2024-01-25T09:40:00",
  },
  {
    id: "4",
    sender: "caregiver",
    content: "O apetite está bom. Ela tomou o café da manhã completo e pediu uma fruta depois. Vou registrar tudo na rotina de cuidados.",
    timestamp: "2024-01-25T09:45:00",
  },
  {
    id: "5",
    sender: "family",
    content: "Perfeito, muito obrigado pelo cuidado! 🙏",
    timestamp: "2024-01-25T10:00:00",
  },
];

const AppointmentChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userRole = searchParams.get("role") as "family" | "caregiver" || "family";
  
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  
  const appointment = mockAppointmentInfo;
  const isActive = appointment.status === "active";

  const handleSendMessage = () => {
    if (!newMessage.trim() || !isActive) return;

    const message: ChatMessage = {
      id: String(Date.now()),
      sender: userRole,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, message]);
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

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, ChatMessage[]>);

  const handleBack = () => {
    if (userRole === "caregiver") {
      navigate(`/caregiver/appointments/${id}`);
    } else {
      navigate(`/family/appointments/${id}`);
    }
  };

  const otherPartyName = userRole === "family" ? appointment.caregiverName : appointment.familyName;

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
            <AvatarImage src={appointment.caregiverPhoto} alt={otherPartyName} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {otherPartyName.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-foreground truncate">
                {otherPartyName}
              </h1>
              <StatusBadge status={appointment.status} size="sm" />
            </div>
            <p className="text-sm text-muted-foreground truncate">
              Cuidado de {appointment.elderlyName}
            </p>
          </div>
        </div>
      </header>

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
                    {formatDate(dateMessages[0].timestamp)}
                  </span>
                </div>

                {/* Messages */}
                {dateMessages.map((message) => {
                  const isOwnMessage = message.sender === userRole;

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
                          {message.content}
                        </p>
                        <p
                          className={cn(
                            "text-[10px] mt-1 text-right",
                            isOwnMessage
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="sticky bottom-0 bg-card border-t border-border px-4 py-3">
        <div className="max-w-3xl mx-auto">
          {isActive ? (
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
                disabled={!newMessage.trim()}
                size="icon"
                className="flex-shrink-0 h-11 w-11"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">
                O atendimento foi finalizado. O chat não está mais disponível.
              </p>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default AppointmentChat;
