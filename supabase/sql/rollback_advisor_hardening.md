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
