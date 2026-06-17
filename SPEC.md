# SPEC.md — Especificação Técnica

> Stack: React + Vite + TypeScript + Supabase + Stripe | TanStack Query v5
> Uma sessão do Claude Code = um sprint. Nunca misture sprints.

---

## ERD

```
auth.users
  └──► profiles (1:1 via trigger)
            ├──► caregiver_profiles (1:1)
            │         ├──► professional_references (1:N)
            │         ├──► caregiver_documents     (1:N)
            │         ├──► caregiver_availability  (1:N)
            │         ├──► appointments            (1:N caregiver_id)
            │         ├──► reviews                 (1:N caregiver_id)
            │         └──► favorites               (1:N caregiver_id)
            └──► family_profiles (1:1)
                      ├──► appointments  (1:N family_id)
                      ├──► reviews       (1:N family_id)
                      ├──► favorites     (1:N family_id)
                      ├──► invoices      (1:N family_id)
                      └──► support_tickets (1:N user_id)

appointments → care_routines (1:N) | messages (1:N) | reviews (1:1)
```

---

## Schema

### `profiles`
`id` UUID PK→auth.users · `role` (caregiver|family|admin, nullable para Google) · `full_name` · `phone`

### `caregiver_profiles`
`id` UUID PK→profiles · `photo_url` · `whatsapp` · `bio`
**Endereço:** `cep` `street` `number` `complement` `neighborhood` `city` `state CHAR(2)` · `lat FLOAT8` · `lng FLOAT8`
**Profissional:** `specialties[]` · `modalities[]` · `idiomas[]` · `experience_years` · `profissao_formacao`¹ · `formacao_complementar` · `possui_cnh` · `categoria_cnh` (A|B|AB|C|D|E) · `has_insurance` · `emergency_available`
**Preços:** `price_per_hour` · `price_per_day`
**Registro:** `professional_reg_type` (coren|crefito|outros) · `professional_reg_number` · `professional_reg_uf` · `professional_reg_other_desc`
**Status/visib.:** `status` (pending|analyzing|verified|rejected) · `rejection_reason` · `is_visible` · `profile_complete`
**Privacidade refs:** `show_refs_to_subscribers` · `mask_reference_phones` · `show_reference_full_names`
**Métricas:** `profile_views_30d` · `search_appearances_30d` · `interested_families_30d` · `average_rating` · `review_count`

¹ profissao_formacao: cuidador|tecnico_enfermagem|auxiliar_enfermagem|enfermeiro|fisioterapeuta|terapeuta_ocupacional|outro

### `family_profiles`
`id` UUID PK→profiles · `photo_url` · `relationship`
**Endereço:** `cep` `street` `number` `complement` `neighborhood` `city` `state` · `lat FLOAT8` · `lng FLOAT8`
**Idoso:** `elderly_name` · `elderly_age` · `elderly_conditions[]` · `blood_type` · `pre_existing_conditions` · `allergies` · `continuous_medications` · `responsible_doctor` · `health_insurance` · `care_needs`
**Preferências:** `service_formats[]` · `hourly_range_min/max` · `daily_range_min/max` · `distance_preference`
**Stripe:** `stripe_customer_id` · `plan` (monthly|quarterly|annual) · `subscription_status` (free|active|past_due|canceled|incomplete) · `stripe_subscription_id` · `cancel_at_period_end` BOOL · `current_period_end` TIMESTAMPTZ · `pending_plan` TEXT (nullable — plano agendado em downgrade)

### `professional_references`
`id` · `caregiver_id`→caregiver_profiles · `name` · `phone` · `workplace` · `position` · `work_duration` · `notes`

### `caregiver_documents`
`id` · `caregiver_id`→caregiver_profiles · `type` (rg_cnh|curriculo|certificacao|antecedentes) · `file_url` (Storage path) · `file_name` · `status` (pending|sent|approved|rejected) · `is_visible` · `required` · `reviewed_at` · `uploaded_at`

### `caregiver_availability`
`id` · `caregiver_id` · `day_of_week` (0-6) · `start_time` · `end_time`

### `appointments`
`id` · `family_id` · `caregiver_id` · `type` (plantão|contínuo|turno) · `status` (pendente|ativo|finalizado|cancelado) · `start_date` · `end_date` · `description` · `family_notes` · `modality` · `observations` · `total_amount` · `cancelled_by` · `cancel_reason`

### `care_routines`
`id` · `appointment_id`→appointments · `date` · `shift` (morning|afternoon|night) · `care_types[]` · `observations` · `has_occurrence` · `occurrence_description` · `recorded_at`

