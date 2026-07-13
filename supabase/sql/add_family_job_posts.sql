create table if not exists public.family_job_posts (
  family_id uuid primary key references public.family_profiles(id) on delete cascade,
  is_active boolean not null default true,
  use_profile_address boolean not null default true,
  cep text null,
  street text null,
  number text null,
  complement text null,
  neighborhood text null,
  city text null,
  state char(2) null,
  lat numeric null,
  lng numeric null,
  care_type text null check (care_type is null or care_type in ('plantao', 'mensalista', 'diaria', 'turno', 'a_combinar')),
  schedule_days text[] not null default '{}'::text[],
  schedule_periods text[] not null default '{}'::text[],
  specific_schedule text null,
  activities text[] not null default '{}'::text[],
  requirements text[] not null default '{}'::text[],
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.family_job_posts is
  'Necessidade de cuidado informada pela familia para recomendacao de cuidadores e apoio a divulgacao administrativa. Uma linha por familia.';

create index if not exists family_job_posts_active_city_idx
  on public.family_job_posts (is_active, city, state);
create index if not exists family_job_posts_lat_lng_idx
  on public.family_job_posts (lat, lng)
  where lat is not null and lng is not null;
create index if not exists family_job_posts_updated_at_idx
  on public.family_job_posts (updated_at desc);

create or replace function public.touch_family_job_posts_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

drop trigger if exists family_job_posts_touch_updated_at on public.family_job_posts;
create trigger family_job_posts_touch_updated_at
before update on public.family_job_posts
for each row execute function public.touch_family_job_posts_updated_at();

alter table public.family_job_posts enable row level security;

drop policy if exists "family_job_posts: family reads own" on public.family_job_posts;
create policy "family_job_posts: family reads own"
on public.family_job_posts for select
to authenticated
using (family_id = (select auth.uid()));

drop policy if exists "family_job_posts: family inserts own" on public.family_job_posts;
create policy "family_job_posts: family inserts own"
on public.family_job_posts for insert
to authenticated
with check (family_id = (select auth.uid()));

drop policy if exists "family_job_posts: family updates own" on public.family_job_posts;
create policy "family_job_posts: family updates own"
on public.family_job_posts for update
to authenticated
using (family_id = (select auth.uid()))
with check (family_id = (select auth.uid()));

drop policy if exists "family_job_posts: admin reads all" on public.family_job_posts;
create policy "family_job_posts: admin reads all"
on public.family_job_posts for select
to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

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
  order by fjp.updated_at desc;
end;
$function$;

revoke all on function public.admin_list_family_job_posts() from public;
grant execute on function public.admin_list_family_job_posts() to authenticated;

notify pgrst, 'reload schema';
