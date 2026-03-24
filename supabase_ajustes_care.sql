-- ============================================================================
-- Ajustes: Checklist de Medicamentos, Diário de Bem-Estar, Itens em Falta
-- Executar no Supabase SQL Editor
-- ============================================================================

-- 1. Adicionar campo de medicamentos pré-definidos no perfil da família
-- JSONB array: [{"name": "Losartana 50mg", "time": "08:00"}, ...]
ALTER TABLE family_profiles
  ADD COLUMN IF NOT EXISTS elderly_medications jsonb DEFAULT '[]'::jsonb;

-- 2. Adicionar novos campos em care_routines
-- medication_items: registros de cada medicamento aplicado pelo cuidador
-- JSONB array: [{"name": "Losartana 50mg", "time": "08:00", "applied": true, "applied_at": "2026-03-19T10:05:00Z"}, ...]
ALTER TABLE care_routines
  ADD COLUMN IF NOT EXISTS medication_items jsonb DEFAULT '[]'::jsonb;

-- feeding_status: como o idoso se alimentou
ALTER TABLE care_routines
  ADD COLUMN IF NOT EXISTS feeding_status text CHECK (feeding_status IN ('full', 'partial', 'refused'));

-- hygiene_done: banho realizado?
ALTER TABLE care_routines
  ADD COLUMN IF NOT EXISTS hygiene_done boolean;

-- mood: humor do idoso
ALTER TABLE care_routines
  ADD COLUMN IF NOT EXISTS mood text CHECK (mood IN ('agitated', 'calm', 'sleepy'));

-- items_running_low: itens acabando (fralda, remédio, etc.)
ALTER TABLE care_routines
  ADD COLUMN IF NOT EXISTS items_running_low text[] DEFAULT '{}';

-- 3. RLS: care_routines já herda a política do appointment
-- Verificar se RLS está habilitado
ALTER TABLE care_routines ENABLE ROW LEVEL SECURITY;

-- Política: cuidador pode inserir/ver registros dos seus atendimentos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'care_routines' AND policyname = 'Caregiver manages own care routines'
  ) THEN
    CREATE POLICY "Caregiver manages own care routines"
      ON care_routines
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.id = care_routines.appointment_id
            AND a.caregiver_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.id = care_routines.appointment_id
            AND a.caregiver_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Política: família pode visualizar registros dos seus atendimentos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'care_routines' AND policyname = 'Family views own care routines'
  ) THEN
    CREATE POLICY "Family views own care routines"
      ON care_routines
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.id = care_routines.appointment_id
            AND a.family_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- Pronto! Agora o frontend pode gravar e ler os novos campos.
-- ============================================================================
