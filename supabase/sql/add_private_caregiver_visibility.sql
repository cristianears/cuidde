create table if not exists public.private_caregiver_visibility (
  family_id uuid not null references public.family_profiles(id) on delete cascade,
  caregiver_id uuid not null references public.caregiver_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  primary key (family_id, caregiver_id)
);

create index if not exists private_caregiver_visibility_caregiver_id_idx
  on public.private_caregiver_visibility (caregiver_id);

alter table public.private_caregiver_visibility enable row level security;

create or replace function public.family_private_caregiver_ids()
returns table(caregiver_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  if not exists (select 1 from public.family_profiles fp where fp.id = auth.uid()) then
    raise exception 'access denied: only families can view private caregivers';
  end if;

  return query
  select pcv.caregiver_id
  from public.private_caregiver_visibility pcv
  where pcv.family_id = auth.uid();
end;
$function$;

revoke all on function public.family_private_caregiver_ids() from public;
grant execute on function public.family_private_caregiver_ids() to authenticated;

create or replace function public.can_family_view_private_caregiver(p_caregiver_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  return exists (
    select 1
    from public.private_caregiver_visibility pcv
    where pcv.family_id = auth.uid()
      and pcv.caregiver_id = p_caregiver_id
  );
end;
$function$;

revoke all on function public.can_family_view_private_caregiver(uuid) from public;
grant execute on function public.can_family_view_private_caregiver(uuid) to authenticated;

drop policy if exists "caregiver_profiles: leitura consolidada" on public.caregiver_profiles;
create policy "caregiver_profiles: leitura consolidada"
on public.caregiver_profiles for select
using (
  id = (select auth.uid())
  or (
    account_status = 'active'
    and profile_complete = true
    and is_available_for_new = true
    and (
      is_visible = true
      or public.can_family_view_private_caregiver(caregiver_profiles.id)
    )
  )
);

drop policy if exists "caregiver_documents: dono ou família assinante lê" on public.caregiver_documents;
create policy "caregiver_documents: dono ou família assinante lê"
on public.caregiver_documents for select
using (
  caregiver_id = (select auth.uid())
  or (
    is_visible = true
    and exists (
      select 1 from public.family_profiles fp
      where fp.id = (select auth.uid())
        and fp.subscription_status = 'active'
    )
    and (
      exists (
        select 1 from public.caregiver_profiles cp
        where cp.id = caregiver_documents.caregiver_id
          and (
            cp.is_visible = true
            or public.can_family_view_private_caregiver(cp.id)
          )
      )
    )
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
  if not exists (select 1 from public.family_profiles where id = auth.uid()) then
    raise exception 'access denied: only families can search by proximity';
  end if;

  return query
  with distances as (
    select cp.id as caregiver_id,
      6371.0 * 2.0 * asin(sqrt(least(1.0,
        power(sin(radians(cp.lat - p_lat) / 2.0), 2)
        + cos(radians(p_lat)) * cos(radians(cp.lat))
        * power(sin(radians(cp.lng - p_lng) / 2.0), 2)
      ))) as distance_km
    from public.caregiver_profiles cp
    where cp.profile_complete = true
      and cp.account_status = 'active'
      and cp.is_available_for_new = true
      and (
        cp.is_visible = true
        or exists (
          select 1 from public.private_caregiver_visibility pcv
          where pcv.caregiver_id = cp.id and pcv.family_id = auth.uid()
        )
      )
      and cp.lat is not null and cp.lng is not null
  )
  select caregiver_id, distances.distance_km
  from distances
  where distances.distance_km <= p_radius_km
  order by distances.distance_km asc;
end;
$function$;

create or replace function public.get_caregiver_public_detail(p_caregiver_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_caller uuid := auth.uid();
  v_is_subscriber boolean := false;
  v_is_admin boolean := false;
  v_can_see_sensitive boolean := false;
  v_has_private_access boolean := false;
  v_row record;
  v_full_name text;
  v_masked_name text;
  v_name_parts text[];
begin
  if v_caller is null then return null; end if;
  select exists(select 1 from profiles where id = v_caller and role = 'admin') into v_is_admin;
  select coalesce(subscription_status, 'free') = 'active' into v_is_subscriber from family_profiles where id = v_caller;
  select exists(
    select 1 from private_caregiver_visibility
    where family_id = v_caller and caregiver_id = p_caregiver_id
  ) into v_has_private_access;
  v_can_see_sensitive := coalesce(v_is_admin, false) or coalesce(v_is_subscriber, false);

  select cp.*, p.full_name as profile_full_name into v_row
  from caregiver_profiles cp join profiles p on p.id = cp.id
  where cp.id = p_caregiver_id and cp.profile_complete = true
    and cp.account_status = 'active' and cp.is_available_for_new = true
    and (cp.is_visible = true or v_has_private_access);
  if not found then return null; end if;

  v_full_name := v_row.profile_full_name;
  if v_full_name is not null and btrim(v_full_name) <> '' then
    v_name_parts := regexp_split_to_array(btrim(v_full_name), '\s+');
    if array_length(v_name_parts, 1) > 1 then
      select v_name_parts[1] || ' ' || string_agg(left(part_name, 1) || '.', ' ')
      into v_masked_name from unnest(v_name_parts[2:array_length(v_name_parts, 1)]) as suffix(part_name);
    else v_masked_name := v_name_parts[1]; end if;
  end if;

  return jsonb_build_object(
    'id', v_row.id, 'photo_url', v_row.photo_url, 'bio', v_row.bio,
    'experience_years', v_row.experience_years, 'profissao_formacao', v_row.profissao_formacao,
    'formacao_complementar', v_row.formacao_complementar, 'neighborhood', v_row.neighborhood,
    'city', v_row.city, 'state', v_row.state, 'price_per_hour', v_row.price_per_hour,
    'price_per_day', v_row.price_per_day, 'pricing_note', v_row.pricing_note,
    'average_rating', v_row.average_rating, 'review_count', v_row.review_count,
    'specialties', v_row.specialties, 'modalities', v_row.modalities, 'idiomas', v_row.idiomas,
    'possui_cnh', v_row.possui_cnh, 'has_insurance', v_row.has_insurance,
    'emergency_available', v_row.emergency_available, 'has_rg_cnh', v_row.has_rg_cnh,
    'has_antecedentes', v_row.has_antecedentes, 'has_certificado', v_row.has_certificado,
    'has_references', v_row.has_references, 'zona', v_row.zona, 'cep', v_row.cep,
    'professional_reg_type', v_row.professional_reg_type,
    'professional_reg_number', case when v_can_see_sensitive then v_row.professional_reg_number else null end,
    'professional_reg_uf', v_row.professional_reg_uf,
    'professional_reg_other_desc', v_row.professional_reg_other_desc,
    'is_available_for_new', v_row.is_available_for_new, 'journey_types', v_row.journey_types,
    'area_type', v_row.area_type, 'area_radius', v_row.area_radius,
    'availability_notes', v_row.availability_notes,
    'show_refs_to_subscribers', v_row.show_refs_to_subscribers,
    'mask_reference_phones', v_row.mask_reference_phones,
    'show_reference_full_names', v_row.show_reference_full_names,
    'full_name', case when v_can_see_sensitive then v_full_name else v_masked_name end,
    'is_subscriber', v_is_subscriber, 'is_admin', v_is_admin
  );
end;
$function$;

create or replace function public.get_caregiver_gated_preview(p_caregiver_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_is_public boolean;
  v_documents jsonb;
  v_reference_count int;
begin
  select cp.profile_complete and cp.account_status = 'active' and cp.is_available_for_new
    and (cp.is_visible or exists (
      select 1 from public.private_caregiver_visibility pcv
      where pcv.caregiver_id = cp.id and pcv.family_id = auth.uid()
    ))
  into v_is_public from public.caregiver_profiles cp where cp.id = p_caregiver_id;
  if coalesce(v_is_public, false) = false then return jsonb_build_object('documents', '[]'::jsonb, 'reference_count', 0); end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'type', d.type, 'file_name', d.file_name, 'status', d.status) order by d.created_at asc), '[]'::jsonb)
  into v_documents from public.caregiver_documents d
  where d.caregiver_id = p_caregiver_id and d.is_visible = true and d.type <> 'rg_cnh';
  select case when cp.has_references and cp.show_refs_to_subscribers then count(pr.id)::int else 0 end
  into v_reference_count from public.caregiver_profiles cp
  left join public.professional_references pr on pr.caregiver_id = cp.id
  where cp.id = p_caregiver_id group by cp.has_references, cp.show_refs_to_subscribers;
  return jsonb_build_object('documents', v_documents, 'reference_count', coalesce(v_reference_count, 0));
end;
$function$;

revoke all on function public.get_caregiver_public_detail(uuid) from public;
grant execute on function public.get_caregiver_public_detail(uuid) to authenticated;
revoke all on function public.get_caregiver_gated_preview(uuid) from public;
grant execute on function public.get_caregiver_gated_preview(uuid) to authenticated;

notify pgrst, 'reload schema';
