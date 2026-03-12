-- ═══════════════════════════════════════════════════════════════════════════
-- Sprint 3.1 — Busca de Cuidadores
-- Rodar no Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. profiles: permitir que usuários autenticados leiam full_name de cuidadores
--    verificados (necessário para montar o card público do cuidador)
--    A política existente "profiles: ver e editar próprio" só permite ver o próprio.
--    Esta nova política complementa: cuidadores verificados têm perfil legível.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'profiles: leitura de cuidadores verificados'
  ) THEN
    CREATE POLICY "profiles: leitura de cuidadores verificados" ON public.profiles
      FOR SELECT
      USING (
        id IN (
          SELECT id FROM public.caregiver_profiles
          WHERE status = 'verified' AND is_visible = TRUE
        )
        OR id = auth.uid()
      );
  END IF;
END $$;

-- 2. family_profiles: políticas para que a família gerencie o próprio perfil
--    (necessário para ler elderly_conditions no useFamilyMatches)
ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'family_profiles'
      AND policyname = 'family: dono gerencia'
  ) THEN
    CREATE POLICY "family: dono gerencia" ON public.family_profiles
      FOR ALL
      USING (auth.uid() = id);
  END IF;
END $$;

-- 3. favorites: políticas para que a família gerencie os próprios favoritos
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'favorites'
      AND policyname = 'favorites: família gerencia'
  ) THEN
    CREATE POLICY "favorites: família gerencia" ON public.favorites
      USING (family_id = auth.uid());
  END IF;
END $$;

-- 4. Verificar se a policy "caregiver: público lê verificados" já existe
--    (criada no supabase_setup.sql — esta é só uma referência de segurança)
-- CREATE POLICY "caregiver: público lê verificados" ON public.caregiver_profiles
--   FOR SELECT USING (status = 'verified' AND is_visible = TRUE);
-- Se der erro de duplicata, ignore — a policy já existe.
