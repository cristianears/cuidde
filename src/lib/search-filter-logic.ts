import type { SearchFilters } from '@/hooks/useSearchCaregivers'

export function hasFamilyCoordinates(filters: Pick<SearchFilters, 'familyLat' | 'familyLng'>): boolean {
  return filters.familyLat != null && filters.familyLng != null
}

export function hasLocationTextFilters(filters: Pick<SearchFilters, 'city' | 'neighborhood'>): boolean {
  return Boolean(filters.city?.trim() || filters.neighborhood?.trim())
}
