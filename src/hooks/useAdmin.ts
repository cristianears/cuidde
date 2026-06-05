import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'
import type { CaregiverStatus } from '@/types/database'

// ─── Tipos retornados pela Edge Function admin-actions ────────────────────────

export interface AdminCaregiverRow {
  id: string
  photo_url: string | null
  city: string | null
  state: string | null
  status: CaregiverStatus
  created_at: string
  profissao_formacao: string | null
  professional_reg_type: string | null
  professional_reg_number: string | null
  professional_reg_uf: string | null
  rejection_reason: string | null
  full_name: string | null
  phone: string | null
}

export interface AdminCaregiverDetail extends AdminCaregiverRow {
  email: string | null
  bio: string | null
  whatsapp: string | null
  specialties: string[]
  modalities: string[]
  idiomas: string[]
  experience_years: number
  possui_cnh: boolean
  has_insurance: boolean
  emergency_available: boolean
  price_per_hour: number | null
  price_per_day: number | null
}

export interface AdminDocumentRow {
  id: string
  caregiver_id: string
  type: string
  file_url: string | null
  file_name: string | null
  status: 'pending' | 'sent' | 'approved' | 'rejected'
  is_visible: boolean
  rejection_reason: string | null
  reviewed_at: string | null
  uploaded_at: string | null
  created_at: string
}

export interface AdminCaregiverCounts {
  pending: number
  analyzing: number
  verified: number
  rejected: number
}

export interface AdminMetrics {
  totalCaregivers: number
  verifiedCaregivers: number
  pendingApproval: number
  totalFamilies: number
  activeSubscriptions: number
  monthlyRevenue: number
  averageTicket: number
  subscriptions: { monthly: number; quarterly: number; annual: number }
  averageRating: number
  profileCompleteCaregivers: number
  caregiversWithRoutineAnyTime: number
  caregiversWithRoutineLast30Days: number
  caregiversWithRoutineLast7Days: number
  caregiversWithRoutineToday: number
}

export interface AdminSubscriptionRow {
  id: string
  plan: 'monthly' | 'quarterly' | 'annual' | null
  subscription_status: 'free' | 'active' | 'past_due' | 'canceled' | 'incomplete'
  current_period_end: string | null
  created_at: string
  full_name: string | null
}

export interface AdminInvoiceRow {
  id: string
  family_id: string
  invoice_ref: string | null
  period: string | null
  plan: 'monthly' | 'quarterly' | 'annual' | null
  amount: number
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  due_date: string | null
  paid_at: string | null
  created_at: string
  family_name: string | null
}

// ─── Helper interno ───────────────────────────────────────────────────────────

async function callAdminAction<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-actions', {
    body: { action, ...params },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data.data as T
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useAdminCaregivers(status: CaregiverStatus) {
  return useQuery({
    queryKey: queryKeys.adminCaregivers(status),
    queryFn: () => callAdminAction<AdminCaregiverRow[]>('list_caregivers', { status }),
    staleTime: 30_000,
  })
}

export function useAdminCaregiverDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.adminCaregiverDetail(id ?? ''),
    queryFn: () => callAdminAction<AdminCaregiverDetail>('get_caregiver_detail', { caregiver_id: id }),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useAdminCaregiverDocuments(id: string | null) {
  return useQuery({
    queryKey: queryKeys.adminCaregiverDocuments(id ?? ''),
    queryFn: () => callAdminAction<AdminDocumentRow[]>('get_documents', { caregiver_id: id }),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useAdminCaregiverCounts() {
  return useQuery({
    queryKey: queryKeys.adminCaregiverCounts,
    queryFn: () => callAdminAction<AdminCaregiverCounts>('get_caregiver_counts'),
    staleTime: 30_000,
  })
}

export function useAdminMetrics() {
  return useQuery({
    queryKey: queryKeys.adminMetrics,
    queryFn: () => callAdminAction<AdminMetrics>('get_metrics'),
    staleTime: 60_000,
  })
}

export function useAdminSubscriptions() {
  return useQuery({
    queryKey: queryKeys.adminSubscriptions,
    queryFn: () => callAdminAction<AdminSubscriptionRow[]>('list_subscriptions'),
    staleTime: 30_000,
  })
}

export function useAdminInvoices() {
  return useQuery({
    queryKey: queryKeys.adminInvoices,
    queryFn: () => callAdminAction<AdminInvoiceRow[]>('list_invoices'),
    staleTime: 30_000,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useAdminApprove() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (caregiverId: string) =>
      callAdminAction<void>('approve', { caregiver_id: caregiverId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'caregivers'] })
      qc.invalidateQueries({ queryKey: queryKeys.adminCaregiverCounts })
      qc.invalidateQueries({ queryKey: queryKeys.adminMetrics })
      toast.success('Cuidador aprovado com sucesso.')
    },
    onError: (err: Error) => toast.error(`Erro ao aprovar: ${err.message}`),
  })
}

export function useAdminReject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ caregiverId, reason }: { caregiverId: string; reason: string }) =>
      callAdminAction<void>('reject', { caregiver_id: caregiverId, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'caregivers'] })
      qc.invalidateQueries({ queryKey: queryKeys.adminCaregiverCounts })
      qc.invalidateQueries({ queryKey: queryKeys.adminMetrics })
      toast.error('Cuidador reprovado.')
    },
    onError: (err: Error) => toast.error(`Erro ao reprovar: ${err.message}`),
  })
}

export function useAdminMarkIllegible() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (caregiverId: string) =>
      callAdminAction<void>('reject', {
        caregiver_id: caregiverId,
        reason: 'Documento não legível, enviar novamente.',
      }),
    onSuccess: (_data, caregiverId) => {
      qc.invalidateQueries({ queryKey: ['admin', 'caregivers'] })
      qc.invalidateQueries({ queryKey: queryKeys.adminCaregiverDetail(caregiverId) })
      qc.invalidateQueries({ queryKey: queryKeys.adminCaregiverCounts })
      toast.warning('Cuidador notificado: documento não legível.')
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })
}

export function useAdminApproveDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId, caregiverId }: { documentId: string; caregiverId: string }) =>
      callAdminAction<void>('approve_document', { document_id: documentId, caregiver_id: caregiverId }),
    onSuccess: (_data, { caregiverId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.adminCaregiverDocuments(caregiverId) })
      qc.invalidateQueries({ queryKey: ['admin', 'caregivers'] })
      qc.invalidateQueries({ queryKey: queryKeys.adminCaregiverCounts })
      toast.success('Documento aprovado.')
    },
    onError: (err: Error) => toast.error(`Erro ao aprovar documento: ${err.message}`),
  })
}

export function useAdminMarkDocumentIllegible() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId, caregiverId }: { documentId: string; caregiverId: string }) =>
      callAdminAction<void>('mark_document_illegible', { document_id: documentId, caregiver_id: caregiverId }),
    onSuccess: (_data, { caregiverId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.adminCaregiverDocuments(caregiverId) })
      qc.invalidateQueries({ queryKey: ['admin', 'caregivers'] })
      qc.invalidateQueries({ queryKey: queryKeys.adminCaregiverCounts })
      toast.warning('Cuidador notificado: documento ilegível.')
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })
}

export function useAdminDocumentUrl() {
  return useMutation({
    mutationFn: async (fileUrl: string) => {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'get_document_signed_url', file_url: fileUrl },
      })
      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)
      return data.url as string
    },
  })
}
