-- Advisor hardening: contact filter trigger and user consent policies.
-- Non-destructive: no data changes, no tables/indexes dropped.

alter function public.sanitize_chat_contact_content(text)
  set search_path = public, pg_temp;

alter function public.apply_chat_contact_filter()
  set search_path = public, pg_temp;

revoke execute on function public.apply_chat_contact_filter() from public, anon, authenticated;

drop policy if exists "Users can read own consents" on public.user_consents;
create policy "Users can read own consents"
  on public.user_consents
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own consents" on public.user_consents;
create policy "Users can insert own consents"
  on public.user_consents
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

notify pgrst, 'reload schema';
