# Rollback Advisor Hardening

## Bloco A: SECURITY DEFINER grants

Applied migration: `supabase/sql/advisor_hardening_security_definer.sql`

Rollback SQL:

```sql
grant execute on function public._refresh_caregiver_metrics_30d(uuid) to anon, authenticated;
grant execute on function public.compute_profile_complete(uuid) to anon, authenticated;
grant execute on function public.fn_update_caregiver_rating() to anon, authenticated;
grant execute on function public.handle_new_user() to anon, authenticated;
grant execute on function public.prevent_role_escalation() to anon, authenticated;
grant execute on function public.refresh_caregiver_computed(uuid) to anon, authenticated;
grant execute on function public.trg_profile_complete_from_doc() to anon, authenticated;
grant execute on function public.trg_profile_complete_from_profile() to anon, authenticated;
grant execute on function public.trg_profile_complete_from_ref() to anon, authenticated;

grant execute on function public.get_caregiver_gated_preview(uuid) to anon, authenticated;
grant execute on function public.get_caregiver_public_detail(uuid) to anon, authenticated;
grant execute on function public.replace_professional_references(uuid, jsonb, boolean, boolean, boolean) to anon, authenticated;
grant execute on function public.reset_caregiver_to_pending(uuid) to anon, authenticated;
grant execute on function public.track_caregiver_interest(uuid) to anon, authenticated;
grant execute on function public.track_caregiver_view(uuid) to anon, authenticated;
grant execute on function public.track_search_appearances(uuid[]) to anon, authenticated;

notify pgrst, 'reload schema';
```

## Bloco C: RLS auth.uid() initPlan - group 1

Applied migration: `supabase/sql/advisor_hardening_rls_initplan.sql`

Rollback SQL:

```sql
drop policy if exists "caregiver_availability: dono gerencia" on public.caregiver_availability;
create policy "caregiver_availability: dono gerencia"
  on public.caregiver_availability
  for all
  to public
  using (caregiver_id = auth.uid());

drop policy if exists "caregiver_documents: dono gerencia" on public.caregiver_documents;
create policy "caregiver_documents: dono gerencia"
  on public.caregiver_documents
  for all
  to public
  using (caregiver_id = auth.uid());

drop policy if exists "caregiver_documents: família assinante lê visíveis" on public.caregiver_documents;
create policy "caregiver_documents: família assinante lê visíveis"
  on public.caregiver_documents
  for select
  to public
  using (
    is_visible = true
    and exists (
      select 1
      from public.family_profiles
      where family_profiles.id = auth.uid()
        and family_profiles.subscription_status = 'active'
    )
  );

drop policy if exists "support_tickets: usuário gerencia os seus" on public.support_tickets;
create policy "support_tickets: usuário gerencia os seus"
  on public.support_tickets
  for all
  to public
  using (user_id = auth.uid());
```

## Bloco C: RLS auth.uid() initPlan - group 2

Applied migration: `advisor_hardening_rls_initplan_group_2`

Rollback SQL:

```sql
drop policy if exists "caregiver reads linked family" on public.family_profiles;
create policy "caregiver reads linked family"
  on public.family_profiles
  for select
  to public
  using (
    auth.uid() = id
    or exists (
      select 1
      from public.appointments
      where appointments.family_id = family_profiles.id
        and appointments.caregiver_id = auth.uid()
        and appointments.status = any (array['ativo'::text, 'pendente'::text])
    )
  );

drop policy if exists "family_profiles: cuidador lê dados do idoso no atendimento" on public.family_profiles;
create policy "family_profiles: cuidador lê dados do idoso no atendimento"
  on public.family_profiles
  for select
  to public
  using (
    exists (
      select 1
      from public.appointments
      where appointments.family_id = family_profiles.id
        and appointments.caregiver_id = auth.uid()
        and appointments.status = any (array['pendente'::text, 'ativo'::text, 'finalizado'::text])
    )
  );
```

Prefer a forward rollback migration in Supabase instead of rewriting git history.

## Bloco B: function search_path

Applied migration: `supabase/sql/advisor_hardening_function_search_path.sql`

Rollback SQL:

```sql
alter function public.compute_profile_complete(uuid) reset search_path;
alter function public.fn_update_caregiver_rating() reset search_path;
alter function public.refresh_caregiver_computed(uuid) reset search_path;
alter function public.replace_professional_references(uuid, jsonb, boolean, boolean, boolean) reset search_path;
alter function public.trg_profile_complete_from_doc() reset search_path;
alter function public.trg_profile_complete_from_profile() reset search_path;
alter function public.trg_profile_complete_from_ref() reset search_path;
alter function public.update_updated_at() reset search_path;

notify pgrst, 'reload schema';
```

