alter table public.family_profiles
  add column if not exists subscription_started_at timestamptz;

comment on column public.family_profiles.subscription_started_at is
  'Inicio da assinatura Stripe atual usado para bloquear contatos externos nos primeiros 7 dias.';

notify pgrst, 'reload schema';
