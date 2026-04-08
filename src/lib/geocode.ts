// Geocodificação client-side com fallback.
// Tenta Google Maps primeiro, se falhar usa Nominatim (OpenStreetMap) como fallback gratuito.
// Para CEPs: resolve via ViaCEP → endereço completo → Nominatim (structured query)

import { fetchAddressByCep } from './viacep'
import { supabase } from './supabase'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GMAPS_GEOCODE_KEY

export interface GeocodeResult {
  lat: number
  lng: number
  formatted_address: string
}

/**
 * Geocodifica um CEP ou endereço.
 * Para CEP: resolve endereço via ViaCEP e usa structured query no Nominatim.
 * Tenta Google Maps API primeiro; se falhar, usa Nominatim como fallback.
 */
export async function geocodeAddress(params: { cep?: string; address?: string }): Promise<GeocodeResult | null> {
  if (params.cep) {
    // Google Maps entende CEP brasileiro diretamente
    const googleResult = await geocodeWithGoogle(`${params.cep}, Brasil`)
    if (googleResult) return googleResult

    // Nominatim NÃO entende CEP brasileiro — resolver via ViaCEP primeiro
    const addr = await fetchAddressByCep(params.cep)
    if (addr) {
      // 1) Tentar structured query rua + cidade (mais preciso no Nominatim)
      if (addr.street) {
        const streetResult = await geocodeNominatimStructured({
          street: addr.street,
          city: addr.city,
          state: addr.state,
        })
        if (streetResult) return streetResult
      }

      // 2) Tentar free-text com endereço completo
      const fullAddress = [addr.street, addr.neighborhood, addr.city, addr.state, 'Brasil']
        .filter(Boolean)
        .join(', ')
      const result = await geocodeWithNominatim(fullAddress)
      if (result) return result

      // 3) Fallback: structured query só com cidade + estado
      return geocodeByCity(addr.city, addr.state)
    }

    return null
  }

  if (params.address) {
    const googleResult = await geocodeWithGoogle(params.address)
    if (googleResult) return googleResult
    return geocodeWithNominatim(params.address)
  }

  return null
}

/**
 * Geocodifica usando cidade + estado via Nominatim structured query.
 * Mais confiável que free-text para o Brasil.
 */
export async function geocodeByCity(city: string, state: string): Promise<GeocodeResult | null> {
  // Tentar Google Maps primeiro
  const googleResult = await geocodeWithGoogle(`${city}, ${state}, Brasil`)
  if (googleResult) return googleResult

  // Fallback Nominatim com structured query (mais preciso)
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=Brazil&limit=1`
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'Cuidde/1.0' },
    })
    if (!response.ok) return null
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

/**
 * Resolve coordenadas (CEP ou cidade+estado) e salva lat/lng na tabela.
 * Usado por hooks de perfil de família e cuidador para eliminar duplicação.
 * Best-effort: falha silenciosa não impede o save do perfil.
 */
export async function resolveAndSaveCoords(
  table: 'family_profiles' | 'caregiver_profiles',
  userId: string,
  opts: { cep?: string; city?: string; state?: string },
): Promise<void> {
  try {
    let geo = opts.cep ? await geocodeAddress({ cep: opts.cep }) : null
    if (!geo && opts.city && opts.state) {
      geo = await geocodeByCity(opts.city, opts.state)
    }
    if (geo) {
      await supabase.from(table).update({ lat: geo.lat, lng: geo.lng }).eq('id', userId)
    }
  } catch {
    // Best-effort — não bloqueia o save
  }
}

async function geocodeWithGoogle(query: string): Promise<GeocodeResult | null> {
  try {
    if (!GOOGLE_MAPS_API_KEY) return null

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&region=br&language=pt-BR`
    const response = await fetch(url)
    if (!response.ok) return null
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

async function geocodeNominatimStructured(params: {
  street?: string
  city: string
  state: string
}): Promise<GeocodeResult | null> {
  try {
    const parts: string[] = []
    if (params.street) parts.push(`street=${encodeURIComponent(params.street)}`)
    parts.push(`city=${encodeURIComponent(params.city)}`)
    parts.push(`state=${encodeURIComponent(params.state)}`)
    parts.push('country=Brazil')
    parts.push('format=json')
    parts.push('limit=1')

    const url = `https://nominatim.openstreetmap.org/search?${parts.join('&')}`
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'Cuidde/1.0' },
    })
    if (!response.ok) return null
    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) return null

    const result = data[0]
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      formatted_address: result.display_name ?? `${params.street}, ${params.city}`,
    }
  } catch {
    return null
  }
}

async function geocodeWithNominatim(query: string): Promise<GeocodeResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&limit=1`
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'Cuidde/1.0' },
    })
    if (!response.ok) return null
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
