# Auditoria pré-produção — Cuidde

> Registro de cada skill rodada antes do go-live. Atualizar após cada execução.
> Arquivo de diligência: se algo quebrar em produção, consultar aqui se foi coberto.

---

## Legenda

- 🔴 **Bloqueante** — corrigido nesta sessão (vaza dado, quebra pagamento, derruba app)
- 🟡 **Importante** — corrigido nesta sessão (bug real, não crítico)
- 🟢 **Nice-to-have** — virou issue para pós-launch
- ⚪ **Falso positivo** — descartado com justificativa

---

## Status geral

| Fase | Skill | Data | Status | Bloq. | Imp. | Issue | FP |
|------|-------|------|--------|-------|------|-------|-----|
| 1 | simplify | — | ⏳ | — | — | — | — |
| 1 | find-bugs | — | ⏳ | — | — | — | — |
| 3 | postgres-best-practices | — | ⏳ | — | — | — | — |
| 3 | database-optimizer | — | ⏳ | — | — | — | — |
| 4 | idor-testing | — | ⏳ | — | — | — | — |
| 4 | broken-authentication | — | ⏳ | — | — | — | — |
| 4 | api-security-best-practices | — | ⏳ | — | — | — | — |
| 4 | secrets-management | — | ⏳ | — | — | — | — |
| 5 | stripe-integration | — | ⏳ | — | — | — | — |
| 5 | payment-integration | — | ⏳ | — | — | — | — |
| 5 | privacy-by-design | — | ⏳ | — | — | — | — |
| 6 | observability-engineer | — | ⏳ | — | — | — | — |
| 7 | accessibility-compliance-accessibility-audit | — | ⏳ | — | — | — | — |
| 8 | codex:adversarial-review | — | ⏳ | — | — | — | — |

**Legenda status:** ⏳ pendente · 🔄 em andamento · ✅ concluído

---

## Findings prévios (já corrigidos antes desta auditoria)

### 2026-04-26 — Codex adversarial review

- 🔴 **Vazamento de campos gated** (`usePublicCaregiverProfile.ts`)
  - **Problema:** `professional_reg_number` e `full_name` retornavam na resposta do Supabase para famílias free; masking só ocorria no client.
  - **Fix:** RPC `get_caregiver_public_detail` com `SECURITY DEFINER` faz gating server-side.
  - **Arquivos:** `supabase/sql/get_caregiver_public_detail.sql`, `src/hooks/usePublicCaregiverProfile.ts`

- 🔴 **Status incorreto de invoice falhada** (`stripe-webhook/index.ts`)
  - **Problema:** `invoice.payment_failed` upsertava `status: 'open'` em vez de `overdue`. UI/admin perdiam distinção entre inadimplência e pendência normal.
  - **Fix:** Restaurado `status: 'overdue'`.

---

## Fase 1 — Higiene básica

### Skill: simplify
- **Data:** —
- **Commits:** —
- **Bloqueantes:** —
- **Importantes:** —
- **Issues criadas:** —
- **Falsos positivos:**
  - —

### Skill: find-bugs
- **Data:** —
- **Commits:** —
- **Bloqueantes:** —
- **Importantes:** —
- **Issues criadas:** —
- **Falsos positivos:**
  - —

---

## Fase 3 — Banco e dados

### Skill: postgres-best-practices
- **Data:** —
- **Commits:** —
- **Bloqueantes:** —
- **Importantes:** —
- **Issues criadas:** —
- **Falsos positivos:**
  - —

### Skill: database-optimizer
- **Data:** —
- **Commits:** —
- **Bloqueantes:** —
- **Importantes:** —
- **Issues criadas:** —
- **Falsos positivos:**
  - —

---

## Fase 4 — Segurança

### Skill: idor-testing
- **Data:** —
- **Commits:** —
- **Bloqueantes:** —
- **Importantes:** —
- **Issues criadas:** —
- **Falsos positivos:**
  - —

