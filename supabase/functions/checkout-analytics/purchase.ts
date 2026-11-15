type Checkout = {
  status: string | null;
  payment_status: string;
  mode: string | null;
  metadata: Record<string, string> | null;
  customer: string | { id: string } | null;
  invoice: string | { id: string } | null;
  currency: string | null;
  amount_total: number | null;
  total_details: { amount_tax: number; amount_shipping: number } | null;
  line_items?: { data: Array<{
    quantity: number | null;
    amount_total: number;
    amount_tax: number;
    price: { recurring: { interval: string; interval_count: number } | null } | null;
  }> };
};

export function getVerifiedPurchase(session: Checkout, familyId: string, customerId: string | null) {
  const sessionCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!customerId || sessionCustomerId !== customerId || session.metadata?.family_id !== familyId) {
    throw new Error("Forbidden");
  }
  if (session.mode !== "subscription" || session.status !== "complete" || session.payment_status !== "paid") return null;
  const transactionId = typeof session.invoice === "string" ? session.invoice : session.invoice?.id;
  const lines = session.line_items?.data;
  if (!transactionId || session.currency !== "brl" || session.amount_total === null || !lines?.length) return null;
  const cents = session.amount_total - (session.total_details?.amount_tax ?? 0) - (session.total_details?.amount_shipping ?? 0);
  if (!Number.isSafeInteger(cents) || cents <= 0) return null;
  const items = lines.map((line) => {
    const recurring = line.price?.recurring;
    const plan = recurring?.interval === "year" ? "annual"
      : recurring?.interval === "month" && recurring.interval_count === 3 ? "quarterly"
      : recurring?.interval === "month" && recurring.interval_count === 1 ? "monthly" : null;
    const quantity = line.quantity;
    const amount = line.amount_total - line.amount_tax;
    if (!plan || !quantity || quantity < 1 || !Number.isSafeInteger(amount) || amount <= 0) return null;
    return {
      item_id: plan,
      item_name: ({ monthly: "Plano Mensal", quarterly: "Plano Trimestral", annual: "Plano Anual" })[plan],
      price: amount / 100 / quantity,
      quantity,
    };
  });
  if (items.some((item) => !item)) return null;
  const validItems = items.filter((item): item is NonNullable<typeof item> => item !== null);
  if (Math.abs(validItems.reduce((sum, item) => sum + item.price * item.quantity, 0) - cents / 100) > 0.01) return null;
  return { transaction_id: transactionId, currency: "BRL", value: cents / 100, items: validItems };
}
