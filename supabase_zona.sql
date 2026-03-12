-- ═══════════════════════════════════════════════════════════════════════════
-- Zona / Região — coluna zona em caregiver_profiles
--
-- O cuidador informa a zona onde atua (auto-declarado no passo "Dados básicos").
-- A família filtra por zona na busca de cuidadores.
--
-- Valores: zona_norte | zona_sul | zona_leste | zona_oeste | centro
-- (NULL = não informado / atende toda a cidade)
--
-- Rodar no Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.caregiver_profiles
  ADD COLUMN IF NOT EXISTS zona TEXT
  CHECK (zona IN ('zona_norte','zona_sul','zona_leste','zona_oeste','centro'));
