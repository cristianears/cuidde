import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Calendar, Clock, User, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/shared/StatusBadge";
import StarRating from "@/components/shared/StarRating";

// Mock data - será substituído por dados reais do backend
const mockAppointment = {
  id: "1",
  elderName: "Maria Silva",
  caregiverName: "Ana Costa",
  status: "active" as const,
  type: "Contínuo",
  professionalType: "MEI",
  startDate: "2024-01-15",
  description: "Acompanhamento diário para cuidados com a saúde e bem-estar da Sra. Maria, incluindo auxílio nas atividades diárias e administração de medicamentos.",
  observations: "A Sra. Maria tem preferência por passeios no jardim durante a manhã.",
};

const mockCareRoutine = [
  {
    id: "1",
    date: "2024-01-20",
    shift: "Manhã",
    summary: "Higiene pessoal, café da manhã, administração de medicamentos",
    occurrences: null,
  },
  {
    id: "2",
    date: "2024-01-20",
    shift: "Tarde",
    summary: "Almoço, descanso, fisioterapia leve",
    occurrences: "Paciente relatou leve dor no joelho direito",
  },
  {
    id: "3",
    date: "2024-01-19",
    shift: "Noite",
    summary: "Jantar, medicação noturna, preparação para dormir",
    occurrences: null,
  },
];

const mockHistory = [
  { id: "1", date: "2024-01-15", event: "Atendimento iniciado" },
  { id: "2", date: "2024-01-15", event: "Primeiro registro de cuidados realizado" },
  { id: "3", date: "2024-01-18", event: "Registro de ocorrência: consulta médica" },
  { id: "4", date: "2024-01-20", event: "Atualização na rotina de medicamentos" },
];

const mockEvaluation = {
  rating: 5,
  comment: "Excelente profissional! Muito atenciosa e carinhosa com a minha mãe.",
  date: "2024-01-20",
};

const FamilyAppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const isActive = mockAppointment.status === "active";

  const getShiftIcon = (shift: string) => {
    switch (shift) {
      case "Manhã":
        return "☀️";
      case "Tarde":
        return "🌤️";
      case "Noite":
        return "🌙";
      default:
        return "📋";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/family")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {/* Appointment Header Card */}
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">
                        {mockAppointment.elderName}
                      </h1>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Cuidador: {mockAppointment.caregiverName}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <StatusBadge status={mockAppointment.status} />
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Início: {new Date(mockAppointment.startDate).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {mockAppointment.type}
                    </span>
                  </div>
                </div>

                {/* Chat Button - Only if active */}
                {isActive && (
                  <Button 
                    className="gap-2"
                    onClick={() => navigate(`/chat/${id}?role=family`)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Conversar com o cuidador
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content with Tabs */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="resumo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="rotina">Rotina de Cuidados</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
          </TabsList>

          {/* Tab: Resumo */}
          <TabsContent value="resumo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Atendimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Descrição
                  </p>
                  <p className="text-foreground">{mockAppointment.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Modalidade de Atendimento
                    </p>
                    <p className="text-foreground">{mockAppointment.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Tipo de Vínculo
                    </p>
                    <p className="text-foreground">{mockAppointment.professionalType}</p>
                  </div>
                </div>

                {mockAppointment.observations && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Observações
                    </p>
                    <p className="text-foreground">{mockAppointment.observations}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Rotina de Cuidados */}
          <TabsContent value="rotina" className="space-y-4">
            {mockCareRoutine.length > 0 ? (
              <div className="space-y-3">
                {mockCareRoutine.map((routine) => (
                  <Card key={routine.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getShiftIcon(routine.shift)}</span>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground">
                              {routine.shift}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(routine.date).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {routine.summary}
                          </p>
                          {routine.occurrences && (
                            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
                              <p className="text-sm text-amber-800 dark:text-amber-200">
                                <strong>Ocorrência:</strong> {routine.occurrences}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Nenhum cuidado foi registrado até o momento.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Linha do Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-4">
                    {mockHistory.map((item, index) => (
                      <div key={item.id} className="relative pl-8">
                        <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                        <div>
                          <p className="font-medium text-foreground">{item.event}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(item.date).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Avaliações */}
          <TabsContent value="avaliacoes" className="space-y-4">
            {mockEvaluation ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sua Avaliação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <StarRating rating={mockEvaluation.rating} />
                    <span className="text-sm text-muted-foreground">
                      {new Date(mockEvaluation.date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-foreground">{mockEvaluation.comment}</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Você ainda não avaliou este atendimento.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FamilyAppointmentDetails;