## Bloco F: caregiver_events.family_id index

Applied migration: `supabase/sql/advisor_hardening_indexes.sql`

Rollback SQL:

```sql
drop index concurrently if exists public.idx_caregiver_events_family_id;
```

## Bloco E: avatars bucket listing

Applied migration: `supabase/sql/advisor_hardening_storage_avatars.sql`

Rollback SQL:

```sql
drop policy if exists "avatars: leitura própria" on storage.objects;

create policy "avatars: leitura pública"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars'::text);
```

## Bloco D: duplicate permissive policies - reviews

Applied migration: `supabase/sql/advisor_hardening_permissive_policies.sql`

Rollback SQL:

```sql
drop policy if exists "reviews: família insere somente para o cuidador do atendimento" on public.reviews;
create policy "reviews: família insere somente para o cuidador do atendimento"
  on public.reviews
  for insert
  to public
  with check (
    (family_id = auth.uid())
    and (
      caregiver_id = (
        select a.caregiver_id
        from public.appointments a
        where a.id = reviews.appointment_id
          and a.family_id = auth.uid()
          and a.status = 'finalizado'::text
      )
    )
  );

create policy "reviews: família insere"
  on public.reviews
  for insert
  to public
  with check (family_id = (select auth.uid()));
```

## Bloco C: RLS auth.uid() initPlan - group 3

Applied migration: `supabase/sql/advisor_hardening_rls_initplan.sql`

Rollback SQL:

```sql
create policy "favorites: família gerencia os seus"
  on public.favorites
  for all
  to public
  using (family_id = auth.uid());

create policy "invoices: família vê as suas"
  on public.invoices
  for select
  to public
  using (family_id = auth.uid());
```

## Bloco C: RLS auth.uid() initPlan - group 4

Applied migration: `supabase/sql/advisor_hardening_rls_initplan.sql`

Rollback SQL:

```sql
drop policy if exists "caregiver: público lê perfil completo" on public.caregiver_profiles;
create policy "caregiver: público lê perfil completo"
  on public.caregiver_profiles
  for select
  to public
  using ((profile_complete = true) or (auth.uid() = id));

create policy "caregiver_profiles: dono gerencia"
  on public.caregiver_profiles
  for all
  to public
  using (auth.uid() = id);
```

## Bloco D: duplicate permissive policies - professional_references

Applied migration: `supabase/sql/advisor_hardening_permissive_policies.sql`

Rollback SQL:

```sql
drop policy if exists "professional_references: dono ou família assinante lê" on public.professional_references;
drop policy if exists "professional_references: dono insere" on public.professional_references;
drop policy if exists "professional_references: dono atualiza" on public.professional_references;
drop policy if exists "professional_references: dono remove" on public.professional_references;

create policy "professional_references: dono gerencia"
  on public.professional_references
  for all
  to public
  using (caregiver_id = auth.uid());

create policy "professional_references: família assinante lê"
  on public.professional_references
  for select
  to public
  using (
    exists (
      select 1
      from public.family_profiles
      where family_profiles.id = auth.uid()
        and family_profiles.subscription_status = 'active'
    )
  );
```

## Bloco D: duplicate permissive policies - caregiver_profiles

Applied migration: `supabase/sql/advisor_hardening_permissive_policies.sql`

Rollback SQL:

```sql
drop policy if exists "caregiver_profiles: leitura consolidada" on public.caregiver_profiles;
drop policy if exists "caregiver_profiles: dono insere" on public.caregiver_profiles;
drop policy if exists "caregiver_profiles: dono atualiza" on public.caregiver_profiles;
drop policy if exists "caregiver_profiles: dono remove" on public.caregiver_profiles;

create policy "caregiver: dono edita"
  on public.caregiver_profiles
  for all
  to public
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "caregiver: público lê perfil completo"
  on public.caregiver_profiles
  for select
  to public
  using ((profile_complete = true) or (id = (select auth.uid())));

create policy "caregiver_profiles: público lê verificados e visíveis"
  on public.caregiver_profiles
  for select
  to public
  using ((status = 'verified'::text) and (is_visible = true));

create policy "caregiver_public_searchable"
  on public.caregiver_profiles
  for select
  to public
  using ((profile_complete = true) and (has_rg_cnh = true) and (is_available_for_new = true));
```

## Bloco D: duplicate permissive policies - caregiver_availability

