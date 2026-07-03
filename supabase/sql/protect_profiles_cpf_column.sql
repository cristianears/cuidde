-- Prevent public/contextual profile reads from exposing caregiver CPF.
-- RLS is row-level; CPF also needs column privileges plus an owner-only RPC.

revoke select on public.profiles from anon, authenticated;
grant select (id, role, full_name, phone, created_at, updated_at)
  on public.profiles to anon, authenticated;

revoke insert on public.profiles from anon, authenticated;
grant insert (id, role, full_name, phone, cpf)
  on public.profiles to authenticated;

revoke update on public.profiles from anon, authenticated;
grant update (role, full_name, phone, cpf)
  on public.profiles to authenticated;

create or replace function public.get_own_caregiver_cpf()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select p.cpf
  from public.profiles p
  where p.id = auth.uid()
    and p.role = 'caregiver'
$$;

revoke all on function public.get_own_caregiver_cpf() from public;
grant execute on function public.get_own_caregiver_cpf() to authenticated;

notify pgrst, 'reload schema';
