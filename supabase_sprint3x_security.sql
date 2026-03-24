-- ============================================================================
-- Sprint 3.x — Security Hardening
-- Executar no Supabase SQL Editor APÓS supabase_sprint3x.sql
-- ============================================================================

-- 1. Recriar haversine_distance com search_path fixo
CREATE OR REPLACE FUNCTION haversine_distance(
  lat1 DOUBLE PRECISION,
  lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lng2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  r CONSTANT DOUBLE PRECISION := 6371.0;
  d_lat DOUBLE PRECISION;
  d_lng DOUBLE PRECISION;
  a DOUBLE PRECISION;
BEGIN
  d_lat := RADIANS(lat2 - lat1);
  d_lng := RADIANS(lng2 - lng1);
  a := SIN(d_lat / 2) ^ 2
     + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(d_lng / 2) ^ 2;
  RETURN r * 2 * ASIN(SQRT(a));
END;
$$;

-- 2. Recriar search_caregivers_by_proximity com role check + search_path
CREATE OR REPLACE FUNCTION search_caregivers_by_proximity(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 20.0
)
RETURNS TABLE (
  id UUID,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  lat_delta DOUBLE PRECISION := p_radius_km / 111.0;
  lng_delta DOUBLE PRECISION := p_radius_km / (111.0 * COS(RADIANS(p_lat)));
BEGIN
  -- Apenas famílias podem buscar cuidadores por proximidade
  IF NOT EXISTS (SELECT 1 FROM family_profiles WHERE family_profiles.id = auth.uid()) THEN
    RAISE EXCEPTION 'access denied: only families can search by proximity';
  END IF;

  RETURN QUERY
  SELECT
    cp.id,
    ROUND(haversine_distance(p_lat, p_lng, cp.lat, cp.lng)::NUMERIC, 1)::DOUBLE PRECISION AS distance_km
  FROM caregiver_profiles cp
  WHERE cp.profile_complete = true
    AND cp.lat IS NOT NULL
    AND cp.lng IS NOT NULL
    AND cp.lat BETWEEN (p_lat - lat_delta) AND (p_lat + lat_delta)
    AND cp.lng BETWEEN (p_lng - lng_delta) AND (p_lng + lng_delta)
    AND haversine_distance(p_lat, p_lng, cp.lat, cp.lng) <= p_radius_km
  ORDER BY distance_km ASC;
END;
$$;