Applied migration: `supabase/sql/advisor_hardening_permissive_policies.sql`

Rollback SQL:

```sql
drop policy if exists "caregiver_availability: dono insere" on public.caregiver_availability;
drop policy if exists "caregiver_availability: dono atualiza" on public.caregiver_availability;
drop policy if exists "caregiver_availability: dono remove" on public.caregiver_availability;

create policy "caregiver_availability: dono gerencia"
  on public.caregiver_availability
  for all
  to authenticated
  using (caregiver_id = (select auth.uid()));
```

## Bloco D: duplicate permissive policies - caregiver_documents

Applied migration: `supabase/sql/advisor_hardening_permissive_policies.sql`

Rollback SQL:

```sql
drop policy if exists "caregiver_documents: dono ou família assinante lê" on public.caregiver_documents;
drop policy if exists "caregiver_documents: dono insere" on public.caregiver_documents;
drop policy if exists "caregiver_documents: dono atualiza" on public.caregiver_documents;
drop policy if exists "caregiver_documents: dono remove" on public.caregiver_documents;

create policy "caregiver_documents: dono gerencia"
  on public.caregiver_documents
  for all
  to authenticated
  using (caregiver_id = (select auth.uid()));

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
```

## Bloco D: duplicate permissive policies - family_profiles

Applied migration: `supabase/sql/advisor_hardening_permissive_policies.sql`

Rollback SQL:

```sql
drop policy if exists "family_profiles: leitura consolidada" on public.family_profiles;

create policy "family_profiles_owner_select"
  on public.family_profiles
  for select
  to public
  using ((select auth.uid()) = id);

create policy "caregiver reads linked family"
  on public.family_profiles
  for select
  to authenticated
  using (
    ((select auth.uid()) = id)
    or exists (
      select 1
      from public.appointments
      where appointments.family_id = family_profiles.id
        and appointments.caregiver_id = (select auth.uid())
        and appointments.status = any (array['ativo'::text, 'pendente'::text])
    )
  );

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
        and appointments.status = any (array['pendente'::text, 'ativo'::text, 'finalizado'::text])
    )
  );
```

## Bloco D: duplicate permissive policies - profiles

Applied migration: `supabase/sql/advisor_hardening_permissive_policies.sql`

Rollback SQL:

```sql
drop policy if exists "profiles: leitura consolidada" on public.profiles;
drop policy if exists "profiles: dono insere" on public.profiles;
drop policy if exists "profiles: dono atualiza" on public.profiles;
drop policy if exists "profiles: dono remove" on public.profiles;

create policy "profiles: ver e editar próprio"
  on public.profiles
  for all
  to public
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "profiles: leitura contextual"
  on public.profiles
  for select
  to public
  using (
    auth.uid() = id
    or id in (
      select cp.id
      from public.caregiver_profiles cp
      where cp.profile_complete = true
    )
    or id in (
      select a.family_id
      from public.appointments a
      where a.caregiver_id = auth.uid()
        and a.status = any (array['ativo'::text, 'pendente'::text, 'finalizado'::text])
    )
    or id in (
      select a.caregiver_id
      from public.appointments a
      where a.family_id = auth.uid()
        and a.status = any (array['ativo'::text, 'pendente'::text, 'finalizado'::text])
    )
  );
```

## Bloco D: duplicate permissive policies - appointments

Applied migration: `supabase/sql/advisor_hardening_permissive_policies.sql`

Rollback SQL:

```sql
drop policy if exists "appointments: participantes leem" on public.appointments;
drop policy if exists "appointments: participantes inserem" on public.appointments;
drop policy if exists "appointments: participantes atualizam" on public.appointments;
drop policy if exists "appointments: participantes removem" on public.appointments;

create policy "appointments: participantes"
  on public.appointments
  for all
  to public
  using (
    family_id = (select auth.uid())
    or caregiver_id = (select auth.uid())
  )
  with check (
    family_id = (select auth.uid())
    or caregiver_id = (select auth.uid())
  );

create policy "appointments: participantes acessam"
  on public.appointments
  for all
  to public
  using (
    family_id = auth.uid()
    or caregiver_id = auth.uid()
  );

create policy "Family creates appointments"
  on public.appointments
  for insert
  to public
  with check (family_id = auth.uid());

create policy "Participants update appointments"
  on public.appointments
  for update
  to public
  using (
    family_id = auth.uid()
    or caregiver_id = auth.uid()
  )
  with check (
    family_id = auth.uid()
    or caregiver_id = auth.uid()
  );
```
