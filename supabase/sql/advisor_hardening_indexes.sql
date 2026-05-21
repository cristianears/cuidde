-- Advisor hardening: add missing covering index for caregiver_events.family_id FK.
-- Supabase migrations run in a transaction, so this uses the non-concurrent form.

create index if not exists idx_caregiver_events_family_id
  on public.caregiver_events (family_id);
