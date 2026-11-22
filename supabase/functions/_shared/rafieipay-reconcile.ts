import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { rafieipayGet } from './rafieipay.ts';
import { verifiedRafieipayPayment } from './rafieipay-verification-policy.ts';

export async function reconcileRafieipayEnrollment(db: SupabaseClient, enrollmentId: string, enrollmentType: 'course' | 'test') {
  const table = enrollmentType === 'test' ? 'test_enrollments' : 'enrollments';
  const selection = enrollmentType === 'test' ? '*, tests(title,slug)' : '*, courses(*), chat_users:chat_user_id(*)';
  const { data: enrollment, error } = await db.from(table).select(selection).eq('id', enrollmentId).single();
  if (error || !enrollment) throw new Error('ثبت‌نام یافت نشد');
  const course = enrollmentType === 'test' ? enrollment.tests : enrollment.courses;
  if (['completed', 'success'].includes(enrollment.payment_status)) {
    return { success: true, alreadyProcessed: true, refId: enrollment.zarinpal_ref_id, enrollment, course };
  }
  if (enrollmentType === 'course' && !String(enrollment.payment_method).startsWith('rafieipay')) throw new Error('این ثبت‌نام مربوط به رفیعی‌پی نیست');
  if (!enrollment.zarinpal_authority) throw new Error('شناسه ذخیره‌شده پرداخت موجود نیست');
  // The browser cannot nominate another person's paid transaction. Always use the stored reference.
  const response = await rafieipayGet('/functions/v1/payments-get', { id: enrollment.zarinpal_authority }, { enrollmentId });
  const verified = verifiedRafieipayPayment(response, enrollment);
  if (!verified.paid) {
    // Pending, abandoned or temporarily unavailable payments are not failed registrations.
    return { success: false, pending: true, error: 'پرداخت هنوز در رفیعی‌پی تأیید نشده است؛ دوباره بررسی کنید.' };
  }
  const refId = String(verified.payment.ref_id);
  const patch = { payment_status: 'completed', zarinpal_ref_id: refId, updated_at: new Date().toISOString() };
  const { data: changed, error: updateError } = await db.from(table).update(patch)
    .eq('id', enrollmentId).not('payment_status', 'in', '(completed,success)').select('id');
  if (updateError) throw new Error(`ذخیره تأیید پرداخت انجام نشد: ${updateError.message}`);
  const firstActivation = (changed?.length ?? 0) > 0;
  const { data: saved, error: readError } = await db.from(table).select(selection).eq('id', enrollmentId).single();
  if (readError || !saved || !['completed', 'success'].includes(saved.payment_status)) throw new Error('تأیید پرداخت در ثبت‌نام ذخیره نشده است');
  if (firstActivation) {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) throw new Error('تنظیمات سرویس پرداخت موجود نیست');
    const notify = async (name: string, body: unknown) => {
      try {
        const result = await fetch(`${url}/functions/v1/${name}`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!result.ok) console.error(`Rafiei Pay ${name} failed`, result.status, await result.text());
      } catch (e) { console.error(`Rafiei Pay ${name} failed`, e); }
    };
    await notify('send-enrollment-webhook', { eventType: 'enrollment_paid_successful', payload: {
      event_type: 'enrollment_paid_successful', timestamp: new Date().toISOString(), data: {
        enrollment: saved, user: saved.chat_users ?? { name: saved.full_name, email: saved.email, phone: saved.phone },
        course, payment: { amount: saved.payment_amount, ref_id: refId, method: saved.payment_method ?? 'rafieipay' },
      },
    } });
    if (enrollmentType === 'course') {
      await notify('send-enrollment-email', { enrollmentId });
      if (course?.is_spotplayer_enabled) await notify('create-spotplayer-license', { enrollmentId, userFullName: saved.full_name, userPhone: saved.phone, courseId: saved.course_id });
    }
    console.info('Rafiei Pay enrollment reconciled', { enrollmentId, refId });
  }
  return { success: true, alreadyProcessed: !firstActivation, refId, enrollment: saved, course, transaction: verified.payment };
}