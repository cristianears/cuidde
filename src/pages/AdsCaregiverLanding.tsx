import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle,
  CircleDollarSign,
  Clock3,
  Eye,
  FileSearch,
  Handshake,
  Heart,
  ListChecks,
  LogIn,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import Footer from '@/components/Footer'
import BrandMark from '@/components/shared/BrandMark'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import heroBg from '@/assets/hero-bg.jpg'
import { trackEvent, withBlogAttribution } from '@/lib/analytics'
import { cleanCep, formatCep } from '@/lib/formatters'
import { useSeo } from '@/hooks/useSeo'
import { cn } from '@/lib/utils'

const benefitFacts = [
  {
    icon: MapPin,
    title: 'Proximidade real',
    text: 'Encontre profissionais que atendem perto de você, em São José dos Campos e Jacareí.',
  },
  {
    icon: Stethoscope,
    title: 'Experiência para cada rotina',
    text: 'Veja informações sobre cuidado com Alzheimer, pós-operatório, mobilidade reduzida e companhia.',
  },
  {
    icon: CalendarDays,
    title: 'Disponibilidades informadas',
    text: 'Conheça os dias e horários que cada cuidador informa poder atender.',
  },
  {
    icon: FileSearch,
    title: 'Mais clareza para decidir',
    text: 'Explore qualificações e regiões atendidas antes de decidir o próximo passo.',
  },
]

const reasons = [
  {
    icon: Heart,
    title: 'Cuidado humano para cada necessidade',
    text: 'Perfis com informações sobre rotinas de medicação, higiene, Alzheimer, pessoas acamadas e apoio após a internação.',
  },
  {
    icon: Eye,
    title: 'Autonomia e clareza',
    text: 'Você olha os perfis, as experiências informadas e as disponibilidades no seu tempo, sem pressão.',
  },
  {
    icon: Handshake,
    title: 'Relação direta com o profissional',
    text: 'Depois de liberar o acesso, a família conversa diretamente com o cuidador escolhido para combinar o cuidado.',
  },
  {
    icon: Clock3,
    title: 'Ajuda quando você precisa',
    text: 'Comece vendo quem atende sua região. Sem formulários longos antes de conhecer os perfis.',
  },
]

const steps = [
  {
    icon: Search,
    title: 'Busque pelo CEP',
    text: 'Informe sua localização para ver cuidadores que atendem perto da sua casa.',
  },
  {
    icon: Eye,
    title: 'Veja a prévia gratuita',
    text: 'Explore especialidades, regiões atendidas e disponibilidades sem pagar nada.',
  },
  {
    icon: ListChecks,
    title: 'Crie sua conta grátis',
    text: 'Crie uma conta para continuar explorando os perfis e guardar seus favoritos.',
  },
  {
    icon: CircleDollarSign,
    title: 'Conecte-se diretamente',
    text: 'Libere o plano quando quiser acessar os contatos e conversar com o cuidador ideal.',
  },
]

function LandingCard({
  icon: Icon,
  title,
  text,
  iconClassName,
}: {
  icon: typeof Heart
  title: string
  text: string
  iconClassName: string
}) {
  return (
    <article className="group h-full rounded-xl border border-border/50 bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg sm:p-6">
      <div className={cn('mb-5 flex h-11 w-11 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105', iconClassName)}>
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </div>
      <h3 className="text-lg font-bold leading-snug text-foreground">{title}</h3>
      <p className="mt-2 text-[15px] leading-6 text-muted-foreground">{text}</p>
    </article>
  )
}

