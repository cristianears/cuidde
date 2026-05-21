# Production Readiness Checklist

Data inicial: 2026-05-07
Ambiente atual: local (`http://localhost:5173`) apontando para Supabase configurado em `.env.local`

## Baseline local

- `npm.cmd run test`: passou, 121 testes em 15 arquivos.
- `npm.cmd run test:e2e`: passou, 2 testes Playwright em Chromium.
- `npm.cmd run build`: passou.
- `npm.cmd run lint`: passou com warnings nao bloqueantes.

### Observacoes do baseline

- No PowerShell, usar `npm.cmd` em vez de `npm`, pois `npm.ps1` pode ser bloqueado pela politica de execucao do Windows.
- O Vitest pode falhar com `spawn EPERM` dentro do sandbox. Quando isso acontecer, rerodar fora do sandbox para separar erro de ambiente de erro real.
- O Playwright local usa Chromium instalado em `%LOCALAPPDATA%\ms-playwright`; se o install falhar por certificado, usar `NODE_OPTIONS=--use-system-ca`.
- O lint do app principal passa. Warnings restantes sao de Fast Refresh e dependencias de hooks a revisar com calma.

## Verificacao local no navegador

- `http://localhost:5173/`: carregou a home.
- `/onboarding?from=google&type=family&cep=12236063`: carregou fluxo de familia.
- CEP preservado ate a etapa de endereco.
- ViaCEP preencheu rua, bairro, cidade e UF.
- O botao de continuar no endereco fica bloqueado enquanto numero nao e preenchido.

## Fluxos criticos antes de producao

### Familia

- [ ] Criar familia via CEP na home + Google.
- [ ] Finalizar cadastro com telefone e endereco.
- [ ] Confirmar que `profiles.full_name` e `profiles.phone` foram salvos.
- [ ] Confirmar que `family_profiles.cep`, `street`, `number`, `neighborhood`, `city`, `state` foram salvos.
- [ ] Confirmar que `family_profiles.lat` e `family_profiles.lng` foram salvos.
- [ ] Abrir "Meu Perfil" sem F5 e confirmar telefone/endereco.
- [ ] Abrir "Buscar Cuidadores" e confirmar filtro "Raio de busca".
- [ ] Alterar endereco em "Meu Perfil" e confirmar nova geocodificacao.

### Busca de cuidadores

- [ ] Cuidador aparece quando `profile_complete = true`, `has_rg_cnh = true`, `is_available_for_new = true`.
- [ ] Cuidador nao aparece quando `profile_complete = false`.
- [ ] Cuidador nao aparece quando `has_rg_cnh = false`.
- [ ] Cuidador nao aparece quando `is_available_for_new = false`.
- [ ] Cuidador aparece mesmo com `status != 'verified'`, se cumprir os tres criterios da busca.
- [ ] Busca por proximidade retorna distancia quando familia tem `lat/lng`.
- [ ] Fallback por cidade/bairro funciona quando familia nao tem `lat/lng`.

### Cuidador

- [ ] Criar cuidador via onboarding.
- [ ] Completar dados minimos de perfil.
- [ ] Enviar RG/CNH valido.
- [ ] Confirmar `has_rg_cnh = true`.
- [ ] Confirmar `profile_complete = true`.
- [ ] Alternar disponibilidade e confirmar impacto na busca.

### Perfil publico do cuidador

- [ ] Familia free acessa preview limitado.
- [ ] Familia active acessa documentos/referencias permitidos.
- [ ] Documentos filtram `is_visible = true` e nao exibem `rg_cnh` publicamente.
- [ ] Familia sem permissao nao consegue baixar documento diretamente.

### Agendamentos e chat

- [ ] Familia solicita atendimento.
- [ ] Cuidador recebe solicitacao.
- [ ] Cuidador aceita.
- [ ] Familia ve status atualizado.
- [ ] Chat abre para participantes.
- [ ] Usuario nao participante nao acessa chat/agendamento.

### Stripe

