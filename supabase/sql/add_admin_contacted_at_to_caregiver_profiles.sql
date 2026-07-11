-- Internal admin follow-up marker for caregiver profile completion outreach.
alter table public.caregiver_profiles
  add column if not exists admin_contacted_at timestamptz null;

create index if not exists caregiver_profiles_admin_contacted_at_idx
  on public.caregiver_profiles (admin_contacted_at)
  where admin_contacted_at is not null;
