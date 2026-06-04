import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  Users,
  User,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Mail,
  Lock,
  CheckCircle2,
  Eye,
  EyeOff,
  Circle,
  Phone,
} from 'lucide-react'
import BrandMark from '@/components/shared/BrandMark'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { signUpWithEmail, signInWithGoogle } from '@/lib/auth'
import { fetchAddressByCep } from '@/lib/viacep'
import { formatPhone } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import { geocodeAddress } from '@/lib/geocode'
import { useAuth } from '@/contexts/AuthContext'
import { queryKeys } from '@/lib/query-keys'
import { LEGAL_DOCUMENTS } from '@/lib/legal-documents'
import { queuePendingUserConsents, recordUserConsents } from '@/lib/user-consents'

type ProfileType = 'family' | 'caregiver' | null

interface FormData {
  profileType: ProfileType
  name: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  description: string
}

// Step IDs: 1=Início, 2=Perfil, 3=Dados (email only), 4=Telefone, 5=Endereço, 6=Informações, 7=Confirmação
const ALL_STEPS = [
  { id: 1, label: 'Início' },
  { id: 2, label: 'Perfil' },
  { id: 3, label: 'Dados' },
  { id: 4, label: 'Telefone' },
  { id: 5, label: 'Endereço' },
  { id: 7, label: 'Confirmação' },
]

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