export default function AdsCaregiverLanding() {
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const [cepDigits, setCepDigits] = useState('')
  const [touched, setTouched] = useState(false)
  const isCepValid = cepDigits.length === 8
  const showCepError = touched && !isCepValid

  useSeo({
    title: 'Cuidadores de idosos em São José dos Campos e Jacareí | iCuide',
    description: 'Busque cuidadores de idosos perto de você e veja uma prévia gratuita dos perfis disponíveis na iCuide.',
  })

  function goToLogin() {
    navigate('/login')
  }

  function goToAccountCreation() {
    navigate('/onboarding?type=family')
  }

  function goToCepSearch() {
    const cepInput = document.getElementById('landing-cep') as HTMLInputElement | null
    if (!cepInput) return

    trackEvent('cta_click', withBlogAttribution({
      cta_name: 'landing_final_cep_search',
      user_role: role ?? 'anonymous',
      is_authenticated: Boolean(user),
    }))
    cepInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(() => cepInput.focus({ preventScroll: true }), 450)
  }

  function submitCepSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched(true)
    if (!isCepValid) return

    const destination = '/buscar-cuidadores?cep=' + cepDigits
    const analyticsParams = withBlogAttribution({
      cep_prefix: cepDigits.slice(0, 5),
      destination,
      user_role: role ?? 'anonymous',
      is_authenticated: Boolean(user),
    })

    trackEvent('begin_lead', { ...analyticsParams, lead_step: 'cep_search' })
    trackEvent('search_by_cep', analyticsParams)
    navigate(destination)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="container flex min-h-16 items-center justify-between gap-2 px-2.5 py-3 sm:min-h-[76px] sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Ir para a página inicial da iCuide"
            className="shrink-0 rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            <BrandMark size={36} wordmarkClassName="text-white max-[340px]:hidden" />
          </button>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={goToLogin}
              title="Entrar"
              className="h-10 px-2.5 text-sm font-semibold text-white hover:bg-white/12 hover:text-white sm:px-4"
            >
              <LogIn className="hidden h-4 w-4 max-[340px]:block" aria-hidden="true" />
              <span className="max-[340px]:sr-only">Entrar</span>
            </Button>
            <Button
              type="button"
              onClick={goToAccountCreation}
              className="h-10 bg-accent px-3 text-xs font-bold text-accent-foreground shadow-md shadow-black/15 hover:bg-accent/90 sm:px-4 sm:text-sm"
            >
              Criar conta grátis
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate flex min-h-[660px] items-center overflow-hidden bg-foreground pb-28 pt-28 sm:min-h-[650px] sm:pb-24 sm:pt-28">
          <div
            className="absolute inset-0 bg-cover bg-[position:62%_center] sm:bg-center"
            style={{ backgroundImage: 'url(' + heroBg + ')' }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/45 to-foreground/25" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/20 to-primary/20" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 z-10 h-44 bg-gradient-to-t from-background via-background/95 to-transparent sm:h-36 sm:via-background/75" aria-hidden="true" />

          <div className="container relative z-20 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl pt-3 text-center sm:pt-4">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white/95 backdrop-blur-sm">
                <MapPin className="h-4 w-4 text-accent" />
                São José dos Campos e Jacareí
              </p>
              <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-[1.08] tracking-normal text-white sm:text-5xl lg:text-[56px]">
                Encontre cuidadores de idosos a poucos minutos da sua casa
              </h1>

              <form noValidate onSubmit={submitCepSearch} className="mx-auto mt-7 max-w-xl">
                <label htmlFor="landing-cep" className="sr-only">Digite seu CEP para buscar cuidadores</label>
                <div className="rounded-xl bg-white p-2 shadow-xl shadow-black/25 sm:flex sm:items-center sm:p-2">
                  <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 sm:py-0">
                    <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <input
                      id="landing-cep"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      value={formatCep(cepDigits)}
                      onChange={(event) => setCepDigits(cleanCep(event.target.value))}
                      onBlur={() => setTouched(true)}
                      placeholder="Digite seu CEP"
                      className="h-11 w-full min-w-0 bg-transparent text-base font-medium text-foreground outline-none placeholder:text-muted-foreground"
                      aria-invalid={showCepError}
                      aria-describedby={showCepError ? 'landing-cep-error' : 'landing-cep-note'}
                    />
                  </div>
                  <Button type="submit" className="mt-1 h-12 w-full gap-2 bg-accent px-5 text-sm font-bold text-accent-foreground hover:bg-accent/90 sm:mt-0 sm:h-11 sm:w-auto sm:text-base">
                    Ver cuidadores próximos
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                {showCepError ? (
                  <p id="landing-cep-error" className="mt-2 text-center text-sm font-medium text-white">
                    Digite os 8 números do seu CEP para continuar.
                  </p>
                ) : (
                  <p id="landing-cep-note" className="mt-3 text-center text-sm leading-5 text-white/90">
                    Usamos seu CEP somente para mostrar profissionais que atendem sua região.
                  </p>
                )}
              </form>

              <ul className="mx-auto mt-6 grid max-w-2xl gap-2 text-sm font-medium text-white/95 sm:grid-cols-3 sm:gap-4">
                {['Veja uma prévia grátis', 'Avaliações de outras famílias', 'Você decide quando avançar'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="relative py-14 sm:py-20">
          <div className="container px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">Para a sua família</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-foreground sm:text-4xl">Cuidar de quem amamos não precisa ser uma jornada solitária</h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
                Sabemos como a rotina pode apertar: uma alta hospitalar inesperada, o avanço de uma limitação ou o cansaço de tentar dar conta de tudo. Na iCuide, você encontra profissionais qualificados e avaliados por outras famílias para começar sua busca com mais clareza e tranquilidade.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {benefitFacts.map((item) => (
                <LandingCard key={item.title} {...item} iconClassName="bg-primary/10 text-primary" />
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border/40 bg-muted/45 py-14 sm:py-20">
          <div className="container px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">Uma escolha no seu tempo</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-foreground sm:text-4xl">Por que as famílias escolhem a iCuide?</h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">A plataforma organiza as informações para que você possa comparar opções com calma e tomar uma decisão mais segura para quem você ama.</p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {reasons.map((item) => (
                <LandingCard key={item.title} {...item} iconClassName="bg-accent/12 text-accent" />
              ))}
            </div>

            <aside className="mt-7 flex gap-4 rounded-xl border border-primary/15 bg-card p-5 shadow-card sm:items-center sm:p-6" aria-label="Informação sobre contratação">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Handshake className="h-5 w-5" />
              </div>
              <p className="text-[15px] leading-6 text-muted-foreground sm:text-base">
                <strong className="text-foreground">Contratação e pagamentos são combinados diretamente entre a família e o cuidador.</strong> A iCuide ajuda você a encontrar e conhecer os profissionais; a decisão e os combinados ficam sempre com vocês.
              </p>
            </aside>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="container px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">Sem complicação</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-foreground sm:text-4xl">Clareza do início ao fim: como funciona</h2>
            </div>

            <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <li key={step.title} className="relative border-l-2 border-primary/20 pl-5 sm:border-l-0 sm:border-t-2 sm:px-1 sm:pt-5">
                    <span className="absolute -left-3 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground sm:-left-0.5 sm:-top-3">{index + 1}</span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-[15px] leading-6 text-muted-foreground">{step.text}</p>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        <section className="bg-primary py-14 text-primary-foreground sm:py-20">
          <div className="container px-4 text-center sm:px-6 lg:px-8">
            <Sparkles className="mx-auto h-7 w-7 text-accent-foreground" />
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">Dê o primeiro passo para trazer mais tranquilidade para sua casa</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-primary-foreground/90 sm:text-lg">
              Não decida nada agora. Apenas veja quem são os profissionais disponíveis em São José dos Campos e Jacareí neste momento.
            </p>
            <Button type="button" onClick={goToCepSearch} className="mt-7 h-12 gap-2 bg-accent px-6 text-base font-bold text-accent-foreground shadow-lg shadow-primary-foreground/10 hover:bg-accent/90">
              Buscar cuidadores pelo CEP
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-primary-foreground/85">
              <ShieldCheck className="h-4 w-4" />
              Busca gratuita. Você avança somente quando se sentir seguro(a).
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
