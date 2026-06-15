import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const appointmentsSource = readFileSync(resolve(__dirname, '../CaregiverAppointments.tsx'), 'utf8')
const detailsSource = readFileSync(resolve(__dirname, '../AppointmentDetails.tsx'), 'utf8')
const chatSource = readFileSync(resolve(__dirname, '../../chat/AppointmentChat.tsx'), 'utf8')
const familyAppointmentsSource = readFileSync(resolve(__dirname, '../../family/FamilyAppointments.tsx'), 'utf8')

describe('foto da familia para o cuidador', () => {
  it('exibe foto da familia na lista de atendimentos do cuidador', () => {
    expect(appointmentsSource).toContain('AvatarImage')
    expect(appointmentsSource).toContain('appointment.family_photo')
    expect(appointmentsSource).toContain('alt={appointment.family_name ?? "Família"}')
  })

  it('exibe foto da familia no detalhe do atendimento do cuidador', () => {
    expect(detailsSource).toContain('AvatarImage')
    expect(detailsSource).toContain('appointment.family_photo')
    expect(detailsSource).toContain('alt={appointment.family_name ?? "Família"}')
  })

  it('exibe foto da outra parte no cabecalho do chat', () => {
    expect(chatSource).toContain('otherPartyPhoto')
    expect(chatSource).toContain('AvatarImage')
    expect(chatSource).toContain('src={otherPartyPhoto ?? undefined}')
  })

  it('exibe foto do cuidador na lista de atendimentos da familia', () => {
    expect(familyAppointmentsSource).toContain('AvatarImage')
    expect(familyAppointmentsSource).toContain('appointment.caregiver_photo')
    expect(familyAppointmentsSource).toContain('alt={appointment.caregiver_name ?? "Cuidador"}')
  })
})