### Skill: broken-authentication
- **Data:** —
- **Commits:** —
- **Bloqueantes:** —
- **Importantes:** —
- **Issues criadas:** —
- **Falsos positivos:**
  - —

### Skill: api-security-best-practices
- **Data:** —
- **Commits:** —
- **Bloqueantes:** —
- **Importantes:** —
- **Issues criadas:** —
- **Falsos positivos:**
  - —

### Skill: secrets-management
- **Data:** —
- **Commits:** —
- **Bloqueantes:** —
- **Importantes:** —
- **Issues criadas:** —
- **Falsos positivos:**
  - —

---

## Fase 5 — Pagamento

### Skill: stripe-integration
- **Data:** —
- **Commits:** —
- **Bloqueantes:** —
- **Importantes:** —
- **Issues criadas:** —
- **Falsos positivos:**
  - —

### Skill: payment-integration
- **Data:** —
- **Commits:** —
- **Bloqueantes:** —
- **Importantes:** —
- **Issues criadas:** —
- **Falsos positivos:**
  - —

### Skill: privacy-by-design (LGPD)
- **Data:** —
- **Commits:** —
- **Bloqueantes:** —
- **Importantes:** —
- **Issues criadas:** —
- **Falsos positivos:**
  - —

---

## Fase 6 — Observabilidade

### Skill: observability-engineer
- **Data:** —
- **Commits:** —
- **Configurado:**
  - [ ] Sentry / error tracking
  - [ ] Alertas no webhook Stripe (taxa de falha)
  - [ ] Health check da app
  - [ ] Logs sem PII
- **Issues criadas:** —
- **Falsos positivos:**
  - —

---

## Fase 7 — Acessibilidade

### Skill: accessibility-compliance-accessibility-audit
- **Data:** —
- **Commits:** —
- **Bloqueantes:** —
- **Importantes:** —
- **Issues criadas:** —
- **Falsos positivos:**
  - —

---

## Fase 8 — Veredito final

### Skill: codex:adversarial-review
- **Data:** —
- **Verdict:** —
- **Findings restantes:** —
- **Decisão:** ⏳ aguardando

---

## Checklist operacional pré-go-live

> Estes itens NÃO são cobertos por skills — são engenharia operacional.

### Infra
- [ ] Repositório no git inicializado e versionado (`git init`)
- [ ] Branches `main` protegida
- [ ] Backups Supabase testados (não basta ter — restaurar uma vez)
- [ ] Plano de rollback documentado (como reverter um deploy ruim em <5min)

### Testes
- [ ] Smoke test manual completo: família free, família paga, cuidador, admin
- [ ] Smoke test em mobile (Chrome Android + Safari iOS)
- [ ] Smoke test em conexão lenta (DevTools throttling 3G)
- [ ] Stripe CLI: `stripe trigger invoice.payment_failed`
- [ ] Stripe CLI: `stripe trigger customer.subscription.deleted`
- [ ] Stripe CLI: `stripe trigger invoice.paid` (assinatura nova)
- [ ] Cancelamento + reativação no mesmo período
- [ ] Upgrade mensal → trimestral (`always_invoice`)
- [ ] Downgrade trimestral → mensal (Subscription Schedule, `pending_plan`)

### LGPD / legal
- [ ] Termos de uso publicados
- [ ] Política de privacidade publicada
- [ ] Fluxo de exclusão de dados implementado e testado
- [ ] DPO ou responsável LGPD definido

### Soft launch
- [ ] Lista de 10 famílias-piloto convidadas
- [ ] Janela de monitoramento ativa nas primeiras 72h
- [ ] Telefone/canal de feedback direto com piloto

---

## Decisão final

- [ ] Todas as fases ✅
- [ ] Checklist operacional ✅
- [ ] Sentry recebendo eventos em produção
- [ ] Stripe webhook em produção respondendo eventos do live mode

**Liberado para go-live em:** —
**Responsável:** —
