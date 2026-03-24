// Geocodificação client-side com fallback.
// Tenta Google Maps primeiro, se falhar usa Nominatim (OpenStreetMap) como fallback gratuito.

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GMAPS_GEOCODE_KEY

export interface GeocodeResult {
  lat: number
  lng: number
  formatted_address: string
}

/**
 * Geocodifica um CEP ou endereço.
 * Tenta Google Maps API primeiro; se falhar, usa Nominatim como fallback.
 */
export async function geocodeAddress(params: { cep?: string; address?: string }): Promise<GeocodeResult | null> {
  const query = params.cep
    ? `${params.cep}, Brasil`
    : params.address
      ? params.address
      : null

  if (!query) return null

  // Tentar Google Maps primeiro
  const googleResult = await geocodeWithGoogle(query)
  if (googleResult) return googleResult

  // Fallback: Nominatim (OpenStreetMap) — gratuito, sem API key
  return geocodeWithNominatim(query)
}

/**
 * Geocodifica usando cidade + estado via Nominatim.
 * Mais confiável que CEP para Nominatim no Brasil.
 */
export async function geocodeByCity(city: string, state: string): Promise<GeocodeResult | null> {
  // Tentar Google Maps primeiro
  const googleResult = await geocodeWithGoogle(`${city}, ${state}, Brasil`)
  if (googleResult) return googleResult

  // Fallback Nominatim com structured query (mais preciso)
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=Brazil&limit=1`
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'pt-BR' },
    })
    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) return null

    const result = data[0]
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      formatted_address: result.display_name ?? `${city}, ${state}`,
    }
  } catch {
    return null
  }
}

async function geocodeWithGoogle(query: string): Promise<GeocodeResult | null> {
  try {
    if (!GOOGLE_MAPS_API_KEY) return null

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&region=br&language=pt-BR`
    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK' || !data.results?.length) return null

    const result = data.results[0]
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted_address: result.formatted_address,
    }
  } catch {
    return null
  }
}

async function geocodeWithNominatim(query: string): Promise<GeocodeResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&limit=1`
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'pt-BR' },
    })
    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) return null

    const result = data[0]
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      formatted_address: result.display_name ?? query,
    }
  } catch {
    return null
  }
}
