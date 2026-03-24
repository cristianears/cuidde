-- =============================================================================
-- CUIDDE — Adicionar campo "Complemento" no endereço
-- Rodar no SQL Editor do Supabase
-- =============================================================================

ALTER TABLE public.caregiver_profiles
  ADD COLUMN IF NOT EXISTS complement TEXT;

ALTER TABLE public.family_profiles
  ADD COLUMN IF NOT EXISTS complement TEXT;

-- =============================================================================
-- FIM — campo complement adicionado em ambos os perfis (nullable, opcional)
-- =============================================================================
