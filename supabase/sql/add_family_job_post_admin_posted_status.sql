alter table public.family_job_posts
  add column if not exists admin_posted_at timestamptz null,
  add column if not exists admin_posted_by uuid null references public.profiles(id) on delete set null;

comment on column public.family_job_posts.admin_posted_at is
  'Marca quando o admin registrou que a necessidade/vaga ja foi divulgada externamente.';

comment on column public.family_job_posts.admin_posted_by is
  'Admin que marcou a necessidade/vaga como postada.';

create index if not exists family_job_posts_admin_posted_at_idx
  on public.family_job_posts (admin_posted_at desc nulls last);

drop function if exists public.admin_list_family_job_posts();

create or replace function public.admin_list_family_job_posts()
returns table(
  family_id uuid,
  family_name text,
  family_phone text,
  is_active boolean,
  use_profile_address boolean,
  cep text,
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  care_type text,
  schedule_days text[],
  schedule_periods text[],
  specific_schedule text,
  activities text[],
  requirements text[],
  notes text,
  admin_posted_at timestamptz,
  admin_posted_by uuid,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'forbidden';
  end if;

  return query
  select
    fjp.family_id,
    p.full_name as family_name,
    p.phone as family_phone,
    fjp.is_active,
    fjp.use_profile_address,
    fjp.cep,
    fjp.street,
    fjp.number,
    fjp.complement,
    fjp.neighborhood,
    fjp.city,
    fjp.state::text,
    fjp.care_type,
    fjp.schedule_days,
    fjp.schedule_periods,
    fjp.specific_schedule,
    fjp.activities,
    fjp.requirements,
    fjp.notes,
    fjp.admin_posted_at,
    fjp.admin_posted_by,
    fjp.updated_at
  from public.family_job_posts fjp
  left join public.profiles p on p.id = fjp.family_id
  where fjp.is_active = true
    and (
      fjp.care_type is not null
      or array_length(fjp.activities, 1) is not null
      or array_length(fjp.requirements, 1) is not null
      or nullif(btrim(coalesce(fjp.notes, '')), '') is not null
    )
  order by fjp.admin_posted_at asc nulls first, fjp.updated_at desc;
end;
$function$;

revoke all on function public.admin_list_family_job_posts() from public;
grant execute on function public.admin_list_family_job_posts() to authenticated;

create or replace function public.admin_mark_family_job_post_posted(
  p_family_id uuid,
  p_posted boolean default true
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'forbidden';
  end if;

  update public.family_job_posts
  set
    admin_posted_at = case when p_posted then now() else null end,
    admin_posted_by = case when p_posted then auth.uid() else null end
  where family_id = p_family_id;
end;
$function$;

revoke all on function public.admin_mark_family_job_post_posted(uuid, boolean) from public;
grant execute on function public.admin_mark_family_job_post_posted(uuid, boolean) to authenticated;

notify pgrst, 'reload schema';