- [ ] Checkout abre para familia.
- [x] Webhook atualiza `subscription_status`.
- [x] `invoice.payment_failed` marca `family_profiles.subscription_status = 'past_due'`.
- [x] `invoice.payment_failed` cria/atualiza invoice com `status = 'overdue'`.
- [x] Pagamento posterior da invoice gera `invoice.paid` e volta familia para `active`.
- [x] Cliente nao altera campos Stripe diretamente:
  `plan`, `subscription_status`, `stripe_customer_id`, `stripe_subscription_id`,
  `pending_plan`, `cancel_at_period_end`, `current_period_end`, `payment_failed_at`.
- [ ] Upgrade e downgrade seguem regra do projeto.
- [ ] Invoice nao duplica em webhook repetido.

## RLS e Supabase

- [x] Exportar policies com `pg_policies` antes de nova alteracao.
- [ ] Confirmar que `family_profiles` nao tem policy com auto-consulta.
- [ ] Confirmar que busca de cuidadores nao depende de `status = 'verified'`.
- [x] Confirmar que `service_role_key` nao existe no frontend (`rg` encontrou apenas `.env.example`).
- [ ] Confirmar Storage RLS para documentos.
- [ ] Confirmar Edge Functions autenticadas onde necessario.

### Advisor hardening - 2026-05-21

- [x] Baseline local: `test`, `build`, `lint` e `test:e2e` passaram. Lint manteve 10 warnings conhecidos.
- [x] Baseline remoto: Security e Performance Advisors capturados antes das migrations.
- [x] `pg_policies` e `pg_get_functiondef` exportados antes das alteracoes.
- [x] Bloco A aplicado: grants de `SECURITY DEFINER` revisados.
- [x] Bloco B aplicado: `search_path` fixo em functions alertadas.
- [ ] Bloco C aplicado: RLS `auth.uid()` otimizado com initplan.
  - [x] Grupo C1: `support_tickets`, `caregiver_availability` e `caregiver_documents`.
  - [x] Grupo C2: `family_profiles`.
  - [x] Grupo C3: `favorites` e `invoices`.
  - [x] Grupo C4: `caregiver_profiles`.
- [ ] Bloco D aplicado: policies permissive duplicadas revisadas.
  - [x] Grupo D1: `reviews`.
  - [x] Grupo D2: `professional_references`.
- [x] Bloco E aplicado: bucket `avatars` sem listagem ampla.
- [x] Bloco F aplicado: indice em `caregiver_events.family_id`.
- [x] Bloco G documentado: Auth leaked password protection e URLs de redirect.

### Auth Dashboard - decisoes manuais

- [ ] Supabase Dashboard: habilitar **Leaked Password Protection** em Authentication > Sign In / Password Security. Advisor 2026-05-21 ainda reporta `auth_leaked_password_protection`.
- [ ] Supabase Dashboard: cadastrar redirects de producao quando o dominio final existir:
  - `https://<dominio-producao>/login`
  - `https://<dominio-producao>/auth/callback`
  - `https://<dominio-producao>/reset-password`
- [x] Redirects no codigo revisados: signup usa `/login`, Google OAuth usa `/auth/callback`, reset de senha usa `/reset-password`.
- [ ] Edge Functions CORS: adicionar dominio de producao em `create-checkout` e `admin-actions` antes do go-live.

### Protecao Stripe em `family_profiles`

- [x] SQL preparado em `supabase/sql/production_readiness_indexes_rls.sql`.
- [x] Migration aplicada no Supabase remoto: `protect_family_stripe_fields`.
- [x] Rodar query de `has_column_privilege` abaixo e confirmar que campos Stripe retornam `false`.
- [ ] Confirmar que saves de endereco/perfil/foto da familia continuam funcionando.
- [x] Confirmar que `service_role` continua com permissao de atualizar campos server-owned.
- [ ] Confirmar que Edge Functions Stripe continuam atualizando campos server-owned apos a migration.

### E2E Playwright

