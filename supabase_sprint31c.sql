-- ═══════════════════════════════════════════════════════════════════════════
-- Sprint 3.1c — Badges de documentos no card público do cuidador
--
-- Problema: CaregiverCard possui props hasDocsSent/hasAntecedentes/hasCertificados
-- /hasReferencias mas a busca nunca as preenchia pois famílias não leem
-- caregiver_documents (RLS restrito ao dono).
--
-- Solução: adicionar 4 colunas booleanas computadas em caregiver_profiles,
-- calculadas pelo mesmo trigger que mantém profile_complete.
-- Famílias lêem os flags diretamente no SELECT de caregiver_profiles.
--
-- Rodar APÓS supabase_sprint31b.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Novas colunas computadas ───────────────────────────────────────────────
ALTER TABLE public.caregiver_profiles
  ADD COLUMN IF NOT EXISTS has_rg_cnh       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_antecedentes BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_certificado  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_references   BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 2. Função central de recompute (substitui compute_profile_complete) ───────
CREATE OR REPLACE FUNCTION public.refresh_caregiver_computed(cp_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bio          TEXT;
  v_specialties  TEXT[];
  v_city         TEXT;
  v_neighborhood TEXT;
  v_has_rg       BOOLEAN;
  v_has_ant      BOOLEAN;
  v_has_cert     BOOLEAN;
  v_has_ref      BOOLEAN;
BEGIN
  SELECT bio, specialties, city, neighborhood
  INTO   v_bio, v_specialties, v_city, v_neighborhood
  FROM   public.caregiver_profiles
  WHERE  id = cp_id;

  IF NOT FOUND THEN RETURN; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.caregiver_documents
    WHERE  caregiver_id = cp_id AND type = 'rg_cnh'
      AND  status IN ('sent', 'approved')
  ) INTO v_has_rg;

  SELECT EXISTS (
    SELECT 1 FROM public.caregiver_documents
    WHERE  caregiver_id = cp_id AND type = 'antecedentes'
      AND  status IN ('sent', 'approved')
  ) INTO v_has_ant;

  SELECT EXISTS (
    SELECT 1 FROM public.caregiver_documents
    WHERE  caregiver_id = cp_id AND type = 'certificados'
      AND  status IN ('sent', 'approved')
  ) INTO v_has_cert;

  SELECT EXISTS (
    SELECT 1 FROM public.professional_references
    WHERE  caregiver_id = cp_id
  ) INTO v_has_ref;

  UPDATE public.caregiver_profiles
  SET
    has_rg_cnh       = v_has_rg,
    has_antecedentes = v_has_ant,
    has_certificado  = v_has_cert,
    has_references   = v_has_ref,
    profile_complete = (
      v_city         IS NOT NULL AND trim(v_city)         != '' AND
      v_neighborhood IS NOT NULL AND trim(v_neighborhood) != '' AND
      v_bio          IS NOT NULL AND length(trim(v_bio))  >= 10 AND
      v_specialties  IS NOT NULL AND array_length(v_specialties, 1) IS NOT NULL AND
      v_has_ref AND v_has_rg
    )
  WHERE id = cp_id;
END;
$$;

-- ── 3. Trigger em caregiver_profiles (dispara ao alterar campos de perfil) ────
-- Filtramos as colunas computadas para evitar loop infinito:
-- o UPDATE de has_rg_cnh/profile_complete não re-dispara este trigger.

CREATE OR REPLACE FUNCTION public.trg_profile_complete_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.refresh_caregiver_computed(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_caregiver_profile_upsert ON public.caregiver_profiles;
CREATE TRIGGER on_caregiver_profile_upsert
  AFTER INSERT OR UPDATE OF bio, specialties, city, neighborhood
  ON public.caregiver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_profile_complete_from_profile();

-- ── 4. Trigger em professional_references ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_profile_complete_from_ref()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.refresh_caregiver_computed(
    COALESCE(NEW.caregiver_id, OLD.caregiver_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_reference_change ON public.professional_references;
CREATE TRIGGER on_reference_change
  AFTER INSERT OR UPDATE OR DELETE ON public.professional_references
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_profile_complete_from_ref();

-- ── 5. Trigger em caregiver_documents ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_profile_complete_from_doc()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.refresh_caregiver_computed(
    COALESCE(NEW.caregiver_id, OLD.caregiver_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_document_change ON public.caregiver_documents;
CREATE TRIGGER on_document_change
  AFTER INSERT OR UPDATE OR DELETE ON public.caregiver_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_profile_complete_from_doc();

-- ── 6. Backfill: recalcular todos os cuidadores existentes ───────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.caregiver_profiles LOOP
    PERFORM public.refresh_caregiver_computed(r.id);
  END LOOP;
END;
$$;

-- ── Resultado ─────────────────────────────────────────────────────────────────
-- caregiver_profiles agora expõe:
--   has_rg_cnh       → RG ou CNH enviado/aprovado
--   has_antecedentes → Certidão de antecedentes enviada/aprovada
--   has_certificado  → Certificados enviados/aprovados
--   has_references   → Tem pelo menos 1 referência profissional
--   profile_complete → Todos os critérios atendidos (aparece na busca)
-- Famílias lêem esses flags via SELECT em caregiver_profiles sem precisar
-- acessar caregiver_documents (que tem RLS restrito ao dono).
