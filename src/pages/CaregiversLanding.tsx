import {
  ArrowRight,
  CalendarDays,
  CheckCircle,
  ClipboardCheck,
  FileText,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import caregiversImage from "@/assets/caregivers-card-image.jpg";
import familiesImage from "@/assets/families-card-image.jpg";

const benefits = [
  {
    icon: UserCheck,
    title: "Perfil profissional completo",
    description:
      "Mostre sua experiência, formação, especialidades, valores, disponibilidade, documentos e referências em um perfil organizado.",
  },
  {
    icon: MessageCircle,
    title: "Converse antes de aceitar",
    description:
      "Fale com a família pelo chat antes de aceitar uma solicitação de atendimento e alinhe expectativas com mais tranquilidade.",
  },
  {
    icon: ClipboardCheck,
    title: "Diário de atendimento",
    description:
      "Registre rotina de cuidados, observações e ocorrências durante o atendimento para manter a família informada.",
  },
  {
    icon: Star,
    title: "Avaliações fortalecem sua reputação",
    description:
      "Ao concluir atendimentos, avaliações de famílias ajudam seu perfil a ganhar mais confiança e destaque na plataforma.",
  },
];

const steps = [
  "Crie sua conta gratuita",
  "Complete perfil, valores e disponibilidade",
  "Adicione documentos, certificações e referências",
  "Receba solicitações e converse com famílias",
  "Registre a rotina de cuidados e receba avaliações",
];

const checklist = [
  "Foto profissional e bio clara",
  "Especialidades, modalidades e experiência",
  "Valores por hora, diária ou plantão",
  "Disponibilidade e região de atendimento",
  "Documentos, certificações e referências",
  "Resposta rápida para solicitações de famílias",
];

const faqs = [
  {
    question: "O cadastro de profissionais é gratuito?",
    answer:
      "Sim. O cuidador cria o perfil gratuitamente e a ditti não cobra comissão sobre os atendimentos combinados diretamente com as famílias.",
  },
  {
    question: "Sou obrigado a aceitar toda solicitação?",
    answer:
      "Não. Você pode conversar com a família, entender a necessidade, avaliar agenda, valores e condições antes de aceitar ou recusar uma solicitação.",
  },
  {
    question: "A ditti define meus valores ou meu vínculo de trabalho?",
    answer:
      "Não. Você informa valores de referência e negocia diretamente com a família. A ditti organiza a conexão, mas não intermedia contrato, vínculo ou pagamento do atendimento.",
  },
  {
    question: "Por que completar documentos e referências?",
    answer:
      "Essas informações aumentam a confiança da família na hora de comparar profissionais e podem tornar seu perfil mais forte dentro da busca.",
  },
];

const CaregiversLanding = () => {
  const navigate = useNavigate();
  const goToOnboarding = () => navigate("/onboarding?type=caregiver");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <section className="relative min-h-[92dvh] flex items-center overflow-hidden pt-20">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${caregiversImage})` }}
          />
          <div className="absolute inset-0 bg-foreground/60" />
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/80 via-foreground/45 to-primary/35" />
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background to-transparent" />

          <div className="container mx-auto px-6 md:px-10 relative">
            <div className="max-w-2xl text-primary-foreground">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 tracking-tight">
                Crie seu perfil gratuito e seja encontrado por famílias da sua região
              </h1>
              <p className="text-sm md:text-base text-primary-foreground/85 mb-7 max-w-xl leading-relaxed">
                A ditti ajuda profissionais de cuidado a apresentar experiência, documentos,
                referências, disponibilidade e valores em um perfil claro. Você conversa com a
                família antes de aceitar solicitações e não paga comissão sobre atendimentos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={goToOnboarding}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  Criar perfil grátis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("como-funciona-cuidador")?.scrollIntoView({ behavior: "smooth" })}
                  className="bg-white/15 hover:bg-white/25 text-white border-white/45 font-semibold px-6 h-12 rounded-xl backdrop-blur-sm"
                >
                  Ver como funciona
                </Button>
              </div>
              <p className="text-xs text-primary-foreground/65 mt-4">
                Cadastro gratuito. Negociação direta com a família. Sem comissão sobre seus ganhos.
              </p>
            </div>
          </div>
        </section>

        <section id="beneficios-cuidador" className="py-14 md:py-18 bg-background">
          <div className="container mx-auto px-6 md:px-10">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-3 tracking-tight">
                Um perfil feito para transmitir confiança
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Famílias precisam comparar informações com calma. Quanto mais completo for seu
                  perfil, mais fácil fica mostrar profissionalismo antes da primeira conversa.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 max-w-6xl mx-auto">
              {benefits.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="bg-card rounded-xl border border-border/40 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 p-5"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona-cuidador" className="py-14 md:py-18 bg-echo-blue/60 relative">
          <div className="container mx-auto px-6 md:px-10">
            <div className="grid lg:grid-cols-[1fr_0.9fr] gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
              <div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-4 tracking-tight">
                  Como o fluxo funciona para profissionais
                </h2>
                <p className="text-sm md:text-base text-muted-foreground mb-6 leading-relaxed">
                  A ditti organiza sua apresentação e o contato inicial. A decisão de aceitar
                  atendimento, negociar valores e combinar detalhes continua sendo sua.
                </p>
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                        {index + 1}
                      </div>
                      <p className="text-sm md:text-base text-foreground pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border/40 shadow-card overflow-hidden">
                <img
                  src={familiesImage}
                  alt="Profissional conversando com família sobre cuidado"
                  className="w-full h-56 md:h-72 object-cover"
                />
                <div className="p-5 md:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Chat antes de aceitar</h3>
                      <p className="text-xs text-muted-foreground">Alinhe rotina, horários e expectativas.</p>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    Quando uma família envia uma solicitação, você pode conversar, entender o
                    contexto do idoso e decidir se aquele atendimento combina com sua agenda e
                    experiência.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="perfil-forte" className="py-14 md:py-18 bg-background">
          <div className="container mx-auto px-6 md:px-10">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start max-w-6xl mx-auto">
              <div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-4 tracking-tight">
                  O que deixa seu perfil mais forte
                </h2>
                <p className="text-sm md:text-base text-muted-foreground mb-6 leading-relaxed">
                  Use este checklist como guia para aparecer com mais clareza para famílias que
                  estão comparando profissionais.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {checklist.map((item) => (
                    <div key={item} className="flex items-start gap-2 rounded-xl bg-muted/50 border border-border/40 p-3">
                      <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-xs md:text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-background border border-border/40 p-5 md:p-6 shadow-card">
                <div className="grid gap-3">
                  {[
                    { icon: FileText, title: "Documentos e certificações", text: "Organize informações que ajudam a família a avaliar seu perfil." },
                    { icon: CalendarDays, title: "Disponibilidade e valores", text: "Informe formatos de atendimento, região e valores de referência." },
                    { icon: ShieldCheck, title: "Referências profissionais", text: "Mostre histórico e experiências que reforçam confiança." },
                    { icon: Sparkles, title: "Avaliações e destaque", text: "Reviews positivos ajudam famílias futuras a decidir com mais segurança." },
                  ].map(({ icon: Icon, title, text }) => (
                    <div key={title} className="flex gap-3 rounded-xl bg-card/80 border border-border/40 p-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-18 bg-cta-gradient relative overflow-hidden">
          <div className="absolute inset-0 bg-foreground/5" />
          <div className="container mx-auto px-6 md:px-10 relative">
            <div className="max-w-3xl mx-auto text-center text-primary-foreground">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 tracking-tight">
                Pronto para criar um perfil que trabalha a favor da sua reputação?
              </h2>
              <p className="text-sm md:text-base text-primary-foreground/85 mb-7 leading-relaxed">
                Comece grátis, complete suas informações e seja encontrado por famílias que
                procuram cuidado com mais transparência.
              </p>
              <Button
                onClick={goToOnboarding}
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 h-12 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
              >
                Criar perfil grátis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        <section id="duvidas-cuidadores" className="py-12 md:py-16 bg-background">
          <div className="container mx-auto px-6 md:px-10">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-2 tracking-tight">
                  Dúvidas de profissionais
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  O essencial para entender como a ditti funciona para cuidadores.
                </p>
              </div>
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <article key={faq.question} className="bg-card rounded-xl px-5 py-4 border border-border/30 shadow-card">
                    <h3 className="text-sm font-semibold text-foreground mb-2">{faq.question}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CaregiversLanding;
