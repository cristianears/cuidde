import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, '../CaregiverProfile.tsx'), 'utf8')

describe('CaregiverProfile contact field', () => {
  it('renders one WhatsApp / Telefone field instead of separate phone and WhatsApp fields', () => {
    expect(source).toContain('WhatsApp / Telefone')
    expect(source).not.toContain('Label htmlFor="phone"')
    expect(source).not.toContain('Label htmlFor="whatsapp"')
  })
})
