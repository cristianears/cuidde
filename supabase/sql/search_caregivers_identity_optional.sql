-- Keep proximity search aligned with marketplace visibility:
-- identity document upload is a trust signal, not a visibility requirement.

create or replace function public.search_caregivers_by_proximity(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision default 20
)
returns table(id uuid, distance_km double precision)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
begin
  if not exists (
    select 1
    from public.family_profiles
    where family_profiles.id = auth.uid()
  ) then
    raise exception 'access denied: only families can search by proximity';
  end if;

  return query
  with distances as (
    select
      cp.id as caregiver_id,
      (
        6371.0 * 2.0 * asin(
          sqrt(
            least(
              1.0,
              power(sin(radians(cp.lat - p_lat) / 2.0), 2)
              + cos(radians(p_lat))
              * cos(radians(cp.lat))
              * power(sin(radians(cp.lng - p_lng) / 2.0), 2)
            )
          )
        )
      ) as distance_km
    from public.caregiver_profiles cp
    where cp.profile_complete = true
      and cp.account_status = 'active'
      and (
        cp.is_visible = true
        or exists (
          select 1 from public.private_caregiver_visibility pcv
          where pcv.caregiver_id = cp.id and pcv.family_id = auth.uid()
        )
      )
      and cp.is_available_for_new = true
      and cp.lat is not null
      and cp.lng is not null
  )
  select caregiver_id as id, distances.distance_km
  from distances
  where distances.distance_km <= p_radius_km
  order by distances.distance_km asc;
end;
$function$;

revoke all on function public.search_caregivers_by_proximity(double precision, double precision, double precision) from public;
grant execute on function public.search_caregivers_by_proximity(double precision, double precision, double precision) to authenticated;

notify pgrst, 'reload schema';
