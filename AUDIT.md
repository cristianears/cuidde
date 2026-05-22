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
| 3 | postgres-best-practices | 2026-04-27 | ✅ | 3 | 5 | — | 0 |
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
- **Data:** 2026-04-27
- **Commits:** —
- **Arquivos:** `supabase/sql/production_readiness_indexes_rls.sql` (migration única, idempotente — aplicar via Supabase Dashboard → SQL Editor)
- **Bloqueantes:**
  - 🔴 **FKs sem índice em todas as tabelas relacionais** — `appointments.family_id/caregiver_id`, `messages.appointment_id/sender_id`, `reviews.*_id`, `favorites.*_id`, `invoices.family_id`, `caregiver_documents.caregiver_id`, `professional_references.caregiver_id`, `caregiver_availability.caregiver_id`, `care_routines.appointment_id`, `support_tickets.user_id`, `system_logs.user_id`. Queries de RLS (`auth.uid() = family_id`) e ON DELETE CASCADE viram seq scan em produção. Fix: 16 `CREATE INDEX IF NOT EXISTS` na migration.
  - 🔴 **Falta de UNIQUE em IDs do Stripe** — `family_profiles.stripe_customer_id`, `family_profiles.stripe_subscription_id`, `invoices.stripe_invoice_id`. O webhook (`stripe-webhook/index.ts:170`) faz `upsert(..., { onConflict: 'stripe_invoice_id' })` — sem unique constraint, primeira corrida gera linha duplicada. Risco de cobrança duplicada na UI. Fix: 3 `ADD CONSTRAINT ... UNIQUE` idempotentes.
  - 🔴 **RLS chamando `auth.uid()` por linha** — todas as policies do `SPEC.md` usam `auth.uid() = id` direto. Postgres re-avalia VOLATILE por linha → 10–100× mais lento em `messages`/`appointments` quando crescerem. Fix: drop+recreate envolvendo em `(select auth.uid())` (recomendação oficial Supabase, regra 3.3 do guia).
- **Importantes:**
  - 🟡 **Hot path do chat sem índice composto** — `useChatMessages` faz `eq(appointment_id).order(created_at)`. Fix: `idx_messages_appointment_created (appointment_id, created_at)`.
  - 🟡 **`useUnreadCounts` faz seq scan em messages** — query `WHERE read_at IS NULL AND sender_id <> me AND appointment_id IN (...)`. Fix: índice parcial `idx_messages_unread (appointment_id, sender_id) WHERE read_at IS NULL` — 10–100× menor que índice completo, ataca exatamente o filtro.
  - 🟡 **`useSearchCaregivers` filtros de array sem GIN** — `.contains('modalities', [...])` e `.contains('idiomas', [...])` viram seq scan. Fix: 3 índices `USING GIN` em `modalities`, `idiomas`, `specialties`.
  - 🟡 **ILIKE wildcard duplo em `city`/`neighborhood` sem trigram** — Fix: `CREATE EXTENSION pg_trgm` + 2 índices `gin_trgm_ops` + 1 índice parcial sobre cuidadores elegíveis para busca (`profile_complete AND has_rg_cnh AND is_available_for_new`).
  - 🟡 **Sem `statement_timeout`** — query lenta de cliente comprometido pode travar conexão indefinidamente. Fix: `alter role authenticated set statement_timeout = '8s'`, `anon = '5s'`. Não afeta `service_role`.
- **Issues criadas (pós-launch, não-bloqueantes):**
  - 🟢 Trocar `useInvoices`, `useReviews`, `useAppointments` para paginação cursor-based — hoje fazem `order by created_at desc` sem `limit`. OK enquanto volume é baixo, mas degrada O(N) com a base.
  - 🟢 `system_logs` deve crescer rápido (logs de auditoria) — considerar particionamento por `range(created_at)` mensal quando passar de 10M linhas (regra 4.3).
  - 🟢 Migrar UUIDs aleatórios (default `gen_random_uuid()` herdado de `auth.users` para PKs) para UUIDv7 nas tabelas filhas (`appointments`, `messages`, `reviews`, etc.) ao próximo refactor — UUIDv4 fragmenta o índice da PK.
- **Falsos positivos:**
  - ⚪ Mixed-case identifiers — schema já usa snake_case lowercase em todas as tabelas. Nada a fazer.
  - ⚪ JSONB indexing — projeto não usa colunas JSONB em filtros (apenas como output de RPCs). Não aplicável.
  - ⚪ Connection pooling — Supabase já provê PgBouncer (Supavisor) por padrão na porta 6543. Edge Functions usam pool nativo.

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

### 2026-05-21 - Advisor hardening

