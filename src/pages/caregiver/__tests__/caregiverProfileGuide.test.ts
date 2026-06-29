import { describe, expect, it } from 'vitest'
import { buildCaregiverProfileGuide } from '../caregiverProfileGuide'

describe('buildCaregiverProfileGuide', () => {
  it('marks profile tabs with complete, pending, and optional guide states', () => {
    const guide = buildCaregiverProfileGuide({
      name: 'Maria Silva',
      phone: '(11) 99999-9999',
      cep: '01001-000',
      street: 'Rua A',
      number: '123',
      neighborhood: 'Centro',
      city: 'Sao Paulo',
      state: 'SP',
      bio: 'Cuidadora com experiencia em acompanhamento de idosos, rotina de medicamentos, higiene, alimentacao, companhia e apoio familiar durante atendimentos domiciliares.',
      profissaoFormacao: 'cuidador',
      specialties: ['Idosos'],
      referencesCount: 0,
    })

    expect(guide.completedCount).toBe(3)
    expect(guide.totalSteps).toBe(4)
    expect(guide.nextStep?.id).toBe(4)
    expect(guide.steps.map((step) => [step.id, step.status])).toEqual([
      [1, 'complete'],
      [2, 'complete'],
      [3, 'complete'],
      [4, 'optional'],
    ])
  })

  it('points to the first required pending step before suggesting references', () => {
    const guide = buildCaregiverProfileGuide({
      name: 'Maria Silva',
      phone: '(11) 99999-9999',
      cep: '01001-000',
      street: 'Rua A',
      number: '123',
      neighborhood: 'Centro',
      city: 'Sao Paulo',
      state: 'SP',
      bio: 'Bio curta',
      profissaoFormacao: '',
      specialties: [],
      referencesCount: 2,
    })

    expect(guide.completedCount).toBe(2)
    expect(guide.nextStep?.id).toBe(2)
    expect(guide.steps[1].status).toBe('pending')
    expect(guide.steps[2].status).toBe('pending')
    expect(guide.steps[3].status).toBe('complete')
  })
})
