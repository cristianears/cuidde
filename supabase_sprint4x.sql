-- ============================================================================
-- Sprint 4.1 — Agendamentos: políticas complementares
-- Executar no Supabase SQL Editor
-- ============================================================================

-- 1. A policy existente ("appointments: participantes acessam") usa USING
--    mas não tem WITH CHECK, o que bloqueia INSERT.
--    Adicionar policy de INSERT para família criar agendamentos.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'appointments' AND policyname = 'Family creates appointments'
  ) THEN
    CREATE POLICY "Family creates appointments"
      ON public.appointments
      FOR INSERT
      WITH CHECK (family_id = auth.uid());
  END IF;
END $$;

-- 2. Policy de UPDATE: apenas participantes podem atualizar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'appointments' AND policyname = 'Participants update appointments'
  ) THEN
    CREATE POLICY "Participants update appointments"
      ON public.appointments
      FOR UPDATE
      USING (family_id = auth.uid() OR caregiver_id = auth.uid())
      WITH CHECK (family_id = auth.uid() OR caregiver_id = auth.uid());
  END IF;
END $$;

-- 3. care_routines: policy existente ("care_routines: participantes do agendamento")
--    usa USING mas não tem WITH CHECK para INSERT.
--    Adicionar policy de INSERT para cuidador inserir registros.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'care_routines' AND policyname = 'Caregiver inserts care routines'
  ) THEN
    CREATE POLICY "Caregiver inserts care routines"
      ON public.care_routines
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.appointments a
          WHERE a.id = appointment_id
            AND a.caregiver_id = auth.uid()
            AND a.status = 'ativo'
        )
      );
  END IF;
END $$;

-- 4. care_routines: policy de DELETE para cuidador excluir seus registros (apenas atendimentos ativos)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'care_routines' AND policyname = 'Caregiver deletes care routines'
  ) THEN
    CREATE POLICY "Caregiver deletes care routines"
      ON public.care_routines
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.appointments a
          WHERE a.id = appointment_id
            AND a.caregiver_id = auth.uid()
            AND a.status = 'ativo'
        )
      );
  END IF;
END $$;

-- 5. care_routines: policy de UPDATE para cuidador editar seus registros (apenas atendimentos ativos)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'care_routines' AND policyname = 'Caregiver updates care routines'
  ) THEN
    CREATE POLICY "Caregiver updates care routines"
      ON public.care_routines
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.appointments a
          WHERE a.id = appointment_id
            AND a.caregiver_id = auth.uid()
            AND a.status = 'ativo'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.appointments a
          WHERE a.id = appointment_id
            AND a.caregiver_id = auth.uid()
            AND a.status = 'ativo'
        )
      );
  END IF;
END $$;

-- 6. Storage: policy de UPDATE no bucket avatars (permite re-upload / upsert)
--    Sem isso, o segundo upload falha com "new role violates security row"

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'avatars: atualizar próprio'
  ) THEN
    CREATE POLICY "avatars: atualizar próprio"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1])
      WITH CHECK (bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
  END IF;
END $$;

-- 7. Profiles: leitura restrita a contextos válidos
--    v1 era "qualquer autenticado lê tudo" (muito permissivo)
--    v2 permite: próprio perfil, cuidadores com perfil completo, participantes de atendimento

DO $$
BEGIN
  DROP POLICY IF EXISTS "profiles: leitura de cuidadores com perfil completo" ON public.profiles;
  DROP POLICY IF EXISTS "profiles: leitura pública autenticado" ON public.profiles;
  DROP POLICY IF EXISTS "profiles: leitura contextual" ON public.profiles;

  CREATE POLICY "profiles: leitura contextual" ON public.profiles
    FOR SELECT
    USING (
      -- Próprio perfil
      auth.uid() = id
      -- Cuidadores com perfil completo (busca pública)
      OR id IN (SELECT cp.id FROM public.caregiver_profiles cp WHERE cp.profile_complete = TRUE)
      -- Participantes de atendimentos em comum
      OR id IN (
        SELECT a.family_id FROM public.appointments a
        WHERE a.caregiver_id = auth.uid() AND a.status IN ('ativo', 'pendente', 'finalizado')
      )
      OR id IN (
        SELECT a.caregiver_id FROM public.appointments a
        WHERE a.family_id = auth.uid() AND a.status IN ('ativo', 'pendente', 'finalizado')
      )
    );
END $$;

-- ============================================================================
-- Pronto! Agora família pode criar agendamentos e cuidador pode registrar rotinas.
-- ============================================================================
