-- Sprint 5.1 v2: Mudar constraint de reviews para por atendimento
-- Executar no Supabase SQL Editor

-- 1. Remover constraint antigo (1 review por par família/cuidador)
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_family_id_caregiver_id_key;

-- 2. Adicionar constraint novo (1 review por atendimento)
--    Partial index: permite appointment_id NULL (legado) sem conflito
CREATE UNIQUE INDEX IF NOT EXISTS reviews_appointment_id_unique
  ON reviews (appointment_id)
  WHERE appointment_id IS NOT NULL;

-- Verificação
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'reviews';
