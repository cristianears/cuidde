import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, '../hooks/useAppointments.ts'), 'utf8')

describe('useAppointments family photos', () => {
  it('busca foto da familia em consulta dedicada para listas do cuidador', () => {
    expect(source).toContain('async function fetchFamilyPhotos')
    expect(source).toContain('fetchFamilyPhotos(familyIds)')
    expect(source).toContain('family_photo: familyPhotos[row.family_id] ?? info?.photo_url ?? null')
    expect(source).toContain('family_photo: familyPhotos[data.family_id] ?? info?.photo_url ?? null')
  })
})
