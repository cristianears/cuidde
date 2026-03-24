-- =============================================================================
-- Storage RLS: Permitir que famílias assinantes leiam documentos dos cuidadores
-- (necessário para visualização de documentos no perfil público)
-- =============================================================================

-- Família com assinatura ativa pode ler documentos de qualquer cuidador
CREATE POLICY "documents: família assinante lê"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.family_profiles
      WHERE id = auth.uid()
      AND subscription_status = 'active'
    )
  );
