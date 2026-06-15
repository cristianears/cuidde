-- Protect server-owned Stripe fields from browser clients.
-- RLS still decides which row a family can edit; column grants decide what
-- fields the authenticated client is allowed to insert/update.

do $$
declare
  all_cols text;
  client_insert_cols text;
  client_update_cols text;
begin
  revoke insert on table public.family_profiles from anon, authenticated;
  revoke update on table public.family_profiles from anon, authenticated;

  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into all_cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'family_profiles';

  if all_cols is not null then
    execute format(
      'revoke insert (%s) on table public.family_profiles from anon, authenticated',
      all_cols
    );
    execute format(
      'revoke update (%s) on table public.family_profiles from anon, authenticated',
      all_cols
    );
  end if;

  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into client_insert_cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'family_profiles'
    and column_name not in (
      'created_at',
      'updated_at',
      'plan',
      'subscription_status',
      'stripe_customer_id',
      'stripe_subscription_id',
      'pending_plan',
      'cancel_at_period_end',
      'current_period_end',
      'subscription_started_at',
      'payment_failed_at'
    );

  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into client_update_cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'family_profiles'
    and column_name not in (
      'id',
      'created_at',
      'updated_at',
      'plan',
      'subscription_status',
      'stripe_customer_id',
      'stripe_subscription_id',
      'pending_plan',
      'cancel_at_period_end',
      'current_period_end',
      'subscription_started_at',
      'payment_failed_at'
    );

  if client_insert_cols is not null then
    execute format(
      'grant insert (%s) on table public.family_profiles to authenticated',
      client_insert_cols
    );
  end if;

  if client_update_cols is not null then
    execute format(
      'grant update (%s) on table public.family_profiles to authenticated',
      client_update_cols
    );
  end if;
end $$;

notify pgrst, 'reload schema';
