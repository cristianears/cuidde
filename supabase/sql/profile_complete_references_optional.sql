-- References are a trust/ranking signal and an optional search filter.
-- They must not block caregivers from appearing in marketplace search.

create or replace function public.compute_profile_complete(cp_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_bio text;
  v_specialties text[];
  v_city text;
  v_neighborhood text;
  v_has_rg boolean;
begin
  select bio, specialties, city, neighborhood
  into v_bio, v_specialties, v_city, v_neighborhood
  from public.caregiver_profiles
  where id = cp_id;

  if not found then
    return false;
  end if;

  if v_city is null or trim(v_city) = '' then
    return false;
  end if;

  if v_neighborhood is null or trim(v_neighborhood) = '' then
    return false;
  end if;

  if v_bio is null or length(trim(v_bio)) < 10 then
    return false;
  end if;

  if v_specialties is null or array_length(v_specialties, 1) is null then
    return false;
  end if;

  select exists (
    select 1
    from public.caregiver_documents
    where caregiver_id = cp_id
      and type = 'rg_cnh'
      and status in ('sent', 'approved')
  ) into v_has_rg;

  if not v_has_rg then
    return false;
  end if;

  return true;
end;
$function$;

update public.caregiver_profiles
set profile_complete = public.compute_profile_complete(id);

notify pgrst, 'reload schema';
