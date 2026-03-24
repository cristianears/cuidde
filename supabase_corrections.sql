-- =============================================================================
-- CUIDDE — Correções do schema após análise front-end × banco
-- Cole este arquivo no SQL Editor do Supabase APÓS o supabase_setup.sql
-- =============================================================================


-- =============================================================================
-- 1. Adicionar emergency_available em caregiver_profiles
--    Usado em: CaregiverCard.tsx, SearchCaregivers.tsx (filtro), CaregiverDashboard.tsx
-- =============================================================================
ALTER TABLE public.caregiver_profiles
  ADD COLUMN IF NOT EXISTS emergency_available BOOLEAN DEFAULT FALSE;


-- =============================================================================
-- 2. Atualizar subscription_status para refletir ciclo real do Stripe/Asaas
--    
--    Status anteriores: active, trial, inactive, cancelled, expired
--    Status novos (modelo freemium + Stripe):
--      free       — acesso gratuito com limitações (padrão ao criar conta)
--      active     — plano pago ativo, pagamento em dia
--      past_due   — pagamento atrasado, assinatura ainda existe
--      canceled   — cancelada pelo usuário ou por inadimplência (volta para free)
--      incomplete — checkout iniciado mas pagamento não finalizado
--
--    Mapeamento Stripe → banco:
--      customer.subscription.created                    → active
--      invoice.paid                                     → active
--      invoice.payment_failed                           → past_due
--      customer.subscription.deleted                    → canceled
--      checkout.session.expired                         → incomplete
--      (sem assinatura / nunca assinou)                 → free
--
--    Mapeamento Asaas → banco:
--      ACTIVE  → active
--      OVERDUE → past_due
--      CANCELED / EXPIRED → canceled
--
--    Regra de acesso no front:
--      subscription_status === 'active' → desbloqueia tudo
--      Qualquer outro status → modo gratuito limitado (cards resumidos apenas)
-- =============================================================================

-- Remover CHECK antigo
ALTER TABLE public.family_profiles
  DROP CONSTRAINT IF EXISTS family_profiles_subscription_status_check;

-- Adicionar CHECK novo com status do modelo freemium
ALTER TABLE public.family_profiles
  ADD CONSTRAINT family_profiles_subscription_status_check
  CHECK (subscription_status IN ('free', 'active', 'past_due', 'canceled', 'incomplete'));

-- Definir default para novos registros (família começa com acesso gratuito)
ALTER TABLE public.family_profiles
  ALTER COLUMN subscription_status SET DEFAULT 'free';


-- =============================================================================
-- 3. Adicionar 'overdue' ao CHECK de invoices.status
--    O Stripe envia invoice.payment_failed — faz sentido ter um status
--    que diferencie faturas vencidas de faturas em aberto
-- =============================================================================
ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('paid', 'pending', 'open', 'overdue'));


-- =============================================================================
-- 4. Trigger genérico para atualizar updated_at automaticamente
--    Afeta: profiles, caregiver_profiles, family_profiles, appointments,
--           support_tickets (todas têm coluna updated_at mas sem trigger)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- caregiver_profiles
DROP TRIGGER IF EXISTS set_updated_at_caregiver_profiles ON public.caregiver_profiles;
CREATE TRIGGER set_updated_at_caregiver_profiles
  BEFORE UPDATE ON public.caregiver_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- family_profiles
DROP TRIGGER IF EXISTS set_updated_at_family_profiles ON public.family_profiles;
CREATE TRIGGER set_updated_at_family_profiles
  BEFORE UPDATE ON public.family_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- appointments
DROP TRIGGER IF EXISTS set_updated_at_appointments ON public.appointments;
CREATE TRIGGER set_updated_at_appointments
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- support_tickets
DROP TRIGGER IF EXISTS set_updated_at_support_tickets ON public.support_tickets;
CREATE TRIGGER set_updated_at_support_tickets
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- =============================================================================
-- FIM DAS CORREÇÕES
-- 
-- Resumo do que foi feito:
--   ✅ emergency_available adicionado em caregiver_profiles
--   ✅ subscription_status modelo freemium (free/active/past_due/canceled/incomplete)
--   ✅ subscription_status default = 'free' para novos registros
--   ✅ invoices.status agora aceita 'overdue'
--   ✅ Triggers de updated_at em 5 tabelas
--
-- O que NÃO foi alterado (corrigir no front, não no banco):
--   - Planos admin mock (match/essencial/daily) → usar monthly/quarterly/annual
--   - Status appointments família (active/finished) → usar ativo/finalizado/pendente/cancelado
--   - buscas_proximas_30d → usar search_appearances_30d no front (MVP)
--   - comprovante_endereco → removido do fluxo (não será usado)
-- =============================================================================
