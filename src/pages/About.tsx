import { ArrowRight, HeartHandshake, ShieldCheck, Users } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/hooks/useSeo";

const commitments = [
  {
    icon: Users,
    title: "Conexão com autonomia",
    description:
      "Famílias e profissionais conversam diretamente para alinhar rotina, valores, disponibilidade e expectativas antes de qualquer decisão.",
  },
  {
    icon: ShieldCheck,
    title: "Informação para decidir melhor",
    description:
      "A plataforma organiza perfis, referências, documentos e dados de disponibilidade para deixar a comparação mais clara.",
  },
  {
    icon: HeartHandshake,
    title: "Cuidado tratado com responsabilidade",
    description:
      "A icuide não substitui a avaliação da família, mas ajuda a reduzir ruído e insegurança na busca por cuidado domiciliar.",
  },
];

const About = () => {
  useSeo({
    title: "Sobre a icuide | Cuidadores de idosos e famílias",
    description:
      "Conheça a icuide, uma plataforma criada para aproximar famílias e profissionais de cuidado com transparência, autonomia e informação.",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        <section className="bg-echo-blue py-12 md:py-16">
          <div className="container mx-auto px-6 md:px-10">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs font-semibold text-primary">Sobre a icuide</p>
              <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
                Aproximamos famílias e cuidadores de idosos de forma simples e transparente
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                A icuide nasceu para ajudar famílias a encontrar profissionais de cuidado e para
                ajudar cuidadores a apresentarem sua experiência de forma organizada, transparente e
                fácil de comparar.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-6 md:px-10">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
              <div>
                <h2 className="mb-4 text-2xl font-bold tracking-tight text-foreground">
                  O que a plataforma faz
                </h2>
                <div className="space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                  <p>
                    A icuide facilita a conexão inicial entre famílias que precisam de apoio no
                    cuidado com idosos e profissionais que atuam nessa rotina.
                  </p>
                  <p>
                    A contratação, o vínculo, a negociação de valores e o pagamento do atendimento
                    são combinados diretamente entre família e profissional. Nosso papel é organizar
                    informação, acesso e comunicação para que a decisão seja mais consciente.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
                {commitments.map(({ icon: Icon, title, description }) => (
                  <article key={title} className="rounded-xl border border-border/40 bg-card p-5 shadow-card">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground md:text-sm">{description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-echo-primary-soft py-12 md:py-16">
          <div className="container mx-auto px-6 md:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">
                Precisa encontrar ou oferecer cuidado?
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground md:text-base">
                Famílias podem buscar profissionais por região. Cuidadores podem criar um perfil
                gratuito para apresentar experiência, disponibilidade e referências.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild className="rounded-lg bg-accent text-accent-foreground hover:bg-accent/90">
                  <a href="/onboarding?type=family">
                    Buscar cuidadores
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="rounded-lg">
                  <a href="/para-cuidadores">Criar perfil de cuidador</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
