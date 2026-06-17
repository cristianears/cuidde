-- Keep professional references as an optional trust signal.
-- The computed refresh trigger must use the same completeness rule as
-- compute_profile_complete(), otherwise references can silently hide caregivers
-- from marketplace search again.

create or replace function public.refresh_caregiver_computed(cp_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_has_rg boolean;
  v_has_ant boolean;
  v_has_cert boolean;
  v_has_ref boolean;
begin
  if not exists (
    select 1
    from public.caregiver_profiles
    where id = cp_id
  ) then
    return;
  end if;

  select exists (
    select 1
    from public.caregiver_documents
    where caregiver_id = cp_id
      and type = 'rg_cnh'
      and status in ('sent', 'approved')
  ) into v_has_rg;

  select exists (
    select 1
    from public.caregiver_documents
    where caregiver_id = cp_id
      and type = 'antecedentes'
      and status in ('sent', 'approved')
  ) into v_has_ant;

  select exists (
    select 1
    from public.caregiver_documents
    where caregiver_id = cp_id
      and type = 'certificados'
      and status in ('sent', 'approved')
  ) into v_has_cert;

  select exists (
    select 1
    from public.professional_references
    where caregiver_id = cp_id
  ) into v_has_ref;

  update public.caregiver_profiles
  set
    has_rg_cnh = v_has_rg,
    has_antecedentes = v_has_ant,
    has_certificado = v_has_cert,
    has_references = v_has_ref,
    profile_complete = public.compute_profile_complete(cp_id)
  where id = cp_id;
end;
$function$;

update public.caregiver_profiles
set profile_complete = public.compute_profile_complete(id);

notify pgrst, 'reload schema';
