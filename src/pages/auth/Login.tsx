import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Heart, Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { signInWithEmail, signInWithGoogle } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

type View = 'initial' | 'email' | 'password'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { role } = useAuth()

  const [view, setView] = useState<View>('initial')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  function getRedirectPath() {
    const redirect = searchParams.get('redirect')
    const cep = searchParams.get('cep')
    if (redirect) return cep ? `${redirect}?cep=${cep}` : redirect
    if (role === 'caregiver') return '/caregiver'
    if (role === 'family') return '/family'
    if (role === 'admin') return '/admin'
    return '/'
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { error } = await signInWithEmail(email, password)
      if (error) {
        toast.error(
          error.message === 'Invalid login credentials'
            ? 'E-mail ou senha incorretos.'
            : error.message
        )
        return
      }
      navigate(getRedirectPath(), { replace: true })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        toast.error(error.message)
        setIsGoogleLoading(false)
      }
      // Se sucesso, o redirect para Google acontece automaticamente
    } catch {
      setIsGoogleLoading(false)
    }
  }

  function goToRegister() {
    navigate('/onboarding' + (email ? `?email=${encodeURIComponent(email)}` : ''))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex flex-col">
      {/* Header */}
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

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* ── VIEW: INITIAL ── */}
          {view === 'initial' && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Entrar na cuidde</h1>
                <p className="text-muted-foreground mt-2 text-sm">Acesse ou crie sua conta</p>
              </div>

              <Card className="shadow-card border-border/50">
                <CardContent className="p-8 space-y-3">
                  {/* Google */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-xl border-border/80 font-medium gap-3 justify-start px-5"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}
                    <span className="flex-1 text-center">Continuar com Google</span>
                  </Button>

                  {/* Separator */}
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/60" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-3 text-muted-foreground">ou</span>
                    </div>
                  </div>

                  {/* E-mail button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-xl border-border/80 font-medium gap-3 justify-start px-5"
                    onClick={() => setView('email')}
                  >
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span className="flex-1 text-center">Continuar com e-mail</span>
                  </Button>

                  <p className="text-center text-sm text-muted-foreground pt-2">
                    Não tem conta?{' '}
                    <button
                      type="button"
                      onClick={goToRegister}
                      className="text-primary font-medium hover:underline"
                    >
                      Criar conta grátis
                    </button>
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── VIEW: EMAIL ── */}
          {view === 'email' && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Entrar na cuidde</h1>
                <p className="text-muted-foreground mt-2 text-sm">Digite seu e-mail para continuar</p>
              </div>

              <Card className="shadow-card border-border/50">
                <CardContent className="p-8 space-y-4">
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
                        className="h-12 pl-11 rounded-xl border-border/80 focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Avançar (login) */}
                  <Button
                    type="button"
                    disabled={!email.includes('@')}
                    onClick={() => setView('password')}
                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20 gap-2 disabled:opacity-50"
                  >
                    Avançar
                    <ArrowRight className="w-4 h-4" />
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

                  <button
                    type="button"
                    onClick={() => setView('initial')}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mx-auto transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Voltar
                  </button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── VIEW: PASSWORD ── */}
          {view === 'password' && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Entrar na cuidde</h1>
                <p className="mt-2 text-sm font-medium text-muted-foreground truncate">{email}</p>
              </div>

              <Card className="shadow-card border-border/50">
                <CardContent className="p-8">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-foreground font-medium">Senha</Label>
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() => toast.info('Funcionalidade de recuperação de senha em breve.')}
                        >
                          Esqueceu sua senha?
                        </button>
                      </div>
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

                    <div className="flex gap-3 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setView('email')}
                        className="flex-1 h-12 rounded-xl border-border/80 gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading || !password}
                        className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Entrar'
                        )}
                      </Button>
                    </div>

                    <p className="text-center text-sm text-muted-foreground pt-1">
                      Não tem conta?{' '}
                      <button
                        type="button"
                        onClick={goToRegister}
                        className="text-primary font-medium hover:underline"
                      >
                        Criar conta grátis
                      </button>
                    </p>
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
