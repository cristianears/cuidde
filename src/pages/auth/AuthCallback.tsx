import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const PENDING_ROLE_KEY = 'cuidde_pending_role'

const roleHomeMap: Record<string, string> = {
  caregiver: '/caregiver',
  family: '/family',
  admin: '/admin',
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const { user, profile, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    async function resolveCallback() {
      // Sem usuário após a troca do código → voltar para login
      if (!user) {
        navigate('/login', { replace: true })
        return
      }

      // Perfil já tem role (login Google de usuário existente)
      if (profile?.role) {
        navigate(roleHomeMap[profile.role] ?? '/', { replace: true })
        return
      }

      // Novo usuário Google — verificar role salvo antes do redirect
      const pendingRole = localStorage.getItem(PENDING_ROLE_KEY)

      if (pendingRole === 'family' || pendingRole === 'caregiver') {
        localStorage.removeItem(PENDING_ROLE_KEY)

        // Atualiza o perfil com o role escolhido no onboarding
        await supabase
          .from('profiles')
          .update({ role: pendingRole })
          .eq('id', user.id)

        // Cria sub-perfil específico
        if (pendingRole === 'caregiver') {
          await supabase.from('caregiver_profiles').upsert({ id: user.id })
        } else {
          await supabase.from('family_profiles').upsert({ id: user.id })
        }

        navigate(roleHomeMap[pendingRole], { replace: true })
      } else {
        // Google sem role — voltar ao onboarding para selecionar
        navigate('/onboarding', { replace: true })
      }
    }

    resolveCallback()
  }, [user, profile, isLoading, navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-muted/30 to-background gap-6">
      <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
        <Heart className="w-7 h-7 text-primary-foreground fill-primary-foreground" />
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Autenticando com Google…</p>
      </div>
    </div>
  )
}
