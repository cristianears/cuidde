create or replace function public.normalize_cpf_digits(p_cpf text)
returns text
language sql
immutable
set search_path = public
as $$
  select regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g')
$$;

create or replace function public.is_valid_cpf(p_cpf text)
returns boolean
language plpgsql
immutable
set search_path = public
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

revoke execute on function public.prevent_invalid_or_duplicate_caregiver_cpf() from public, anon, authenticated;
