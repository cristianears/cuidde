alter table public.profiles
  add constraint profiles_full_name_format_check
  check (
    full_name is null
    or (
      btrim(full_name) !~ '@'
      and btrim(full_name) !~ '[[:digit:]]'
      and btrim(full_name) ~ '^[[:alpha:]][[:alpha:]''’ -]*[[:alpha:]]$'
      and btrim(full_name) ~ '^([^ ]{2,}|[eE])( +([^ ]{2,}|[eE]))+$'
    )
  ) not valid;

comment on constraint profiles_full_name_format_check on public.profiles is
  'Prevents emails, numbers, single names, and one-letter initials in new or updated full names. Existing rows remain for manual review.';
