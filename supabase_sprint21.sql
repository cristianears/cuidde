-- Sprint 2.1 — Novas colunas para Disponibilidade e Preços
-- Execute no Supabase Dashboard > SQL Editor

ALTER TABLE caregiver_profiles
  ADD COLUMN IF NOT EXISTS is_available_for_new  BOOLEAN  DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS journey_types          TEXT[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS area_type              TEXT     DEFAULT 'cidade',
  ADD COLUMN IF NOT EXISTS area_radius            TEXT,
  ADD COLUMN IF NOT EXISTS availability_notes     TEXT,
  ADD COLUMN IF NOT EXISTS pricing_note           TEXT;

-- Verificar resultado
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'caregiver_profiles'
  AND column_name IN (
    'is_available_for_new', 'journey_types', 'area_type',
    'area_radius', 'availability_notes', 'pricing_note', 'complement'
  )
ORDER BY column_name;
