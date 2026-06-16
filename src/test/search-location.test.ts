import { describe, expect, it } from 'vitest'
import {
  getEffectiveFamilyCoordinates,
  getLandingCepFromSearchParams,
} from '@/lib/search-location'

describe('search location helpers', () => {
  it('reads a valid landing CEP from the search URL', () => {
    expect(getLandingCepFromSearchParams('?cep=12236-063')).toBe('12236063')
  })

  it('ignores invalid landing CEP values', () => {
    expect(getLandingCepFromSearchParams('?cep=123')).toBeNull()
  })

  it('prefers temporary landing CEP coordinates over saved family coordinates', () => {
    expect(
      getEffectiveFamilyCoordinates({
        landingCoordinates: { lat: -23.1, lng: -45.9 },
        profileLat: -22.2,
        profileLng: -44.8,
      }),
    ).toEqual({ lat: -23.1, lng: -45.9 })
  })

  it('falls back to saved family coordinates when no landing CEP coordinates exist', () => {
    expect(
      getEffectiveFamilyCoordinates({
        landingCoordinates: null,
        profileLat: -22.2,
        profileLng: -44.8,
      }),
    ).toEqual({ lat: -22.2, lng: -44.8 })
  })
})
