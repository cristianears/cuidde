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

export function normalizeHourlyPriceRange(value: number[] | undefined, maxPrice: number): [number, number] {
  const fallback: [number, number] = [0, maxPrice]
  if (!value || value.length === 0) return fallback

  const ceiling = value.length === 1 ? value[0] : value[value.length - 1]
  const normalizedCeiling = Math.min(Math.max(Number(ceiling) || 0, 0), maxPrice)

  return [0, normalizedCeiling]
}

export function buildHourlyPriceFilter(
  value: number[] | undefined,
  maxPrice: number,
): Pick<SearchFilters, 'maxPrice'> {
  const [, ceiling] = normalizeHourlyPriceRange(value, maxPrice)

  return ceiling < maxPrice ? { maxPrice: ceiling } : {}
}
