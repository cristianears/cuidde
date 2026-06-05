import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const appointmentsSource = readFileSync(resolve(__dirname, '../CaregiverAppointments.tsx'), 'utf8')
const appointmentDetailsSource = readFileSync(resolve(__dirname, '../AppointmentDetails.tsx'), 'utf8')
const careRoutineHookSource = readFileSync(resolve(__dirname, '../../../hooks/useCareRoutine.ts'), 'utf8')

describe('caregiver routine reminders', () => {
  it('shows a gentle routine reminder in active appointments without framing it as mandatory', () => {
    expect(appointmentsSource).toContain('Já registrou a rotina de cuidados hoje?')
    expect(appointmentsSource).toContain('valorizam seu histórico na plataforma')
    expect(appointmentsSource).toContain('appointmentsMissingRoutineToday.length > 0')
    expect(appointmentsSource).toContain('Registrar agora')
    expect(appointmentsSource).not.toContain('obrigatório')
  })

  it('shows appointment-level routine status based on today records', () => {
    expect(appointmentDetailsSource).toContain('Nenhum registro de hoje ainda')
    expect(appointmentDetailsSource).toContain('Rotina de hoje registrada')
    expect(appointmentDetailsSource).toContain('care.date === getLocalDateString()')
  })

  it('fetches today routine status with centralized query keys and refreshes after routine changes', () => {
    expect(careRoutineHookSource).toContain('useCareRoutineTodayStatus')
    expect(careRoutineHookSource).toContain('queryKeys.careRoutineTodayStatus(appointmentIds, today)')
    expect(careRoutineHookSource).toContain("qc.invalidateQueries({ queryKey: queryKeys.careRoutineTodayStatusAll })")
  })
})
