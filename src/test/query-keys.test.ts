import { describe, it, expect } from 'vitest'
import { queryKeys } from '@/lib/query-keys'

describe('queryKeys', () => {
  it('caregiverProfile retorna key com userId', () => {
    const key = queryKeys.caregiverProfile('user-123')
    expect(key).toEqual(['caregiverProfile', 'user-123'])
  })

  it('familyProfile retorna key com userId', () => {
    const key = queryKeys.familyProfile('user-456')
    expect(key).toEqual(['family_profile', 'user-456'])
  })

  it('searchCaregivers retorna key com filtros serializados', () => {
    const filters = { city: 'SP', radiusKm: 20 }
    const key = queryKeys.searchCaregivers(filters)
    expect(key[0]).toBe('caregivers')
    expect(key[1]).toBe('search')
    expect(typeof key[2]).toBe('string') // serializado como JSON estável
  })

  it('searchCaregivers gera keys diferentes para filtros diferentes', () => {
    const key1 = queryKeys.searchCaregivers({ city: 'SP' })
    const key2 = queryKeys.searchCaregivers({ city: 'RJ' })
    expect(key1).not.toEqual(key2)
  })

  it('searchCaregivers gera key idêntica independente da ordem das chaves', () => {
    const key1 = queryKeys.searchCaregivers({ city: 'SP', radiusKm: 20 })
    const key2 = queryKeys.searchCaregivers({ radiusKm: 20, city: 'SP' })
    expect(key1).toEqual(key2)
  })

  it('searchCaregivers ignora valores vazios (undefined, string vazia, array vazio)', () => {
    const key1 = queryKeys.searchCaregivers({ city: 'SP' })
    const key2 = queryKeys.searchCaregivers({ city: 'SP', query: '', modalities: [], zona: undefined })
    expect(key1).toEqual(key2)
  })

  it('appointments retorna key com userId e role', () => {
    const key = queryKeys.appointments('user-789', 'caregiver')
    expect(key).toEqual(['appointments', 'caregiver', 'user-789'])
  })

  it('appointmentDetail retorna key com id', () => {
    const key = queryKeys.appointmentDetail('appt-001')
    expect(key).toEqual(['appointment', 'appt-001'])
  })

  it('messages retorna key com appointmentId', () => {
    const key = queryKeys.messages('appt-001')
    expect(key).toEqual(['messages', 'appt-001'])
  })

  it('careRoutines retorna key com appointmentId', () => {
    const key = queryKeys.careRoutines('appt-002')
    expect(key).toEqual(['care_routines', 'appt-002'])
  })

  it('professionalRefs retorna key com userId', () => {
    const key = queryKeys.professionalRefs('user-abc')
    expect(key).toEqual(['professionalReferences', 'user-abc'])
  })

  it('favorites retorna key com userId', () => {
    const key = queryKeys.favorites('user-def')
    expect(key).toEqual(['favorites', 'user-def'])
  })

  it('favoriteIds retorna key com userId', () => {
    const key = queryKeys.favoriteIds('user-ghi')
    expect(key).toEqual(['favorite_ids', 'user-ghi'])
  })

  it('publicCaregiverProfile retorna key com caregiverId', () => {
    const key = queryKeys.publicCaregiverProfile('cg-001')
    expect(key).toEqual(['publicCaregiverProfile', 'cg-001'])
  })

  it('familyMatches retorna key com userId e limit', () => {
    const key = queryKeys.familyMatches('user-xyz', 5)
    expect(key).toEqual(['family_matches', 'user-xyz', 5])
  })
})
