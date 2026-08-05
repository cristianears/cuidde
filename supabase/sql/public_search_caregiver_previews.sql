-- Public, limited caregiver previews for anonymous landing-page searches.
-- This intentionally exposes only presentation fields needed before signup:
-- no phone, CPF, document URLs, references, CEP, street, number, or coordinates.

create or replace function public.public_search_caregiver_previews(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision default 20,
  p_limit integer default 5
)
returns table(
  id uuid,
  display_name text,
  photo_url text,
  bio_preview text,
  experience_years integer,
  profissao_formacao text,
  city text,
  state text,
  price_per_hour numeric,
  price_per_day numeric,
  average_rating numeric,
  review_count integer,
  specialties text[],
  modalities text[],
  idiomas text[],
  possui_cnh boolean,
  has_insurance boolean,
  emergency_available boolean,
  has_rg_cnh boolean,
  has_antecedentes boolean,
  has_certificado boolean,
  has_references boolean,
  distance_km double precision
)
language sql
stable
security definer
set search_path = public, pg_temp
as $function$
  with visible_caregivers as (
    select
      cp.*,
      p.full_name,
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
      ) as computed_distance_km
    from public.caregiver_profiles cp
    left join public.profiles p on p.id = cp.id
    where cp.profile_complete = true
      and cp.account_status = 'active'
      and cp.is_visible = true
      and cp.is_available_for_new = true
      and cp.lat is not null
      and cp.lng is not null
  ),
  ranked as (
    select *
    from visible_caregivers
    where computed_distance_km <= coalesce(p_radius_km, 20)
    order by computed_distance_km asc, average_rating desc, review_count desc
    limit least(greatest(coalesce(p_limit, 5), 1), 8)
  )
  select
    ranked.id,
    case
      when nullif(trim(ranked.full_name), '') is null then 'Profissional da icuide'
      when array_length(regexp_split_to_array(trim(ranked.full_name), '\s+'), 1) > 1 then
        split_part(trim(ranked.full_name), ' ', 1)
        || ' '
        || left((regexp_split_to_array(trim(ranked.full_name), '\s+'))[
          array_length(regexp_split_to_array(trim(ranked.full_name), '\s+'), 1)
        ], 1)
        || '.'
      else trim(ranked.full_name)
    end as display_name,
    ranked.photo_url,
    nullif(
      left(
        trim(
          regexp_replace(
            regexp_replace(
              coalesce(ranked.bio, ''),
              '([[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,})',
              '[contato oculto]',
              'gi'
            ),
            '(\+?[0-9][0-9\s().-]{7,}[0-9])',
            '[contato oculto]',
            'g'
          )
        ),
        180
      ),
      ''
    ) as bio_preview,
    ranked.experience_years,
    ranked.profissao_formacao,
    ranked.city,
    ranked.state,
    ranked.price_per_hour,
    ranked.price_per_day,
    ranked.average_rating,
    ranked.review_count,
    ranked.specialties,
    ranked.modalities,
    ranked.idiomas,
    ranked.possui_cnh,
    ranked.has_insurance,
    ranked.emergency_available,
    ranked.has_rg_cnh,
    ranked.has_antecedentes,
    ranked.has_certificado,
    ranked.has_references,
    ranked.computed_distance_km
  from ranked;
$function$;

revoke all on function public.public_search_caregiver_previews(double precision, double precision, double precision, integer) from public;
grant execute on function public.public_search_caregiver_previews(double precision, double precision, double precision, integer) to anon, authenticated;

notify pgrst, 'reload schema';
