import { useParams, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/shared/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StarRating from "@/components/shared/StarRating";
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Plus,
  History,
  FileText,
  Sun,
  Moon,
  Sunset,
  CheckCircle2,
  Circle,
  MessageSquare,
  MapPin,
} from "lucide-react";

// Mock data for a single appointment
const mockAppointment = {
  id: "1",
  familyName: "Maria Santos",
  elderlyName: "José Santos",
  status: "ativo",
  startDate: "2024-01-15",
  endDate: null,
  type: "contínuo",
  description:
    "Acompanhamento diário para idoso com mobilidade reduzida. Necessita auxílio para atividades básicas e administração de medicamentos.",
  familyNotes:
    "Sr. José prefere acordar às 7h. Gosta de ouvir música clássica durante as refeições. Alergia a frutos do mar.",
  // Removido: vínculo/MEI do resumo e header (se quiser exibir depois, reintroduza com linguagem neutra)
  modality: "Presencial - Residência da família",
};

const mockCareRoutine = [
  { id: "1", date: "2024-01-20", shift: "manhã", summary: "Banho assistido, café da manhã e medicação matinal administrada." },
  { id: "2", date: "2024-01-19", shift: "tarde", summary: "Fisioterapia passiva, almoço e descanso acompanhado." },
  { id: "3", date: "2024-01-19", shift: "manhã", summary: "Higiene pessoal, troca de curativos e caminhada leve no jardim." },
];

const mockHistory = [
  { id: "1", date: "2024-01-20", event: "Registro adicionado", description: "Registro de cuidado incluído no atendimento" },
  { id: "2", date: "2024-01-19", event: "Registro adicionado", description: "Registro de cuidado incluído no atendimento" },
  { id: "3", date: "2024-01-15", event: "Atendimento iniciado", description: "Atendimento iniciado após aceite das partes" },
];

const mockReview = {
  rating: 4.5,
  comment: "Excelente profissional! Muito atenciosa e carinhosa com meu pai. Sempre pontual e dedicada.",
  date: "2024-01-18",
  author: "Maria Santos",
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
    ativo: { variant: "default", label: "Ativo" },
    finalizado: { variant: "secondary", label: "Finalizado" },
    pendente: { variant: "outline", label: "Pendente" },
  };
  return variants[status] || variants.pendente;
};

const getShiftIcon = (shift: string) => {
  switch (shift) {
    case "manhã":
      return <Sun className="w-4 h-4 text-amber-500" />;
    case "tarde":
      return <Sunset className="w-4 h-4 text-orange-500" />;
    case "noite":
      return <Moon className="w-4 h-4 text-indigo-500" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const appointment = mockAppointment;
  const statusInfo = getStatusBadge(appointment.status);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar role="caregiver" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/caregiver/appointments")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos atendimentos
          </Button>

          {/* Header Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge variant={statusInfo.variant} className="text-sm">
                      {statusInfo.label}
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      {appointment.type}
                    </Badge>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{appointment.elderlyName}</h1>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                      <User className="w-4 h-4" />
                      Responsável: {appointment.familyName}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Início: {new Date(appointment.startDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" size="sm">
                    <History className="w-4 h-4 mr-2" />
                    Ver histórico completo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do atendimento */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informações do atendimento</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Pessoa assistida</p>
                <p className="font-medium text-foreground">{appointment.elderlyName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Responsável na família</p>
                <p className="font-medium text-foreground">{appointment.familyName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Início do atendimento</p>
                <p className="font-medium text-foreground">
                  {new Date(appointment.startDate).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Modalidade</p>
                <p className="font-medium text-foreground flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span>{appointment.modality}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="resumo" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="rotina">Registro de cuidados</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
            </TabsList>

            {/* Tab: Resumo */}
            <TabsContent value="resumo" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Descrição do atendimento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{appointment.description}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Informações da família
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{appointment.familyNotes}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Registro de cuidados */}
            <TabsContent value="rotina" className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => navigate(`/caregiver/appointments/${id}/care-routine`)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar cuidado
                </Button>
              </div>
              {mockCareRoutine.length > 0 ? (
                <div className="space-y-3">
                  {mockCareRoutine.map((care) => (
                    <Card key={care.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                            {getShiftIcon(care.shift)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {new Date(care.date).toLocaleDateString("pt-BR")}
                              </span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {care.shift}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{care.summary}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1">Nenhum registro ainda</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Registre aqui os cuidados realizados durante o atendimento.
                    </p>
                    <Button size="sm" onClick={() => navigate(`/caregiver/appointments/${id}/care-routine`)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar cuidado
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab: Histórico */}
            <TabsContent value="historico" className="space-y-4">
              {mockHistory.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-6">
                    {mockHistory.map((item, index) => (
                      <div key={item.id} className="relative pl-10">
                        <div className="absolute left-0 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                          {index === mockHistory.length - 1 ? (
                            <Circle className="w-3 h-3 text-primary fill-primary" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{item.event}</span>
                              <span className="text-xs text-muted-foreground">
                                • {new Date(item.date).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <History className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1">Histórico vazio</h3>
                    <p className="text-sm text-muted-foreground">Os eventos do atendimento aparecerão aqui.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab: Avaliações */}
            <TabsContent value="avaliacoes" className="space-y-4">
              {mockReview ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{mockReview.author}</h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(mockReview.date).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <StarRating rating={mockReview.rating} size="md" />
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">"{mockReview.comment}"</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1">Sem avaliações</h3>
                    <p className="text-sm text-muted-foreground">Este atendimento ainda não recebeu avaliação.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AppointmentDetails;
