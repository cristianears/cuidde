-- =============================================================================
-- Cuidde — Hardening pré-produção (índices, RLS performance, integridade Stripe)
-- =============================================================================
--
-- Aplicar via Supabase Dashboard → SQL Editor (uma seção por vez é OK).
-- Todos os comandos são idempotentes (IF NOT EXISTS) — seguro re-rodar.
--
-- Categorias (Postgres Best Practices da Supabase):
--   1. Índices em FKs (evita seq scan em JOINs e CASCADE)              CRITICAL
--   2. Índices compostos para hot paths (chat, contagens não lidas)    HIGH
--   3. Índices parciais (ex: mensagens não lidas)                       HIGH
--   4. GIN para arrays (specialties, idiomas, modalities)              MEDIUM
--   5. Trigram para ILIKE em city/neighborhood                         MEDIUM
--   6. Unique constraints em IDs do Stripe (idempotência do webhook)   CRITICAL
--   7. Reescrita de policies RLS com (select auth.uid()) — cache       CRITICAL
--   8. Column grants em family_profiles para blindar Stripe             CRITICAL
--   9. statement_timeout em authenticated — proteção runaway            HIGH
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Índices em FKs e colunas filtradas frequentemente
-- -----------------------------------------------------------------------------
-- Postgres NÃO indexa FKs automaticamente. Sem isso:
--   - JOINs viram seq scan
--   - ON DELETE CASCADE/SET NULL trava a tabela inteira
--   - Policies RLS que comparam com auth.uid() não usam índice

create index if not exists idx_appointments_family_id
  on public.appointments (family_id);

create index if not exists idx_appointments_caregiver_id
  on public.appointments (caregiver_id);

create index if not exists idx_messages_appointment_id
  on public.messages (appointment_id);

create index if not exists idx_messages_sender_id
  on public.messages (sender_id);

create index if not exists idx_reviews_caregiver_id
  on public.reviews (caregiver_id);

create index if not exists idx_reviews_family_id
  on public.reviews (family_id);

create index if not exists idx_reviews_appointment_id
  on public.reviews (appointment_id);

create index if not exists idx_favorites_family_id
  on public.favorites (family_id);

create index if not exists idx_favorites_caregiver_id
  on public.favorites (caregiver_id);

create index if not exists idx_invoices_family_id
  on public.invoices (family_id);

create index if not exists idx_caregiver_documents_caregiver_id
  on public.caregiver_documents (caregiver_id);

create index if not exists idx_professional_references_caregiver_id
  on public.professional_references (caregiver_id);

create index if not exists idx_caregiver_availability_caregiver_id
  on public.caregiver_availability (caregiver_id);

create index if not exists idx_care_routines_appointment_id
  on public.care_routines (appointment_id);

create index if not exists idx_support_tickets_user_id
  on public.support_tickets (user_id);

create index if not exists idx_system_logs_user_id
  on public.system_logs (user_id);

create index if not exists idx_system_logs_created_at
  on public.system_logs (created_at desc);


-- -----------------------------------------------------------------------------
-- 2. Índices compostos para hot paths
-- -----------------------------------------------------------------------------
-- Chat: histórico ordenado por appointment + tempo
-- (substitui efetivamente idx_messages_appointment_id + sort)
create index if not exists idx_messages_appointment_created
  on public.messages (appointment_id, created_at);

-- Listagem de agendamentos por usuário ordenada (useAppointments)
create index if not exists idx_appointments_caregiver_created
  on public.appointments (caregiver_id, created_at desc);

create index if not exists idx_appointments_family_created
  on public.appointments (family_id, created_at desc);

-- useUnreadCounts: solicitações pendentes por cuidador desde X
create index if not exists idx_appointments_caregiver_pending
  on public.appointments (caregiver_id, created_at)
  where status = 'pendente';

-- useUnreadCounts: famílias verificando solicitações com status alterado
create index if not exists idx_appointments_family_updated
  on public.appointments (family_id, updated_at desc);

-- Listagem de invoices por família ordenada
create index if not exists idx_invoices_family_created
  on public.invoices (family_id, created_at desc);

-- Reviews ordenadas por cuidador
create index if not exists idx_reviews_caregiver_created
  on public.reviews (caregiver_id, created_at desc);


-- -----------------------------------------------------------------------------
-- 3. Índice parcial: mensagens não lidas
-- -----------------------------------------------------------------------------
-- useUnreadCounts faz: WHERE read_at IS NULL AND sender_id <> me AND appointment_id IN (...)
-- Como a esmagadora maioria das mensagens vira "lida", índice parcial é
-- 10–100x menor e mais rápido que índice completo em read_at.

create index if not exists idx_messages_unread
  on public.messages (appointment_id, sender_id)
  where read_at is null;


