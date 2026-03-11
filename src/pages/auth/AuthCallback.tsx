import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const roleHomeMap: Record<string, string> = {
  caregiver: '/caregiver',
  family: '/family',
  admin: '/admin',
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (checking) return

    if (!user) {
      // Ainda sem user — pode ser que o AuthContext não processou o token ainda.
      // Aguarda um ciclo. Se depois de 3s não tiver user, vai pro login.
      const timeout = setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3000)
      return () => clearTimeout(timeout)
    }

    // User existe — busca o profile DIRETAMENTE do banco para evitar
    // race condition com o AuthContext (que pode ainda não ter atualizado)
    setChecking(true)

    async function checkProfileAndRedirect() {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user!.id)
          .single()

        if (profile?.role) {
          // Usuário existente fazendo login com Google → dashboard
          localStorage.removeItem('cuidde_pending_signup')
          navigate(roleHomeMap[profile.role] ?? '/', { replace: true })
        } else {
          // Novo usuário Google — precisa completar o cadastro
          navigate('/onboarding?from=google', { replace: true })
        }
      } catch {
        // Se não encontrou profile (404) → usuário novo, vai pro onboarding
        navigate('/onboarding?from=google', { replace: true })
      }
    }

    checkProfileAndRedirect()
  }, [user, isLoading, checking, navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-muted/30 to-background gap-6">
      <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
        <Heart className="w-7 h-7 text-primary-foreground fill-primary-foreground" />
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Autenticando…</p>
      </div>
    </div>
  )
}
