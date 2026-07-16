import {
  ArrowRight,
  BadgeCheck,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Star,
  UserCheck,
} from 'lucide-react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { getLocalCarePageByPath } from '@/data/localCarePages'
import { useSeo } from '@/hooks/useSeo'

const trustItems = [
  {
    icon: UserCheck,
    title: 'Experiência',
    text: 'Veja histórico profissional, tipos de cuidado realizados e rotinas em que o cuidador tem mais segurança.',
  },
  {
    icon: Star,
    title: 'Referências',
    text: 'Considere referências profissionais e sinais de confiança antes de iniciar a conversa.',
  },
  {
    icon: ShieldCheck,
    title: 'Antecedentes',
    text: 'Analise antecedentes quando o profissional disponibiliza essa informação no perfil.',
  },
  {
    icon: FileText,
    title: 'Documentos',
    text: 'Compare documentos, certificações e dados do perfil junto com disponibilidade e valores de referência.',
  },
]

const decisionSteps = [
  'Descreva a rotina do idoso, horários críticos e tipo de apoio esperado.',
  'Busque cuidadores pelo CEP e confira se atendem sua região com regularidade.',
  'Compare experiência, referências, antecedentes, documentos, disponibilidade e valores.',
  'Converse com o profissional antes de combinar o primeiro atendimento.',
]

const LocalCarePage = () => {
  const { pathname } = useLocation()
  const page = getLocalCarePageByPath(pathname)

  useSeo({
    title: page?.title ?? 'Cuidador de idosos | iCuide',
    description:
      page?.description ??
      'Encontre cuidadores de idosos pela iCuide e compare perfis com experiência, referências e disponibilidade.',
  })

  if (!page) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        <section className="bg-echo-blue py-12 md:py-16">
          <div className="container mx-auto px-6 md:px-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-primary">
                  <MapPin className="h-4 w-4" />
                  {page.areaLabel}
                </div>
                <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
                  {page.h1}
                </h1>
                <p className="mb-4 text-base leading-relaxed text-muted-foreground md:text-lg">{page.intro}</p>
                <p className="mb-7 text-sm leading-relaxed text-foreground md:text-base">{page.proof}</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="h-12 rounded-xl bg-accent px-6 font-semibold text-accent-foreground hover:bg-accent/90">
                    <Link to="/onboarding?type=family">
                      Buscar cuidadores pelo CEP
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-12 rounded-xl px-6 font-semibold">
                    <Link to="/blog/quanto-custa-cuidador-de-idosos">Entender valores</Link>
                  </Button>
                </div>
              </div>

              <aside className="rounded-xl border border-border/40 bg-card p-5 shadow-card">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Busca com intenção real</h2>
                    <p className="text-xs text-muted-foreground">Termos usados por famílias prontas para comparar.</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{page.searchIntent}</p>
              </aside>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-14">
          <div className="container mx-auto px-6 md:px-10">
            <div className="mb-8 max-w-3xl">
              <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">O que você consegue avaliar na iCuide</h2>
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                A escolha fica mais objetiva quando a família consegue ver informações organizadas antes da conversa.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {trustItems.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-xl border border-border/40 bg-card p-5 shadow-card">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/35 py-12 md:py-14">
          <div className="container mx-auto px-6 md:px-10">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className="mb-4 text-2xl font-bold tracking-tight text-foreground">Formatos de atendimento procurados</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {page.formats.map((format) => (
                    <div key={format} className="flex items-start gap-3 rounded-lg border border-border/40 bg-background p-3">
                      <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                      <span className="text-sm text-foreground">{format}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="mb-4 text-2xl font-bold tracking-tight text-foreground">Regiões e bairros</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {page.neighborhoods.map((neighborhood) => (
                    <div key={neighborhood} className="flex items-start gap-3 rounded-lg border border-border/40 bg-background p-3">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span className="text-sm text-foreground">{neighborhood}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-14">
          <div className="container mx-auto px-6 md:px-10">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">Como escolher com mais segurança</h2>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground md:text-base">
                  Preço importa, mas não deve ser o único critério. Use a conversa para confirmar se o perfil combina com a rotina do idoso.
                </p>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link to="/blog/perguntas-antes-de-contratar-cuidador">
                    Ver perguntas para entrevista
                    <MessageCircle className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="space-y-3">
                {[...decisionSteps, ...page.localNotes].map((step) => (
                  <div key={step} className="flex items-start gap-3 rounded-xl border border-border/40 bg-card p-4 shadow-card">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                    <p className="text-sm leading-relaxed text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-echo-blue/60 py-12 md:py-14">
          <div className="container mx-auto px-6 md:px-10">
            <div className="mx-auto max-w-3xl">
              <div className="mb-8 text-center">
                <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold text-primary">
                  <BadgeCheck className="h-4 w-4" />
                  Perguntas frequentes
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Dúvidas antes de contratar</h2>
              </div>
              <div className="space-y-3">
                {page.faqs.map((faq) => (
                  <article key={faq.question} className="rounded-xl border border-border/40 bg-card p-5 shadow-card">
                    <h3 className="mb-2 text-base font-semibold text-foreground">{faq.question}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-cta-gradient py-12 md:py-16">
          <div className="container mx-auto px-6 md:px-10">
            <div className="mx-auto max-w-3xl text-center text-primary-foreground">
              <h2 className="mb-4 text-2xl font-bold tracking-tight md:text-3xl">
                Compare cuidadores com mais informação antes de decidir
              </h2>
              <p className="mb-7 text-sm leading-relaxed text-primary-foreground/85 md:text-base">
                Busque pelo CEP, veja perfis com experiência, referências e antecedentes quando disponíveis, e converse diretamente com profissionais da região.
              </p>
              <Button asChild size="lg" className="h-12 rounded-xl bg-accent px-8 font-semibold text-accent-foreground hover:bg-accent/90">
                <Link to="/onboarding?type=family">
                  Buscar cuidadores pelo CEP
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default LocalCarePage
