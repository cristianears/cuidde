import { describe, expect, it } from 'vitest'

import { getInvoicePaymentIntentId } from '../../supabase/functions/stripe-webhook/invoice-payment'

describe('stripe webhook invoice payment intent extraction', () => {
  it('reads the legacy top-level invoice payment_intent', () => {
    expect(getInvoicePaymentIntentId({ payment_intent: 'pi_legacy' })).toBe('pi_legacy')
  })

  it('reads the live API invoice payment_intent from invoice.payments', () => {
    const invoice = {
      payment_intent: null,
      payments: {
        data: [
          {
            payment: {
              type: 'payment_intent',
              payment_intent: 'pi_live_payments',
            },
          },
        ],
      },
    }

    expect(getInvoicePaymentIntentId(invoice)).toBe('pi_live_payments')
  })

  it('returns null when the invoice has no payment intent reference', () => {
    expect(getInvoicePaymentIntentId({ payment_intent: null, payments: { data: [] } })).toBeNull()
  })
})
