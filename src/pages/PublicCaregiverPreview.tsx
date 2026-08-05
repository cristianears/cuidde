import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Lock, MapPin, Search } from 'lucide-react'
import BrandMark from '@/components/shared/BrandMark'
import CaregiverCard from '@/components/shared/CaregiverCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cleanCep, formatCep } from '@/lib/formatters'
import { geocodeAddress } from '@/lib/geocode'
import { getLoginRegisterTarget } from '@/lib/landing-cep-flow'
import { getLandingCepFromSearchParams, type SearchCoordinates } from '@/lib/search-location'
import { trackEvent, withBlogAttribution } from '@/lib/analytics'
import { DEFAULT_RADIUS_KM } from '@/lib/constants'
import { usePublicCaregiverPreviews } from '@/hooks/usePublicCaregiverPreviews'

function getFamilySearchRedirect(cepDigits: string) {
  const params = new URLSearchParams()
  params.set('cep', cepDigits)
  return `/family/search?${params.toString()}`
}

const PublicCaregiverPreview = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialCep = useMemo(() => getLandingCepFromSearchParams(searchParams) ?? '', [searchParams])
  const [cepRaw, setCepRaw] = useState(initialCep)
  const [submittedCep, setSubmittedCep] = useState(initialCep)
  const [coordinates, setCoordinates] = useState<SearchCoordinates | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [touched, setTouched] = useState(false)
  const [geocodeFailed, setGeocodeFailed] = useState(false)
  const cepDigits = cleanCep(cepRaw)
  const submittedCepDigits = cleanCep(submittedCep)
  const isCepValid = cepDigits.length === 8
  const registerTarget = getLoginRegisterTarget({
    type: 'family',
    cep: submittedCepDigits || cepDigits || null,
    redirect: submittedCepDigits ? getFamilySearchRedirect(submittedCepDigits) : '/family/search',
  })
  const loginTarget = (() => {
    const params = new URLSearchParams()
    params.set('redirect', '/family/search')
    params.set('type', 'family')
    if (submittedCepDigits) params.set('cep', submittedCepDigits)
    return `/login?${params.toString()}`
  })()

  useEffect(() => {
    setCepRaw(initialCep)
    setSubmittedCep(initialCep)
  }, [initialCep])

  useEffect(() => {
    setCoordinates(null)
    setGeocodeFailed(false)
    if (submittedCepDigits.length !== 8) return

    let cancelled = false
    setIsGeocoding(true)
    ;(async () => {
      const geo = await geocodeAddress({ cep: submittedCepDigits })
      if (cancelled) return
      setCoordinates(geo)
      setGeocodeFailed(!geo)
    })().finally(() => {
      if (!cancelled) setIsGeocoding(false)
    })

    return () => { cancelled = true }
  }, [submittedCepDigits])

  const { data: caregivers = [], isLoading: isLoadingCaregivers } = usePublicCaregiverPreviews({
    lat: coordinates?.lat,
    lng: coordinates?.lng,
    radiusKm: DEFAULT_RADIUS_KM,
    limit: 5,
  })

  useEffect(() => {
    if (!submittedCepDigits || caregivers.length === 0) return

    trackEvent('view_caregiver_preview', withBlogAttribution({
      cep_prefix: submittedCepDigits.slice(0, 5),
      preview_count: caregivers.length,
      radius_km: DEFAULT_RADIUS_KM,
    }))
  }, [caregivers.length, submittedCepDigits])

  const isLoading = isGeocoding || isLoadingCaregivers
  const hasSearched = submittedCepDigits.length === 8

  const submitSearch = () => {
    setTouched(true)
    if (!isCepValid) return
    setSubmittedCep(cepDigits)
    const params = new URLSearchParams()
    params.set('cep', cepDigits)
    navigate(`/buscar-cuidadores?${params.toString()}`, { replace: true })
    trackEvent('search_by_cep', withBlogAttribution({
      cep_prefix: cepDigits.slice(0, 5),
      destination: '/buscar-cuidadores',
      user_role: 'anonymous',
      is_authenticated: false,
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitSearch()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    submitSearch()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Voltar para a página inicial">
            <BrandMark size={36} />
          </Link>
          <Button asChild variant="ghost" size="sm" className="h-9">
            <Link to={loginTarget}>Entrar</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-5 sm:px-6 lg:py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 gap-2 text-muted-foreground">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>

        <section className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-normal text-primary">Prévia gratuita</p>
            <h1 className="max-w-3xl text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
              Veja cuidadores próximos antes de criar sua conta
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Mostramos uma prévia limitada dos profissionais na região. Para ver perfis completos, documentos e conversar, crie sua conta grátis.
            </p>
          </div>

          <form className="rounded-lg border border-border bg-card p-3 shadow-sm" onSubmit={handleSubmit}>
            <label className="mb-2 block text-xs font-medium text-foreground" htmlFor="public-preview-cep">
              Buscar por CEP
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="public-preview-cep"
                inputMode="numeric"
                autoComplete="postal-code"
                value={formatCep(cepDigits)}
                onChange={(event) => {
                  setTouched(true)
                  setCepRaw(event.target.value)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Digite seu CEP"
                className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-28 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <Button type="submit" size="sm" className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-md px-3 text-xs">
                Buscar
              </Button>
            </div>
            {touched && !isCepValid && (
              <p className="mt-2 text-xs text-muted-foreground">Informe um CEP válido com 8 números.</p>
            )}
          </form>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Profissionais encontrados</h2>
                <p className="text-sm text-muted-foreground">
                  {isLoading
                    ? 'Buscando opções próximas...'
                    : hasSearched
                      ? `${caregivers.length} prévia${caregivers.length !== 1 ? 's' : ''} disponível${caregivers.length !== 1 ? 'is' : ''}`
                      : 'Digite um CEP para ver opções próximas'}
                </p>
              </div>
              {hasSearched && (
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <MapPin className="h-3.5 w-3.5" />
                  Raio inicial de {DEFAULT_RADIUS_KM} km
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <Card key={item} className="h-40 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : geocodeFailed ? (
              <Card className="rounded-lg p-8 text-center">
                <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <h3 className="mb-1 text-base font-semibold text-foreground">Não conseguimos localizar esse CEP</h3>
                <p className="text-sm text-muted-foreground">Confira os números e tente novamente.</p>
              </Card>
            ) : caregivers.length > 0 ? (
              <div className="space-y-3">
                {caregivers.map((caregiver) => (
                  <CaregiverCard
                    key={caregiver.id}
                    caregiver={caregiver}
                    showFavorite={false}
                    ctaLabel="Criar conta para ver perfil"
                    footerNote="Prévia limitada. Chat, documentos e perfil completo ficam disponíveis após cadastro."
                    onContact={() => navigate(registerTarget)}
                    hasDocsSent={caregiver.has_rg_cnh}
                    hasAntecedentes={caregiver.has_antecedentes}
                    hasCertificados={caregiver.has_certificado}
                    hasReferencias={caregiver.has_references}
                    distanceKm={caregiver.distance_km}
                    photoPosition="center"
                  />
                ))}
              </div>
            ) : (
              <Card className="rounded-lg p-8 text-center">
                <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <h3 className="mb-1 text-base font-semibold text-foreground">
                  {hasSearched ? 'Nenhum cuidador encontrado nesse raio' : 'Comece pelo CEP'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {hasSearched
                    ? 'Crie sua conta grátis para ampliar a busca e salvar sua necessidade de cuidado.'
                    : 'A busca por CEP ajuda a mostrar profissionais próximos à sua família.'}
                </p>
              </Card>
            )}
          </div>

          <aside className="lg:sticky lg:top-24">
            <Card className="rounded-lg border-primary/20 bg-primary/5 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Desbloqueie a busca completa</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Com a conta grátis, você continua a busca pelo CEP, compara mais detalhes e pode avançar para conversar com profissionais.
              </p>
              <div className="mt-4 space-y-2 text-sm text-foreground">
                <p className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Perfis completos</p>
                <p className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Documentos e referências quando disponíveis</p>
                <p className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Chat direto pela plataforma</p>
              </div>
              <Button asChild className="mt-5 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to={registerTarget}>Criar conta grátis</Link>
              </Button>
              <Button asChild variant="ghost" className="mt-2 w-full">
                <Link to={loginTarget}>Já tenho conta</Link>
              </Button>
            </Card>
          </aside>
        </section>
      </main>
    </div>
  )
}

export default PublicCaregiverPreview
