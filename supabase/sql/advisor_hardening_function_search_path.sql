-- Advisor hardening: set explicit search_path on functions flagged by Security Advisor.
-- ALTER FUNCTION preserves body, owner, SECURITY DEFINER/INVOKER mode, and grants.

alter function public.compute_profile_complete(uuid)
  set search_path = public, pg_temp;

alter function public.fn_update_caregiver_rating()
  set search_path = public, pg_temp;

alter function public.refresh_caregiver_computed(uuid)
  set search_path = public, pg_temp;

alter function public.replace_professional_references(uuid, jsonb, boolean, boolean, boolean)
  set search_path = public, pg_temp;

alter function public.trg_profile_complete_from_doc()
  set search_path = public, pg_temp;

alter function public.trg_profile_complete_from_profile()
  set search_path = public, pg_temp;

alter function public.trg_profile_complete_from_ref()
  set search_path = public, pg_temp;

alter function public.update_updated_at()
  set search_path = public, pg_temp;

notify pgrst, 'reload schema';
