-- Garante integridade das reviews no servidor:
-- a família só pode inserir review para o cuidador que realmente está no atendimento.
-- Isso impede que um cliente malicioso envie caregiver_id adulterado.
--
-- Executar no Supabase SQL Editor.

-- Remover política anterior de INSERT se existir
DROP POLICY IF EXISTS "reviews: família insere avaliação" ON reviews;
DROP POLICY IF EXISTS "reviews: familia insere avaliacao" ON reviews;

-- Política de INSERT: vincula family_id, caregiver_id e appointment_id ao atendimento real
CREATE POLICY "reviews: família insere somente para o cuidador do atendimento"
  ON reviews
  FOR INSERT
  WITH CHECK (
    family_id = auth.uid()
    AND caregiver_id = (
      SELECT a.caregiver_id FROM appointments a
      WHERE a.id = appointment_id
        AND a.family_id = auth.uid()
        AND a.status = 'finalizado'
    )
  );
