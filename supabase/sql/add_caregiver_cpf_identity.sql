alter table public.profiles
  add column if not exists cpf text;

comment on column public.profiles.cpf is
  'CPF do cuidador, normalizado para 11 digitos, usado para identidade, seguranca e prevencao de cadastro duplicado. Nao coletado para familias.';

create or replace function public.normalize_cpf_digits(p_cpf text)
returns text
language sql
immutable
as $$
  select regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g')
$$;

create or replace function public.is_valid_cpf(p_cpf text)
returns boolean
language plpgsql
immutable
as $$
declare
  v_cpf text;
  v_sum int;
  v_digit int;
  i int;
begin
  v_cpf := public.normalize_cpf_digits(p_cpf);

  if length(v_cpf) <> 11 then
    return false;
  end if;

  if v_cpf ~ '^(\d)\1{10}$' then
    return false;
  end if;

  v_sum := 0;
  for i in 1..9 loop
    v_sum := v_sum + substring(v_cpf from i for 1)::int * (11 - i);
  end loop;
  v_digit := (v_sum * 10) % 11;
  if v_digit = 10 then
    v_digit := 0;
  end if;
  if v_digit <> substring(v_cpf from 10 for 1)::int then
    return false;
  end if;

  v_sum := 0;
  for i in 1..10 loop
    v_sum := v_sum + substring(v_cpf from i for 1)::int * (12 - i);
  end loop;
  v_digit := (v_sum * 10) % 11;
  if v_digit = 10 then
    v_digit := 0;
  end if;

  return v_digit = substring(v_cpf from 11 for 1)::int;
end;
$$;

create or replace function public.caregiver_cpf_already_registered(p_cpf text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when not public.is_valid_cpf(p_cpf) then false
    else exists (
      select 1
      from public.profiles
      where role = 'caregiver'
        and public.normalize_cpf_digits(cpf) = public.normalize_cpf_digits(p_cpf)
    )
  end
$$;

revoke all on function public.caregiver_cpf_already_registered(text) from public;
grant execute on function public.caregiver_cpf_already_registered(text) to anon, authenticated;

create unique index if not exists profiles_caregiver_cpf_digits_uidx
  on public.profiles (public.normalize_cpf_digits(cpf))
  where role = 'caregiver'
    and length(public.normalize_cpf_digits(cpf)) = 11;

create or replace function public.prevent_invalid_or_duplicate_caregiver_cpf()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cpf_digits text;
begin
  if new.role is distinct from 'caregiver' then
    new.cpf := null;
    return new;
  end if;

  v_cpf_digits := public.normalize_cpf_digits(new.cpf);

  if length(v_cpf_digits) = 0 then
    raise exception 'caregiver_cpf_required'
      using errcode = '23502';
  end if;

  if not public.is_valid_cpf(v_cpf_digits) then
    raise exception 'caregiver_cpf_invalid'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.profiles p
    where p.role = 'caregiver'
      and p.id <> new.id
      and public.normalize_cpf_digits(p.cpf) = v_cpf_digits
  ) then
    raise exception 'caregiver_cpf_already_registered'
      using errcode = '23505';
  end if;

  new.cpf := v_cpf_digits;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_invalid_or_duplicate_caregiver_cpf on public.profiles;

create trigger profiles_prevent_invalid_or_duplicate_caregiver_cpf
  before insert or update of role, cpf
  on public.profiles
  for each row
  execute function public.prevent_invalid_or_duplicate_caregiver_cpf();

revoke all on function public.prevent_invalid_or_duplicate_caregiver_cpf() from public;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  user_role text;
begin
  user_role := new.raw_user_meta_data->>'role';

  if user_role is not null and user_role not in ('caregiver', 'family') then
    raise exception 'Role invalido: %. Apenas caregiver e family sao permitidos via signup.', user_role;
  end if;

  insert into public.profiles (id, role, full_name, phone, cpf)
  values (
    new.id,
    user_role,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    case
      when user_role = 'caregiver' then new.raw_user_meta_data->>'cpf'
      else null
    end
  );

  if user_role = 'caregiver' then
    insert into public.caregiver_profiles (id) values (new.id);
  elsif user_role = 'family' then
    insert into public.family_profiles (id) values (new.id);
  end if;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
