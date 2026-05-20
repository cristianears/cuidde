# Stripe — Passo a passo de teste pré-produção (100% navegador)

> Roteiro linear usando apenas **Stripe Dashboard** + **Supabase Dashboard** + sua app.
> Sem instalar Stripe CLI. Faça **na ordem**, sem pular passos.
> Tempo estimado: **40–60 min** na primeira vez.

---

## Antes de começar (uma vez só)

### 0.1. Confirmar test mode no Stripe Dashboard

- [ ] Abrir https://dashboard.stripe.com
- [ ] Canto superior: ativar **View test data** (toggle laranja "Test mode")
- [ ] Confirmar que a URL agora tem `/test/` (ex: `dashboard.stripe.com/test/dashboard`)

### 0.2. Verificar webhook configurado

- [ ] **Developers → Webhooks**
- [ ] Deve existir endpoint apontando para `https://<SEU-PROJETO>.supabase.co/functions/v1/stripe-webhook`
- [ ] Clicar nele → **Signing secret → Reveal** → copiar `whsec_…`
- [ ] Comparar com o secret no Supabase: **Edge Functions → stripe-webhook → Secrets → STRIPE_WEBHOOK_SECRET**
- [ ] Se diferente: atualizar no Supabase e fazer redeploy da function
- [ ] Eventos escutados precisam incluir, no mínimo:
  - `checkout.session.completed`
  - `checkout.session.expired`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`

### 0.3. Família-cobaia criada

- [ ] Acessar a app, fazer signup com `familia-teste@cuidde.dev` (ou um e-mail seu)
- [ ] Completar onboarding como **família** até cair em `/family`
- [ ] Anotar o `id` (Supabase Dashboard → Table Editor → `profiles` → filtrar por email)

### 0.4. Migration de hardening aplicada

- [ ] Supabase Dashboard → SQL Editor
- [ ] Colar `supabase/sql/production_readiness_indexes_rls.sql` → **Run**
- [ ] Validar UNIQUE constraint:
  ```sql
  select conname from pg_constraint
   where conrelid = 'public.invoices'::regclass and contype = 'u';
  -- deve aparecer: invoices_stripe_invoice_id_key
  ```

---

## Passo 1 — Checkout inicial (pela sua app)

### 1.1. Logar e iniciar assinatura

- [ ] Logar na app como `familia-teste@cuidde.dev`
- [ ] Ir em `/family/billing` → clicar plano **Mensal (R$ 127)** → **Assinar**
- [ ] Vai para `checkout.stripe.com/...`

### 1.2. Cartão de teste

| Campo | Valor |
|---|---|
| Número | `4242 4242 4242 4242` |
| Validade | qualquer data futura (ex: `12/34`) |
| CVC | `123` |
| Nome | qualquer |
| CEP | `01310100` |

- [ ] Clicar **Assinar** → volta para `/family/billing`

### 1.3. Validar no banco

Supabase Dashboard → SQL Editor:

```sql
select id, plan, subscription_status, stripe_customer_id,
       stripe_subscription_id, current_period_end
  from family_profiles
 where id = (select id from profiles where email = 'familia-teste@cuidde.dev');
```

- [ ] `subscription_status = 'active'`
- [ ] `plan = 'monthly'`
- [ ] `stripe_customer_id` começa com `cus_`
- [ ] `stripe_subscription_id` começa com `sub_`
- [ ] `current_period_end` ~1 mês no futuro

```sql
select count(*), status
  from invoices
 where family_id = (select id from profiles where email = 'familia-teste@cuidde.dev')
 group by status;
```

- [ ] 1 linha com `status='paid'`

### 1.4. Validar UI

- [ ] `/family/billing` mostra "Plano Mensal" + data de renovação
- [ ] `/family/invoices` lista 1 fatura "Paga"
- [ ] Abrir `/family/caregiver/:id` — documentos abrem no modal
- [ ] Anotar o `stripe_customer_id` (`cus_…`) — vamos usar nos próximos passos

⛔ **Se algo falhar aqui, NÃO continue.** Veja "Troubleshooting" no final.

---

## Passo 2 — Renovação OK (Resend de `invoice.paid` no Dashboard)

> Como `invoice.paid` já foi disparado no checkout, vamos **reenviar** o mesmo evento. O webhook deve criar/atualizar a invoice de forma idempotente (graças à UNIQUE).

### 2.1. Achar o evento

- [ ] Stripe Dashboard → **Developers → Events**
- [ ] Filtrar pelo seu `cus_…` (campo Customer)
- [ ] Procurar o último evento `invoice.paid`
- [ ] Clicar nele

### 2.2. Reenviar

- [ ] Aba **Webhook attempts** (ou "Webhooks" lateralmente)
- [ ] Localizar o seu endpoint → clicar **Resend**
- [ ] Confirmar — deve retornar **200 OK** em poucos segundos

### 2.3. Validar idempotência (não duplicou fatura)

```sql
select count(*) from invoices
 where family_id = (select id from profiles where email = 'familia-teste@cuidde.dev');
