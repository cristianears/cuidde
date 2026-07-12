alter table public.caregiver_profiles
add column if not exists initial_setup_completed_at timestamptz;

alter table public.caregiver_profiles
add column if not exists initial_setup_step smallint not null default 2;

alter table public.caregiver_profiles
drop constraint if exists caregiver_profiles_initial_setup_step_check;

alter table public.caregiver_profiles
add constraint caregiver_profiles_initial_setup_step_check
check (initial_setup_step between 1 and 6);

comment on column public.caregiver_profiles.initial_setup_completed_at is
'Data em que o cuidador concluiu ou dispensou o percurso guiado inicial. Nulo enquanto o primeiro cadastro profissional esta em andamento.';

-- Execute o backfill junto com a migracao para que apenas novos cuidadores entrem no fluxo.
update public.caregiver_profiles
set initial_setup_completed_at = coalesce(updated_at, created_at, now())
where initial_setup_completed_at is null;
