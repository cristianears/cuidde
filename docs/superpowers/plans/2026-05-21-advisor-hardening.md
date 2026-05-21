# Advisor Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolver os achados dos Supabase Advisors com mudanças pequenas, verificáveis e reversíveis, sem quebrar fluxos reais de RLS, Storage, RPC, Stripe ou onboarding.

**Architecture:** Cada achado vira um bloco independente com baseline, migration idempotente, rollback documentado, validação específica e commit próprio. Mudanças de RLS/functions devem ser aplicadas uma tabela/função por vez sempre que houver risco funcional. O branch remoto deve permanecer protegível via `git revert` e migrations reversas, nunca via reescrita de histórico.

**Tech Stack:** React + Vite + TypeScript, Supabase Postgres/RLS/Storage/Edge Functions, Stripe Billing, Playwright, Vitest, ESLint.

---

## Status

- [x] Plano criado em `docs/superpowers/plans/2026-05-21-advisor-hardening.md`.
- [x] Branch isolada criada para o sprint de advisor hardening.
- [x] Baseline local e remoto capturado.
- [x] Bloco A concluído: `SECURITY DEFINER` executável.
- [x] Bloco B concluído: `search_path` fixo em functions.
- [ ] Bloco C concluído: RLS `auth.uid()` otimizado.
- [ ] Bloco D concluído: policies permissive duplicadas revisadas.
- [x] Bloco E concluído: Storage `avatars` sem listagem ampla.
- [x] Bloco F concluído: índice faltante em `caregiver_events.family_id`.
- [ ] Bloco G concluído: decisões manuais de Auth/Dashboard documentadas.
- [ ] Advisors reexecutados e checklist final atualizado.
- [ ] PR/push final feito.

## Estratégia De Segurança E Rollback

- [x] Trabalhar em branch nova, sugerida: `codex/advisor-hardening`. Branch usada: `codex-advisor-hardening` porque o sandbox bloqueou a criação de refs com prefixo `codex/`.
- [ ] Fazer um commit por bloco, nunca um commit gigante para todos os advisors.
- [x] Para cada migration aplicada, criar ou documentar rollback no próprio bloco.
- [ ] Não usar `git reset --hard` para desfazer trabalho; usar `git revert <commit>` quando precisar reverter código/versionamento.
- [ ] Para reverter banco remoto, aplicar uma migration reversa explícita.
- [ ] Nunca criar policy em `family_profiles` que consulte `family_profiles`.
- [x] Antes de alterar RLS, exportar `pg_policies` da tabela afetada.
- [x] Antes de alterar functions, exportar definição via `pg_get_functiondef`.
- [ ] Após alterar grants/functions/policies, rodar Supabase advisors novamente.

## Baseline Inicial

### Arquivos

- Criar: `supabase/sql/advisor_hardening_security_definer.sql`
- Criar: `supabase/sql/advisor_hardening_function_search_path.sql`
- Criar: `supabase/sql/advisor_hardening_rls_initplan.sql`
- Criar: `supabase/sql/advisor_hardening_storage_avatars.sql`
- Criar: `supabase/sql/advisor_hardening_indexes.sql`
- Criar: `supabase/sql/rollback_advisor_hardening.md`
- Modificar: `PRODUCTION_CHECKLIST.md`
- Modificar: `AUDIT.md`

### Passos

- [x] Rodar status do Git.

```powershell
git status -sb
git branch -vv
```

- [x] Criar branch isolada.

```powershell
git switch -c codex/advisor-hardening
```

- [x] Rodar baseline local.

```powershell
npm.cmd run test
npm.cmd run build
npm.cmd run lint
npm.cmd run test:e2e
```

Esperado:
- Vitest: todos os testes passando.
- Build: exit 0.
- Lint: 0 errors; warnings conhecidos podem permanecer documentados.
- E2E: 2 testes Playwright passando.

- [x] Capturar advisors.

Usar Supabase MCP:
- `get_advisors(type="security")`
- `get_advisors(type="performance")`

- [x] Exportar policies atuais.

```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;
```

- [x] Exportar functions críticas.

```sql
select
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args,
  p.prosecdef as security_definer,
  p.proconfig as config,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname, args;
```

---

## Bloco A: `SECURITY DEFINER` Executável Por Cliente

