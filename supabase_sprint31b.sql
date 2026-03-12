-- ═══════════════════════════════════════════════════════════════════════════
-- Sprint 3.1b — Visibilidade automática por completude de perfil
--
-- CONTEXTO: Admin não aprova mais cuidadores. Um cuidador aparece nas buscas
-- automaticamente quando atende ao mínimo:
--   1. Dados básicos preenchidos (cidade e bairro)
--   2. Biografia preenchida
--   3. Pelo menos 1 especialidade
--   4. Pelo menos 1 referência profissional
--   5. RG ou CNH enviado (status 'sent' ou 'approved')
--
-- Rodar no Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Nova coluna ────────────────────────────────────────────────────────────
ALTER TABLE public.caregiver_profiles
  ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 2. Função que calcula se o perfil atende ao mínimo ───────────────────────
CREATE OR REPLACE FUNCTION public.compute_profile_complete(cp_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bio          TEXT;
  v_specialties  TEXT[];
  v_city         TEXT;
  v_neighborhood TEXT;
  v_has_ref      BOOLEAN;
  v_has_rg       BOOLEAN;
BEGIN
  SELECT bio, specialties, city, neighborhood
  INTO   v_bio, v_specialties, v_city, v_neighborhood
  FROM   public.caregiver_profiles
  WHERE  id = cp_id;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- Dados básicos: cidade e bairro
  IF v_city IS NULL OR trim(v_city) = ''         THEN RETURN FALSE; END IF;
  IF v_neighborhood IS NULL OR trim(v_neighborhood) = '' THEN RETURN FALSE; END IF;

  -- Biografia
  IF v_bio IS NULL OR length(trim(v_bio)) < 10 THEN RETURN FALSE; END IF;

  -- Pelo menos 1 especialidade
  IF v_specialties IS NULL OR array_length(v_specialties, 1) IS NULL THEN RETURN FALSE; END IF;

  -- Pelo menos 1 referência profissional
  SELECT EXISTS (
    SELECT 1 FROM public.professional_references WHERE caregiver_id = cp_id
  ) INTO v_has_ref;
  IF NOT v_has_ref THEN RETURN FALSE; END IF;

  -- RG ou CNH enviado ou aprovado
  SELECT EXISTS (
    SELECT 1 FROM public.caregiver_documents
    WHERE  caregiver_id = cp_id
      AND  type         = 'rg_cnh'
      AND  status       IN ('sent', 'approved')
  ) INTO v_has_rg;
  IF NOT v_has_rg THEN RETURN FALSE; END IF;

  RETURN TRUE;
END;
$$;

-- ── 3. Trigger: recalcular ao atualizar caregiver_profiles ───────────────────
CREATE OR REPLACE FUNCTION public.trg_profile_complete_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.profile_complete := public.compute_profile_complete(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_caregiver_profile_upsert ON public.caregiver_profiles;
CREATE TRIGGER on_caregiver_profile_upsert
  BEFORE INSERT OR UPDATE OF bio, specialties, city, neighborhood
  ON public.caregiver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_profile_complete_from_profile();

-- ── 4. Trigger: recalcular ao inserir/remover referência ─────────────────────
CREATE OR REPLACE FUNCTION public.trg_profile_complete_from_ref()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_id UUID;
BEGIN
  target_id := COALESCE(NEW.caregiver_id, OLD.caregiver_id);
  UPDATE public.caregiver_profiles
  SET    profile_complete = public.compute_profile_complete(target_id)
  WHERE  id = target_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_reference_change ON public.professional_references;
CREATE TRIGGER on_reference_change
  AFTER INSERT OR UPDATE OR DELETE ON public.professional_references
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_profile_complete_from_ref();

-- ── 5. Trigger: recalcular ao mudar status de documento ──────────────────────
CREATE OR REPLACE FUNCTION public.trg_profile_complete_from_doc()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_id UUID;
BEGIN
  target_id := COALESCE(NEW.caregiver_id, OLD.caregiver_id);
  UPDATE public.caregiver_profiles
  SET    profile_complete = public.compute_profile_complete(target_id)
  WHERE  id = target_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_document_change ON public.caregiver_documents;
CREATE TRIGGER on_document_change
  AFTER INSERT OR UPDATE OR DELETE ON public.caregiver_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_profile_complete_from_doc();

-- ── 6. Atualizar os valores existentes ───────────────────────────────────────
UPDATE public.caregiver_profiles
SET    profile_complete = public.compute_profile_complete(id);

-- ── 7. Atualizar RLS: remover política baseada em status='verified' ───────────
DROP POLICY IF EXISTS "caregiver: público lê verificados"      ON public.caregiver_profiles;
DROP POLICY IF EXISTS "caregiver: público lê perfil completo"  ON public.caregiver_profiles;

-- Nova política: perfil visível se profile_complete = true
-- O dono sempre lê o próprio perfil (coberto pela policy "caregiver: dono edita")
CREATE POLICY "caregiver: público lê perfil completo" ON public.caregiver_profiles
  FOR SELECT
  USING (profile_complete = TRUE OR auth.uid() = id);

-- ── 8. Atualizar RLS de profiles: nomes legíveis para perfis completos ────────
DROP POLICY IF EXISTS "profiles: leitura de cuidadores verificados"            ON public.profiles;
DROP POLICY IF EXISTS "profiles: leitura de cuidadores com perfil completo"    ON public.profiles;

CREATE POLICY "profiles: leitura de cuidadores com perfil completo" ON public.profiles
  FOR SELECT
  USING (
    id IN (SELECT id FROM public.caregiver_profiles WHERE profile_complete = TRUE)
    OR id = auth.uid()
  );
