alter table public.caregiver_profiles
  add column if not exists account_status text not null default 'active'
    check (account_status in ('active', 'paused', 'closed', 'suspended')),
  add column if not exists account_status_reason_code text null,
  add column if not exists account_status_reason_label text null,
  add column if not exists account_status_reason_details text null,
  add column if not exists account_status_updated_at timestamptz null,
  add column if not exists account_status_updated_by uuid null references public.profiles(id) on delete set null,
  add column if not exists paused_at timestamptz null,
  add column if not exists closed_at timestamptz null,
  add column if not exists suspended_at timestamptz null;

create index if not exists caregiver_profiles_account_status_idx
  on public.caregiver_profiles (account_status, account_status_updated_at desc);

create table if not exists public.caregiver_account_feedback (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid not null references public.caregiver_profiles(id) on delete cascade,
  account_status text not null check (account_status in ('paused', 'closed', 'suspended')),
  reason_code text not null check (
    reason_code in (
      'found_work_no_longer_needs_platform',
      'no_longer_available',
      'not_enough_contacts',
      'found_clients_elsewhere',
      'difficult_to_use',
      'privacy_or_safety',
      'temporary_pause',
      'no_matching_families',
      'admin_action',
      'other'
    )
  ),
  reason_label text not null,
  reason_details text null,
  created_by uuid null references public.profiles(id) on delete set null,
  created_by_role text null check (created_by_role in ('caregiver', 'admin')),
  created_at timestamptz not null default now()
);

create index if not exists caregiver_account_feedback_caregiver_created_idx
  on public.caregiver_account_feedback (caregiver_id, created_at desc);

alter table public.caregiver_account_feedback enable row level security;

drop policy if exists "Caregivers can read own account feedback" on public.caregiver_account_feedback;
create policy "Caregivers can read own account feedback"
  on public.caregiver_account_feedback
  for select
  to authenticated
  using ((select auth.uid()) = caregiver_id);

drop policy if exists "Caregivers can insert own account feedback" on public.caregiver_account_feedback;
create policy "Caregivers can insert own account feedback"
  on public.caregiver_account_feedback
  for insert
  to authenticated
  with check (
    (select auth.uid()) = caregiver_id
    and (created_by is null or created_by = (select auth.uid()))
    and created_by_role = 'caregiver'
    and account_status in ('paused', 'closed')
  );

grant select, insert on public.caregiver_account_feedback to authenticated;

drop policy if exists "caregiver_profiles: leitura consolidada" on public.caregiver_profiles;
create policy "caregiver_profiles: leitura consolidada"
  on public.caregiver_profiles
  for select
  to public
  using (
    id = (select auth.uid())
    or (
      account_status = 'active'
      and is_visible = true
      and (
        profile_complete = true
        or status = 'verified'
        or (profile_complete = true and is_available_for_new = true)
      )
    )
  );

drop policy if exists "profiles: leitura consolidada" on public.profiles;
create policy "profiles: leitura consolidada"
  on public.profiles
  for select
  to public
  using (
    id = (select auth.uid())
    or id in (
      select cp.id
      from public.caregiver_profiles cp
      where cp.profile_complete = true
        and cp.account_status = 'active'
        and cp.is_visible = true
    )
    or id in (
      select a.family_id
      from public.appointments a
      where a.caregiver_id = (select auth.uid())
        and a.status = any (array['ativo'::text, 'pendente'::text, 'finalizado'::text, 'cancelado'::text])
    )
    or id in (
      select a.caregiver_id
      from public.appointments a
      where a.family_id = (select auth.uid())
        and a.status = any (array['ativo'::text, 'pendente'::text, 'finalizado'::text, 'cancelado'::text])
    )
  );

create or replace function public.search_caregivers_by_proximity(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision default 20
)
returns table(id uuid, distance_km double precision)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
begin
  if not exists (
    select 1
    from public.family_profiles
    where family_profiles.id = auth.uid()
  ) then
    raise exception 'access denied: only families can search by proximity';
  end if;

  return query
  with distances as (
    select
      cp.id as caregiver_id,
      (
        6371.0 * 2.0 * asin(
          sqrt(
            least(
              1.0,
              power(sin(radians(cp.lat - p_lat) / 2.0), 2)
              + cos(radians(p_lat))
              * cos(radians(cp.lat))
              * power(sin(radians(cp.lng - p_lng) / 2.0), 2)
            )
          )
        )
      ) as distance_km
    from public.caregiver_profiles cp
    where cp.profile_complete = true
      and cp.account_status = 'active'
      and cp.is_visible = true
      and cp.is_available_for_new = true
      and cp.lat is not null
      and cp.lng is not null
  )
  select caregiver_id as id, distances.distance_km
  from distances
  where distances.distance_km <= p_radius_km
  order by distances.distance_km asc;