**Objetivo:** Revogar `EXECUTE` de `anon` e/ou `authenticated` em funções internas que não devem ser chamadas diretamente pela API.

**Risco:** Alto. Revogar uma RPC usada pela UI quebra fluxo real.

**Rollback:** Reaplicar `grant execute on function ... to anon/authenticated` apenas para a função revertida.

### Passos

- [x] Listar funções alertadas pelo Security Advisor.
- [x] Classificar cada função:
  - `trigger_internal`: revogar de `anon` e `authenticated`.
  - `rpc_authenticated`: manter para `authenticated`, revogar de `anon`.
  - `rpc_public_intentional`: manter e documentar justificativa.
  - `unknown`: não alterar até mapear uso no código.
- [x] Procurar uso no frontend e Edge Functions.

```powershell
rg -n "rpc\\(|compute_profile_complete|refresh_caregiver_computed|get_caregiver_public_detail|get_caregiver_gated_preview|track_caregiver" src supabase
```

- [x] Criar migration `supabase/sql/advisor_hardening_security_definer.sql`.

Modelo:

```sql
-- Example only. Fill with reviewed functions one by one.
revoke execute on function public.fn_update_caregiver_rating() from anon, authenticated;
revoke execute on function public.compute_profile_complete(uuid) from anon, authenticated;

notify pgrst, 'reload schema';
```

- [x] Aplicar migration no Supabase.
- [x] Rodar Security Advisor.
- [x] Rodar testes locais.
- [x] Smoke de permissões das RPCs usadas pelo frontend via `has_function_privilege` (sem credenciais para smoke manual autenticado nesta sessão).
- [x] Commit.

```powershell
git add supabase/sql/advisor_hardening_security_definer.sql PRODUCTION_CHECKLIST.md AUDIT.md
git commit -m "Harden security definer function grants"
```

---

## Bloco B: `search_path` Fixo Em Functions

**Objetivo:** Evitar que functions usem objetos errados por `search_path` mutável.

**Risco:** Médio/alto. Recriar function com assinatura errada quebra triggers/RPCs.

**Rollback:** Reaplicar definição anterior capturada com `pg_get_functiondef`.

### Passos

- [x] Exportar definição anterior das functions alertadas.
- [x] Para cada function, recriar preservando:
  - assinatura;
  - `security definer` ou `security invoker`;
  - owner;
  - grants;
  - lógica original.
- [x] Adicionar `set search_path = public, pg_temp` ou schema mais restrito.

Modelo:

