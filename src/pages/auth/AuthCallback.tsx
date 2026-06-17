import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandMark from '@/components/shared/BrandMark'
import { useAuth } from '@/contexts/AuthContext'
import { getFamilyOnboardingCompleteTarget } from '@/lib/landing-cep-flow'
import { supabase } from '@/lib/supabase'

const roleHomeMap: Record<string, string> = {
  caregiver: '/caregiver',
  family: '/family',
  admin: '/admin',
}

/** Recupera e limpa dados do onboarding salvos antes do OAuth redirect */
function consumeOnboardingData(): { type?: string; cep?: string; phone?: string; redirect?: string } | null {
  try {
    const raw = localStorage.getItem('cuidde_onboarding_data')
    localStorage.removeItem('cuidde_onboarding_data')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (checking) return

    if (!user) {
      const timeout = setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3000)
      return () => clearTimeout(timeout)
    }

    setChecking(true)

    async function checkProfileAndRedirect() {
      const isPendingSignup = localStorage.getItem('cuidde_pending_signup') === 'true'
      const onboardingData = consumeOnboardingData()

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user!.id)
          .single()

        if (profile?.role && !isPendingSignup) {
          // Usuário existente fazendo login com Google → dashboard
          localStorage.removeItem('cuidde_pending_signup')
          const familyRedirect = profile.role === 'family'
            ? getFamilyOnboardingCompleteTarget({
              redirect: onboardingData?.redirect,
              cep: onboardingData?.cep,
            })
            : null

          navigate(familyRedirect ?? roleHomeMap[profile.role] ?? '/', { replace: true })
        } else {
          // Novo usuário OU veio do onboarding (pending_signup) → completar cadastro
          localStorage.removeItem('cuidde_pending_signup')

          // Construir query params preservando CEP e type do onboarding
          const params = new URLSearchParams({ from: 'google' })
          if (onboardingData?.cep) params.set('cep', onboardingData.cep)
          if (onboardingData?.type) params.set('type', onboardingData.type)
          if (onboardingData?.redirect) params.set('redirect', onboardingData.redirect)

          navigate(`/onboarding?${params.toString()}`, { replace: true })
        }
      } catch {
        // Profile não encontrado (404) → usuário novo
        localStorage.removeItem('cuidde_pending_signup')

        const params = new URLSearchParams({ from: 'google' })
        if (onboardingData?.cep) params.set('cep', onboardingData.cep)
        if (onboardingData?.type) params.set('type', onboardingData.type)
        if (onboardingData?.redirect) params.set('redirect', onboardingData.redirect)

        navigate(`/onboarding?${params.toString()}`, { replace: true })
      }
    }

    checkProfileAndRedirect()
  }, [user, isLoading, checking, navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-muted/30 to-background gap-6">
      <BrandMark size={56} showWordmark={false} />
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Autenticando…</p>
      </div>
    </div>
  )
}
