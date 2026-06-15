-- Advisor hardening: replace auth.uid() with initPlan-friendly (select auth.uid()).
-- Group 1 keeps the original business rules for low-risk tables.

drop policy if exists "caregiver_availability: dono gerencia" on public.caregiver_availability;
create policy "caregiver_availability: dono gerencia"
  on public.caregiver_availability
  for all
  to authenticated
  using (caregiver_id = (select auth.uid()));

drop policy if exists "caregiver_documents: dono gerencia" on public.caregiver_documents;
create policy "caregiver_documents: dono gerencia"
  on public.caregiver_documents
  for all
  to authenticated
  using (caregiver_id = (select auth.uid()));

drop policy if exists "caregiver_documents: família assinante lê visíveis" on public.caregiver_documents;
create policy "caregiver_documents: família assinante lê visíveis"
  on public.caregiver_documents
  for select
  to authenticated
  using (
    is_visible = true
    and exists (
      select 1
      from public.family_profiles
      where family_profiles.id = (select auth.uid())
        and family_profiles.subscription_status = 'active'
    )
  );

drop policy if exists "support_tickets: usuário gerencia os seus" on public.support_tickets;
create policy "support_tickets: usuário gerencia os seus"
  on public.support_tickets
  for all
  to authenticated
  using (user_id = (select auth.uid()));

-- Group 2: family_profiles linked-caregiver read policies.

drop policy if exists "caregiver reads linked family" on public.family_profiles;
create policy "caregiver reads linked family"
  on public.family_profiles
  for select
  to authenticated
  using (
    (select auth.uid()) = id
    or exists (
      select 1
      from public.appointments
      where appointments.family_id = family_profiles.id
        and appointments.caregiver_id = (select auth.uid())
        and appointments.status = any (array['ativo'::text, 'pendente'::text, 'cancelado'::text])
    )
  );

drop policy if exists "family_profiles: cuidador lê dados do idoso no atendimento" on public.family_profiles;
create policy "family_profiles: cuidador lê dados do idoso no atendimento"
  on public.family_profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.appointments
      where appointments.family_id = family_profiles.id
        and appointments.caregiver_id = (select auth.uid())
        and appointments.status = any (array['pendente'::text, 'ativo'::text, 'finalizado'::text, 'cancelado'::text])
    )
  );

-- Group 3: remove duplicate legacy policies already covered by optimized policies.

drop policy if exists "favorites: família gerencia os seus" on public.favorites;

drop policy if exists "invoices: família vê as suas" on public.invoices;

-- Group 4: caregiver_profiles duplicate owner policy and public read initPlan.

drop policy if exists "caregiver_profiles: dono gerencia" on public.caregiver_profiles;

drop policy if exists "caregiver: público lê perfil completo" on public.caregiver_profiles;
create policy "caregiver: público lê perfil completo"
  on public.caregiver_profiles
  for select
  to public
  using (
    profile_complete = true
    or id = (select auth.uid())
  );