-- -----------------------------------------------------------------------------
-- 4. GIN para colunas array usadas em filtros .contains() do PostgREST
-- -----------------------------------------------------------------------------
-- useSearchCaregivers filtra: modalities, idiomas. Sem GIN = seq scan.
-- specialties também é array, embora não filtre na busca pública atual,
-- é usado em scoring/labels — manter indexado evita regressão futura.

create index if not exists idx_caregiver_modalities_gin
  on public.caregiver_profiles using gin (modalities);

create index if not exists idx_caregiver_idiomas_gin
  on public.caregiver_profiles using gin (idiomas);

create index if not exists idx_caregiver_specialties_gin
  on public.caregiver_profiles using gin (specialties);


-- -----------------------------------------------------------------------------
-- 5. Trigram (pg_trgm) para ILIKE em city/neighborhood
-- -----------------------------------------------------------------------------
-- useSearchCaregivers usa .ilike('%texto%') — sem pg_trgm = seq scan.
-- Com GIN+trgm, ILIKE de wildcard duplo usa índice.

create extension if not exists pg_trgm;

create index if not exists idx_caregiver_city_trgm
  on public.caregiver_profiles using gin (city gin_trgm_ops);

create index if not exists idx_caregiver_neighborhood_trgm
  on public.caregiver_profiles using gin (neighborhood gin_trgm_ops);

-- Filtro mais comum: busca pública só lê verificados+visíveis+disponíveis.
-- Índice parcial em "elegíveis para busca" reduz drasticamente o tamanho.
create index if not exists idx_caregiver_searchable
  on public.caregiver_profiles (city, neighborhood)
  where profile_complete = true
    and has_rg_cnh = true
    and is_available_for_new = true;


-- -----------------------------------------------------------------------------
-- 6. Unique constraints em IDs do Stripe (idempotência do webhook)
-- -----------------------------------------------------------------------------
-- O webhook usa upsert com onConflict='stripe_invoice_id'. Isso EXIGE
-- unique constraint — sem ela, a primeira corrida gera duplicata.
-- Idem stripe_customer_id: webhook localiza família por ele;
-- duplicata = ambiguidade (resultado inconsistente).

-- Famílias: 1 customer Stripe = 1 family_profile
do $$ begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'family_profiles_stripe_customer_id_key'
  ) then
    alter table public.family_profiles
      add constraint family_profiles_stripe_customer_id_key
      unique (stripe_customer_id);
  end if;
end $$;

-- Famílias: 1 subscription Stripe = 1 family_profile
do $$ begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'family_profiles_stripe_subscription_id_key'
  ) then
    alter table public.family_profiles
      add constraint family_profiles_stripe_subscription_id_key
      unique (stripe_subscription_id);
  end if;
end $$;

-- Invoices: stripe_invoice_id é a chave de idempotência do upsert
do $$ begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'invoices_stripe_invoice_id_key'
  ) then
    alter table public.invoices
      add constraint invoices_stripe_invoice_id_key
      unique (stripe_invoice_id);
  end if;
end $$;


-- -----------------------------------------------------------------------------
-- 7. RLS performance: envolver auth.uid() em (select ...)
-- -----------------------------------------------------------------------------
-- Sem (select), auth.uid() é tratado como VOLATILE e re-executado por linha.
-- Em tabelas grandes (messages, appointments, caregiver_profiles), isso é
-- 10–100x mais lento. Wrapping força o planner a tratar como STABLE/cached.
--
-- Recriamos as policies do SPEC.md com a forma otimizada.
-- (DROP/CREATE em vez de ALTER porque não dá pra alterar USING/CHECK in-place)

-- profiles
drop policy if exists "profiles: ver e editar próprio" on public.profiles;
create policy "profiles: ver e editar próprio"
  on public.profiles
  for all
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- caregiver_profiles
drop policy if exists "caregiver: dono edita" on public.caregiver_profiles;
create policy "caregiver: dono edita"
  on public.caregiver_profiles
  for all
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "caregiver: público lê verificados" on public.caregiver_profiles;
drop policy if exists "caregiver: público lê perfis buscáveis" on public.caregiver_profiles;
drop policy if exists "caregiver_public_searchable" on public.caregiver_profiles;
create policy "caregiver_public_searchable"
  on public.caregiver_profiles
  for select
  using (
    profile_complete = true
    and has_rg_cnh = true
    and is_available_for_new = true
  );

-- family_profiles
-- Nao consultar family_profiles dentro das policies desta propria tabela.
-- Isso causa "infinite recursion detected in policy for relation family_profiles".
drop policy if exists "family: dono lê e edita" on public.family_profiles;
drop policy if exists "family_profiles: owner select" on public.family_profiles;
drop policy if exists "family_profiles: owner insert" on public.family_profiles;
drop policy if exists "family_profiles: owner update" on public.family_profiles;
drop policy if exists "family_profiles: owner delete" on public.family_profiles;
drop policy if exists "family_profiles_owner_select" on public.family_profiles;
drop policy if exists "family_profiles_owner_insert" on public.family_profiles;
drop policy if exists "family_profiles_owner_update" on public.family_profiles;
drop policy if exists "family_profiles_owner_delete" on public.family_profiles;

