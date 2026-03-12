import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CaregiverDocument, DocumentType, ProfessionalRegType } from '@/types/database'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface UpdateProfessionalRegPayload {
  professional_reg_type: ProfessionalRegType | ''
  professional_reg_number: string
  professional_reg_uf: string
  professional_reg_other_desc: string
}

// ─── Query: listar documentos ─────────────────────────────────────────────────

export function useDocuments() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['caregiver-documents', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caregiver_documents')
        .select('*')
        .eq('caregiver_id', user!.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data ?? []) as CaregiverDocument[]
    },
    enabled: !!user,
  })
}

// ─── Mutation: upload de documento ───────────────────────────────────────────

export function useUploadDocument() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ docType, file }: { docType: DocumentType; file: File }) => {
      const ext = file.name.split('.').pop() ?? 'pdf'
      const storagePath = `${user!.id}/${docType}.${ext}`

      // Upload para Storage (substitui se já existir)
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Upsert na tabela — usa constraint UNIQUE (caregiver_id, type)
      const { data, error: dbError } = await supabase
        .from('caregiver_documents')
        .upsert(
          {
            caregiver_id: user!.id,
            type: docType,
            file_url: storagePath,
            file_name: file.name,
            status: 'sent',
            uploaded_at: new Date().toISOString(),
          },
          { onConflict: 'caregiver_id,type' },
        )
        .select('id')

      if (dbError) throw dbError
      if (!data || data.length === 0) throw new Error('0 linhas atualizadas — verifique RLS.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caregiver-documents'] })
      toast.success('Documento enviado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar documento: ${error.message}`)
      console.error('[useUploadDocument]', error)
    },
  })
}

// ─── Mutation: remover documento ──────────────────────────────────────────────

export function useRemoveDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (doc: CaregiverDocument) => {
      // Deleta do Storage se há arquivo
      if (doc.file_url) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([doc.file_url])

        if (storageError) throw storageError
      }

      // Deleta o registro da tabela
      const { error } = await supabase
        .from('caregiver_documents')
        .delete()
        .eq('id', doc.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caregiver-documents'] })
      toast.success('Documento removido.')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover documento: ${error.message}`)
      console.error('[useRemoveDocument]', error)
    },
  })
}

// ─── Mutation: toggle de visibilidade ────────────────────────────────────────

export function useToggleDocumentVisibility() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { error } = await supabase
        .from('caregiver_documents')
        .update({ is_visible })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caregiver-documents'] })
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar visibilidade: ${error.message}`)
      console.error('[useToggleDocumentVisibility]', error)
    },
  })
}

// ─── Mutation: registro profissional ─────────────────────────────────────────

export function useUpdateProfessionalReg() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateProfessionalRegPayload) => {
      const { data, error } = await supabase
        .from('caregiver_profiles')
        .update({
          professional_reg_type: payload.professional_reg_type || null,
          professional_reg_number: payload.professional_reg_number || null,
          professional_reg_uf: payload.professional_reg_uf || null,
          professional_reg_other_desc: payload.professional_reg_other_desc || null,
        })
        .eq('id', user!.id)
        .select('id')

      if (error) throw error
      if (!data || data.length === 0) throw new Error('0 linhas atualizadas — verifique RLS.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caregiver-profile'] })
      toast.success('Registro profissional salvo!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar registro: ${error.message}`)
      console.error('[useUpdateProfessionalReg]', error)
    },
  })
}
