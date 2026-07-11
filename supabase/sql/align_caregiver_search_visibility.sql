-- Search eligibility is based on a useful minimum profile. Administrative
-- review and identity documents are trust signals and do not control listing.

create or replace function public.compute_profile_complete(cp_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_full_name text;
  v_phone text;
  v_whatsapp text;
  v_city text;
  v_neighborhood text;
  v_bio text;
  v_specialties text[];
  v_modalities text[];
begin
  select p.full_name, p.phone, cp.whatsapp, cp.city, cp.neighborhood,
         cp.bio, cp.specialties, cp.modalities
    into v_full_name, v_phone, v_whatsapp, v_city, v_neighborhood,
         v_bio, v_specialties, v_modalities
    from public.caregiver_profiles cp
    join public.profiles p on p.id = cp.id
   where cp.id = cp_id;

  if not found then return false; end if;

  return
    v_full_name is not null
    and btrim(v_full_name) !~ '@'
    and btrim(v_full_name) !~ '[[:digit:]]'
    and btrim(v_full_name) ~ '^([^ ]{2,}|[eE])( +([^ ]{2,}|[eE]))+$'
    and length(regexp_replace(coalesce(nullif(v_whatsapp, ''), v_phone, ''), '[^0-9]', '', 'g')) between 10 and 13
    and coalesce(btrim(v_city), '') <> ''
    and coalesce(btrim(v_neighborhood), '') <> ''
    and length(btrim(coalesce(v_bio, ''))) >= 150
    and coalesce(array_length(v_specialties, 1), 0) > 0
    and coalesce(array_length(v_modalities, 1), 0) > 0;
end;
$function$;

create or replace function public.refresh_caregiver_computed(cp_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_has_rg boolean;
  v_has_ant boolean;
  v_has_cert boolean;
  v_has_ref boolean;
begin
  if not exists (select 1 from public.caregiver_profiles where id = cp_id) then return; end if;

  select exists (
    select 1 from public.caregiver_documents
     where caregiver_id = cp_id and type in ('rg', 'rg_cnh') and status = 'approved'
  ) into v_has_rg;

  select exists (
    select 1 from public.caregiver_documents
     where caregiver_id = cp_id and type = 'antecedentes' and status in ('sent', 'approved')
  ) into v_has_ant;

  select exists (
    select 1 from public.caregiver_documents
     where caregiver_id = cp_id and type in ('certificado', 'certificados', 'certificacao') and status in ('sent', 'approved')
  ) into v_has_cert;

  select exists (
    select 1 from public.professional_references where caregiver_id = cp_id
  ) into v_has_ref;

  update public.caregiver_profiles
     set has_rg_cnh = v_has_rg,
         has_antecedentes = v_has_ant,
         has_certificado = v_has_cert,
         has_references = v_has_ref,
         profile_complete = public.compute_profile_complete(cp_id)
   where id = cp_id;
end;
$function$;

drop trigger if exists on_caregiver_profile_upsert on public.caregiver_profiles;
create trigger on_caregiver_profile_upsert
after insert or update of bio, specialties, modalities, city, neighborhood, whatsapp
on public.caregiver_profiles
for each row execute function public.trg_profile_complete_from_profile();

create or replace function public.trg_profile_complete_from_identity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  perform public.refresh_caregiver_computed(new.id);
  return new;
end;
$function$;

drop trigger if exists on_caregiver_identity_update on public.profiles;
create trigger on_caregiver_identity_update
after update of full_name, phone on public.profiles
for each row execute function public.trg_profile_complete_from_identity();

alter table public.caregiver_profiles alter column is_visible set default true;

-- Active accounts are listable when they meet the profile minimum. Account
-- closure, pause, and suspension continue to hide through account_status.
update public.caregiver_profiles
   set is_visible = true
 where account_status = 'active';

select public.refresh_caregiver_computed(id) from public.caregiver_profiles;

drop function if exists public.admin_list_caregiver_accounts(text);
create function public.admin_list_caregiver_accounts(p_status text default 'all')
returns table(
  id uuid, photo_url text, neighborhood text, city text, state text, status text,
  created_at timestamptz, profissao_formacao text, professional_reg_type text,
  professional_reg_number text, professional_reg_uf text, rejection_reason text,
  profile_complete boolean, is_visible boolean, is_available_for_new boolean,
  admin_contacted_at timestamptz, account_status text,
  account_status_reason_code text, account_status_reason_label text,
  account_status_reason_details text, account_status_updated_at timestamptz,
  paused_at timestamptz, closed_at timestamptz, suspended_at timestamptz,
  full_name text, phone text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  if not exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ) then raise exception 'forbidden'; end if;

  return query
  select cp.id, cp.photo_url, cp.neighborhood, cp.city, cp.state::text, cp.status,
         cp.created_at, cp.profissao_formacao, cp.professional_reg_type,
         cp.professional_reg_number, cp.professional_reg_uf::text,
         cp.rejection_reason, cp.profile_complete, cp.is_visible,
         cp.is_available_for_new, cp.admin_contacted_at, cp.account_status,
         cp.account_status_reason_code, cp.account_status_reason_label,
         cp.account_status_reason_details, cp.account_status_updated_at,
         cp.paused_at, cp.closed_at, cp.suspended_at, p.full_name, p.phone
    from public.caregiver_profiles cp
    left join public.profiles p on p.id = cp.id
   where p_status = 'all' or cp.status = p_status or cp.account_status = p_status
   order by cp.created_at desc;
end;
$function$;

revoke all on function public.admin_list_caregiver_accounts(text) from public;
revoke execute on function public.admin_list_caregiver_accounts(text) from anon;
grant execute on function public.admin_list_caregiver_accounts(text) to authenticated;

notify pgrst, 'reload schema';
