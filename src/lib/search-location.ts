export type SearchCoordinates = {
  lat: number
  lng: number
}

export function getLandingCepFromSearchParams(search: string | URLSearchParams): string | null {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search
  const cepDigits = (params.get('cep') ?? '').replace(/\D/g, '')

  return cepDigits.length === 8 ? cepDigits : null
}

type EffectiveFamilyCoordinatesParams = {
  landingCoordinates: SearchCoordinates | null
  profileLat?: number | null
  profileLng?: number | null
}

export function getEffectiveFamilyCoordinates({
  landingCoordinates,
  profileLat,
  profileLng,
}: EffectiveFamilyCoordinatesParams): SearchCoordinates | null {
  if (landingCoordinates) return landingCoordinates
  if (profileLat == null || profileLng == null) return null

  return {
    lat: Number(profileLat),
    lng: Number(profileLng),
  }
}
