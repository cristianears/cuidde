import { useState } from "react";
import { Link } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HelpCircle, MessageSquare, Send, ExternalLink, Mail, CreditCard, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const faqItems = [
  {
    question: "Como funciona a CuidaBem?",
    answer: "A CuidaBem é uma plataforma que conecta famílias a cuidadores de idosos verificados. Você pode buscar profissionais por especialidade, localização e disponibilidade, e contratar diretamente o cuidador ideal para suas necessidades."
  },
  {
    question: "Quem faz a contratação do cuidador?",
    answer: "A contratação é sempre feita diretamente pela família. A CuidaBem atua como plataforma de conexão, facilitando a busca, verificação e match entre famílias e cuidadores. Oferecemos suporte e orientação durante todo o processo."
  },
  {
    question: "A CuidaBem é responsável pelo vínculo empregatício?",
    answer: "Não. A CuidaBem é uma plataforma de conexão entre famílias e cuidadores. A contratação e o vínculo empregatício são definidos diretamente entre as partes, podendo ser MEI, CLT ou outras modalidades conforme acordado."
  },
  {
    question: "Como são feitos os pagamentos?",
    answer: "A família realiza o pagamento à CuidaBem apenas referente ao plano de uso da plataforma. O pagamento pelo serviço do cuidador é feito diretamente a ele, conforme valores e condições acordadas entre família e profissional."
  },
  {
    question: "Os cuidadores são verificados?",
    answer: "Sim! Todos os cuidadores passam por um processo rigoroso que inclui validação de documentos, análise de antecedentes criminais, verificação de referências profissionais e validação de certificações. Apenas profissionais aprovados podem atender famílias."
  },
  {
    question: "Posso substituir o cuidador se não me adaptar?",
    answer: "Sim. Dependendo do seu plano, você pode solicitar a substituição do cuidador. O plano Match, por exemplo, oferece até 3 substituições em 90 dias. Basta entrar em contato pelo suporte ou buscar um novo profissional na plataforma."
  },
  {
    question: "Como funciona o atendimento em emergências?",
    answer: "Com o plano Essencial, você tem acesso à localização de profissionais disponíveis nas proximidades em tempo real, além de suporte para emergências e substituições rápidas. O plano Daily também oferece fluxo rápido de contratação para necessidades pontuais."
  },
  {
    question: "Como falo com a equipe da CuidaBem?",
    answer: "Você pode entrar em contato com a equipe da CuidaBem pelo formulário abaixo nesta página ou pelo e-mail suporte@cuidabem.com. Nossa equipe responde em até 24 horas úteis."
  }
];

const FamilySupport = () => {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o assunto e a mensagem.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      toast({
        title: "Mensagem enviada com sucesso",
        description: "Nossa equipe responderá em breve."
      });
      setSubject("");
      setMessage("");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar role="family" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <PageHeader
            title="Suporte"
            description="Tire suas dúvidas e entre em contato com a equipe CuidaBem."
          />

          <div className="space-y-6 max-w-4xl">
            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Ajuda rápida</CardTitle>
                    <CardDescription>Perguntas frequentes sobre a plataforma</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Contact Form Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Fale com a CuidaBem</CardTitle>
                    <CardDescription>
                      Envie sua dúvida ou sugestão para nossa equipe.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span>Você também pode nos escrever em <strong className="text-foreground">suporte@cuidabem.com</strong></span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Assunto</label>
                  <Input
                    placeholder="Ex: Dúvida sobre meu plano"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Mensagem</label>
                  <Textarea
                    placeholder="Descreva sua dúvida ou sugestão..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Enviando..." : "Enviar mensagem"}
                </Button>
              </CardContent>
            </Card>

            {/* Useful Links Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ExternalLink className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Links úteis</CardTitle>
                    <CardDescription>Acesse rapidamente outras áreas da plataforma</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    to="/family/billing"
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <CreditCard className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Plano & Assinatura</p>
                      <p className="text-xs text-muted-foreground">Gerencie seu plano e pagamentos</p>
                    </div>
                  </Link>
                  <Link
                    to="/family/invoices"
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Faturas</p>
                      <p className="text-xs text-muted-foreground">Veja seu histórico de faturas</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default FamilySupport;
