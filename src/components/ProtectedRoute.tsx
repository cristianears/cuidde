import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types/database'

interface ProtectedRouteProps {
  children: React.ReactNode
  role?: UserRole
}

const roleHomeMap: Record<UserRole, string> = {
  caregiver: '/caregiver',
  family: '/family',
  admin: '/admin',
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Não autenticado → /login preservando a URL atual como redirect
  if (!user) {
    const params = new URLSearchParams()
    params.set('redirect', location.pathname)
    if (location.search) {
      // preserva query params existentes (ex: ?cep=01310100)
      const existing = new URLSearchParams(location.search)
      existing.forEach((value, key) => params.set(key, value))
    }
    return <Navigate to={`/login?${params.toString()}`} replace />
  }

  // Autenticado mas email não confirmado → /verify-email
  if (user && !user.email_confirmed_at) {
    return <Navigate to="/verify-email" replace />
  }

  // Role mismatch: redireciona para a home correta do role do usuário
  if (role && profile?.role && profile.role !== role) {
    return <Navigate to={roleHomeMap[profile.role]} replace />
  }

  return <>{children}</>
}
