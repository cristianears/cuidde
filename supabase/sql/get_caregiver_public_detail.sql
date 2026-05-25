-- RPC: retorna o perfil completo do cuidador com gating server-side.
-- Campos sensíveis (full_name, professional_reg_number) só são incluídos
-- se o caller for admin OU family com subscription_status = 'active'.
-- Caso contrário, vêm como NULL — impedindo que um free user os recupere
-- via DevTools/cache, mesmo que a UI os esconda.
--
-- SECURITY DEFINER: lê a tabela diretamente, sem depender de RLS para
-- masking de colunas individuais (que o RLS não suporta nativamente).

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

  -- 1) É admin?
  select exists(
    select 1 from profiles
     where id = v_caller and role = 'admin'
  ) into v_is_admin;

  -- 2) Família com assinatura ativa?
  select coalesce(subscription_status, 'free') = 'active'
    into v_is_subscriber
    from family_profiles
   where id = v_caller;

  v_can_see_sensitive := coalesce(v_is_admin, false) or coalesce(v_is_subscriber, false);

  -- 3) Buscar o cuidador (apenas perfis completos)
  select cp.*, p.full_name as profile_full_name
    into v_row
    from caregiver_profiles cp
    join profiles p on p.id = cp.id
   where cp.id = p_caregiver_id
     and cp.profile_complete = true;

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
    -- SENSÍVEL: só para assinantes/admin
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
    -- SENSÍVEL: só para assinantes/admin
    'full_name', case when v_can_see_sensitive then v_full_name else v_masked_name end,
    'is_subscriber', v_is_subscriber,
    'is_admin', v_is_admin
  );
end;
$$;

revoke all on function public.get_caregiver_public_detail(uuid) from public;
grant execute on function public.get_caregiver_public_detail(uuid) to authenticated;
