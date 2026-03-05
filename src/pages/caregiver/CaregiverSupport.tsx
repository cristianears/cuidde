import { useMemo, useState } from "react";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, MessageSquare, Send, FileText, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockCaregivers } from "@/data/mockData";

const MSG_MAX = 600;

const faqItems = [
  {
    question: "Como funciona a visibilidade do meu perfil para as famílias?",
    answer:
      "Seu perfil pode aparecer nas buscas de famílias na Cuidde. Você controla quais informações ficam visíveis nas configurações de Visibilidade, inclusive por atendimento (quando aplicável).",
  },
  {
    question: "A Cuidde é responsável pela contratação?",
    answer:
      "Não. A Cuidde é uma plataforma de conexão entre profissionais e famílias. A contratação, termos e vínculo são definidos diretamente entre as partes. A plataforma não intermedia relações trabalhistas.",
  },
  {
    question: "Quem define valores e pagamentos do serviço?",
    answer:
      "Você define seus valores na página de Valores. A negociação e a forma de pagamento são acordadas diretamente com a família. A Cuidde não processa pagamentos de serviços entre profissionais e famílias.",
  },
  {
    question: "Como atualizo meus documentos?",
    answer:
      "Acesse a página de Documentos no menu lateral. Lá você pode enviar, atualizar ou substituir seus arquivos. Documentos completos aumentam a confiança das famílias no seu perfil.",
  },
  {
    question: "Posso encerrar um atendimento ativo?",
    answer:
      "Sim. Na página de Atendimentos, você pode finalizar um atendimento ativo (conforme regras do produto). Recomendamos comunicar a família previamente e registrar informações relevantes para manter seu histórico organizado.",
  },
  {
    question: "O que acontece se eu ficar indisponível temporariamente?",
    answer:
      "Você pode ajustar sua disponibilidade na página de Disponibilidade. Ao marcar como indisponível, seu perfil pode aparecer menos nas buscas — mas você mantém controle dos seus atendimentos já combinados.",
  },
];

const subjectOptions = [
  { value: "conta", label: "Conta e cadastro" },
  { value: "documentos", label: "Documentos" },
  { value: "atendimentos", label: "Atendimentos" },
  { value: "avaliacoes", label: "Avaliações" },
  { value: "visibilidade", label: "Visibilidade do perfil" },
  { value: "sugestoes", label: "Sugestões" },
  { value: "outro", label: "Outro" },
];

const mockRequests = [
  {
    id: "SUP-2024-001",
    subjectValue: "documentos",
    status: "respondido",
    date: "2024-01-15",
  },
  {
    id: "SUP-2024-002",
    subjectValue: "conta",
    status: "em_analise",
    date: "2024-01-18",
  },
] as const;

const CaregiverSupport = () => {
  const { toast } = useToast();
  const currentUser = mockCaregivers[0];

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subjectLabel = useMemo(() => {
    return subjectOptions.find((s) => s.value === subject)?.label || "";
  }, [subject]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "enviado":
        return <Badge variant="secondary">Enviado</Badge>;
      case "em_analise":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Em análise</Badge>;
      case "respondido":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Respondido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleSubmit = () => {
    if (!subject || !message.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione um assunto e escreva sua mensagem.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      toast({
        title: "Solicitação enviada",
        description: `Recebemos sua mensagem sobre "${subjectLabel || "Suporte"}". Responderemos em breve.`,
      });
      setSubject("");
      setMessage("");
      setIsSubmitting(false);
    }, 1000);
  };

  const getSubjectLabelFromValue = (value: string) =>
    subjectOptions.find((s) => s.value === value)?.label || value;

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar
        role="caregiver"
        userName={currentUser.name}
        userPhoto={currentUser.photo}
      />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <PageHeader
          title="Suporte"
          description="Canal exclusivo para suporte sobre o uso da plataforma Cuidde."
        />

        <div className="space-y-4 md:space-y-6 max-w-4xl">
          {/* Quick policy note */}
          <div className="rounded-2xl border border-border bg-muted/30 p-3 md:p-4 flex gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              A Cuidde facilita a conexão. Contratação, pagamento e vínculo profissional são definidos diretamente entre
              você e a família — sem intermediação da plataforma.
            </p>
          </div>

          {/* FAQ Section */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <HelpCircle className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg">Central de ajuda</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Perguntas frequentes sobre o uso da plataforma</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left text-sm md:text-base hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs md:text-sm text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Contact Form Section */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg">Falar com o suporte</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Use este formulário para enviar dúvidas, problemas técnicos ou questões sobre sua conta.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium">Assunto</label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione o assunto" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {subjectOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium">Mensagem</label>
                <Textarea
                  placeholder="Descreva sua dúvida ou problema..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MSG_MAX))}
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {message.length}/{MSG_MAX}
                </p>
              </div>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Enviando..." : "Enviar solicitação"}
              </Button>
            </CardContent>
          </Card>

          {/* Previous Requests Section */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg">Solicitações enviadas</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Acompanhe o status das suas solicitações anteriores</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {mockRequests.length > 0 ? (
                <div className="space-y-3">
                  {mockRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 border rounded-lg gap-2 md:gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs md:text-sm text-muted-foreground">{request.id}</span>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-xs md:text-sm font-medium">
                          {getSubjectLabelFromValue(request.subjectValue)}
                        </p>
                      </div>
                      <span className="text-xs md:text-sm text-muted-foreground">
                        {new Date(request.date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 md:py-10">
                  <FileText className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-xs md:text-sm text-muted-foreground">Você ainda não enviou nenhuma solicitação ao suporte.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CaregiverSupport;
