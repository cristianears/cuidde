import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Mail, RefreshCw, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { resendConfirmationEmail } from '@/lib/auth'
import { toast } from 'sonner'

export default function VerifyEmail() {
  const { user } = useAuth()
  const [isResending, setIsResending] = useState(false)
  const [resent, setResent] = useState(false)

  const email = user?.email ?? ''

  async function handleResend() {
    if (!email) return
    setIsResending(true)
    try {
      const { error } = await resendConfirmationEmail(email)
      if (error) {
        toast.error(error.message)
        return
      }
      setResent(true)
      toast.success('Email de confirmação reenviado!')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex flex-col">
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
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Mail className="w-10 h-10 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Verifique seu email</h1>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Enviamos um link de confirmação para{' '}
              {email && (
                <span className="font-semibold text-foreground">{email}</span>
              )}
              . Clique no link para ativar sua conta.
            </p>
          </div>

          <div className="bg-muted/50 rounded-2xl p-5 text-sm text-muted-foreground space-y-2 text-left">
            <p className="font-medium text-foreground">Não encontrou o email?</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Verifique a pasta de spam ou lixo eletrônico</li>
              <li>Aguarde alguns minutos — pode demorar</li>
              <li>Confirme que digitou o email corretamente</li>
            </ul>
          </div>

          {resent ? (
            <div className="flex items-center justify-center gap-2 text-sm text-accent font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Email reenviado com sucesso!
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl border-border/80 gap-2"
              onClick={handleResend}
              disabled={isResending || !email}
            >
              {isResending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Reenviar email de confirmação
            </Button>
          )}

          <p className="text-sm text-muted-foreground">
            Email errado?{' '}
            <Link to="/onboarding" className="text-primary font-medium hover:underline">
              Criar nova conta
            </Link>
            {' '}ou{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
