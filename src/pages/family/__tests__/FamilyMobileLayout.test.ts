import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const metricCardSource = readFileSync(resolve(__dirname, '../../../components/shared/MetricCard.tsx'), 'utf8')
const publicProfileSource = readFileSync(resolve(__dirname, '../CaregiverPublicProfile.tsx'), 'utf8')
const requestDialogSource = readFileSync(resolve(__dirname, '../../../components/shared/RequestAppointmentDialog.tsx'), 'utf8')
const matchesSource = readFileSync(resolve(__dirname, '../FamilyMatches.tsx'), 'utf8')
const searchCaregiversSource = readFileSync(resolve(__dirname, '../SearchCaregivers.tsx'), 'utf8')
const familyProfileSource = readFileSync(resolve(__dirname, '../FamilyProfile.tsx'), 'utf8')
const familyInvoicesSource = readFileSync(resolve(__dirname, '../FamilyInvoices.tsx'), 'utf8')
const familyInvoiceDetailsSource = readFileSync(resolve(__dirname, '../FamilyInvoiceDetails.tsx'), 'utf8')

describe('family mobile layout regressions', () => {
  it('reserves space for compact dashboard metric icons on mobile', () => {
    expect(metricCardSource).toContain('h-6 w-6')
    expect(metricCardSource).toContain('text-[10px] sm:text-xs')
    expect(metricCardSource).not.toContain('absolute right-2 top-2')
  })

  it('normalizes caregiver about text alignment', () => {
    expect(publicProfileSource).toContain('caregiver.bio.trim()')
    expect(publicProfileSource).toContain('text-left')
    expect(publicProfileSource).toContain('grid grid-cols-[auto_1fr]')
  })

  it('wraps appointment type dropdown text within the mobile dialog', () => {
    expect(requestDialogSource).toContain('selectedTypeLabel')
    expect(requestDialogSource).toContain('textValue={opt.label}')
    expect(requestDialogSource).toContain('truncate text-left')
    expect(requestDialogSource).toContain('max-w-[calc(100vw-2rem)]')
    expect(requestDialogSource).toContain('whitespace-normal')
  })

  it('fits family solicitation tabs in four mobile columns', () => {
    expect(matchesSource).toContain('grid w-full grid-cols-4')
    expect(matchesSource).toContain('text-[11px] sm:text-sm')
  })

  it('uses a stacked mobile solicitation card layout with balanced actions', () => {
    expect(matchesSource).toContain('flex flex-col gap-3 sm:flex-row')
    expect(matchesSource).toContain('grid grid-cols-[1fr_auto]')
  })

  it('makes binary caregiver filters clearly show active and inactive states', () => {
    expect(searchCaregiversSource).toContain('aria-pressed={emergencyOnly}')
    expect(searchCaregiversSource).toContain('aria-pressed={withReferences}')
    expect(searchCaregiversSource).toContain('CheckCircle2')
    expect(searchCaregiversSource).toContain('Ativo')
    expect(searchCaregiversSource).toContain('Não aplicado')
  })

  it('uses a custom medication time field instead of the native mobile time picker', () => {
    expect(familyProfileSource).toContain('handleMedicationTimeChange')
    expect(familyProfileSource).toContain('Horário da medicação')
    expect(familyProfileSource).toContain('placeholder="HH:MM"')
    expect(familyProfileSource).toContain('md:grid-cols-[minmax(0,1fr)_minmax(14rem,16rem)_auto]')
    expect(familyProfileSource).toContain('inputMode="numeric"')
    expect(familyProfileSource).not.toContain('type="time"')
  })

  it('shows family invoices as readable mobile cards instead of a clipped table', () => {
    expect(familyInvoicesSource).toContain('md:hidden')
    expect(familyInvoicesSource).toContain('hidden md:block')
    expect(familyInvoicesSource).toContain('Fatura')
    expect(familyInvoicesSource).toContain('Ver detalhes')
  })

  it('does not expose Stripe invoice identifiers in family invoice details', () => {
    expect(familyInvoiceDetailsSource).not.toContain('ID Stripe')
    expect(familyInvoiceDetailsSource).not.toContain('stripe_invoice_id &&')
  })
})
