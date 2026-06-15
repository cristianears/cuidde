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
        and appointments.status = any (array['pendente'::text, 'ativo'::text, 'finalizado'::text, 'cancelado'::text])
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
        and a.status = any (array['ativo'::text, 'pendente'::text, 'finalizado'::text, 'cancelado'::text])
    )
    or id in (
      select a.caregiver_id
      from public.appointments a
      where a.family_id = (select auth.uid())
        and a.status = any (array['ativo'::text, 'pendente'::text, 'finalizado'::text, 'cancelado'::text])
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

-- Group D8: appointments participant policies split by command.

drop policy if exists "appointments: participantes" on public.appointments;
drop policy if exists "appointments: participantes acessam" on public.appointments;
drop policy if exists "Family creates appointments" on public.appointments;
drop policy if exists "Participants update appointments" on public.appointments;

create policy "appointments: participantes leem"
  on public.appointments
  for select
  to authenticated
  using (
    family_id = (select auth.uid())
    or caregiver_id = (select auth.uid())
  );

create policy "appointments: participantes inserem"
  on public.appointments
  for insert
  to authenticated
  with check (
    family_id = (select auth.uid())
    or caregiver_id = (select auth.uid())
  );

create policy "appointments: participantes atualizam"
  on public.appointments
  for update
  to authenticated
  using (
    family_id = (select auth.uid())
    or caregiver_id = (select auth.uid())
  )
  with check (
    family_id = (select auth.uid())
    or caregiver_id = (select auth.uid())
  );

create policy "appointments: participantes removem"
  on public.appointments
  for delete
  to authenticated
  using (
    family_id = (select auth.uid())
    or caregiver_id = (select auth.uid())
  );

-- Group D9: messages participant policies split by command.

drop policy if exists "messages: participantes" on public.messages;
drop policy if exists "messages: insert com sender_id validado" on public.messages;
drop policy if exists "messages: select para participantes" on public.messages;
drop policy if exists "messages: update read_at para destinatário" on public.messages;

create policy "messages: participantes leem"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.appointments a
      where a.id = messages.appointment_id
        and (
          a.family_id = (select auth.uid())
          or a.caregiver_id = (select auth.uid())
        )
    )
  );

create policy "messages: participantes inserem"
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1
      from public.appointments a
      where a.id = messages.appointment_id
        and (
          a.family_id = (select auth.uid())
          or a.caregiver_id = (select auth.uid())
        )
    )
    and (
      exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and p.role = 'caregiver'
      )
      or exists (
        select 1
        from public.family_profiles f
        where f.id = (select auth.uid())
          and f.subscription_status = any (array['active'::text, 'past_due'::text])
      )
    )
  );

create policy "messages: destinatario marca como lida"
  on public.messages
  for update
  to authenticated
  using (
    sender_id <> (select auth.uid())
    and exists (
      select 1
      from public.appointments a
      where a.id = messages.appointment_id
        and (
          a.family_id = (select auth.uid())
          or a.caregiver_id = (select auth.uid())
        )
    )
  )
  with check (
    sender_id <> (select auth.uid())
    and exists (
      select 1
      from public.appointments a
      where a.id = messages.appointment_id
        and (
          a.family_id = (select auth.uid())
          or a.caregiver_id = (select auth.uid())
      )
    )
  );

-- Group D10: care_routines participant read and caregiver writes split by command.

drop policy if exists "Caregiver manages own care routines" on public.care_routines;
drop policy if exists "care_routines: participantes do agendamento" on public.care_routines;
drop policy if exists "Caregiver deletes care routines" on public.care_routines;
drop policy if exists "Caregiver inserts care routines" on public.care_routines;
drop policy if exists "Family views own care routines" on public.care_routines;
drop policy if exists "Caregiver updates care routines" on public.care_routines;

create policy "care_routines: participantes leem"
  on public.care_routines
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.appointments a
      where a.id = care_routines.appointment_id
        and (
          a.family_id = (select auth.uid())
          or a.caregiver_id = (select auth.uid())
        )
    )
  );

create policy "care_routines: cuidador insere em atendimento ativo"
  on public.care_routines
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.appointments a
      where a.id = care_routines.appointment_id
        and a.caregiver_id = (select auth.uid())
        and a.status = 'ativo'::text
    )
  );

create policy "care_routines: cuidador atualiza em atendimento ativo"
  on public.care_routines
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.appointments a
      where a.id = care_routines.appointment_id
        and a.caregiver_id = (select auth.uid())
        and a.status = 'ativo'::text
    )
  )
  with check (
    exists (
      select 1
      from public.appointments a
      where a.id = care_routines.appointment_id
        and a.caregiver_id = (select auth.uid())
        and a.status = 'ativo'::text
    )
  );

create policy "care_routines: cuidador remove em atendimento ativo"
  on public.care_routines
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.appointments a
      where a.id = care_routines.appointment_id
        and a.caregiver_id = (select auth.uid())
        and a.status = 'ativo'::text
    )
  );
