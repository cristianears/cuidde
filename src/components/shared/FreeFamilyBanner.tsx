import { Link } from 'react-router-dom'
import { Heart, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamilyProfile } from '@/hooks/useFamilyProfile'

export default function FreeFamilyBanner() {
  const { role } = useAuth()
  const { data: family } = useFamilyProfile()

  if (role !== 'family') return null
  if (!family || family.subscription_status !== 'free') return null

  return (
    <div className="w-full bg-red-600 text-white">
      <Link
        to="/family/billing"
        className="flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm font-medium text-center hover:bg-red-700 transition-colors"
      >
        <Heart className="w-4 h-4 shrink-0 fill-white" />
        <span>
          Encontre o cuidador certo para sua família — assine e tenha acesso ilimitado a todos os profissionais.
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 underline underline-offset-2 font-semibold">
          Ver planos <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </Link>
    </div>
  )
}