- [x] `npm.cmd run test:e2e`: passou com 2 testes em Chromium.
- [x] Home preserva CEP e navega para onboarding de familia.
- [x] Fluxo Google simulado preserva CEP ate etapa de endereco.
- [x] ViaCEP mockado preenche rua, bairro, cidade e estado.
- [ ] Adicionar E2E autenticado para "Meu Perfil" carregar telefone/endereco sem F5.
- [ ] Adicionar E2E autenticado para busca exibir "Raio de busca" quando familia tem `lat/lng`.
- [ ] Adicionar E2E autenticado para plano `past_due` bloquear/limitar CTAs pagos.

## Comandos de validacao

```powershell
npm.cmd run test
npm.cmd run build
npm.cmd run lint
```

## Queries uteis

```sql
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

```sql
-- family_profiles nao pode ter policy com auto-consulta.
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'family_profiles'
order by policyname;
```

```sql
-- Cliente autenticado nao deve ter UPDATE table-level,
-- nem UPDATE/INSERT nos campos Stripe server-owned.
select
  has_table_privilege('authenticated', 'public.family_profiles', 'UPDATE') as authenticated_table_update,
  has_column_privilege('authenticated', 'public.family_profiles', 'cep', 'UPDATE') as can_update_cep,
  has_column_privilege('authenticated', 'public.family_profiles', 'lat', 'UPDATE') as can_update_lat,
  has_column_privilege('authenticated', 'public.family_profiles', 'plan', 'UPDATE') as can_update_plan,
  has_column_privilege('authenticated', 'public.family_profiles', 'subscription_status', 'UPDATE') as can_update_subscription_status,
  has_column_privilege('authenticated', 'public.family_profiles', 'stripe_customer_id', 'UPDATE') as can_update_stripe_customer_id,
  has_column_privilege('authenticated', 'public.family_profiles', 'stripe_subscription_id', 'UPDATE') as can_update_stripe_subscription_id,
  has_column_privilege('authenticated', 'public.family_profiles', 'pending_plan', 'UPDATE') as can_update_pending_plan,
  has_column_privilege('authenticated', 'public.family_profiles', 'cancel_at_period_end', 'UPDATE') as can_update_cancel_at_period_end,
  has_column_privilege('authenticated', 'public.family_profiles', 'current_period_end', 'UPDATE') as can_update_current_period_end,
  has_column_privilege('authenticated', 'public.family_profiles', 'payment_failed_at', 'UPDATE') as can_update_payment_failed_at,
  has_column_privilege('authenticated', 'public.family_profiles', 'plan', 'INSERT') as can_insert_plan,
  has_column_privilege('authenticated', 'public.family_profiles', 'subscription_status', 'INSERT') as can_insert_subscription_status,
  has_column_privilege('authenticated', 'public.family_profiles', 'payment_failed_at', 'INSERT') as can_insert_payment_failed_at;
```

```sql
select
  fp.id,
  p.full_name,
  p.phone,
  fp.cep,
  fp.street,
  fp.number,
  fp.neighborhood,
  fp.city,
  fp.state,
  fp.lat,
  fp.lng,
  fp.created_at,
  fp.updated_at
from family_profiles fp
left join profiles p on p.id = fp.id
order by fp.created_at desc
limit 10;
```

## Criterio minimo para seguir para deploy

- Testes automatizados passando.
- Build passando.
- Lint do app principal sem erros bloqueantes.
- Fluxo familia via Google + CEP funcionando sem F5.
- Busca por raio funcionando.
- RLS sem recursao.
- Regras Stripe protegidas contra update direto pelo cliente.

## Skills recomendadas para o restante da aprovacao

- `superpowers:systematic-debugging`: usar em qualquer falha de E2E, webhook ou RLS antes de corrigir.
- `superpowers:test-driven-development`: usar para novos helpers de acesso, billing ou regras de UI.
- `build-web-apps:frontend-testing-debugging` + Browser: usar para validar renderizacao real, console e interacoes locais.
- `build-web-apps:supabase-postgres-best-practices`: usar em qualquer mudanca de RLS, grants, indices ou policies.
- `build-web-apps:stripe-best-practices`: usar para checkout, Billing, webhooks, retry de invoice e portal Stripe.
- `superpowers:verification-before-completion`: usar antes de marcar qualquer bloco como pronto para producao.
