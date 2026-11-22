type Order = { id: string; payment_amount: unknown; zarinpal_authority: string | null };
export function verifiedRafieipayPayment(response: { ok: boolean; body: any }, order: Order) {
  if (!response.ok || response.body?.success === false) throw new Error('استعلام رفیعی‌پی موفق نبود؛ وضعیت ثبت‌نام تغییر نکرد');
  const payment = response.body?.payment ?? response.body?.transaction ?? response.body?.data;
  if (!payment || typeof payment !== 'object') throw new Error('پاسخ معتبر پرداخت دریافت نشد');
  if (String(payment.id ?? '') !== order.zarinpal_authority || String(payment.order_id ?? '') !== order.id) {
    throw new Error('پرداخت متعلق به این ثبت‌نام نیست');
  }
  if (payment.status !== 'verified') return { paid: false, payment };
  const amount = Number(payment.amount_toman);
  const expected = Number(order.payment_amount);
  if (payment.amount_toman == null || !Number.isFinite(amount) || !Number.isFinite(expected) || amount <= 0 || amount !== expected) {
    throw new Error('مبلغ پرداخت با مبلغ ثبت‌نام مطابقت ندارد');
  }
  if (!payment.ref_id) throw new Error('شماره مرجع پرداخت تأییدشده دریافت نشد');
  return { paid: true, payment };
}