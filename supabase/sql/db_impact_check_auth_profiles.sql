-- Database impact check for auth/profile onboarding contracts.
--
-- Run through the Supabase MCP execute_sql tool after migrations that touch:
-- profiles, cpf, auth signup metadata, RLS policies, grants, triggers or onboarding.
--
-- This suite uses deterministic @example.invalid users and ends with rollback,
-- so successful runs do not persist test data.

begin;

set local statement_timeout = '15s';

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'cpf'
  ) then
    raise exception 'db_impact_check failed: profiles.cpf column is missing';
  end if;

  if not exists (
    select 1
    from information_schema.triggers
    where event_object_schema = 'auth'
      and event_object_table = 'users'
      and trigger_name = 'on_auth_user_created'
      and action_statement ilike '%handle_new_user%'
  ) then
    raise exception 'db_impact_check failed: auth.users trigger on_auth_user_created -> handle_new_user is missing';
  end if;

  if exists (
    select 1
    from information_schema.column_privileges
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'cpf'
      and grantee in ('anon', 'authenticated')
      and privilege_type = 'SELECT'
  ) then
    raise exception 'db_impact_check failed: profiles_cpf_not_selectable_by_authenticated';
  end if;
end;
$$;

insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user, is_anonymous
) values (
  '10000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'db-impact-google-caregiver@example.invalid',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"full_name":"DB Impact Google Caregiver","email":"db-impact-google-caregiver@example.invalid"}'::jsonb,
  now(),
  now(),
  false,
  false
);

do $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = '10000000-0000-0000-0000-000000000001'
      and role is null
  ) then
    raise exception 'db_impact_check failed: Google signup did not create a role-null profiles row';
  end if;
end;
$$;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
set local request.jwt.claim.role = 'authenticated';

update public.profiles
set
  role = 'caregiver',
  full_name = 'DB Impact Google Caregiver',
  phone = '11999999999',
  cpf = '93541134780'
where id = '10000000-0000-0000-0000-000000000001';

insert into public.caregiver_profiles (
  id, cep, street, number, neighborhood, city, state
) values (
  '10000000-0000-0000-0000-000000000001',
  '12240000',
  'Rua Teste',
  '123',
  'Centro',
  'Sao Jose dos Campos',
  'SP'
);

reset role;

do $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = '10000000-0000-0000-0000-000000000001'
      and role = 'caregiver'
      and cpf = '93541134780'
  ) then
    raise exception 'db_impact_check failed: authenticated_user_can_update_own_profile';
  end if;

  if not exists (
    select 1
    from public.caregiver_profiles
    where id = '10000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'db_impact_check failed: authenticated user could not insert own caregiver_profiles row';
  end if;
end;
$$;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
set local request.jwt.claim.role = 'authenticated';

do $$
begin
  begin
    insert into public.profiles (id, role, full_name, phone, cpf)
    values (
      '10000000-0000-0000-0000-000000000001',
      'caregiver',
      'DB Impact Google Caregiver',
      '11999999999',
      '93541134780'
    )
    on conflict (id) do update
    set
      role = excluded.role,
      full_name = excluded.full_name,
      phone = excluded.phone,
      cpf = excluded.cpf;

    raise exception 'db_impact_check failed: authenticated_profile_upsert_requires_table_select';
  exception
    when insufficient_privilege then
      null;
  end;
end;
$$;

reset role;

insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user, is_anonymous
) values (
  '10000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'db-impact-email-caregiver@example.invalid',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"caregiver","full_name":"DB Impact Email Caregiver","phone":"11988888888","cpf":"11144477735"}'::jsonb,
  now(),
  now(),
  false,
  false
);

do $$
begin
  if not exists (
    select 1
    from public.profiles p
    join public.caregiver_profiles cp on cp.id = p.id
    where p.id = '10000000-0000-0000-0000-000000000002'
      and p.role = 'caregiver'
      and p.phone = '11988888888'
      and p.cpf = '11144477735'
  ) then
    raise exception 'db_impact_check failed: handle_new_user_creates_caregiver_profile';
  end if;
end;
$$;

insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user, is_anonymous
) values (
  '10000000-0000-0000-0000-000000000003',
  'authenticated',
  'authenticated',
  'db-impact-email-family@example.invalid',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"family","full_name":"DB Impact Family","phone":"11977777777"}'::jsonb,
  now(),
  now(),
  false,
  false
);

do $$
begin
  if not exists (
    select 1
    from public.profiles p
    join public.family_profiles fp on fp.id = p.id
    where p.id = '10000000-0000-0000-0000-000000000003'
      and p.role = 'family'
      and p.cpf is null
  ) then
    raise exception 'db_impact_check failed: handle_new_user_creates_family_profile';
  end if;
end;
$$;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000002';
set local request.jwt.claim.role = 'authenticated';

insert into public.user_consents (
  user_id, consent_type, document_version, document_url,
  accepted, context, metadata
) values (
  '10000000-0000-0000-0000-000000000002',
  'terms_of_use',
  'db-impact-check',
  '/terms',
  true,
  'signup',
  '{"source":"db_impact_check"}'::jsonb
);

reset role;

do $$
begin
  if not exists (
    select 1
    from public.user_consents
    where user_id = '10000000-0000-0000-0000-000000000002'
      and context = 'signup'
      and document_version = 'db-impact-check'
  ) then
    raise exception 'db_impact_check failed: user_consents_insert_own_signup_terms';
  end if;
end;
$$;

rollback;

select 'db_impact_check_auth_profiles_passed' as status;