### `messages`
`id` · `appointment_id`→appointments · `sender_id`→profiles · `content` (≤2000 chars) · `read_at`

### `reviews`
`id` · `appointment_id` · `family_id` · `caregiver_id` · `family_name` · `family_photo` · `rating` DECIMAL(2,1) 1-5 · `comment`
UNIQUE(family_id, caregiver_id)

### `favorites`
`id` · `family_id` · `caregiver_id` | UNIQUE(family_id, caregiver_id)

### `invoices`
`id` · `family_id` · `invoice_ref` · `period` · `plan` · `amount` · `status` (paid|pending|open|overdue) · `stripe_invoice_id` · `stripe_payment_intent_id` · `due_date` · `paid_at`

### `support_tickets`
`id` · `user_id`→profiles · `subject` (conta|documentos|atendimentos|avaliacoes|visibilidade|sugestoes|outro) · `message` · `status` (enviado|em_analise|respondido) · `admin_reply`

### `system_logs`
`id` · `user_id`→profiles (SET NULL on delete) · `user_name` · `user_role` · `action` · `details`

---

## Triggers

- **`on_auth_user_created`** — INSERT em `profiles`; se role='caregiver' cria `caregiver_profiles`; se role='family' cria `family_profiles`. Google OAuth cria com role=NULL (definido depois no onboarding).
- **`on_review_inserted`** — atualiza `average_rating` e `review_count` em `caregiver_profiles`.
- **`profile_complete`** — recalcula ao alterar perfil/referencias/documentos. Critérios: cidade+bairro + bio ≥10 chars + specialties[] + rg_cnh (sent/approved). As referencias profissionais sao opcionais: contam como sinal de confianca, filtro e ranking, mas nao podem bloquear visibilidade na busca.

---

## Row Level Security (RLS)

```sql
-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: ver e editar próprio" ON profiles
  USING (auth.uid() = id);

-- caregiver_profiles
ALTER TABLE caregiver_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "caregiver: dono edita" ON caregiver_profiles
  FOR ALL USING (auth.uid() = id);
CREATE POLICY "caregiver: público lê verificados" ON caregiver_profiles
  FOR SELECT USING (status = 'verified' AND is_visible = TRUE);

-- appointments: participantes
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments: participantes" ON appointments
  USING (family_id = auth.uid() OR caregiver_id = auth.uid());

-- messages: participantes do agendamento
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages: participantes" ON messages
  USING (
    appointment_id IN (
      SELECT id FROM appointments
      WHERE family_id = auth.uid() OR caregiver_id = auth.uid()
    )
  );

-- reviews: família cria, todos leem
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews: família insere" ON reviews
  FOR INSERT WITH CHECK (family_id = auth.uid());
CREATE POLICY "reviews: todos leem" ON reviews
  FOR SELECT USING (TRUE);

-- favorites: família gerencia
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites: família gerencia" ON favorites
  USING (family_id = auth.uid());

-- invoices: família vê as suas
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices: família vê" ON invoices
  FOR SELECT USING (family_id = auth.uid());

-- Storage: família assinante lê documentos
CREATE POLICY "documents: família assinante lê"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.family_profiles
      WHERE id = auth.uid() AND subscription_status = 'active'
    )
  );
```

---

## Sprints Concluídos

| Sprint | Entregável principal |
|--------|----------------------|
| 1.1 | `src/lib/supabase.ts`, `src/types/database.ts` |
| 1.2 | Auth (email+Google), `AuthContext`, `ProtectedRoute`, Login, VerifyEmail, Onboarding conectado |
| 2.1 | `useCaregiverProfile`, CaregiverProfile (4 steps), Availability, Pricing |
| 2.2 | `useCaregiverDocuments`, CaregiverDocuments, DocumentUpload (4 slots fixos, upsert por tipo) |
| 3.1 | `useSearchCaregivers`, `useFavorites`, `useFamilyProfile`, CaregiverCard, SearchCaregivers, Favorites, FamilyDashboard |
| 3.x | Geocodificação (Google Maps + Nominatim fallback), RPC `search_caregivers_by_proximity`, seletor de raio |
| 3.2 | `usePublicCaregiverProfile`, CaregiverPublicProfile completo, visualizador de docs (blob URL, sem download) |
| 4.1 | `useAppointments`, `useCareRoutine`, `RequestAppointmentDialog`, fluxo solicitação→atendimento |
| 4.2 | `useChat`, AppointmentChat (Realtime), `contact-filter.ts`, read receipts ✓/✓✓ |
| 5.1 | `useReviews`, CaregiverReviews, FamilyAppointmentDetails (avaliação pós-atendimento) |
| 6.1 | `useSubscription`, `useInvoices`, Edge Functions `create-checkout` + `stripe-webhook`, FamilyBilling, FamilyInvoices, FamilyInvoiceDetails |
| 3.cleanup | Dívida técnica: query-keys camelCase, null-safe useInvoices, stripe-webhook helpers modulares, typed optimistic update, CSP, JWT auth em Edge Functions |

