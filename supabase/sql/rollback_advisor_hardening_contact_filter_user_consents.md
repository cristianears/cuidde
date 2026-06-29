# Rollback: advisor_hardening_contact_filter_user_consents

This restores the Supabase state observed before the 2026-06-29 advisor hardening.

```sql
alter function public.sanitize_chat_contact_content(text)
  reset search_path;

alter function public.apply_chat_contact_filter()
  set search_path = public;

grant execute on function public.apply_chat_contact_filter() to public, anon, authenticated, service_role;

drop policy if exists "Users can read own consents" on public.user_consents;
create policy "Users can read own consents"
  on public.user_consents
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own consents" on public.user_consents;
create policy "Users can insert own consents"
  on public.user_consents
  for insert
  to authenticated
  with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
```
