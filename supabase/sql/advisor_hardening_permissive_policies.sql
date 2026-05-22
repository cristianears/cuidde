-- Advisor hardening: remove duplicate permissive policies.
-- Group D1: reviews INSERT keeps only the appointment-finalized rule.

drop policy if exists "reviews: família insere" on public.reviews;

drop policy if exists "reviews: família insere somente para o cuidador do atendimento" on public.reviews;
create policy "reviews: família insere somente para o cuidador do atendimento"
  on public.reviews
  for insert
  to authenticated
  with check (
    family_id = (select auth.uid())
    and caregiver_id = (
      select a.caregiver_id
      from public.appointments a
      where a.id = reviews.appointment_id
        and a.family_id = (select auth.uid())
        and a.status = 'finalizado'
    )
  );

-- Group D2: professional_references SELECT policies are complementary.
-- Keep one SELECT policy and split owner writes by command.

drop policy if exists "professional_references: dono gerencia" on public.professional_references;
drop policy if exists "professional_references: família assinante lê" on public.professional_references;

create policy "professional_references: dono ou família assinante lê"
  on public.professional_references
  for select
  to authenticated
  using (
    caregiver_id = (select auth.uid())
    or exists (
      select 1
      from public.family_profiles
      where family_profiles.id = (select auth.uid())
        and family_profiles.subscription_status = 'active'
    )
  );

create policy "professional_references: dono insere"
  on public.professional_references
  for insert
  to authenticated
  with check (caregiver_id = (select auth.uid()));

create policy "professional_references: dono atualiza"
  on public.professional_references
  for update
  to authenticated
  using (caregiver_id = (select auth.uid()))
  with check (caregiver_id = (select auth.uid()));

create policy "professional_references: dono remove"
  on public.professional_references
  for delete
  to authenticated
  using (caregiver_id = (select auth.uid()));

-- Group D3: caregiver_profiles SELECT policies consolidated, owner writes split by command.

drop policy if exists "caregiver: dono edita" on public.caregiver_profiles;
drop policy if exists "caregiver: público lê perfil completo" on public.caregiver_profiles;
drop policy if exists "caregiver_profiles: público lê verificados e visíveis" on public.caregiver_profiles;
drop policy if exists "caregiver_public_searchable" on public.caregiver_profiles;

create policy "caregiver_profiles: leitura consolidada"
  on public.caregiver_profiles
  for select
  to public
  using (
    id = (select auth.uid())
    or profile_complete = true
    or (status = 'verified' and is_visible = true)
    or (profile_complete = true and has_rg_cnh = true and is_available_for_new = true)
  );

create policy "caregiver_profiles: dono insere"
  on public.caregiver_profiles
  for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "caregiver_profiles: dono atualiza"
  on public.caregiver_profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "caregiver_profiles: dono remove"
  on public.caregiver_profiles
  for delete
  to authenticated
  using (id = (select auth.uid()));

-- Group D4: caregiver_availability keeps public read and splits owner writes.

drop policy if exists "caregiver_availability: dono gerencia" on public.caregiver_availability;

create policy "caregiver_availability: dono insere"
  on public.caregiver_availability
  for insert
  to authenticated
  with check (caregiver_id = (select auth.uid()));

create policy "caregiver_availability: dono atualiza"
  on public.caregiver_availability
  for update
  to authenticated
  using (caregiver_id = (select auth.uid()))
  with check (caregiver_id = (select auth.uid()));

create policy "caregiver_availability: dono remove"
  on public.caregiver_availability
  for delete
  to authenticated
  using (caregiver_id = (select auth.uid()));

-- Group D5: caregiver_documents SELECT policies are complementary.
-- Keep subscriber gating and split owner writes by command.

drop policy if exists "caregiver_documents: dono gerencia" on public.caregiver_documents;
drop policy if exists "caregiver_documents: família assinante lê visíveis" on public.caregiver_documents;

create policy "caregiver_documents: dono ou família assinante lê"
  on public.caregiver_documents
  for select
  to authenticated
  using (
    caregiver_id = (select auth.uid())
    or (
      is_visible = true
      and exists (
        select 1
        from public.family_profiles
        where family_profiles.id = (select auth.uid())
          and family_profiles.subscription_status = 'active'
      )
    )
  );

create policy "caregiver_documents: dono insere"
  on public.caregiver_documents
  for insert
  to authenticated
  with check (caregiver_id = (select auth.uid()));

create policy "caregiver_documents: dono atualiza"
  on public.caregiver_documents
  for update
  to authenticated
  using (caregiver_id = (select auth.uid()))
  with check (caregiver_id = (select auth.uid()));

create policy "caregiver_documents: dono remove"
  on public.caregiver_documents
  for delete
  to authenticated
  using (caregiver_id = (select auth.uid()));

-- Group D6: family_profiles SELECT policies consolidated.
-- Never query family_profiles from a family_profiles policy, to avoid RLS recursion.

drop policy if exists "caregiver reads linked family" on public.family_profiles;
drop policy if exists "family_profiles: cuidador lê dados do idoso no atendimento" on public.family_profiles;
drop policy if exists "family_profiles_owner_select" on public.family_profiles;

create policy "family_profiles: leitura consolidada"
  on public.family_profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.appointments
      where appointments.family_id = family_profiles.id
        and appointments.caregiver_id = (select auth.uid())
        and appointments.status = any (array['pendente'::text, 'ativo'::text, 'finalizado'::text])
    )
  );

-- Group D7: profiles SELECT policies consolidated and owner writes split by command.

drop policy if exists "profiles: leitura contextual" on public.profiles;
drop policy if exists "profiles: ver e editar próprio" on public.profiles;

create policy "profiles: leitura consolidada"
  on public.profiles
  for select
  to public
  using (
    id = (select auth.uid())
    or id in (
      select cp.id
      from public.caregiver_profiles cp
      where cp.profile_complete = true
    )
    or id in (
      select a.family_id
      from public.appointments a
      where a.caregiver_id = (select auth.uid())
        and a.status = any (array['ativo'::text, 'pendente'::text, 'finalizado'::text])
    )
    or id in (
      select a.caregiver_id
      from public.appointments a
      where a.family_id = (select auth.uid())
        and a.status = any (array['ativo'::text, 'pendente'::text, 'finalizado'::text])
    )
  );

create policy "profiles: dono insere"
  on public.profiles
  for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "profiles: dono atualiza"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles: dono remove"
  on public.profiles
  for delete
  to authenticated
  using (id = (select auth.uid()));
