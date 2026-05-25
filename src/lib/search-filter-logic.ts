import type { SearchFilters } from '@/hooks/useSearchCaregivers'

export function hasFamilyCoordinates(filters: Pick<SearchFilters, 'familyLat' | 'familyLng'>): boolean {
  return filters.familyLat != null && filters.familyLng != null
}

export function hasLocationTextFilters(filters: Pick<SearchFilters, 'city' | 'neighborhood'>): boolean {
  return Boolean(filters.city?.trim() || filters.neighborhood?.trim())
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function textIncludesNormalized(value: string | null | undefined, search: string | null | undefined): boolean {
  const term = normalizeSearchText(search ?? '')
  if (!term) return true
  return normalizeSearchText(value ?? '').includes(term)
}
