#!/usr/bin/env bash
# =============================================================================
# Cuidde — Smoke test do Stripe (test mode)
# =============================================================================
#
# O QUE ESTE SCRIPT FAZ (automático):
#   - Dispara eventos do Stripe via `stripe trigger`
#   - Mostra as queries SQL que você deve rodar para validar cada evento
#
# O QUE VOCÊ TEM QUE FAZER MANUALMENTE (não dá pra script):
#   1. Em outro terminal, manter `stripe listen --forward-to <webhook-url>` rodando
#   2. Fazer o Checkout pela UI com cartão de teste (4242…) — script não consegue
#      preencher o iframe da Stripe
#   3. Rodar as queries SQL no Supabase Dashboard → SQL Editor depois de cada
#      evento e conferir o resultado
#   4. Olhar a UI (/family/billing e /family/invoices) entre cada passo para
#      confirmar que o estado bate com o banco
#
# PRÉ-REQUISITOS:
#   - Stripe CLI instalado:  https://stripe.com/docs/stripe-cli
#   - `stripe login` já feito (usa chaves de TEST)
#   - Migration de UNIQUE aplicada (production_readiness_indexes_rls.sql) —
#     sem ela, idempotência não é garantida e teste #4 dá falso negativo
#   - .env.local com VITE_SUPABASE_URL para montar a URL do webhook
# =============================================================================

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────

# Edite ou exporte antes de rodar
WEBHOOK_URL="${WEBHOOK_URL:-https://<SEU-PROJETO>.supabase.co/functions/v1/stripe-webhook}"
FAMILY_EMAIL="${FAMILY_EMAIL:-familia-teste@cuidde.dev}"   # email da família-cobaia
PAUSE_SEC="${PAUSE_SEC:-8}"                                 # tempo entre eventos pro webhook processar

# ─── Helpers ─────────────────────────────────────────────────────────────────

cyan()   { printf "\033[1;36m%s\033[0m\n" "$*"; }
yellow() { printf "\033[1;33m%s\033[0m\n" "$*"; }
green()  { printf "\033[1;32m%s\033[0m\n" "$*"; }
red()    { printf "\033[1;31m%s\033[0m\n" "$*"; }

step() {
  echo
  cyan   "═══════════════════════════════════════════════════════════════════════"
  cyan   "  $1"
  cyan   "═══════════════════════════════════════════════════════════════════════"
}

manual_check() {
  yellow "  → AÇÃO MANUAL: $1"
}

sql_check() {
  green  "  → VALIDAR NO SUPABASE (SQL Editor):"
  echo "$1" | sed 's/^/      /'
}

wait_webhook() {
  echo "  ⏳ aguardando $PAUSE_SEC s para o webhook processar…"
  sleep "$PAUSE_SEC"
}

confirm() {
  read -rp "  ↳ Tudo OK? Pressione ENTER para continuar (Ctrl+C para abortar)…"
}

# ─── Pré-flight ──────────────────────────────────────────────────────────────

if ! command -v stripe >/dev/null 2>&1; then
  red "Stripe CLI não encontrada. Instale: https://stripe.com/docs/stripe-cli"
  exit 1
fi

if [[ "$WEBHOOK_URL" == *"<SEU-PROJETO>"* ]]; then
  red "Edite WEBHOOK_URL no topo do script ou exporte WEBHOOK_URL=… antes de rodar."
  exit 1
fi

step "PRÉ-FLIGHT"
echo "Webhook alvo: $WEBHOOK_URL"
echo
yellow "ABRA OUTRO TERMINAL E RODE:"
echo "    stripe listen --forward-to $WEBHOOK_URL"
echo
yellow "Confirme que ele imprimiu o webhook signing secret (whsec_…) e que o"
yellow "secret está configurado no Supabase como STRIPE_WEBHOOK_SECRET."
confirm


# ─── 1. Checkout inicial (MANUAL — script não preenche iframe Stripe) ────────

step "1/7 — CHECKOUT INICIAL (manual)"
manual_check "Logue como família ($FAMILY_EMAIL) na app"
manual_check "Vá em /family/billing → escolha um plano (ex: Mensal)"
manual_check "No Stripe Checkout, use cartão: 4242 4242 4242 4242"
manual_check "Validade: qualquer futura · CVC: qualquer · CEP: qualquer"
manual_check "Após sucesso, deve voltar pra /family/billing com plano ativo"
sql_check "select id, plan, subscription_status, stripe_customer_id, stripe_subscription_id, current_period_end
  from family_profiles where id in (select id from profiles where email = '$FAMILY_EMAIL');
-- esperado: subscription_status='active', plan preenchido, stripe_customer_id começa com cus_, stripe_subscription_id com sub_"
sql_check "select count(*), status from invoices
  where family_id = (select id from profiles where email = '$FAMILY_EMAIL') group by status;
-- esperado: 1 linha com status='paid'"
manual_check "UI: /family/invoices mostra a fatura com status 'Paga'"
confirm


# ─── 2. Renovação OK (automático) ────────────────────────────────────────────

