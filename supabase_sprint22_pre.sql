-- Sprint 2.2 — pré-requisitos para módulo de documentos
-- Rodar no Supabase Dashboard → SQL Editor antes de testar Sprint 2.2

-- 1. Remover documentos do tipo cnpj (se houver)
DELETE FROM caregiver_documents WHERE type = 'cnpj';

-- 2. Atualizar CHECK constraint sem 'cnpj'
ALTER TABLE caregiver_documents
  DROP CONSTRAINT IF EXISTS caregiver_documents_type_check;

ALTER TABLE caregiver_documents
  ADD CONSTRAINT caregiver_documents_type_check
  CHECK (type IN ('rg_cnh', 'curriculo', 'certificacao', 'antecedentes'));

-- 3. Adicionar coluna rejection_reason (preenchida pelo admin ao rejeitar)
ALTER TABLE caregiver_documents
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 4. Unique constraint para permitir upsert por (caregiver_id, type)
ALTER TABLE caregiver_documents
  DROP CONSTRAINT IF EXISTS caregiver_documents_caregiver_type_unique;

ALTER TABLE caregiver_documents
  ADD CONSTRAINT caregiver_documents_caregiver_type_unique
  UNIQUE (caregiver_id, type);

-- 5. RLS — cuidador gerencia seus próprios documentos
ALTER TABLE caregiver_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "caregiver_documents: dono gerencia" ON caregiver_documents;
CREATE POLICY "caregiver_documents: dono gerencia" ON caregiver_documents
  USING (caregiver_id = auth.uid());

-- 6. Storage bucket 'documents' — policy para cuidador fazer upload/delete
-- (somente se ainda não existir — criar no Dashboard se necessário)
-- INSERT: cuidador só sobe para sua própria pasta
INSERT INTO storage.buckets (id, name, public)
  VALUES ('documents', 'documents', false)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "documents: cuidador upload" ON storage.objects;
CREATE POLICY "documents: cuidador upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "documents: cuidador lê e deleta" ON storage.objects;
CREATE POLICY "documents: cuidador lê e deleta" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
