import { Link } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/shared/AppSidebar";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, ExternalLink, Mail, CreditCard, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyProfile } from "@/hooks/useFamilyProfile";

const faqItems = [
  {
    question: "O cadastro do profissional é realmente gratuito?",
    answer: "Sim. Profissionais de cuidado podem criar seu perfil gratuitamente, adicionar certificações, cursos e informações relevantes. A ditti não cobra comissão sobre os atendimentos realizados."
  },
  {
    question: "Quem faz a contratação do profissional?",
    answer: "A contratação é sempre feita diretamente pela família. A ditti é uma plataforma de conexão — facilitamos a busca e o contato, mas a negociação de valores, forma de trabalho e vínculo são definidos exclusivamente entre família e profissional, sem intermediação nossa."
  },
  {
    question: "Como funcionam os documentos e informações do perfil?",
    answer: "Cada profissional preenche seu próprio perfil e pode anexar documentos e declarações (como certificações e certidões, quando desejar). A ditti organiza essas informações para facilitar a avaliação da família. A responsabilidade pela veracidade e atualização do que é enviado é do profissional, e a decisão final é sempre da família."
  },
  {
    question: "O que consigo ver no plano gratuito?",
    answer: "No plano gratuito, você consegue explorar a plataforma com limitações (por exemplo, busca limitada e visualização parcial de perfis), além de ver avaliações. Para liberar chat ilimitado e visualizar documentos completos enviados pelo profissional, é necessário assinar um plano."
  },
  {
    question: "Posso cancelar minha assinatura a qualquer momento?",
    answer: "Sim. Não há fidelidade. Você pode cancelar quando quiser, sem multa. O acesso continua ativo até o fim do período já pago (mensal, trimestral ou anual)."
  },
  {
    question: "A ditti é responsável pelo vínculo empregatício?",
    answer: "Não. A ditti é uma plataforma de conexão entre famílias e profissionais de cuidado. A contratação, o vínculo e o pagamento pelo serviço são definidos e realizados diretamente entre as partes. A ditti não é empregadora e não intermedia contratos."
  },
  {
    question: "Como funcionam os pagamentos?",
    answer: "A família paga à ditti apenas a assinatura do plano escolhido para uso da plataforma. O pagamento pelo serviço prestado pelo profissional é feito diretamente a ele, nos valores e condições acordados entre as partes. A ditti não intermedia nem processa pagamentos de serviços de cuidado."
  }
];

const FamilySupport = () => {
  const { user } = useAuth();
  const { data: familyProfileData } = useFamilyProfile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar role="family" userName={familyProfileData?.profiles?.full_name ?? user?.email ?? ""} userPhoto={familyProfileData?.photo_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <PageHeader
            title="Suporte"
            description="Tire suas dúvidas e entre em contato com a equipe ditti."
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
                <Accordion type="single" collapsible className="space-y-2.5">
                  {faqItems.map((item, index) => (
                    <AccordionItem
                      key={index}
                      value={`item-${index}`}
                      className="bg-card rounded-xl px-5 border border-border/30 shadow-card data-[state=open]:shadow-card-hover transition-all duration-300"
                    >
                      <AccordionTrigger className="text-left text-foreground font-medium py-4 hover:no-underline text-sm">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4 leading-relaxed text-xs md:text-sm">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Contact Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Falar com o suporte</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
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
