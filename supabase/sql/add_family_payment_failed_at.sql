alter table public.family_profiles
  add column if not exists payment_failed_at timestamptz;

comment on column public.family_profiles.payment_failed_at is
  'Timestamp of the latest Stripe payment failure used to enforce past_due grace access.';