```

- [ ] **Esperado: ainda 1.** Se subiu para 2, a UNIQUE não foi aplicada — pare e investigue.

> ✅ **Este já é o teste de idempotência.** O `Resend` reenvia o **mesmo** `event_id`, então o webhook tem que tratar como duplicado.

### 2.4. Reenviar mais 2× para reforçar

- [ ] Clicar **Resend** mais 2 vezes
- [ ] Rodar a query de novo — contagem **continua 1**

---

## Passo 3 — Falha de pagamento (declinar uma invoice)

> Vamos forçar uma cobrança de renovação a falhar usando **Test clock** + cartão que falha.

### 3.1. Trocar o cartão default da família para um que falha

- [ ] Stripe Dashboard → **Customers** → clicar na sua família (`cus_…`)
- [ ] Aba **Payment methods** → **Add payment method**
- [ ] Cartão: `4000 0000 0000 0341` (autoriza, falha em cobrança recorrente)
- [ ] Marcar como **Default**

### 3.2. Criar Test Clock e avançar o tempo

> Test clocks só funcionam em customers criados **dentro** de um clock. Como o seu customer já existe, vamos pular pelo método mais simples: **forçar uma invoice de teste**.

**Alternativa mais simples — criar invoice manual:**

- [ ] Na página do customer → aba **Invoices** → **Create invoice**
- [ ] Adicionar item: descrição "Teste falha", valor `R$ 127,00`
- [ ] **Send invoice** ou **Finalize**
- [ ] Após finalizar, clicar **Collect payment** → vai tentar cobrar o cartão default (que é o `0341`)
- [ ] A cobrança vai falhar → Stripe dispara `invoice.payment_failed`

### 3.3. Validar no banco

```sql
select subscription_status from family_profiles
 where id = (select id from profiles where email = 'familia-teste@cuidde.dev');
```

- [ ] `subscription_status = 'past_due'`

```sql
select status, count(*) from invoices
 where family_id = (select id from profiles where email = 'familia-teste@cuidde.dev')
 group by status;
```

- [ ] Pelo menos 1 linha com `status='overdue'`

### 3.4. Validar UI

- [ ] `/family/billing` mostra banner "Pagamento atrasado"
- [ ] `/family/invoices` lista a fatura nova com status "Vencida"

### 3.5. Restaurar cartão bom

- [ ] Voltar à página do customer → trocar o default para `4242 4242 4242 4242` (adicionar novo se necessário)
- [ ] Clicar **Collect payment** na invoice falhada → agora paga
- [ ] `subscription_status` volta para `'active'` (confirmar no banco)

---

## Passo 4 — Cancelar e reativar (pela sua app)

### 4.1. Cancelar pela UI

- [ ] Em `/family/billing`, clicar **Cancelar assinatura** → confirmar

### 4.2. Validar (assinatura ainda ativa até o fim do período)

```sql
select subscription_status, cancel_at_period_end, current_period_end
  from family_profiles
 where id = (select id from profiles where email = 'familia-teste@cuidde.dev');
```

- [ ] `subscription_status = 'active'`
- [ ] `cancel_at_period_end = true`
- [ ] UI mostra "Sua assinatura termina em DD/MM/YYYY"

### 4.3. Confirmar no Stripe Dashboard

- [ ] Customer → Subscription → deve mostrar **"Cancels on DD/MM/YYYY"**

### 4.4. Reativar pela UI

- [ ] Clicar **Reativar assinatura**

```sql
select cancel_at_period_end from family_profiles
 where id = (select id from profiles where email = 'familia-teste@cuidde.dev');
```

- [ ] `cancel_at_period_end = false`
- [ ] Banner sumiu na UI
- [ ] No Stripe Dashboard, subscription volta a "Active" sem data de fim

---

## Passo 5 — Cancelamento definitivo (Dashboard)

### 5.1. Cancelar imediato pelo Stripe Dashboard

- [ ] Customer → Subscription → botão **"..."** ou **Cancel subscription**
- [ ] Escolher **Immediately** (não "At period end")
- [ ] Confirmar — Stripe dispara `customer.subscription.deleted`

### 5.2. Validar

```sql
select subscription_status, plan from family_profiles
 where id = (select id from profiles where email = 'familia-teste@cuidde.dev');
```

- [ ] `subscription_status = 'canceled'`

### 5.3. Validar UI (RLS bloqueia premium)

- [ ] `/family/billing` volta a mostrar planos para assinar (estado free)
- [ ] Abrir `/family/caregiver/:id` — documentos **não abrem** mais (Storage RLS bloqueia)
- [ ] Nomes/telefones de referências aparecem mascarados
- [ ] `professional_reg_number` aparece como `null` (gating server-side da RPC)

---

## Passo 6 — Upgrade Mensal → Trimestral (pela sua app)

### 6.1. Re-assinar Mensal

- [ ] Repetir Passo 1 (checkout com `4242 4242 4242 4242`) para voltar a `active`

### 6.2. Fazer upgrade

- [ ] Em `/family/billing`, clicar **Trimestral**
- [ ] Confirmar — **NÃO** abre Checkout (cobra direto no cartão salvo via `always_invoice`)

### 6.3. Validar

```sql
select plan, subscription_status from family_profiles
 where id = (select id from profiles where email = 'familia-teste@cuidde.dev');
