// ─── Query Keys centralizados ────────────────────────────────────────────────
// Todas as query keys do TanStack Query ficam aqui para evitar duplicação
// e garantir que invalidação de cache funcione corretamente.
// ─────────────────────────────────────────────────────────────────────────────

// Normaliza objeto de filtros para que a ordem das chaves não cause cache miss
function stableFilterKey(filters: Record<string, unknown>): string {
  return JSON.stringify(
    Object.keys(filters).sort().reduce<Record<string, unknown>>((acc, k) => {
      const v = filters[k]
      if (v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) {
        acc[k] = v
      }
      return acc
    }, {}),
  )
}

export const queryKeys = {
  caregiverProfile: (userId: string) => ['caregiverProfile', userId] as const,
  professionalRefs: (userId: string) => ['professionalReferences', userId] as const,
  caregiverDocuments: (userId: string) => ['caregiver-documents', userId] as const,
  favorites: (userId: string) => ['favorites', userId] as const,
  favoriteIds: (userId: string) => ['favorite_ids', userId] as const,
  familyProfile: (userId: string) => ['family_profile', userId] as const,
  familyMatches: (userId: string, limit: number) => ['family_matches', userId, limit] as const,
  searchCaregivers: (filters: Record<string, unknown>) => ['caregivers', 'search', stableFilterKey(filters)] as const,
  appointmentsAll: ['appointments'] as const,
  appointments: (userId: string, role: string) => ['appointments', role, userId] as const,
  appointmentDetail: (id: string) => ['appointment', id] as const,
  careRoutines: (appointmentId: string) => ['care_routines', appointmentId] as const,
  publicCaregiverProfile: (caregiverId: string) => ['publicCaregiverProfile', caregiverId] as const,
  messages: (appointmentId: string) => ['messages', appointmentId] as const,
} as const
