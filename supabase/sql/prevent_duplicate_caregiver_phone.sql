create or replace function public.normalize_phone_digits(p_phone text)
returns text
language sql
immutable
as $$
  select regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
$$;

create or replace function public.caregiver_phone_already_registered(p_phone text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where role = 'caregiver'
      and length(public.normalize_phone_digits(phone)) = 11
      and public.normalize_phone_digits(phone) = public.normalize_phone_digits(p_phone)
  )
$$;

revoke all on function public.caregiver_phone_already_registered(text) from public;
grant execute on function public.caregiver_phone_already_registered(text) to anon, authenticated;

create index if not exists profiles_caregiver_phone_digits_idx
  on public.profiles (public.normalize_phone_digits(phone))
  where role = 'caregiver'
    and length(public.normalize_phone_digits(phone)) = 11;

create or replace function public.prevent_duplicate_caregiver_phone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone_digits text;
begin
  if new.role is distinct from 'caregiver' then
    return new;
  end if;

  v_phone_digits := public.normalize_phone_digits(new.phone);

  if length(v_phone_digits) <> 11 then
    return new;
  end if;

  if exists (
    select 1
    from public.profiles p
    where p.role = 'caregiver'
      and p.id <> new.id
      and length(public.normalize_phone_digits(p.phone)) = 11
      and public.normalize_phone_digits(p.phone) = v_phone_digits
  ) then
    raise exception 'caregiver_phone_already_registered'
      using errcode = '23505';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_duplicate_caregiver_phone on public.profiles;

create trigger profiles_prevent_duplicate_caregiver_phone
  before insert or update of role, phone
  on public.profiles
  for each row
  execute function public.prevent_duplicate_caregiver_phone();

revoke all on function public.prevent_duplicate_caregiver_phone() from public;
