-- Database impact check for caregiver search and gated public profile details.

begin;

set local statement_timeout = '15s';

insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user, is_anonymous
) values
(
  '40000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'db-impact-search-free-family@example.invalid',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"family","full_name":"DB Impact Free Family","phone":"11972000001"}'::jsonb,
  now(),
  now(),
  false,
  false
),
(
  '40000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'db-impact-search-active-family@example.invalid',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"family","full_name":"DB Impact Active Family","phone":"11972000002"}'::jsonb,
  now(),
  now(),
  false,
  false
),
(
  '40000000-0000-0000-0000-000000000003',
  'authenticated',
  'authenticated',
  'db-impact-search-caregiver@example.invalid',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"caregiver","full_name":"DB Search Caregiver","phone":"11972000003","cpf":"39053344705"}'::jsonb,
  now(),
  now(),
  false,
  false
);

update public.family_profiles
set subscription_status = 'active'
where id = '40000000-0000-0000-0000-000000000002';

update public.caregiver_profiles
set
  is_available_for_new = true,
  status = 'verified',
  is_visible = true,
  has_rg_cnh = false,
  bio = repeat('Cuidadora criada para check preventivo. ', 5),
  specialties = array['companhia']::text[],
  modalities = array['diarias']::text[],
  city = 'Sao Paulo',
  state = 'SP',
  neighborhood = 'Centro',
  lat = -23.55052,
  lng = -46.633308,
  professional_reg_type = 'coren',
  professional_reg_number = 'COREN-DB-123',
  professional_reg_uf = 'SP'
where id = '40000000-0000-0000-0000-000000000003';

set local role authenticated;
set local request.jwt.claim.sub = '40000000-0000-0000-0000-000000000003';
set local request.jwt.claim.role = 'authenticated';

do $$
begin
  begin
    perform *
    from public.search_caregivers_by_proximity(-23.55052, -46.633308, 20);

    raise exception 'db_impact_check failed: only_families_can_search_by_proximity';
  exception
    when others then
      if sqlerrm = 'db_impact_check failed: only_families_can_search_by_proximity' then
        raise;
      end if;
  end;
end;
$$;

set local request.jwt.claim.sub = '40000000-0000-0000-0000-000000000001';

do $$
declare
  result_count integer;
  detail jsonb;
begin
  if exists (
    select 1
    from public.caregiver_documents
    where caregiver_id = '40000000-0000-0000-0000-000000000003'
      and type = 'rg_cnh'
      and status in ('sent', 'approved')
  ) then
    raise exception 'db_impact_check failed: fixture unexpectedly has identity document';
  end if;

  select count(*) into result_count
  from public.search_caregivers_by_proximity(-23.55052, -46.633308, 20)
  where id = '40000000-0000-0000-0000-000000000003';

  if result_count <> 1 then
    raise exception 'db_impact_check failed: profile_complete_caregiver_appears_in_radius_search';
  end if;

  select public.get_caregiver_public_detail('40000000-0000-0000-0000-000000000003') into detail;

  if detail is null
    or detail->>'full_name' = 'DB Search Caregiver'
    or detail->>'professional_reg_number' is not null
  then
    raise exception 'db_impact_check failed: free_family_sees_masked_caregiver_detail';
  end if;
end;
$$;

set local request.jwt.claim.sub = '40000000-0000-0000-0000-000000000002';

do $$
declare
  detail jsonb;
begin
  select public.get_caregiver_public_detail('40000000-0000-0000-0000-000000000003') into detail;

  if detail is null
    or detail->>'full_name' <> 'DB Search Caregiver'
    or detail->>'professional_reg_number' <> 'COREN-DB-123'
  then
    raise exception 'db_impact_check failed: active_family_sees_sensitive_caregiver_detail';
  end if;
end;
$$;

reset role;

rollback;

select 'db_impact_check_caregiver_search_passed' as status;
