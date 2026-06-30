import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import BrandMark from '@/components/shared/BrandMark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { signInWithEmail, signInWithGoogle, resetPasswordForEmail } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import { getIncompleteOnboardingTarget, getLoginRegisterTarget } from '@/lib/landing-cep-flow'
import { toast } from 'sonner'

type View = 'email' | 'password'

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, profile, role, isLoading } = useAuth()

  const [view, setView] = useState<View>('email')
  const [email, setEmail] = useState(() => searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // Flag: o usuário acabou de fazer login com email com sucesso
  const [loginSuccess, setLoginSuccess] = useState(false)

  // Rate limiting: bloqueia após 5 tentativas por 60s
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)

  // Ref para preservar redirect/cep dos searchParams
  const redirectRef = useRef(searchParams.get('redirect'))
  const cepRef = useRef(searchParams.get('cep'))
  const typeRef = useRef(searchParams.get('type'))

  // ─── REDIRECT AUTOMÁTICO ───
  // Se o usuário JÁ está logado ao abrir /login, ou acabou de logar com
  // sucesso (loginSuccess), redireciona assim que o AuthContext tiver o role.
  useEffect(() => {
    if (isLoading) return

    if (user && profile && !role) {
      navigate(getIncompleteOnboardingTarget({
        type: typeRef.current,
        cep: cepRef.current,
        redirect: redirectRef.current,
      }), { replace: true })
      return
    }

    // Só redireciona se: já estava logado OU acabou de logar com sucesso
    if (user && (loginSuccess || role)) {
      const redirect = redirectRef.current
      const cep = cepRef.current

      // Validação de segurança: prevenir open redirect
      const safeRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//') && !redirect.includes('://') ? redirect : null
      if (safeRedirect) {
        navigate(cep ? `${safeRedirect}?cep=${encodeURIComponent(cep)}` : safeRedirect, { replace: true })
        return
      }

      if (role === 'caregiver') navigate('/caregiver', { replace: true })
      else if (role === 'family') navigate('/family', { replace: true })
      else if (role === 'admin') navigate('/admin', { replace: true })
      // Se user existe mas role ainda é null, espera o próximo render
      // (o AuthContext ainda está carregando o profile)
    }
  }, [user, profile, role, isLoading, loginSuccess, navigate])

  function goToRegister() {
    navigate(getLoginRegisterTarget({
      email: email || null,
      cep: cepRef.current,
      type: typeRef.current,
      redirect: redirectRef.current,
    }))
  }

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (isLocked) {
      const secsLeft = Math.ceil((lockedUntil! - Date.now()) / 1000)
      toast.error(`Muitas tentativas. Aguarde ${secsLeft}s.`)
      return
    }
    setIsSubmitting(true)
    try {
      const { error } = await signInWithEmail(email, password)
      if (error) {
        const newAttempts = failedAttempts + 1
        setFailedAttempts(newAttempts)
        if (newAttempts >= 5) {
          setLockedUntil(Date.now() + 60_000)
          setFailedAttempts(0)
          toast.error('Muitas tentativas falhadas. Conta bloqueada por 60 segundos.')
          return
        }
        toast.error(
          error.message === 'Invalid login credentials'
            ? 'E-mail ou senha incorretos.'
            : error.message
        )
        return
      }
      setFailedAttempts(0)
      setLockedUntil(null)
      setLoginSuccess(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true)
    try {
      if (cepRef.current || typeRef.current || redirectRef.current) {
        localStorage.setItem('cuidde_onboarding_data', JSON.stringify({
          type: typeRef.current || 'family',
          cep: cepRef.current || '',
          redirect: redirectRef.current || '',
        }))
      }
      const { error } = await signInWithGoogle()
      if (error) {
        toast.error(error.message)
        setIsGoogleLoading(false)
      }
      // Google OAuth faz redirect automático, não precisa de navigate
    } catch {
      setIsGoogleLoading(false)
    }
  }

  // Enquanto verifica sessão existente OU aguardando redirect pós-login
  if (isLoading || loginSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted/30 to-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">
            {loginSuccess ? 'Entrando…' : 'Carregando…'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex flex-col">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <Link to="/" className="w-fit">
            <BrandMark size={40} />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* ── VIEW: EMAIL ── */}
          {view === 'email' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Entrar na icuide</h1>
                <p className="text-muted-foreground mt-2 text-sm">Acesse sua conta</p>
              </div>

              <Card className="shadow-card border-border/50">
                <CardContent className="p-8 space-y-4">
                  {/* Campo de e-mail */}
                  <div>
                    <Label htmlFor="email" className="text-foreground font-medium">E-mail</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && email.includes('@') && setView('password')}
                        autoFocus
                        className="h-12 pl-11 rounded-xl border-border/80 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/50"
                      />
                    </div>
                  </div>

                  {/* Avançar */}
                  <Button
                    type="button"
                    disabled={!email.includes('@')}
                    onClick={() => setView('password')}
                    className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg shadow-accent/20 disabled:opacity-50"
                  >
                    Avançar
                  </Button>

                  {/* Cadastrar-se */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToRegister}
                    className="w-full h-12 rounded-xl border-border/80 font-medium"
                  >
                    Cadastrar-se
                  </Button>

                  {/* Separator */}
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/60" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-3 text-muted-foreground">ou continuar com</span>
                    </div>
                  </div>

                  {/* Google button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading}
                    className="w-full h-12 rounded-xl border-border/80 font-medium gap-3"
                  >
                    {isGoogleLoading ? (
                      <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <GoogleLogo />
                    )}
                    Google
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── VIEW: PASSWORD ── */}
          {view === 'password' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Entrar na icuide</h1>
                <p className="mt-2 text-sm text-muted-foreground truncate max-w-xs mx-auto">{email}</p>
              </div>

              <Card className="shadow-card border-border/50">
                <CardContent className="p-8">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <Label htmlFor="password" className="text-foreground font-medium">Senha</Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoFocus
                          required
                          className="h-12 pl-11 pr-11 rounded-xl border-border/80 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          tabIndex={-1}
                        >
                          {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline mt-2 block"
                        onClick={async () => {
                          if (!email.includes('@')) {
                            toast.error('Volte e digite seu e-mail primeiro.')
                            return
                          }
                          const { error } = await resetPasswordForEmail(email)
                          if (error) {
                            toast.error(error.message)
                          } else {
                            toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.')
                          }
                        }}
                      >
                        Esqueceu sua senha?
                      </button>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setView('email'); setPassword('') }}
                        className="flex-1 h-12 rounded-xl border-border/80 gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || !password || isLocked}
                        className="flex-1 h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg shadow-accent/20"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                        ) : 'Entrar'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
