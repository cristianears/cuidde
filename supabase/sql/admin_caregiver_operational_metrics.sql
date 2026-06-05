create or replace function public.get_admin_caregiver_operational_metrics()
returns table (
  profile_complete_caregivers integer,
  caregivers_with_routine_any_time integer,
  caregivers_with_routine_last_30_days integer,
  caregivers_with_routine_last_7_days integer,
  caregivers_with_routine_today integer
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    (select count(*)::integer
       from public.caregiver_profiles
      where profile_complete = true) as profile_complete_caregivers,
    (select count(distinct a.caregiver_id)::integer
       from public.appointments a
       join public.care_routines cr on cr.appointment_id = a.id) as caregivers_with_routine_any_time,
    (select count(distinct a.caregiver_id)::integer
       from public.appointments a
       join public.care_routines cr on cr.appointment_id = a.id
      where cr.date >= current_date - interval '30 days') as caregivers_with_routine_last_30_days,
    (select count(distinct a.caregiver_id)::integer
       from public.appointments a
       join public.care_routines cr on cr.appointment_id = a.id
      where cr.date >= current_date - interval '7 days') as caregivers_with_routine_last_7_days,
    (select count(distinct a.caregiver_id)::integer
       from public.appointments a
       join public.care_routines cr on cr.appointment_id = a.id
      where cr.date = current_date) as caregivers_with_routine_today;
$$;

revoke execute on function public.get_admin_caregiver_operational_metrics() from public, anon, authenticated;
grant execute on function public.get_admin_caregiver_operational_metrics() to service_role;
