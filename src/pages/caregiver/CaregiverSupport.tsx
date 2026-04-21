import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Mail, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCaregiverProfile } from "@/hooks/useCaregiverProfile";

const faqItems = [
  {
    question: "Como funciona a visibilidade do meu perfil para as famílias?",
    answer:
      "Seu perfil pode aparecer nas buscas de famílias na ditti. Você controla quais informações ficam visíveis nas configurações de Visibilidade, inclusive por atendimento (quando aplicável).",
  },
  {
    question: "A ditti é responsável pela contratação?",
    answer:
      "Não. A ditti é uma plataforma de conexão entre profissionais e famílias. A contratação, termos e vínculo são definidos diretamente entre as partes. A plataforma não intermedia relações trabalhistas.",
  },
  {
    question: "Quem define valores e pagamentos do serviço?",
    answer:
      "Você define seus valores na página de Valores. A negociação e a forma de pagamento são acordadas diretamente com a família. A ditti não processa pagamentos de serviços entre profissionais e famílias.",
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

const CaregiverSupport = () => {
  const { user } = useAuth();
  const { data: profileData } = useCaregiverProfile();

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar
        role="caregiver"
        userName={profileData?.profiles.full_name ?? user?.email ?? ""}
        userPhoto={profileData?.photo_url ?? undefined}
      />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <PageHeader
          title="Suporte"
          description="Canal exclusivo para suporte sobre o uso da plataforma ditti."
        />

        <div className="space-y-4 md:space-y-6 max-w-4xl">
          {/* Quick policy note */}
          <div className="rounded-2xl border border-border bg-muted/30 p-3 md:p-4 flex gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              A ditti facilita a conexão. Contratação, pagamento e vínculo profissional são definidos diretamente entre
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

          {/* Contact Section */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Mail className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg">Falar com o suporte</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>
                  Entre em contato pelo e-mail{" "}
                  <a
                    href="mailto:suporte@ditti.app.br"
                    className="font-medium text-foreground hover:underline"
                  >
                    suporte@ditti.app.br
                  </a>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CaregiverSupport;