- **Baseline local:** `npm.cmd run test` passou com 121 testes; `build` passou; `lint` passou com 10 warnings conhecidos; `test:e2e` passou com 2 testes.
- **Baseline remoto:** Supabase Security Advisor apontou functions `SECURITY DEFINER`, `search_path`, bucket `avatars`, `pg_trgm` em `public`, `system_logs` sem policy e Auth leaked password protection. Performance Advisor apontou FK sem indice, RLS initplan e duplicidade de policies.
- **Bloco A classificacao:** trigger/helpers internos perdem `anon` e `authenticated`; RPCs usadas pelo frontend perdem `anon` e mantem `authenticated`.
- **Bloco A validacao:** migration aplicada no Supabase; Security Advisor removeu os alertas `anon_security_definer_function_executable`; `has_function_privilege` confirmou a matriz esperada; `test`, `build`, `lint` e `test:e2e` passaram.
- **Bloco B validacao:** `ALTER FUNCTION ... SET search_path = public, pg_temp` aplicado nas 8 functions alertadas; Security Advisor removeu os alertas `function_search_path_mutable`; `pg_proc.proconfig` confirmou `search_path=public, pg_temp`; `test`, `build`, `lint` e `test:e2e` passaram.
- **Bloco C1 validacao:** policies de `support_tickets`, `caregiver_availability` e `caregiver_documents` recriadas com `to authenticated` e `(select auth.uid())`; Performance Advisor deixou de listar essas tabelas para initplan; `pg_policies` confirmou as regras; `test`, `build`, `lint` e `test:e2e` passaram.
- **Bloco C2 validacao:** policies de leitura vinculada em `family_profiles` recriadas sem auto-consulta da tabela; Performance Advisor deixou de listar `family_profiles` para initplan; `pg_policies` confirmou `(select auth.uid())`; `test`, `build`, `lint` e `test:e2e` passaram.
- **Bloco C3 validacao:** policies legadas redundantes de `favorites` e `invoices` removidas; Performance Advisor deixou de listar essas duas tabelas para initplan; `pg_policies` confirmou as policies otimizadas restantes; `test`, `build`, `lint` e `test:e2e` passaram.
- **Bloco C4 validacao:** policy legada redundante de `caregiver_profiles` removida e leitura pública recriada com `(select auth.uid())`; Performance Advisor deixou de listar `caregiver_profiles` para initplan; `pg_policies` confirmou regras preservadas; `test`, `build`, `lint` e `test:e2e` passaram.
- **Bloco E validacao:** SELECT ampla `avatars: leitura pública` substituída por `avatars: leitura própria`; Security Advisor removeu `public_bucket_allows_listing`; `pg_policies` confirmou INSERT/UPDATE próprios preservados; URL pública existente de avatar respondeu HTTP 200; `npm.cmd run test` passou.
- **Bloco F validacao:** indice `idx_caregiver_events_family_id` criado em `public.caregiver_events(family_id)`; Performance Advisor removeu o alerta `unindexed_foreign_keys` de `caregiver_events_family_id_fkey`; `pg_indexes` confirmou o indice.
- **Bloco D1 validacao:** policy INSERT ampla de `reviews` removida e regra de atendimento finalizado recriada com `(select auth.uid())`; Performance Advisor deixou de listar `reviews` em policies permissive duplicadas e initplan; `pg_policies` confirmou a regra; `test`, `build`, `lint` e `test:e2e` passaram.
- **Bloco D2 validacao:** `professional_references` consolidada em uma SELECT para dono ou família assinante e writes separados por comando para o dono; Performance Advisor deixou de listar `professional_references` para initplan e policies permissive duplicadas; `pg_policies` confirmou regras preservadas; `test`, `build`, `lint` e `test:e2e` passaram.
- **Bloco D3 validacao:** `caregiver_profiles` consolidada em uma SELECT com a união das leituras anteriores e writes separados por comando para o dono; Performance Advisor deixou de listar `caregiver_profiles` para policies permissive duplicadas; `pg_policies` confirmou regras preservadas; `test`, `build`, `lint` e `test:e2e` passaram.
- **Bloco D4 validacao:** `caregiver_availability` manteve SELECT pública e separou insert/update/delete do dono; Performance Advisor deixou de listar `caregiver_availability` para policies permissive duplicadas; `pg_policies` confirmou regras preservadas; `test`, `build`, `lint` e `test:e2e` passaram.
- **Bloco D5 validacao:** `caregiver_documents` consolidada em uma SELECT para dono ou família assinante com documento visível e writes separados por comando para o dono; Performance Advisor deixou de listar `caregiver_documents` para policies permissive duplicadas; `pg_policies` confirmou regras preservadas; `test`, `build`, `lint` e `test:e2e` passaram.
- **Bloco D6 validacao:** `family_profiles` consolidada em uma SELECT para dono ou cuidador vinculado por atendimento `pendente`, `ativo` ou `finalizado`, sem auto-consulta em `family_profiles`; Performance Advisor deixou de listar `family_profiles` para policies permissive duplicadas; `pg_policies` confirmou regras preservadas; `test`, `build`, `lint` e `test:e2e` passaram.
- **Bloco D7 validacao:** `profiles` consolidada em uma SELECT contextual única e writes do dono separados por comando; Performance Advisor deixou de listar `profiles` para policies permissive duplicadas e initplan; `pg_policies` confirmou regras preservadas; `test`, `build`, `lint` e `test:e2e` passaram.
- **Bloco G decisao:** `auth_leaked_password_protection` permanece como acao manual de Supabase Dashboard; redirects do codigo revisados (`/login`, `/auth/callback`, `/reset-password`); checklist registra redirects e CORS de producao pendentes ate existir dominio final.
- **Rollback:** documentado em `supabase/sql/rollback_advisor_hardening.md`.

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
