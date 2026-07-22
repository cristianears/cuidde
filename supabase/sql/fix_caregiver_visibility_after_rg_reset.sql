-- Prevent RG/CNH re-uploads from leaving complete active caregivers hidden.
-- Legitimate hidden states remain: private family visibility and non-active accounts.

create or replace function public.reset_caregiver_to_pending(p_caregiver_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is distinct from p_caregiver_id then
    raise exception 'Nao autorizado';
  end if;

  update public.caregiver_profiles
     set status = 'pending',
         has_rg_cnh = false
   where id = p_caregiver_id;
end;
$$;

revoke all on function public.reset_caregiver_to_pending(uuid) from public;
grant execute on function public.reset_caregiver_to_pending(uuid) to authenticated;

create or replace function public.trg_restore_verified_caregiver_visibility()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'verified'
     and coalesce(new.profile_complete, false) = true
     and coalesce(new.account_status, 'active') = 'active'
     and coalesce(new.is_available_for_new, true) = true
     and coalesce(new.is_visible, false) = false
     and not exists (
       select 1
       from public.private_caregiver_visibility pcv
       where pcv.caregiver_id = new.id
     ) then
    update public.caregiver_profiles
       set is_visible = true
     where id = new.id
       and is_visible = false;
  end if;

  return new;
end;
$$;

revoke all on function public.trg_restore_verified_caregiver_visibility() from public;
revoke all on function public.trg_restore_verified_caregiver_visibility() from anon;
revoke all on function public.trg_restore_verified_caregiver_visibility() from authenticated;

drop trigger if exists restore_verified_caregiver_visibility on public.caregiver_profiles;
create trigger restore_verified_caregiver_visibility
after update of status, has_rg_cnh on public.caregiver_profiles
for each row
when (
  (old.status is distinct from new.status or old.has_rg_cnh is distinct from new.has_rg_cnh)
  and new.status = 'verified'
)
execute function public.trg_restore_verified_caregiver_visibility();

update public.caregiver_profiles cp
   set is_visible = true
 where cp.profile_complete = true
   and cp.status = 'verified'
   and cp.account_status = 'active'
   and cp.is_available_for_new = true
   and cp.is_visible = false
   and not exists (
     select 1
     from public.private_caregiver_visibility pcv
     where pcv.caregiver_id = cp.id
   );

comment on function public.reset_caregiver_to_pending(uuid) is
  'Moves a caregiver identity document back to pending review without changing marketplace visibility.';
comment on function public.trg_restore_verified_caregiver_visibility() is
  'Restores public marketplace visibility for verified, complete, active, available caregivers unless they are intentionally private for a family.';