end;
$function$;

revoke all on function public.search_caregivers_by_proximity(double precision, double precision, double precision) from public;
grant execute on function public.search_caregivers_by_proximity(double precision, double precision, double precision) to authenticated;

create or replace function public.get_caregiver_public_detail(p_caregiver_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller uuid := auth.uid();
  v_is_subscriber boolean := false;
  v_is_admin boolean := false;
  v_can_see_sensitive boolean := false;
  v_row record;
  v_full_name text;
  v_masked_name text;
  v_name_parts text[];
begin
  if v_caller is null then
    return null;
  end if;

  select exists(
    select 1 from profiles
     where id = v_caller and role = 'admin'
  ) into v_is_admin;

  select coalesce(subscription_status, 'free') = 'active'
    into v_is_subscriber
    from family_profiles
   where id = v_caller;

  v_can_see_sensitive := coalesce(v_is_admin, false) or coalesce(v_is_subscriber, false);

  select cp.*, p.full_name as profile_full_name
    into v_row
    from caregiver_profiles cp
    join profiles p on p.id = cp.id
   where cp.id = p_caregiver_id
     and cp.profile_complete = true
     and cp.account_status = 'active'
     and cp.is_visible = true;

  if not found then
    return null;
  end if;

  v_full_name := v_row.profile_full_name;
  if v_full_name is not null and btrim(v_full_name) <> '' then
    v_name_parts := regexp_split_to_array(btrim(v_full_name), '\s+');
    if array_length(v_name_parts, 1) > 1 then
      select v_name_parts[1] || ' ' || string_agg(left(part_name, 1) || '.', ' ')
        into v_masked_name
        from unnest(v_name_parts[2:array_length(v_name_parts, 1)]) as suffix(part_name);
    else
      v_masked_name := v_name_parts[1];
    end if;
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'photo_url', v_row.photo_url,
    'bio', v_row.bio,
    'experience_years', v_row.experience_years,
    'profissao_formacao', v_row.profissao_formacao,
    'formacao_complementar', v_row.formacao_complementar,
    'neighborhood', v_row.neighborhood,
    'city', v_row.city,
    'state', v_row.state,
    'price_per_hour', v_row.price_per_hour,
    'price_per_day', v_row.price_per_day,
    'pricing_note', v_row.pricing_note,
    'average_rating', v_row.average_rating,
    'review_count', v_row.review_count,
    'specialties', v_row.specialties,
    'modalities', v_row.modalities,
    'idiomas', v_row.idiomas,
    'possui_cnh', v_row.possui_cnh,
    'has_insurance', v_row.has_insurance,
    'emergency_available', v_row.emergency_available,
    'has_rg_cnh', v_row.has_rg_cnh,
    'has_antecedentes', v_row.has_antecedentes,
    'has_certificado', v_row.has_certificado,
    'has_references', v_row.has_references,
    'zona', v_row.zona,
    'cep', v_row.cep,
    'professional_reg_type', v_row.professional_reg_type,
    'professional_reg_number', case when v_can_see_sensitive then v_row.professional_reg_number else null end,
    'professional_reg_uf', v_row.professional_reg_uf,
    'professional_reg_other_desc', v_row.professional_reg_other_desc,
    'is_available_for_new', v_row.is_available_for_new,
    'journey_types', v_row.journey_types,
    'area_type', v_row.area_type,
    'area_radius', v_row.area_radius,
    'availability_notes', v_row.availability_notes,
    'show_refs_to_subscribers', v_row.show_refs_to_subscribers,
    'mask_reference_phones', v_row.mask_reference_phones,
    'show_reference_full_names', v_row.show_reference_full_names,
    'full_name', case when v_can_see_sensitive then v_full_name else v_masked_name end,
    'is_subscriber', v_is_subscriber,
    'is_admin', v_is_admin
  );
end;
$$;

revoke all on function public.get_caregiver_public_detail(uuid) from public;
grant execute on function public.get_caregiver_public_detail(uuid) to authenticated;