const Onboarding = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const isGoogleFlow = searchParams.get('from') === 'google'

  // Google flow: skip step 3 (email/password) — shows steps [1,2,4,5,6,7]
  const steps = isGoogleFlow ? ALL_STEPS.filter((s) => s.id !== 3) : ALL_STEPS

  // Google flow starts at step 2 (step 1 already completed by choosing Google)
  const [currentStepId, setCurrentStepId] = useState(isGoogleFlow ? 2 : 1)
  const currentStepIndex = steps.findIndex((s) => s.id === currentStepId)

  const [formData, setFormData] = useState<FormData>({
    profileType: null,
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    description: '',
  })
  const [cepFilled, setCepFilled] = useState(false)
  const [isFetchingCep, setIsFetchingCep] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [hasAcceptedPlatformTerms, setHasAcceptedPlatformTerms] = useState(false)

  // Pre-fill from query params (?type, ?cep, ?email)
  useEffect(() => {
    const type = searchParams.get('type') as ProfileType
    const cepParam = searchParams.get('cep')
    const emailParam = searchParams.get('email')

    if (type === 'family' || type === 'caregiver') {
      setFormData((prev) => ({ ...prev, profileType: type }))
    }
    if (emailParam) {
      setFormData((prev) => ({ ...prev, email: emailParam }))
    }
    if (cepParam) {
      const clean = cepParam.replace(/\D/g, '')
      if (clean.length === 8) {
        setFormData((prev) => ({ ...prev, cep: cepParam }))
        fetchAddressByCep(clean).then((address) => {
          if (address) {
            setFormData((prev) => ({
              ...prev,
              street: address.street,
              neighborhood: address.neighborhood,
              city: address.city,
              state: address.state,
            }))
            setCepFilled(true)
          }
        })
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill name/email from Google OAuth metadata
  useEffect(() => {
    if (isGoogleFlow && user) {
      const name =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        ''
      setFormData((prev) => ({
        ...prev,
        name: prev.name || name,
        email: prev.email || user.email || '',
      }))
    }
  }, [isGoogleFlow, user])

  const hasMinLength = formData.password.length >= 8
  const hasUpperCase = /[A-Z]/.test(formData.password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  const passwordsMatch =
    formData.password === formData.confirmPassword && formData.confirmPassword.length > 0
  const isPasswordStrong = hasMinLength && hasUpperCase && hasSpecialChar

  const updateFormData = (field: keyof FormData, value: string | ProfileType) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // formatPhone importado de @/lib/formatters

  const phoneDigitsCount = formData.phone.replace(/\D/g, '').length
  const isPhoneValid = phoneDigitsCount === 11

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true)
    try {
      const typeParam = searchParams.get('type') as ProfileType
      const cepParam = searchParams.get('cep')
      localStorage.setItem('cuidde_pending_signup', 'true')
      // Preservar dados do onboarding para recuperar após callback OAuth
      localStorage.setItem('cuidde_onboarding_data', JSON.stringify({
        type: formData.profileType ?? typeParam,
        cep: formData.cep || cepParam || '',
      }))
      const { error } = await signInWithGoogle()
      if (error) {
        toast.error(error.message)
        setIsGoogleLoading(false)
      }
      // No error: Google OAuth redirect happens automatically
    } catch {
      setIsGoogleLoading(false)
    }
  }

  const handleCepChange = async (value: string) => {
    updateFormData('cep', value)
    const cleanCep = value.replace(/\D/g, '')
    if (cleanCep.length === 8) {
      setIsFetchingCep(true)
      try {
        const address = await fetchAddressByCep(cleanCep)
        if (address) {
          updateFormData('street', address.street)
          updateFormData('neighborhood', address.neighborhood)
          updateFormData('city', address.city)
          updateFormData('state', address.state)
          setCepFilled(true)
        } else {
          toast.error('CEP não encontrado. Preencha o endereço manualmente.')
          setCepFilled(false)
        }
      } finally {
        setIsFetchingCep(false)
      }
    } else {
      setCepFilled(false)
    }
  }

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepId(steps[currentStepIndex + 1].id)
    }
  }
  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepId(steps[currentStepIndex - 1].id)
    }
  }

  const saveProfileAddress = async (
    table: 'caregiver_profiles' | 'family_profiles',
    userId: string,
    addressData: Record<string, string | null>,
  ) => {
    const { data: updatedRows, error: updateError } = await supabase
      .from(table)
      .update(addressData)
      .eq('id', userId)
      .select('id')

    if (updateError) throw updateError
    if (updatedRows && updatedRows.length > 0) return updatedRows

    const { data: insertedRows, error: insertError } = await supabase
      .from(table)
      .insert({ id: userId, ...addressData })
      .select('id')

    if (insertError) throw insertError
    return insertedRows
  }

  const handleSubmit = async () => {
    if (!formData.profileType) return
    if (!hasAcceptedPlatformTerms) {
      toast.error('Para criar sua conta, aceite os termos e politicas da plataforma.')
      return
    }

    const buildSignupConsentPayload = (userId: string) => ({
      userId,
      documentKeys: ['terms', 'privacy', 'cookies'] as const,
      context: 'signup',
      metadata: {
        role: formData.profileType,
        flow: isGoogleFlow ? 'google' : 'email',
      },
    })

    setIsSubmitting(true)
    try {
      if (isGoogleFlow && user) {
        const googlePhoto =
          (user.user_metadata?.avatar_url as string | undefined) ||
          (user.user_metadata?.picture as string | undefined) ||
          null

        // Upsert garante criação do row caso não exista (novo usuário Google)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            role: formData.profileType,
            full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? formData.name,
            phone: formData.phone,
          }, { onConflict: 'id' })

        if (profileError) throw profileError

        const addressData = {
          cep: formData.cep,
          street: formData.street,
          number: formData.number,
          complement: formData.complement || null,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          photo_url: googlePhoto,
        }

        const table = formData.profileType === 'caregiver' ? 'caregiver_profiles' : 'family_profiles'
        const addressRows = await saveProfileAddress(table, user.id, addressData)
        if (!addressRows || addressRows.length === 0) {
          throw new Error('Nao foi possivel salvar seu endereco. Verifique as permissoes do perfil.')
        }

        // Geocodificar CEP — aguardar antes de navegar para garantir lat/lng no perfil
        if (formData.cep) {
          try {
            const geo = await geocodeAddress({ cep: formData.cep })
            if (geo) {
              const { error: geoError } = await supabase.from(table).update({ lat: geo.lat, lng: geo.lng }).eq('id', user.id)
              if (geoError) throw geoError
            }
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Nao foi possivel salvar a localizacao do CEP.')
            return
          }
        }

        await recordUserConsents(buildSignupConsentPayload(user.id))

        const profileQueryKey = formData.profileType === 'caregiver'
          ? queryKeys.caregiverProfile(user.id)
          : queryKeys.familyProfile(user.id)
        queryClient.removeQueries({ queryKey: profileQueryKey })

        if (formData.profileType === 'caregiver') {
          navigate('/caregiver', { replace: true })
        } else {
          navigate(formData.cep ? '/family/search' : '/family', { replace: true })
        }
      } else {
        const { data, error } = await signUpWithEmail(formData.email, formData.password, {
          role: formData.profileType,
          full_name: formData.name,
          phone: formData.phone,
        })
        if (error) {
          toast.error(error.message)
          return
        }
        if (data.user && data.user.identities?.length === 0) {
          toast.error('Este e-mail já está cadastrado. Tente fazer login.')
          return
        }

        if (data.user) {
          // Garantir que o profile row existe (caso trigger do Supabase não tenha criado)
          await supabase.from('profiles').upsert({
            id: data.user.id,
            role: formData.profileType,
            full_name: formData.name,
            phone: formData.phone,
          }, { onConflict: 'id' })

          // O upsert do endereço abaixo pode falhar silenciosamente se o RLS
          // do Supabase bloquear o acesso (sessão ainda não confirmada por email).
          // Como fallback, persistir no localStorage para ser gravado após login.
          const addressData = {
            cep: formData.cep,
            street: formData.street,
            number: formData.number,
            complement: formData.complement || null,
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state,
          }

          const table2 = formData.profileType === 'caregiver' ? 'caregiver_profiles' : 'family_profiles'
          const addressErr = await saveProfileAddress(table2, data.user.id, addressData)
            .then(() => null)
            .catch((error) => error as Error)

          if (addressErr) {
            // RLS bloqueou — salvar para aplicar após verificação de e-mail
            localStorage.setItem('cuidde_pending_address', JSON.stringify({
              userId: data.user.id,
              profileType: formData.profileType,
              table: table2,
              address: addressData,
            }))
          } else if (formData.cep) {
            try {
              const geo = await geocodeAddress({ cep: formData.cep })
              if (geo) {
                await supabase.from(table2).update({ lat: geo.lat, lng: geo.lng }).eq('id', data.user!.id)
              }
            } catch {
              // Falha na geocodificação não bloqueia o fluxo
            }
          }

          const consentPayload = buildSignupConsentPayload(data.user.id)
          try {
            await recordUserConsents(consentPayload)
          } catch {
            queuePendingUserConsents(consentPayload)
          }
        }

        navigate('/verify-email', { replace: true })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao finalizar cadastro. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStepId) {
      case 1:
        return true // Step 1 handled by its own buttons
      case 2:
        return formData.profileType !== null
      case 3:
        return !!(
          formData.name &&
          formData.email &&
          formData.password &&
          formData.confirmPassword &&
          isPasswordStrong &&
          passwordsMatch
        )
      case 4:
        return isPhoneValid
      case 5:
        return !!(formData.cep && formData.street && formData.number && formData.city && formData.state)

      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <Link to="/" className="w-fit">
            <BrandMark size={40} />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 max-w-xl">
        <Card className="shadow-card border-border/50 overflow-hidden">
          <CardContent className="p-5 sm:p-7">

            {/* ── STEP 1: MÉTODO DE CADASTRO ── */}
            {currentStepId === 1 && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">Cadastre-se grátis</h2>
                  <p className="text-muted-foreground mt-2">Escolha como quer criar sua conta</p>
                </div>
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 rounded-xl border-border/80 font-medium gap-3 text-base"
                    onClick={handleGoogleSignup}
                    disabled={isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}
                    Continuar com o Google
                  </Button>

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/60" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-3 text-muted-foreground">ou</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 rounded-xl border-border/80 font-medium text-base"
                    onClick={nextStep}
                  >
                    Continuar com e-mail
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 2: PERFIL (role selection) ── */}
            {currentStepId === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">Como você quer usar a icuide?</h2>
                  <p className="text-muted-foreground mt-2">Escolha o perfil que melhor representa você</p>
                </div>
                <div className="grid gap-4">
                  <button
                    onClick={() => updateFormData('profileType', 'family')}
                    className={cn(
                      'group p-6 rounded-2xl border-2 transition-all duration-200 text-left flex items-start gap-5',
                      formData.profileType === 'family'
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                        : 'border-border hover:border-primary/40 hover:bg-muted/30',
                    )}
                  >
                    <div
                      className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors',
                        formData.profileType === 'family' ? 'bg-primary/15' : 'bg-muted group-hover:bg-primary/10',
                      )}
                    >
                      <Users
                        className={cn(
                          'w-7 h-7 transition-colors',
                          formData.profileType === 'family'
                            ? 'text-primary'
                            : 'text-muted-foreground group-hover:text-primary',
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">Sou Família</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Estou buscando um profissional de saúde de confiança para cuidar do meu familiar
                      </p>
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex-shrink-0 ml-auto mt-1 transition-all',
                        formData.profileType === 'family' ? 'border-primary bg-primary' : 'border-border',
                      )}
                    >
                      {formData.profileType === 'family' && (
                        <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => updateFormData('profileType', 'caregiver')}
                    className={cn(
                      'group p-6 rounded-2xl border-2 transition-all duration-200 text-left flex items-start gap-5',
                      formData.profileType === 'caregiver'
                        ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10'
                        : 'border-border hover:border-accent/40 hover:bg-muted/30',
                    )}
                  >
                    <div
                      className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors',
                        formData.profileType === 'caregiver' ? 'bg-accent/15' : 'bg-muted group-hover:bg-accent/10',
                      )}
                    >
                      <User
                        className={cn(
                          'w-7 h-7 transition-colors',
                          formData.profileType === 'caregiver'
                            ? 'text-accent'
                            : 'text-muted-foreground group-hover:text-accent',
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">Sou Profissional de Saúde</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Sou cuidador, enfermeiro, fisioterapeuta ou outro profissional e quero criar meu perfil gratuito
                      </p>
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex-shrink-0 ml-auto mt-1 transition-all',
                        formData.profileType === 'caregiver' ? 'border-accent bg-accent' : 'border-border',
                      )}
                    >
                      {formData.profileType === 'caregiver' && (
                        <CheckCircle2 className="w-4 h-4 text-accent-foreground" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: DADOS PESSOAIS (email flow only) ── */}
            {currentStepId === 3 && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">Crie sua conta</h2>
                  <p className="text-muted-foreground mt-2">Preencha seus dados para começar</p>
                </div>
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="name" className="text-foreground font-medium">
                      Nome completo
                    </Label>
                    <Input
                      id="name"
                      placeholder="Digite seu nome completo"
                      value={formData.name}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      className="mt-2 h-12 rounded-xl border-border/80 focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-foreground font-medium">
                      E-mail
                    </Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        className="h-12 pl-11 rounded-xl border-border/80 focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password" className="text-foreground font-medium">
                        Senha
                      </Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => updateFormData('password', e.target.value)}
                          className="h-12 pl-11 pr-11 rounded-xl border-border/80 focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                        Confirmar senha
                      </Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                          className="h-12 pl-11 pr-11 rounded-xl border-border/80 focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                      {formData.confirmPassword && !passwordsMatch && (
                        <p className="text-xs text-destructive mt-1.5">As senhas não coincidem</p>
                      )}
                    </div>
                  </div>
                  {formData.password.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Requisitos da senha:</p>
                      {[
                        { check: hasMinLength, label: 'Mínimo 8 caracteres' },
                        { check: hasUpperCase, label: 'Pelo menos 1 letra maiúscula' },
                        { check: hasSpecialChar, label: 'Pelo menos 1 caractere especial (!@#$%...)' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          {item.check ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                          )}
                          <span className={item.check ? 'text-accent' : 'text-muted-foreground'}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-center text-sm text-muted-foreground pt-2">
                    Já tem conta?{' '}
                    <Link to="/login" className="text-primary font-medium hover:underline">
                      Fazer login
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 4: TELEFONE ── */}
            {currentStepId === 4 && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">Seu telefone</h2>
                  <p className="text-muted-foreground mt-2">Informe seu número para contato com famílias</p>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-foreground font-medium">
                    Telefone / WhatsApp
                  </Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', formatPhone(e.target.value))}
                      className="h-12 pl-11 rounded-xl border-border/80 focus:border-primary"
                    />
                  </div>
                  {formData.phone && !isPhoneValid && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Digite o DDD + 9 dígitos (ex: (11) 99999-9999)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 5: ENDEREÇO ── */}
            {currentStepId === 5 && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">Qual é o seu endereço?</h2>
                  <p className="text-muted-foreground mt-2">
                    {formData.profileType === 'family'
                      ? 'Usaremos para encontrar profissionais próximos a você'
                      : 'Usaremos para mostrar você a famílias na sua região'}
                  </p>
                </div>
                <div className="space-y-5">
                  {/* CEP + Rua */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="cep" className="text-foreground font-medium">
                        CEP
                      </Label>
                      <div className="relative mt-2">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="cep"
                          placeholder="00000-000"
                          value={formData.cep}
                          onChange={(e) => handleCepChange(e.target.value)}
                          disabled={isFetchingCep}
                          className="h-12 pl-11 rounded-xl border-border/80 focus:border-primary"
                        />
                      </div>
                      {isFetchingCep && (
                        <p className="text-xs text-muted-foreground mt-1.5">Buscando endereço...</p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="street" className="text-foreground font-medium">
                        Rua
                      </Label>
                      <Input
                        id="street"
                        placeholder="Nome da rua"
                        value={formData.street}
                        onChange={(e) => updateFormData('street', e.target.value)}
                        className={cn(
                          'mt-2 h-12 rounded-xl border-border/80 focus:border-primary transition-colors',
                          cepFilled && formData.street && 'bg-accent/5 border-accent/30',
                        )}
                      />
                    </div>
                  </div>

                  {/* Número + Complemento (same row) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="number" className="text-foreground font-medium">
                        Número
                      </Label>
                      <Input
                        id="number"
                        placeholder="123"
                        value={formData.number}
                        onChange={(e) => updateFormData('number', e.target.value)}
                        className="mt-2 h-12 rounded-xl border-border/80 focus:border-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="complement" className="text-foreground font-medium">
                        Complemento{' '}
                        <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
                      </Label>
                      <Input
                        id="complement"
                        placeholder="Apto 42, Bloco B..."
                        value={formData.complement}
                        onChange={(e) => updateFormData('complement', e.target.value)}
                        className="mt-2 h-12 rounded-xl border-border/80 focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Bairro */}
                  <div>
                    <Label htmlFor="neighborhood" className="text-foreground font-medium">
                      Bairro
                    </Label>
                    <Input
                      id="neighborhood"
                      placeholder="Bairro"
                      value={formData.neighborhood}
                      onChange={(e) => updateFormData('neighborhood', e.target.value)}
                      className={cn(
                        'mt-2 h-12 rounded-xl border-border/80 focus:border-primary transition-colors',
                        cepFilled && formData.neighborhood && 'bg-accent/5 border-accent/30',
                      )}
                    />
                  </div>

                  {/* Cidade + Estado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city" className="text-foreground font-medium">
                        Cidade
                      </Label>
                      <Input
                        id="city"
                        placeholder="Cidade"
                        value={formData.city}
                        onChange={(e) => updateFormData('city', e.target.value)}
                        className={cn(
                          'mt-2 h-12 rounded-xl border-border/80 focus:border-primary transition-colors',
                          cepFilled && formData.city && 'bg-accent/5 border-accent/30',
                        )}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state" className="text-foreground font-medium">
                        Estado
                      </Label>
                      <Input
                        id="state"
                        placeholder="UF"
                        value={formData.state}
                        onChange={(e) => updateFormData('state', e.target.value)}
                        className={cn(
                          'mt-2 h-12 rounded-xl border-border/80 focus:border-primary transition-colors',
                          cepFilled && formData.state && 'bg-accent/5 border-accent/30',
                        )}
                      />
                    </div>
                  </div>

                  {cepFilled && (
                    <div className="flex items-center gap-2 text-sm text-accent animate-fade-in">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Endereço preenchido automaticamente via CEP</span>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* ── STEP 7: CONFIRMAÇÃO ── */}
            {currentStepId === 7 && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-accent" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">Tudo pronto!</h2>
                  <p className="text-muted-foreground mt-2">
                    {isGoogleFlow
                      ? 'Revise seus dados e finalize o cadastro.'
                      : formData.profileType === 'family'
                        ? 'Revise seus dados e confirme o cadastro.'
                        : 'Revise seus dados e confirme o cadastro. Complete seu perfil após o login.'}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-2xl p-6 space-y-4">
                  <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">Resumo do cadastro</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      {
                        label: 'Tipo de perfil',
                        value: formData.profileType === 'family' ? 'Família' : 'Profissional de Saúde',
                      },
                      { label: 'Nome', value: formData.name || (user?.user_metadata?.full_name as string) || '—' },
                      { label: 'E-mail', value: formData.email || user?.email || '—' },
                      { label: 'Telefone', value: formData.phone || '—' },
                      {
                        label: 'Localização',
                        value: formData.city && formData.state ? `${formData.city}, ${formData.state}` : '—',
                      },
                    ].map((item, i, arr) => (
                      <div
                        key={i}
                        className={cn(
                          'flex justify-between py-2',
                          i < arr.length - 1 && 'border-b border-border/50',
                        )}
                      >
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <label className="flex items-start gap-3 text-sm leading-relaxed">
                    <Checkbox
                      checked={hasAcceptedPlatformTerms}
                      onCheckedChange={(checked) => setHasAcceptedPlatformTerms(checked === true)}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="text-muted-foreground">
                      Li e aceito os{' '}
                      <Link className="font-medium text-primary underline-offset-4 hover:underline" to={LEGAL_DOCUMENTS.terms.route} target="_blank">
                        Termos de Uso
                      </Link>
                      , a{' '}
                      <Link className="font-medium text-primary underline-offset-4 hover:underline" to={LEGAL_DOCUMENTS.privacy.route} target="_blank">
                        Politica de Privacidade
                      </Link>
                      {' '}e a{' '}
                      <Link className="font-medium text-primary underline-offset-4 hover:underline" to={LEGAL_DOCUMENTS.cookies.route} target="_blank">
                        Politica de Cookies
                      </Link>
                      .
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* ── NAVEGAÇÃO (hidden on step 1 — it has its own buttons) ── */}
            {currentStepId !== 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                {currentStepIndex > 0 ? (
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    className="text-muted-foreground hover:text-foreground gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                  </Button>
                ) : (
                  <div />
                )}

                {currentStepIndex < steps.length - 1 ? (
                  <Button
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 h-12 px-8 rounded-xl font-semibold shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 h-12 px-8 rounded-xl font-semibold shadow-lg shadow-accent/20 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {isGoogleFlow ? 'Finalizar cadastro' : 'Criar conta'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default Onboarding
