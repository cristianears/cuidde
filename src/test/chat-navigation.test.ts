import { describe, expect, it } from 'vitest'
import { getAppointmentChatBackPath } from '@/lib/chat-navigation'

describe('appointment chat navigation', () => {
  it('sends caregivers back to solicitations when the appointment is pending', () => {
    expect(
      getAppointmentChatBackPath({
        userRole: 'caregiver',
        status: 'pendente',
        appointmentId: 'appointment-1',
      }),
    ).toBe('/caregiver/solicitations')
  })

  it('keeps caregivers in appointment details when the appointment is active', () => {
    expect(
      getAppointmentChatBackPath({
        userRole: 'caregiver',
        status: 'ativo',
        appointmentId: 'appointment-1',
      }),
    ).toBe('/caregiver/appointments/appointment-1')
  })

  it('keeps the family back path unchanged', () => {
    expect(
      getAppointmentChatBackPath({
        userRole: 'family',
        status: 'pendente',
        appointmentId: 'appointment-1',
      }),
    ).toBe('/family/appointments/appointment-1')
  })
})
