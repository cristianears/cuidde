-- References and identity documents are trust/ranking signals and optional filters.
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

  return true;
end;
$function$;

update public.caregiver_profiles cp
set
  has_rg_cnh = exists (
    select 1
    from public.caregiver_documents cd
    where cd.caregiver_id = cp.id
      and cd.type = 'rg_cnh'
      and cd.status in ('sent', 'approved')
  ),
  profile_complete = public.compute_profile_complete(cp.id);

notify pgrst, 'reload schema';
