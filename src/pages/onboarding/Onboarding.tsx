import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  Heart,
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { signUpWithEmail, signInWithGoogleForSignup } from '@/lib/auth'
import { fetchAddressByCep } from '@/lib/viacep'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

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
  neighborhood: string
  city: string
  state: string
  description: string
}

const ALL_STEPS = [
  { id: 1, label: 'Perfil' },
  { id: 2, label: 'Dados' },
  { id: 3, label: 'Telefone' },
  { id: 4, label: 'Endereço' },
  { id: 5, label: 'Informações' },
  { id: 6, label: 'Confirmação' },
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

  const isGoogleFlow = searchParams.get('from') === 'google'

  // Passos ativos: Google flow pula o step 2 (email/senha)
  const steps = isGoogleFlow ? ALL_STEPS.filter((s) => s.id !== 2) : ALL_STEPS

  const [currentStepId, setCurrentStepId] = useState(1)
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

  // Pré-preencher dados a partir de query params (?type, ?cep, ?email)
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

  // Pré-preencher nome/email do Google OAuth
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

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  const phoneDigitsCount = formData.phone.replace(/\D/g, '').length
  const isPhoneValid = phoneDigitsCount === 11

  const handleGoogleSignup = async () => {
    if (!formData.profileType) return
    setIsGoogleLoading(true)
    try {
      const { error } = await signInWithGoogleForSignup(formData.profileType)
      if (error) {
        toast.error(error.message)
        setIsGoogleLoading(false)
      }
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

  const handleSubmit = async () => {
    if (!formData.profileType) return
    setIsSubmitting(true)
    try {
      if (isGoogleFlow && user) {
        // Usuário já autenticado via Google — apenas atualizar o perfil
        await supabase
          .from('profiles')
          .update({ role: formData.profileType, phone: formData.phone })
          .eq('id', user.id)

        if (formData.profileType === 'caregiver') {
          await supabase.from('caregiver_profiles').upsert({ id: user.id })
        } else {
          await supabase.from('family_profiles').upsert({ id: user.id })
        }

        navigate(formData.profileType === 'caregiver' ? '/caregiver' : '/family', { replace: true })
      } else {
        // Fluxo de email/senha
        const { error } = await signUpWithEmail(formData.email, formData.password, {
          role: formData.profileType,
          full_name: formData.name,
          phone: formData.phone,
        })
        if (error) {
          toast.error(error.message)
          return
        }
        navigate('/verify-email', { replace: true })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStepId) {
      case 1:
        return formData.profileType !== null
      case 2:
        return !!(
          formData.name &&
          formData.email &&
          formData.password &&
          formData.confirmPassword &&
          isPasswordStrong &&
          passwordsMatch
        )
      case 3:
        return isPhoneValid
      case 4:
        return !!(formData.cep && formData.street && formData.number && formData.city && formData.state)
      case 5:
        return formData.description.length >= 20
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Heart className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground tracking-tight">cuidde</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-xl">
        {/* Progress bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border mx-8" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-accent mx-8 transition-all duration-500 ease-out"
              style={{
                width: `calc(${(currentStepIndex / (steps.length - 1)) * 100}% - 4rem)`,
              }}
            />
            {steps.map((step, idx) => (
              <div key={step.id} className="flex flex-col items-center relative z-10">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 shadow-sm',
                    currentStepIndex > idx
                      ? 'bg-accent text-accent-foreground shadow-accent/30'
                      : currentStepIndex === idx
                        ? 'bg-primary text-primary-foreground shadow-primary/30 ring-4 ring-primary/20'
                        : 'bg-card text-muted-foreground border-2 border-border',
                  )}
                >
                  {currentStepIndex > idx ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    'mt-3 text-xs font-medium transition-colors',
                    currentStepIndex >= idx ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Card className="shadow-card border-border/50 overflow-hidden">
          <CardContent className="p-8 sm:p-10">

            {/* ── STEP 1: PERFIL ── */}
            {currentStepId === 1 && (
              <div className="space-y-8 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">Como você quer usar a cuidde?</h2>
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

            {/* ── STEP 2: DADOS (email flow only) ── */}
            {currentStepId === 2 && (
              <div className="space-y-8 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">Crie sua conta</h2>
                  <p className="text-muted-foreground mt-2">Preencha seus dados para começar</p>
                </div>
                <div className="space-y-5">
                  {/* Google OAuth (só no flow email) */}
                  {!isGoogleFlow && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 rounded-xl border-border/80 font-medium gap-3"
                        onClick={handleGoogleSignup}
                        disabled={isGoogleLoading}
                      >
                        {isGoogleLoading ? (
                          <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <GoogleIcon />
                        )}
                        Cadastrar com Google
                      </Button>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border/60" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-card px-3 text-muted-foreground">ou cadastre com email</span>
                        </div>
                      </div>
                    </>
                  )}

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

            {/* ── STEP 3: TELEFONE ── */}
            {currentStepId === 3 && (
              <div className="space-y-8 animate-fade-in">
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

            {/* ── STEP 4: ENDEREÇO ── */}
            {currentStepId === 4 && (
              <div className="space-y-8 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">Qual é o seu endereço?</h2>
                  <p className="text-muted-foreground mt-2">
                    {formData.profileType === 'family'
                      ? 'Usaremos para encontrar profissionais próximos a você'
                      : 'Usaremos para mostrar você a famílias na sua região'}
                  </p>
                </div>
                <div className="space-y-5">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  </div>
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

            {/* ── STEP 5: INFORMAÇÕES ── */}
            {currentStepId === 5 && (
              <div className="space-y-8 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">
                    {formData.profileType === 'family'
                      ? 'Conte sobre a necessidade de cuidado'
                      : 'Conte sobre sua experiência profissional'}
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    {formData.profileType === 'family'
                      ? 'Isso ajuda a encontrar o profissional mais adequado para você'
                      : 'Essas informações aparecem no seu perfil e ajudam famílias a conhecerem você'}
                  </p>
                </div>
                <div>
                  <Label htmlFor="description" className="text-foreground font-medium">
                    {formData.profileType === 'family'
                      ? 'Descreva brevemente a situação'
                      : 'Sua experiência e especialidades'}
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={
                      formData.profileType === 'family'
                        ? 'Ex: Minha mãe tem 78 anos e precisa de acompanhamento diário para alimentação e medicação...'
                        : 'Ex: Sou cuidador de idosos há 5 anos, tenho experiência com Alzheimer, curso de primeiros socorros e NR32...'
                    }
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    className="mt-2 min-h-[160px] rounded-xl border-border/80 focus:border-primary resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Mínimo 20 caracteres • {formData.description.length}/500
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 6: CONFIRMAÇÃO ── */}
            {currentStepId === 6 && (
              <div className="space-y-8 animate-fade-in">
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
                      { label: 'Nome', value: formData.name || user?.user_metadata?.full_name || '—' },
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
              </div>
            )}

            {/* ── NAVEGAÇÃO ── */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/50">
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
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default Onboarding