---

## Sprint 5.1 — Reviews ✅ CONCLUÍDO

```
Arquivos afetados:
- src/pages/caregiver/CaregiverReviews.tsx
- src/pages/family/FamilyAppointmentDetails.tsx

Tarefas:
1. Criar src/hooks/useReviews.ts:
   - query: listar reviews de um cuidador (por caregiver_id)
   - mutation: família submete review
     - Só permitido se appointment.status === 'finalizado'
     - Respeitar constraint UNIQUE(family_id, caregiver_id)
   - O trigger SQL atualiza average_rating automaticamente após INSERT

2. CaregiverReviews.tsx: exibir reviews reais (nota, comentário, nome, foto)
3. FamilyAppointmentDetails.tsx: mostrar formulário de avaliação (1-5 estrelas + comentário)
   apenas se appointment.status === 'finalizado'
```

✅ **Concluído quando:**
- Review aparece em CaregiverReviews com nome e foto da família
- `average_rating` atualiza automaticamente após review (trigger)
- Formulário não aparece se agendamento não estiver `finalizado`

---

## Sprint 6.1 — Assinaturas Stripe ✅ CONCLUÍDO

> Referência: [Stripe Webhooks](https://stripe.com/docs/webhooks)

```
Arquivos afetados:
- src/hooks/useSubscription.ts (novo)
- src/hooks/useInvoices.ts (novo)
- supabase/functions/create-checkout/index.ts (novo)
- supabase/functions/stripe-webhook/index.ts (novo)
- src/pages/family/FamilyBilling.tsx
- src/pages/family/FamilyInvoices.tsx
- src/pages/family/FamilyInvoiceDetails.tsx

Planos (assinatura da plataforma — NÃO pagamento ao cuidador):
- monthly:    R$ 127/mês
- quarterly:  R$ 297/trimestre
- annual:     R$ 997/ano

Tarefas:
1. Instalar @stripe/stripe-js

2. Edge Function: supabase/functions/create-checkout/index.ts
   - Recebe: family_id, price_id
   - Cria/recupera Stripe Customer (salva stripe_customer_id em family_profiles)
   - Cria Checkout Session para subscription
   - Retorna: { url: checkoutUrl }

3. Edge Function: supabase/functions/stripe-webhook/index.ts
   - customer.subscription.created  → subscription_status = 'active', salva plan
   - customer.subscription.updated  → atualiza plan + subscription_status
   - customer.subscription.deleted  → subscription_status = 'canceled'
   - invoice.paid                   → cria/atualiza invoice (status='paid') + subscription_status='active'
   - invoice.payment_failed         → subscription_status = 'past_due' + invoice status = 'overdue'
   - checkout.session.expired       → subscription_status = 'incomplete'
   - SEMPRE validar com stripe-webhook-secret

4. Criar src/hooks/useSubscription.ts:
   - query: plano atual da família logada
   - mutation: iniciar checkout (chama Edge Function)
   - mutation: cancelar assinatura

5. Criar src/hooks/useInvoices.ts:
   - query: listar faturas da família logada
   - query: buscar fatura por ID

6. Conectar FamilyBilling, FamilyInvoices, FamilyInvoiceDetails com dados reais

Labels de status de subscription:
  free='Gratuito' | active='Ativo' | past_due='Pagamento atrasado' | canceled='Cancelado' | incomplete='Pendente'

Labels de status de invoice:
  paid='Paga' | pending='Pendente' | open='Em aberto' | overdue='Vencida'

REGRA: Stripe Webhook é a fonte de verdade. Nunca atualizar plan diretamente pelo cliente.
  Edge Functions (server-side com service_role) podem atualizar para evitar race condition com webhook.

Troca de plano (upgrade vs downgrade):
  - Upgrade (rank sobe: monthly→quarterly→annual): imediato com always_invoice (cobra diferença proporcional no cartão salvo)
  - Downgrade (rank desce): Subscription Schedule agenda troca para o fim do período já pago
    - Plano atual mantido até current_period_end
    - pending_plan salvo em family_profiles para exibir na UI
    - Nenhuma fatura intermediária gerada
    - Ao clicar no plano atual novamente: libera o schedule, limpa pending_plan
  - Webhook customer.subscription.updated limpa pending_plan quando o plano efetivamente transiciona

Proration invoices (invoice.paid):
  - Faturas de proration podem ter múltiplas linhas (crédito do plano antigo + cobrança do novo)
  - Webhook pega a linha com amount > 0 (plano novo), não lines.data[0] cegamente
```

✅ **Concluído:**
- "Assinar" abre Stripe Checkout real
- Após pagamento, `plan` e `subscription_status` atualizam via webhook
- Faturas aparecem em FamilyInvoices com dados reais
- create-checkout protegida com JWT (caller.id === family_id) + CORS whitelist
- stripe-webhook valida com `stripe-webhook-secret` antes de processar qualquer evento
- Upgrade imediato com cobrança proporcional automática (sem tela de checkout)
- Downgrade agendado via Stripe Subscription Schedule (sem fatura R$ 0,00)
- Edge Functions atualizam Supabase imediatamente (cancel, reactivate, upgrade) para evitar race condition com webhook
- UI mostra aviso "Seu plano mudará para X em DD/MM/YYYY" quando há downgrade pendente

---

## Sprint 7.1 — Admin (Aprovações e Finanças)

```
Arquivos afetados:
- src/pages/admin/AdminDashboard.tsx
- src/pages/admin/ApprovalQueue.tsx
- src/pages/admin/Finance.tsx

Tarefas:
1. Edge Function: supabase/functions/admin-actions/index.ts
   - Usa SUPABASE_SERVICE_ROLE_KEY (bypass RLS)
   - Ações: aprovar cuidador, reprovar com motivo, listar usuários, métricas

2. Criar src/hooks/useAdmin.ts:
   - query: cuidadores por status (ApprovalQueue)
   - query: documentos de um cuidador
   - mutation: aprovar → status='verified'
   - mutation: reprovar → status='rejected' + rejection_reason
   - query: métricas gerais (total users, verified, active subscriptions)
   - query: todas as invoices com filtros (Finance.tsx)

3. ApprovalQueue.tsx: substituir estado local pelo hook real
4. Finance.tsx: substituir mockAdminSubscriptions/mockAdminInvoices por dados reais
   (family_profiles JOIN invoices)

Planos: monthly='Mensal' R$127 | quarterly='Trimestral' R$297 | annual='Anual' R$997
Admin NUNCA expõe service_role_key no cliente — sempre via Edge Function.
Rotas /admin/* verificam role='admin' via ProtectedRoute.
```

✅ **Concluído quando:**
- Aprovação muda `status='verified'` e cuidador aparece na busca
- Rejeição exige motivo e bloqueia visibilidade
- Usuário sem role `admin` é redirecionado

---

## Sprint 7.2 — Suporte e Logs

```
Arquivos afetados:
- src/pages/caregiver/CaregiverSupport.tsx
- src/pages/family/FamilySupport.tsx
- src/pages/admin/Security.tsx

Tarefas:
1. Criar src/hooks/useSupport.ts:
   - mutation: INSERT em support_tickets (subject enum + message ≤600 chars)
   - query: listar tickets do usuário logado com status

2. Conectar CaregiverSupport.tsx e FamilySupport.tsx:
   - Substituir handleSubmit mock pela mutation real
   - Substituir mockRequests pela query real

3. Helper para inserir system_logs nos eventos:
   - Login/logout, aprovação/reprovação de cuidador,
     mudança de status de agendamento, envio de documentos

4. Security.tsx: substituir mockSystemLogs por query real
   (Edge Function com service_role para leitura sem RLS)
```

✅ **Concluído quando:**
- Ticket enviado aparece no histórico com status `enviado`
- Logs de sistema exibem eventos reais
- Busca de logs por texto funciona na página de Segurança

---

## Variáveis de Ambiente

```env
# .env.local — nunca commitar
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_GMAPS_GEOCODE_KEY=

# Apenas em Supabase Edge Functions (secrets — nunca no cliente)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_MONTHLY=
STRIPE_PRICE_ID_QUARTERLY=
STRIPE_PRICE_ID_ANNUAL=
SUPABASE_SERVICE_ROLE_KEY=
```
