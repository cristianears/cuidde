-- Advisor hardening: limit direct execution of SECURITY DEFINER functions.
-- Internal trigger/helper functions should not be callable through PostgREST.
-- Authenticated RPCs keep authenticated access and explicitly drop anonymous access.

revoke execute on function public._refresh_caregiver_metrics_30d(uuid) from public, anon, authenticated;
revoke execute on function public.compute_profile_complete(uuid) from public, anon, authenticated;
revoke execute on function public.fn_update_caregiver_rating() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.prevent_role_escalation() from public, anon, authenticated;
revoke execute on function public.refresh_caregiver_computed(uuid) from public, anon, authenticated;
revoke execute on function public.trg_profile_complete_from_doc() from public, anon, authenticated;
revoke execute on function public.trg_profile_complete_from_profile() from public, anon, authenticated;
revoke execute on function public.trg_profile_complete_from_ref() from public, anon, authenticated;

revoke execute on function public.get_caregiver_gated_preview(uuid) from public, anon;
revoke execute on function public.get_caregiver_public_detail(uuid) from public, anon;
revoke execute on function public.replace_professional_references(uuid, jsonb, boolean, boolean, boolean) from public, anon;
revoke execute on function public.reset_caregiver_to_pending(uuid) from public, anon;
revoke execute on function public.track_caregiver_interest(uuid) from public, anon;
revoke execute on function public.track_caregiver_view(uuid) from public, anon;
revoke execute on function public.track_search_appearances(uuid[]) from public, anon;

grant execute on function public.get_caregiver_gated_preview(uuid) to authenticated;
grant execute on function public.get_caregiver_public_detail(uuid) to authenticated;
grant execute on function public.replace_professional_references(uuid, jsonb, boolean, boolean, boolean) to authenticated;
grant execute on function public.reset_caregiver_to_pending(uuid) to authenticated;
grant execute on function public.track_caregiver_interest(uuid) to authenticated;
grant execute on function public.track_caregiver_view(uuid) to authenticated;
grant execute on function public.track_search_appearances(uuid[]) to authenticated;

notify pgrst, 'reload schema';
