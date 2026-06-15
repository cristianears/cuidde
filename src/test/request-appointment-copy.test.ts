import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const publicProfileSource = readFileSync(resolve(__dirname, '../pages/family/CaregiverPublicProfile.tsx'), 'utf8')
const dialogSource = readFileSync(resolve(__dirname, '../components/shared/RequestAppointmentDialog.tsx'), 'utf8')

describe('copy de solicitar atendimento', () => {
  it('usa CTA mencionando atendimento e chat no perfil publico do cuidador', () => {
    expect(publicProfileSource).toContain('Solicitar Atendimento/Chat')
  })

  it('informa que familia e cuidador poderao trocar mensagens via chat', () => {
    expect(dialogSource).toContain('e poderão trocar mensagens via chat.')
  })
})
