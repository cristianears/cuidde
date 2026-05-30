import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
const faqs = [
  {
    question: "O cadastro do profissional é realmente gratuito?",
    answer:
      "Sim. Profissionais de cuidado podem criar seu perfil gratuitamente, adicionar certificações, cursos e informações relevantes. A icuide não cobra comissão sobre os atendimentos realizados.",
  },
  {
    question: "Quem faz a contratação do profissional?",
    answer:
      "A contratação é sempre feita diretamente pela família. A icuide é uma plataforma de conexão — facilitamos a busca e o contato, mas a negociação de valores, forma de trabalho e vínculo são definidos exclusivamente entre família e profissional, sem intermediação nossa.",
  },
  {
    question: "Como funcionam os documentos e informações do perfil?",
    answer:
      "Cada profissional preenche seu próprio perfil e pode anexar documentos e declarações (como certificações e certidões, quando desejar). A icuide organiza essas informações para facilitar a avaliação da família. A responsabilidade pela veracidade e atualização do que é enviado é do profissional, e a decisão final é sempre da família.",
  },
  {
    question: "O que consigo ver no plano gratuito?",
    answer:
      "No plano gratuito, você consegue explorar a plataforma com limitações (por exemplo, busca limitada e visualização parcial de perfis), além de ver avaliações. Para liberar chat ilimitado e visualizar documentos completos enviados pelo profissional, é necessário assinar um plano.",
  },
  {
    question: "Posso cancelar minha assinatura a qualquer momento?",
    answer:
      "Sim. Não há fidelidade. Você pode cancelar quando quiser, sem multa. O acesso continua ativo até o fim do período já pago (mensal, trimestral ou anual).",
  },
  {
    question: "A icuide é responsável pelo vínculo empregatício?",
    answer:
      "Não. A icuide é uma plataforma de conexão entre famílias e profissionais de cuidado. A contratação, o vínculo e o pagamento pelo serviço são definidos e realizados diretamente entre as partes. A icuide não é empregadora e não intermedia contratos.",
  },
  {
    question: "Como funcionam os pagamentos?",
    answer:
      "A família paga à icuide apenas a assinatura do plano escolhido para uso da plataforma. O pagamento pelo serviço prestado pelo profissional é feito diretamente a ele, nos valores e condições acordados entre as partes. A icuide não intermedia nem processa pagamentos de serviços de cuidado.",
  },
];
const FAQ = () => {
  return (
    <section id="faq" className="py-12 md:py-16 bg-background relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-section-divider" />
      <div className="container mx-auto px-6 md:px-10">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-2 tracking-tight">
            Perguntas frequentes
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Tire suas dúvidas sobre a icuide.
          </p>
        </div>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-2.5">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`item-${index}`}
                className="bg-card rounded-xl px-5 border border-border/30 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary/30 data-[state=open]:shadow-card-hover data-[state=open]:border-primary/40 transition-all duration-300"
              >
                <AccordionTrigger className="text-left text-foreground font-medium py-4 hover:no-underline hover:text-primary text-sm transition-colors duration-200 [&[data-state=open]]:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 leading-relaxed text-xs md:text-sm animate-fade-in">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
export default FAQ;
