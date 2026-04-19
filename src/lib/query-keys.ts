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
  caregiverDocuments: (userId: string) => ['caregiverDocuments', userId] as const,
  favorites: (userId: string) => ['favorites', userId] as const,
  favoriteIds: (userId: string) => ['favoriteIds', userId] as const,
  familyProfile: (userId: string) => ['familyProfile', userId] as const,
  familyMatches: (userId: string, limit: number) => ['familyMatches', userId, limit] as const,
  searchCaregivers: (filters: Record<string, unknown>) => ['caregivers', 'search', stableFilterKey(filters)] as const,
  appointmentsAll: ['appointments'] as const,
  appointments: (userId: string, role: string) => ['appointments', role, userId] as const,
  appointmentDetail: (id: string) => ['appointment', id] as const,
  careRoutines: (appointmentId: string) => ['careRoutines', appointmentId] as const,
  publicCaregiverProfile: (caregiverId: string) => ['publicCaregiverProfile', caregiverId] as const,
  messages: (appointmentId: string) => ['messages', appointmentId] as const,
  reviews: (caregiverId: string) => ['reviews', caregiverId] as const,
  appointmentReview: (appointmentId: string) => ['review_by_appointment', appointmentId] as const,
  familyReviewedAppointments: (userId: string) => ['family_reviewed_appointments', userId] as const,
  invoices: (userId: string) => ['invoices', userId] as const,
  invoice: (id: string) => ['invoice', id] as const,
  // ─── Admin ────────────────────────────────────────────────────────────────
  adminCaregivers: (status: string) => ['admin', 'caregivers', status] as const,
  adminCaregiverDetail: (id: string) => ['admin', 'caregiver', id] as const,
  adminCaregiverDocuments: (id: string) => ['admin', 'documents', id] as const,
  adminCaregiverCounts: ['admin', 'counts'] as const,
  adminMetrics: ['admin', 'metrics'] as const,
  adminSubscriptions: ['admin', 'subscriptions'] as const,
  adminInvoices: ['admin', 'invoices'] as const,
} as const
