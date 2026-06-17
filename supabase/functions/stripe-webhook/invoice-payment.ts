type PaymentIntentReference = string | { id?: string | null } | null | undefined

type InvoicePaymentEntry = {
  payment?: {
    payment_intent?: PaymentIntentReference
  } | null
  payment_intent?: PaymentIntentReference
}

type InvoicePaymentSource = {
  payment_intent?: PaymentIntentReference
  payments?: {
    data?: InvoicePaymentEntry[]
  } | null
}

function getPaymentIntentId(paymentIntent: PaymentIntentReference): string | null {
  return typeof paymentIntent === 'string'
    ? paymentIntent
    : paymentIntent?.id ?? null
}

export function getInvoicePaymentIntentId(invoice: InvoicePaymentSource): string | null {
  const topLevelPaymentIntent = getPaymentIntentId(invoice.payment_intent)
  if (topLevelPaymentIntent) return topLevelPaymentIntent

  const invoicePayments = invoice.payments?.data ?? []
  for (const paymentEntry of invoicePayments) {
    const nestedPaymentIntent = getPaymentIntentId(paymentEntry.payment?.payment_intent)
      ?? getPaymentIntentId(paymentEntry.payment_intent)

    if (nestedPaymentIntent) return nestedPaymentIntent
  }

  return null
}
