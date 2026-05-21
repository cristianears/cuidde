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
