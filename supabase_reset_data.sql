-- ⚠️ RESET COMPLETO DE DADOS
-- Apaga todos os registros para começar do zero.
-- ATENÇÃO: irreversível. Não há como desfazer após execução.
-- Rodar no Supabase Dashboard → SQL Editor

-- ── 1. Apagar dados das tabelas (ordem respeitando FK) ───────────────────────
TRUNCATE TABLE
  system_logs,
  support_tickets,
  invoices,
  messages,
  care_routines,
  reviews,
  favorites,
  appointments,
  caregiver_documents,
  caregiver_availability,
  professional_references,
  caregiver_profiles,
  family_profiles,
  profiles
CASCADE;

-- ── 2. Apagar usuários do Auth (cascateia para profiles automaticamente) ─────
DELETE FROM auth.users;

-- ── 3. Limpar arquivos do Storage ────────────────────────────────────────────
-- Os arquivos nos buckets 'avatars' e 'documents' NÃO são apagados pelo SQL.
-- Faça manualmente no Supabase Dashboard:
--   Storage → avatars → selecionar tudo → Delete
--   Storage → documents → selecionar tudo → Delete

-- ── Verificação (opcional — rode após o reset para confirmar) ─────────────────
-- SELECT COUNT(*) FROM auth.users;        -- deve retornar 0
-- SELECT COUNT(*) FROM profiles;          -- deve retornar 0
-- SELECT COUNT(*) FROM caregiver_profiles; -- deve retornar 0