```

- [ ] `plan = 'quarterly'`, `subscription_status = 'active'`

```sql
select count(*) from invoices
 where family_id = (select id from profiles where email = 'familia-teste@cuidde.dev');
```

- [ ] Contagem aumentou `+1` (invoice de proration)

- [ ] No Stripe Dashboard, customer → Invoices → última invoice tem múltiplas linhas (crédito do mensal + cobrança do trimestral)

---

## Passo 7 — Downgrade Trimestral → Mensal (pela sua app)

### 7.1. Fazer downgrade

- [ ] Em `/family/billing`, clicar **Mensal**
- [ ] Confirmar — **NÃO** cobra agora (Subscription Schedule)

### 7.2. Validar plano atual mantido + `pending_plan` salvo

```sql
select plan, pending_plan, current_period_end
  from family_profiles
 where id = (select id from profiles where email = 'familia-teste@cuidde.dev');
```

- [ ] `plan = 'quarterly'` (mantido)
- [ ] `pending_plan = 'monthly'`
- [ ] UI mostra aviso "Seu plano mudará para Mensal em DD/MM/YYYY"

### 7.3. Confirmar Subscription Schedule no Stripe

- [ ] Customer → Subscription → deve aparecer **"Schedule"** com a troca futura listada

### 7.4. Cancelar o downgrade

- [ ] Clicar **Trimestral** de novo (plano atual) → libera o Schedule

```sql
select pending_plan from family_profiles
 where id = (select id from profiles where email = 'familia-teste@cuidde.dev');
```

- [ ] `pending_plan = null`
- [ ] Aviso sumiu na UI
- [ ] No Stripe Dashboard, Schedule sumiu

---

## Encerramento

### Limpeza

- [ ] (Opcional) Cancelar a assinatura de teste no Dashboard para deixar a família-cobaia limpa
- [ ] Deletar invoices manuais criadas no Passo 3 se quiser tirar ruído

### Marcar AUDIT.md

- [ ] Marcar fase **5 — stripe-integration** e **5 — payment-integration** como ✅
- [ ] Marcar todos os itens da seção "Stripe CLI" do checklist operacional como ✅ (substituindo "Stripe CLI" por "Dashboard Resend/Cancel manual")

---

## Cheat sheet de cartões de teste

| Número | Comportamento |
|---|---|
| `4242 4242 4242 4242` | Aprovado sempre |
| `4000 0000 0000 0341` | Autoriza, **falha** em cobrança recorrente (use no Passo 3) |
| `4000 0000 0000 9995` | Sempre falha (insufficient funds) |
| `4000 0025 0000 3155` | Exige 3D Secure (testar `incomplete`) |

Validade qualquer futura, CVC qualquer, CEP qualquer.

---

## Troubleshooting

| Sintoma | Causa provável | Como resolver |
|---|---|---|
| Resend retorna 200 mas banco não muda | `STRIPE_WEBHOOK_SECRET` errado no Supabase | Copiar signing secret do endpoint no Dashboard, colar no Supabase, redeploy |
| Resend retorna 401 / Invalid signature | Idem | Idem |
| Resend retorna 500 | Bug na Edge Function | Supabase Dashboard → Edge Functions → stripe-webhook → **Logs** |
| Checkout abre mas volta com erro | `STRIPE_PRICE_ID_*` errado ou plano não existe no test mode | **Products** no Dashboard → criar 3 prices (mensal/trimestral/anual) → atualizar secrets do Supabase |
| Idempotência falhou (Passo 2 duplicou) | UNIQUE não foi aplicada | Rodar `production_readiness_indexes_rls.sql` de novo no SQL Editor |
| `4242` é recusado | Está em **live mode** sem querer | Verificar toggle "Test mode" laranja ativo no canto |
| Documentos do cuidador não abrem mesmo com `active` | Storage RLS bloqueando | Conferir policy do bucket `documents` (SPEC.md tem o SQL) |
| Não acho a opção "Resend" no evento | Olhou em Events em vez de Webhooks | **Developers → Webhooks → seu endpoint → aba "Events"** lista os disparos com botão Resend |

---

## Referência: o que cada passo cobre

| Passo | Cenário de produção que valida |
|---|---|
| 1 | Família novata assina e ganha acesso |
| 2 | Renovação mensal automática + idempotência (não duplica fatura se Stripe reentregar) |
| 3 | Cartão da família vence/insuficiente → app entra em past_due e mostra aviso |
| 4 | Família clica "cancelar" mas pode reativar antes do fim |
| 5 | Cancelamento total (admin/Stripe) → app revoga acesso premium via RLS |
| 6 | Upgrade gera proration imediato sem nova tela |
| 7 | Downgrade não cobra agora, agenda troca para o fim do período |