create policy "family_profiles_owner_select"
  on public.family_profiles
  for select
  using ((select auth.uid()) = id);

create policy "family_profiles_owner_insert"
  on public.family_profiles
  for insert
  with check ((select auth.uid()) = id);

create policy "family_profiles_owner_update"
  on public.family_profiles
  for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "family_profiles_owner_delete"
  on public.family_profiles
  for delete
  using ((select auth.uid()) = id);

-- Stripe fields in family_profiles are server-owned.
-- Keep the owner UPDATE policy simple and non-recursive, then restrict which
-- columns browser clients may insert/update. Edge Functions using service_role
-- are not affected by these anon/authenticated grants.
do $$
declare
  all_cols text;
  client_insert_cols text;
  client_update_cols text;
begin
  revoke insert on table public.family_profiles from anon, authenticated;
  revoke update on table public.family_profiles from anon, authenticated;

  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into all_cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'family_profiles';

  if all_cols is not null then
    execute format(
      'revoke insert (%s) on table public.family_profiles from anon, authenticated',
      all_cols
    );
    execute format(
      'revoke update (%s) on table public.family_profiles from anon, authenticated',
      all_cols
    );
  end if;

  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into client_insert_cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'family_profiles'
    and column_name not in (
      'created_at',
      'updated_at',
      'plan',
      'subscription_status',
      'stripe_customer_id',
      'stripe_subscription_id',
      'pending_plan',
      'cancel_at_period_end',
      'current_period_end',
      'payment_failed_at'
    );

  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into client_update_cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'family_profiles'
    and column_name not in (
      'id',
      'created_at',
      'updated_at',
      'plan',
      'subscription_status',
      'stripe_customer_id',
      'stripe_subscription_id',
      'pending_plan',
      'cancel_at_period_end',
      'current_period_end',
      'payment_failed_at'
    );

  if client_insert_cols is not null then
    execute format(
      'grant insert (%s) on table public.family_profiles to authenticated',
      client_insert_cols
    );
  end if;

  if client_update_cols is not null then
    execute format(
      'grant update (%s) on table public.family_profiles to authenticated',
      client_update_cols
    );
  end if;
end $$;

-- appointments
drop policy if exists "appointments: participantes" on public.appointments;
create policy "appointments: participantes"
  on public.appointments
  for all
  using (
    family_id = (select auth.uid())
    or caregiver_id = (select auth.uid())
  )
  with check (
    family_id = (select auth.uid())
    or caregiver_id = (select auth.uid())
  );

-- messages: subselect interno também precisa do (select auth.uid())
drop policy if exists "messages: participantes" on public.messages;
create policy "messages: participantes"
  on public.messages
  for all
  using (
    appointment_id in (
      select id from public.appointments
       where family_id = (select auth.uid())
          or caregiver_id = (select auth.uid())
    )
  )
  with check (
    appointment_id in (
      select id from public.appointments
       where family_id = (select auth.uid())
          or caregiver_id = (select auth.uid())
    )
  );

-- reviews
drop policy if exists "reviews: família insere" on public.reviews;
create policy "reviews: família insere"
  on public.reviews
  for insert
  with check (family_id = (select auth.uid()));

drop policy if exists "reviews: todos leem" on public.reviews;
create policy "reviews: todos leem"
  on public.reviews
  for select
  using (true);

-- favorites
drop policy if exists "favorites: família gerencia" on public.favorites;
create policy "favorites: família gerencia"
  on public.favorites
  for all
  using (family_id = (select auth.uid()))
  with check (family_id = (select auth.uid()));

-- invoices
drop policy if exists "invoices: família vê" on public.invoices;
create policy "invoices: família vê"
  on public.invoices
  for select
  using (family_id = (select auth.uid()));


-- -----------------------------------------------------------------------------
-- 9. statement_timeout — proteção contra queries runaway
-- -----------------------------------------------------------------------------
-- Aplica à role authenticated (clientes via PostgREST). Não afeta
-- service_role (Edge Functions, Stripe webhook) — eles podem rodar
-- batches longos quando necessário.

alter role authenticated set statement_timeout = '8s';
alter role anon          set statement_timeout = '5s';


-- -----------------------------------------------------------------------------
-- Pós-aplicação: atualizar estatísticas para o planner
-- -----------------------------------------------------------------------------
analyze public.appointments;
analyze public.messages;
analyze public.reviews;
analyze public.invoices;
analyze public.caregiver_profiles;
analyze public.family_profiles;
analyze public.caregiver_documents;
analyze public.professional_references;
analyze public.favorites;