```sql
create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

- [x] Aplicar uma function por vez se houver risco.
- [x] Rodar Security Advisor.
- [x] Rodar `npm.cmd run test`.
- [x] Rodar smoke automatizado de onboarding via Playwright; smoke autenticado de perfil não rodado por ausência de credenciais nesta sessão.
- [x] Commit.

```powershell
git add supabase/sql/advisor_hardening_function_search_path.sql PRODUCTION_CHECKLIST.md AUDIT.md
git commit -m "Set search path on database functions"
```

---

## Bloco C: RLS `auth.uid()` Com InitPlan

**Objetivo:** Trocar `auth.uid()` por `(select auth.uid())` em policies alertadas, mantendo a mesma regra de acesso.

**Risco:** Alto. Uma policy levemente errada pode abrir ou bloquear dados.

**Rollback:** Recriar policy anterior a partir do export de `pg_policies`.

### Passos

- [x] Começar por tabela de menor risco.
- [x] Exportar policies da tabela.
- [x] Recriar policy com `to authenticated` quando aplicável.
- [x] Substituir:

```sql
auth.uid() = id
```

por:

```sql
(select auth.uid()) = id
```

- [x] Em subqueries, usar o mesmo padrão.
- [x] Não alterar a regra de negócio no mesmo commit.
- [x] Aplicar migration. Grupo C1: `support_tickets`, `caregiver_availability`, `caregiver_documents`.
- [x] Rodar Performance Advisor. Grupo C1 saiu dos alertas de initplan.
- [x] Rodar smoke do domínio da tabela. Validação por `pg_policies` e suíte local; smoke autenticado manual não rodado por ausência de credenciais.
- [x] Commit por grupo pequeno de tabelas. Grupo C1.
- [x] Grupo C2: `family_profiles`.

```powershell
git add supabase/sql/advisor_hardening_rls_initplan.sql PRODUCTION_CHECKLIST.md AUDIT.md
git commit -m "Optimize RLS auth uid policies"
```

---

## Bloco D: Policies Permissive Duplicadas

**Objetivo:** Remover ou consolidar policies redundantes para reduzir custo e ambiguidade.

**Risco:** Alto em `messages`, `reviews`, `profiles`, `professional_references`.

**Rollback:** Recriar policies removidas a partir do export.

### Passos

- [ ] Para cada tabela alertada, listar policies por `cmd`.
- [ ] Identificar duplicidade real versus regra complementar.
- [ ] Consolidar uma tabela por vez.
- [ ] Evitar mexer em `messages` primeiro; começar por uma tabela de menor blast radius.
- [ ] Aplicar migration.
- [ ] Rodar advisor.
- [ ] Rodar testes e smoke do domínio.
- [ ] Commit.

---

## Bloco E: Storage `avatars` Sem Listing Amplo

**Objetivo:** Manter leitura pública por URL quando necessário, mas impedir listagem ampla do bucket.

**Risco:** Médio. Pode quebrar exibição/upload de avatar.

**Rollback:** Recriar policy anterior de `storage.objects`.

### Passos

- [x] Exportar policies atuais do bucket `avatars`.

```sql
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;
```

- [x] Ajustar policy para evitar listagem ampla.
- [x] Confirmar upload de avatar. Validado por policies de INSERT/UPDATE próprias preservadas e SELECT própria para upsert; upload manual autenticado não rodado por ausência de credenciais.
- [x] Confirmar avatar renderiza nas telas. URL pública existente de avatar respondeu HTTP 200.
- [x] Rodar Security Advisor.
- [x] Commit.

---

## Bloco F: Índice Faltante Em `caregiver_events.family_id`

**Objetivo:** Resolver FK sem índice apontada pelo Performance Advisor.

**Risco:** Baixo.

**Rollback:** `drop index concurrently if exists idx_caregiver_events_family_id;`

### Migration

```sql
create index concurrently if not exists idx_caregiver_events_family_id
  on public.caregiver_events (family_id);
```

Observação: se a ferramenta de migration não aceitar `concurrently` em transação, usar:

```sql
create index if not exists idx_caregiver_events_family_id
  on public.caregiver_events (family_id);
```

### Validação

- [x] Aplicar migration.
- [x] Rodar Performance Advisor.
- [x] Confirmar que o alerta sumiu.
- [x] Commit.

---

## Bloco G: Itens De Dashboard/Auth

**Objetivo:** Documentar e executar itens que não são apenas SQL versionável.

### Itens

- [ ] Avaliar `Leaked Password Protection Disabled`.
- [ ] Se disponível no plano atual, ativar no Supabase Dashboard.
- [ ] Se não disponível ou se for decisão de negócio, registrar no `PRODUCTION_CHECKLIST.md`.
- [ ] Confirmar que URLs de Auth/redirect seguem corretas para produção.

---

## Verificação Final

- [ ] Rodar Supabase Security Advisor.
- [ ] Rodar Supabase Performance Advisor.
- [ ] Rodar comandos locais.

```powershell
npm.cmd run test
npm.cmd run build
npm.cmd run lint
npm.cmd run test:e2e
```

- [ ] Smoke manual final:
  - [ ] Login família.
  - [ ] Onboarding família com CEP.
  - [ ] Perfil família carrega sem F5.
  - [ ] Busca de cuidadores.
  - [ ] Perfil público de cuidador.
  - [ ] Billing active/past_due.
  - [ ] Chat/agendamento.
  - [ ] Upload/exibição de avatar.

- [ ] Atualizar `PRODUCTION_CHECKLIST.md`.
- [ ] Commit final, push e PR.

```powershell
git status -sb
git push
```

## Quando Criar Skill Ou Plugin

- [x] Para este sprint, `.md` é suficiente.
- [ ] Criar uma skill se este checklist virar processo recorrente entre projetos ou todo pré-deploy.
- [ ] Criar plugin apenas se precisarmos empacotar automações, MCPs, scripts e templates reutilizáveis.

Recomendação atual: manter como `.md` versionado neste repositório. Depois de executar uma vez e estabilizar o processo, extrair para skill `production-hardening` se ele se repetir.
