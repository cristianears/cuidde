create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in ('terms_of_use', 'privacy_policy', 'cookie_policy', 'third_party_data')),
  document_version text not null,
  document_url text not null,
  accepted boolean not null default true,
  context text not null,
  metadata jsonb not null default '{}'::jsonb,
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists user_consents_unique_latest
  on public.user_consents (user_id, consent_type, document_version, context);

alter table public.user_consents enable row level security;

drop policy if exists "Users can read own consents" on public.user_consents;
create policy "Users can read own consents"
  on public.user_consents
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own consents" on public.user_consents;
create policy "Users can insert own consents"
  on public.user_consents
  for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.user_consents to authenticated;
