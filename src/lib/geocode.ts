// Usar VITE_GMAPS_GEOCODE_KEY para geocodificação client-side.
// Restrinja esta chave no Google Cloud Console: HTTP referrer + Geocoding API only.
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GMAPS_GEOCODE_KEY

interface GeocodeResult {
  lat: number
  lng: number
  formatted_address: string
}

/**
 * Chama a Google Maps Geocoding API diretamente.
 * Retorna null silenciosamente se falhar (geocodificação é best-effort).
 */
export async function geocodeAddress(params: { cep?: string; address?: string }): Promise<GeocodeResult | null> {
  try {
    if (!GOOGLE_MAPS_API_KEY) return null

    let query = ''
    if (params.cep) {
      query = `${params.cep}, Brasil`
    } else if (params.address) {
      query = params.address
    } else {
      return null
    }

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