step "2/7 — RENOVAÇÃO BEM-SUCEDIDA (invoice.paid)"
echo "Disparando: stripe trigger invoice.paid"
stripe trigger invoice.paid
wait_webhook
sql_check "select count(*) from invoices
  where family_id = (select id from profiles where email = '$FAMILY_EMAIL');
-- esperado: 2 (a do checkout + a renovação)"
manual_check "UI: /family/invoices lista a nova fatura com status 'Paga'"
confirm


# ─── 3. Falha de pagamento (automático) ──────────────────────────────────────

step "3/7 — FALHA DE PAGAMENTO (invoice.payment_failed)"
echo "Disparando: stripe trigger invoice.payment_failed"
stripe trigger invoice.payment_failed
wait_webhook
sql_check "select subscription_status from family_profiles
  where id in (select id from profiles where email = '$FAMILY_EMAIL');
-- esperado: 'past_due'"
sql_check "select status, count(*) from invoices
  where family_id = (select id from profiles where email = '$FAMILY_EMAIL')
  group by status;
-- esperado: pelo menos 1 linha com status='overdue'"
manual_check "UI: banner 'Pagamento atrasado' aparece em /family/billing"
confirm


# ─── 4. Idempotência (automático) ────────────────────────────────────────────

step "4/7 — IDEMPOTÊNCIA DO WEBHOOK"
echo "Disparando MESMO evento 2× — não pode criar invoice duplicada"
echo "(exige UNIQUE em invoices.stripe_invoice_id da migration)"
stripe trigger invoice.paid
wait_webhook
COUNT_BEFORE_SQL="select count(*) from invoices where family_id = (select id from profiles where email = '$FAMILY_EMAIL');"
sql_check "$COUNT_BEFORE_SQL  -- ANOTE este número: ____"
confirm
stripe trigger invoice.paid
wait_webhook
sql_check "$COUNT_BEFORE_SQL  -- DEVE SER IGUAL ao anterior (não pode aumentar +1)
-- se aumentou, a UNIQUE não foi aplicada ou o webhook não usa onConflict"
confirm


# ─── 5. Cancelamento agendado (MANUAL — fluxo de UI) ─────────────────────────

step "5/7 — CANCELAMENTO AGENDADO (manual via UI)"
manual_check "Em /family/billing, clique em 'Cancelar assinatura'"
manual_check "Confirme — assinatura deve continuar ativa até current_period_end"
sql_check "select subscription_status, cancel_at_period_end, current_period_end
  from family_profiles where id in (select id from profiles where email = '$FAMILY_EMAIL');
-- esperado: subscription_status='active', cancel_at_period_end=true"
manual_check "UI: banner 'Sua assinatura termina em DD/MM/YYYY'"
manual_check "Agora reative — clique 'Reativar assinatura'"
sql_check "select cancel_at_period_end from family_profiles
  where id in (select id from profiles where email = '$FAMILY_EMAIL');
-- esperado: false"
confirm


# ─── 6. Cancelamento definitivo (automático) ─────────────────────────────────

step "6/7 — CANCELAMENTO DEFINITIVO (customer.subscription.deleted)"
echo "Disparando: stripe trigger customer.subscription.deleted"
stripe trigger customer.subscription.deleted
wait_webhook
sql_check "select subscription_status, plan from family_profiles
  where id in (select id from profiles where email = '$FAMILY_EMAIL');
-- esperado: subscription_status='canceled'"
manual_check "UI: /family/billing volta a oferecer planos (estado free)"
manual_check "UI: documentos do cuidador NÃO podem mais ser abertos (RLS bloqueia)"
confirm


# ─── 7. Upgrade/downgrade (MANUAL — exige UI + Subscription Schedule) ────────

step "7/7 — UPGRADE E DOWNGRADE (manual)"
manual_check "Re-assine no plano Mensal (volte ao passo 1)"
manual_check "UPGRADE: clique 'Trimestral' → cobra diferença imediato (always_invoice)"
sql_check "select plan from family_profiles where id in (select id from profiles where email = '$FAMILY_EMAIL');
-- esperado: 'quarterly'"
sql_check "select count(*) from invoices where family_id = (select id from profiles where email = '$FAMILY_EMAIL');
-- esperado: aumentou +1 (proration invoice)"
manual_check "DOWNGRADE: clique 'Mensal' → NÃO cobra agora, salva pending_plan"
sql_check "select plan, pending_plan from family_profiles
  where id in (select id from profiles where email = '$FAMILY_EMAIL');
-- esperado: plan='quarterly' (mantido), pending_plan='monthly'"
manual_check "UI: aviso 'Seu plano mudará para Mensal em DD/MM/YYYY'"
manual_check "Cancela o downgrade clicando 'Trimestral' de novo → libera Schedule"
sql_check "select pending_plan from family_profiles
  where id in (select id from profiles where email = '$FAMILY_EMAIL');
-- esperado: null"
confirm

green ""
green "═══════════════════════════════════════════════════════════════════════"
green "  ✅ Smoke test concluído. Cheque AUDIT.md para marcar a Fase 5."
green "═══════════════════════════════════════════════════════════════════════"
