-- ============================================================
-- SQL DE TESTE: Cria um atendimento ativo entre o cuidador e a família existentes
-- Execute no Supabase SQL Editor
-- ⚠️  Rodar DEPOIS de supabase_ajustes_care.sql e supabase_sprint4x.sql
-- ============================================================

-- Insere um atendimento ativo vinculando o primeiro cuidador e a primeira família do banco
INSERT INTO appointments (family_id, caregiver_id, type, status, start_date, description, modality)
SELECT
  fp.id   AS family_id,
  cp.id   AS caregiver_id,
  'contínuo'  AS type,
  'ativo'     AS status,
  CURRENT_DATE AS start_date,
  'Atendimento de teste para validar Sprint 4.1' AS description,
  'Presencial' AS modality
FROM family_profiles fp
JOIN profiles p_fam ON p_fam.id = fp.id
CROSS JOIN caregiver_profiles cp
WHERE p_fam.full_name ILIKE '%Fábio Batista%'
LIMIT 1;

-- Verifica o que foi criado
SELECT
  a.id,
  a.status,
  a.type,
  a.start_date,
  p_fam.full_name  AS familia,
  p_care.full_name AS cuidador
FROM appointments a
JOIN profiles p_fam  ON p_fam.id  = a.family_id
JOIN profiles p_care ON p_care.id = a.caregiver_id
ORDER BY a.created_at DESC
LIMIT 5;
