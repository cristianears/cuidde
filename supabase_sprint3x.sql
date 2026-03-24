-- ============================================================================
-- Sprint 3.x — Geocodificação e Filtro por Proximidade (km)
-- Executar no Supabase SQL Editor
-- ============================================================================

-- 1. Adicionar colunas lat/lng em caregiver_profiles
ALTER TABLE caregiver_profiles
  ADD COLUMN IF NOT EXISTS lat DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS lng DECIMAL(9,6);

-- 2. Adicionar colunas lat/lng em family_profiles
ALTER TABLE family_profiles
  ADD COLUMN IF NOT EXISTS lat DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS lng DECIMAL(9,6);

-- 3. Índice para buscas por proximidade (filtragem rápida por bounding box)
CREATE INDEX IF NOT EXISTS idx_caregiver_profiles_lat_lng
  ON caregiver_profiles (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- 4. Função haversine_distance — retorna distância em km entre dois pontos
CREATE OR REPLACE FUNCTION haversine_distance(
  lat1 DOUBLE PRECISION,
  lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lng2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  r CONSTANT DOUBLE PRECISION := 6371.0; -- raio da Terra em km
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

-- 5. Função search_caregivers_by_proximity
--    Retorna cuidadores com profile_complete=true dentro do raio, ordenados por distância
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
AS $$
DECLARE
  -- Bounding box aproximado para pré-filtro (1 grau ≈ 111 km)
  lat_delta DOUBLE PRECISION := p_radius_km / 111.0;
  lng_delta DOUBLE PRECISION := p_radius_km / (111.0 * COS(RADIANS(p_lat)));
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    haversine_distance(p_lat, p_lng, cp.lat, cp.lng) AS distance_km
  FROM caregiver_profiles cp
  WHERE cp.profile_complete = true
    AND cp.lat IS NOT NULL
    AND cp.lng IS NOT NULL
    -- Bounding box para usar o índice
    AND cp.lat BETWEEN (p_lat - lat_delta) AND (p_lat + lat_delta)
    AND cp.lng BETWEEN (p_lng - lng_delta) AND (p_lng + lng_delta)
    -- Filtro preciso pelo haversine
    AND haversine_distance(p_lat, p_lng, cp.lat, cp.lng) <= p_radius_km
  ORDER BY distance_km ASC;
END;
$$;
