-- =============================================================================
-- CORREÇÃO DE SEGURANÇA: Bloquear auto-atribuição de role admin via signup
-- =============================================================================
-- EXECUTAR NO SUPABASE SQL EDITOR
-- Data: 2026-03-17
-- Severidade: CRÍTICA
-- =============================================================================

-- 1. Corrigir handle_new_user() para rejeitar role 'admin' e adicionar search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'family');

  -- SEGURANÇA: Bloquear criação de admin via signup público
  IF user_role NOT IN ('caregiver', 'family') THEN
    RAISE EXCEPTION 'Role inválido: %. Apenas caregiver e family são permitidos via signup.', user_role;
  END IF;

  INSERT INTO public.profiles (id, role, full_name, phone)
  VALUES (
    NEW.id,
    user_role,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  );

  IF user_role = 'caregiver' THEN
    INSERT INTO public.caregiver_profiles (id) VALUES (NEW.id);
  ELSIF user_role = 'family' THEN
    INSERT INTO public.family_profiles (id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Recriar o trigger (para garantir que usa a versão atualizada)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Adicionar constraint na tabela profiles para impedir update de role para admin via cliente
-- (mesmo se RLS permitir update do próprio perfil)
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o role está sendo alterado para 'admin', bloquear
  -- (admin só pode ser atribuído via service_role no Dashboard)
  IF NEW.role = 'admin' AND OLD.role != 'admin' THEN
    RAISE EXCEPTION 'Não é permitido alterar role para admin.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS prevent_role_escalation ON public.profiles;
CREATE TRIGGER prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.prevent_role_escalation();

-- 4. Corrigir search_path nas demais funções SECURITY DEFINER existentes
-- (previne hijack via schema malicioso)

-- update_caregiver_rating
DO $$ BEGIN
  ALTER FUNCTION public.update_caregiver_rating() SET search_path = public;
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'update_caregiver_rating() não existe ainda — ignorando.';
END $$;

-- compute_profile_complete (se existir, do sprint31b)
DO $$ BEGIN
  ALTER FUNCTION public.compute_profile_complete() SET search_path = public;
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'compute_profile_complete() não existe ainda — ignorando.';
END $$;

-- refresh_caregiver_computed (se existir, do sprint31c)
DO $$ BEGIN
  ALTER FUNCTION public.refresh_caregiver_computed() SET search_path = public;
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'refresh_caregiver_computed() não existe ainda — ignorando.';
END $$;

-- =============================================================================
-- VERIFICAÇÃO: Após executar, teste com:
--   SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
-- Deve conter "IF user_role NOT IN ('caregiver', 'family')"
-- =============================================================================
