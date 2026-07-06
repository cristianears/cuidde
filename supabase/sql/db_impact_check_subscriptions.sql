-- Database impact check for family subscriptions, Stripe-owned fields and invoices.

begin;

set local statement_timeout = '15s';

do $$
begin
  if exists (
    select 1
    from information_schema.column_privileges
    where table_schema = 'public'
      and table_name = 'family_profiles'
      and column_name in (
        'stripe_customer_id',
        'stripe_subscription_id',
        'subscription_status',
        'plan',
        'cancel_at_period_end',
        'current_period_end',
        'pending_plan',
        'payment_failed_at'
      )
      and grantee in ('anon', 'authenticated')
      and privilege_type in ('INSERT', 'UPDATE')
  ) then
    raise exception 'db_impact_check failed: family_profiles_stripe_fields_not_client_writable';
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'family_profiles_stripe_customer_id_key'
  ) then
    raise exception 'db_impact_check failed: family_profiles stripe_customer_id unique constraint is missing';
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'family_profiles_stripe_subscription_id_key'
  ) then
    raise exception 'db_impact_check failed: family_profiles stripe_subscription_id unique constraint is missing';
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'invoices_stripe_invoice_id_key'
  ) then
    raise exception 'db_impact_check failed: invoices stripe_invoice_id unique constraint is missing';
  end if;
end;
$$;

insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user, is_anonymous
) values
(
  '20000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'db-impact-family-billing@example.invalid',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"family","full_name":"DB Impact Billing Family","phone":"11970000001"}'::jsonb,
  now(),
  now(),
  false,
  false
),
(
  '20000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'db-impact-other-family-billing@example.invalid',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"family","full_name":"DB Impact Other Billing Family","phone":"11970000002"}'::jsonb,
  now(),
  now(),
  false,
  false
);

set local role authenticated;
set local request.jwt.claim.sub = '20000000-0000-0000-0000-000000000001';
set local request.jwt.claim.role = 'authenticated';

update public.family_profiles
set
  elderly_name = 'Pessoa Teste',
  city = 'Sao Paulo',
  state = 'SP'
where id = '20000000-0000-0000-0000-000000000001';

do $$
begin
  begin
    update public.family_profiles
    set subscription_status = 'active'
    where id = '20000000-0000-0000-0000-000000000001';

    raise exception 'db_impact_check failed: family_profiles_stripe_fields_not_client_writable';
  exception
    when insufficient_privilege then
      null;
  end;
end;
$$;

reset role;

do $$
begin
  if not exists (
    select 1
    from public.family_profiles
    where id = '20000000-0000-0000-0000-000000000001'
      and elderly_name = 'Pessoa Teste'
      and city = 'Sao Paulo'
  ) then
    raise exception 'db_impact_check failed: family_can_update_own_non_billing_profile_fields';
  end if;
end;
$$;

update public.family_profiles
set
  stripe_customer_id = 'cus_db_impact_family_1',
  stripe_subscription_id = 'sub_db_impact_family_1',
  subscription_status = 'active',
  plan = 'monthly',
  current_period_end = now() + interval '30 days'
where id = '20000000-0000-0000-0000-000000000001';

insert into public.invoices (
  family_id,
  invoice_ref,
  period,
  plan,
  amount,
  status,
  stripe_invoice_id,
  stripe_payment_intent_id,
  due_date,
  paid_at
) values (
  '20000000-0000-0000-0000-000000000001',
  'INV-DB-IMPACT',
  '2026-07',
  'monthly',
  127,
  'paid',
  'in_db_impact_family_1',
  'pi_db_impact_family_1',
  current_date,
  now()
);

set local role authenticated;
set local request.jwt.claim.sub = '20000000-0000-0000-0000-000000000001';
set local request.jwt.claim.role = 'authenticated';

do $$
declare
  visible_count integer;
begin
  select count(*) into visible_count
  from public.invoices
  where stripe_invoice_id = 'in_db_impact_family_1';

  if visible_count <> 1 then
    raise exception 'db_impact_check failed: invoices_family_sees_own_invoice';
  end if;
end;
$$;

set local request.jwt.claim.sub = '20000000-0000-0000-0000-000000000002';

do $$
declare
  visible_count integer;
begin
  select count(*) into visible_count
  from public.invoices
  where stripe_invoice_id = 'in_db_impact_family_1';

  if visible_count <> 0 then
    raise exception 'db_impact_check failed: invoices_other_family_cannot_read_invoice';
  end if;
end;
$$;

reset role;

rollback;

select 'db_impact_check_subscriptions_passed' as status;