create or replace function public.get_caregiver_gated_preview(p_caregiver_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_public boolean;
  v_documents jsonb;
  v_reference_count int;
begin
  select profile_complete and account_status = 'active' and is_visible = true
    into v_is_public
    from caregiver_profiles
   where id = p_caregiver_id;

  if coalesce(v_is_public, false) = false then
    return jsonb_build_object('documents', '[]'::jsonb, 'reference_count', 0);
  end if;

  select coalesce(jsonb_agg(
           jsonb_build_object(
             'id',        d.id,
             'type',      d.type,
             'file_name', d.file_name,
             'status',    d.status
           )
           order by d.created_at asc
         ), '[]'::jsonb)
    into v_documents
    from caregiver_documents d
   where d.caregiver_id = p_caregiver_id
     and d.is_visible = true
     and d.type <> 'rg_cnh';

  select case when cp.has_references and cp.show_refs_to_subscribers
                then count(pr.id)::int
                else 0
           end
    into v_reference_count
    from caregiver_profiles cp
    left join professional_references pr on pr.caregiver_id = cp.id
   where cp.id = p_caregiver_id
   group by cp.has_references, cp.show_refs_to_subscribers;

  return jsonb_build_object(
    'documents',       v_documents,
    'reference_count', coalesce(v_reference_count, 0)
  );
end;
$$;

revoke all on function public.get_caregiver_gated_preview(uuid) from public;
grant execute on function public.get_caregiver_gated_preview(uuid) to authenticated;

create or replace function public.admin_list_caregiver_accounts(p_status text default 'all')
returns table(
  id uuid,
  photo_url text,
  neighborhood text,
  city text,
  state text,
  status text,
  created_at timestamptz,
  profissao_formacao text,
  professional_reg_type text,
  professional_reg_number text,
  professional_reg_uf text,
  rejection_reason text,
  profile_complete boolean,
  is_visible boolean,
  admin_contacted_at timestamptz,
  account_status text,
  account_status_reason_code text,
  account_status_reason_label text,
  account_status_reason_details text,
  account_status_updated_at timestamptz,
  paused_at timestamptz,
  closed_at timestamptz,
  suspended_at timestamptz,
  full_name text,
  phone text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  ) then
    raise exception 'forbidden';
  end if;

  return query
  select
    cp.id,
    cp.photo_url,
    cp.neighborhood,
    cp.city,
    cp.state::text,
    cp.status,
    cp.created_at,
    cp.profissao_formacao,
    cp.professional_reg_type,
    cp.professional_reg_number,
    cp.professional_reg_uf::text,
    cp.rejection_reason,
    cp.profile_complete,
    cp.is_visible,
    cp.admin_contacted_at,
    cp.account_status,
    cp.account_status_reason_code,
    cp.account_status_reason_label,
    cp.account_status_reason_details,
    cp.account_status_updated_at,
    cp.paused_at,
    cp.closed_at,
    cp.suspended_at,
    p.full_name,
    p.phone
  from public.caregiver_profiles cp
  left join public.profiles p on p.id = cp.id
  where p_status = 'all'
     or cp.status = p_status
     or cp.account_status = p_status
  order by cp.created_at desc;
end;
$$;

revoke all on function public.admin_list_caregiver_accounts(text) from public;
revoke execute on function public.admin_list_caregiver_accounts(text) from anon;
grant execute on function public.admin_list_caregiver_accounts(text) to authenticated;

create or replace function public.admin_update_caregiver_account_status(
  p_caregiver_id uuid,
  p_account_status text,
  p_reason_label text default null,
  p_reason_details text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_label text;
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  ) then
    raise exception 'forbidden';
  end if;

  if p_account_status not in ('paused', 'closed', 'suspended') then
    raise exception 'account_status invalid';
  end if;

  v_label := coalesce(
    nullif(btrim(p_reason_label), ''),
    case when p_account_status = 'suspended' then 'Suspensao manual pelo admin' else 'Alteracao manual pelo admin' end
  );

  insert into public.caregiver_account_feedback (
    caregiver_id,
    account_status,
    reason_code,
    reason_label,
    reason_details,
    created_by,
    created_by_role
  )
  values (
    p_caregiver_id,
    p_account_status,
    'admin_action',
    v_label,
    nullif(btrim(coalesce(p_reason_details, '')), ''),
    auth.uid(),
    'admin'
  );

  update public.caregiver_profiles
     set account_status = p_account_status,
         account_status_reason_code = 'admin_action',
         account_status_reason_label = v_label,
         account_status_reason_details = nullif(btrim(coalesce(p_reason_details, '')), ''),
         account_status_updated_at = v_now,
         account_status_updated_by = auth.uid(),
         paused_at = case when p_account_status = 'paused' then v_now else null end,
         closed_at = case when p_account_status = 'closed' then v_now else null end,
         suspended_at = case when p_account_status = 'suspended' then v_now else null end,
         is_visible = false,
         is_available_for_new = false
   where id = p_caregiver_id;
end;
$$;

revoke all on function public.admin_update_caregiver_account_status(uuid, text, text, text) from public;
revoke execute on function public.admin_update_caregiver_account_status(uuid, text, text, text) from anon;
grant execute on function public.admin_update_caregiver_account_status(uuid, text, text, text) to authenticated;

notify pgrst, 'reload schema';
