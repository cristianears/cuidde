-- Sprint 5.1: Reviews com critérios granulares
-- Executar no Supabase SQL Editor

-- 1. Adicionar colunas de critérios e resposta do cuidador
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS rating_pontualidade  DECIMAL(2,1) CHECK (rating_pontualidade BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_competencia   DECIMAL(2,1) CHECK (rating_competencia BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_comunicacao   DECIMAL(2,1) CHECK (rating_comunicacao BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_trato         DECIMAL(2,1) CHECK (rating_trato BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_confianca     DECIMAL(2,1) CHECK (rating_confianca BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS caregiver_reply      TEXT,
  ADD COLUMN IF NOT EXISTS replied_at           TIMESTAMPTZ;

-- 2. O campo rating (já existente) continua sendo a nota geral (1.0–5.0).
--    O frontend calcula o average dos 5 critérios e insere nesse campo.
--    O trigger update_caregiver_rating (já existente) lê reviews.rating
--    para atualizar caregiver_profiles.average_rating — sem alteração necessária.

-- 3. RLS: políticas já existentes cobrem os novos campos.
--    "reviews: todos leem"  → SELECT * → inclui as novas colunas automaticamente
--    "reviews: família insere" → INSERT → família enviará os novos campos
--    Nenhuma nova policy é necessária.

-- Verificação: confirmar colunas adicionadas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'reviews'
ORDER BY ordinal_position;
