create table if not exists public.subscription_cancellation_feedback (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  reason_code text not null check (
    reason_code in (
      'found_caregiver_elsewhere',
      'no_caregivers_region',
      'price_high',
      'temporary_need',
      'difficult_to_use',
      'missing_features',
      'other'
    )
  ),
  reason_label text not null,
  reason_details text null,
  plan text null,
  subscription_status text null,
  cancel_at_period_end boolean null,
  current_period_end timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists subscription_cancellation_feedback_family_created_idx
  on public.subscription_cancellation_feedback (family_id, created_at desc);

alter table public.subscription_cancellation_feedback enable row level security;

drop policy if exists "Families can read own cancellation feedback" on public.subscription_cancellation_feedback;
create policy "Families can read own cancellation feedback"
  on public.subscription_cancellation_feedback
  for select
  to authenticated
  using ((select auth.uid()) = family_id);

drop policy if exists "Families can insert own cancellation feedback" on public.subscription_cancellation_feedback;
create policy "Families can insert own cancellation feedback"
  on public.subscription_cancellation_feedback
  for insert
  to authenticated
  with check ((select auth.uid()) = family_id);

grant select, insert on public.subscription_cancellation_feedback to authenticated;

notify pgrst, 'reload schema';
