import { DEFAULT_RADIUS_KM } from '@/lib/constants'
import type { CaregiverPublic } from '@/types/database'

export type CaregiverWithDistance = CaregiverPublic & { distance_km?: number }

const GLOBAL_MEAN_RATING = 4.0
const BAYESIAN_K = 5

/**
 * Score de ranking composto (0–~124 pts).
 * Calculado client-side após o fetch para evitar SQL complexo.
 * Pesos ajustáveis sem migração.
 *
 * Distribuição aproximada:
 *   Qualidade de avaliação  0–20 pts  (Bayesian average escalado)
 *   Completude do perfil    0–46 pts
 *   Confiança / documentos  0–45 pts
 *   Disponibilidade         0–3 pts
 *   Proximidade             0–10 pts  (bônus contínuo; qualidade domina)
 */
export function computeRankScore(
  c: CaregiverWithDistance,
  radiusKm: number = DEFAULT_RADIUS_KM,
): number {
  const bayesian =
    (BAYESIAN_K * GLOBAL_MEAN_RATING + c.review_count * c.average_rating) /
    (BAYESIAN_K + c.review_count)
  const ratingScore = (bayesian / 5) * 20

  let completeness = 0
  if (c.photo_url)                        completeness += 15
  if (c.bio && c.bio.length >= 100)       completeness += 10
  if (c.specialties.length >= 2)          completeness += 8
  if (c.profissao_formacao)               completeness += 5
  if (c.modalities.length >= 1)           completeness += 4
  if (c.price_per_hour != null)           completeness += 4

  let trust = 0
  if (c.has_references)   trust += 20
  if (c.has_antecedentes) trust += 10
  if (c.has_certificado)  trust += 7
  if (c.has_insurance)    trust += 5
  if (c.has_rg_cnh)       trust += 3

  const availability = c.emergency_available ? 3 : 0

  const distanceBonus = c.distance_km != null
    ? Math.max(0, (1 - c.distance_km / radiusKm) * 10)
    : 0

  return ratingScore + completeness + trust + availability + distanceBonus
}
