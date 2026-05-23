-- Keep Google OAuth users in onboarding until they choose a role.
-- Email/password signup still sends role metadata and creates the matching profile row.

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

  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    user_role,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
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
