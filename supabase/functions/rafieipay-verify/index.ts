import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { reconcileRafieipayEnrollment } from '../_shared/rafieipay-reconcile.ts';

const schema = z.object({
  enrollmentId: z.string().uuid(),
  enrollmentType: z.enum(['course', 'test']).default('course'),
  // Legacy callback values are accepted for compatibility, never used as proof.
  trackId: z.string().max(255).nullable().optional(),
  transactionId: z.string().max(255).nullable().optional(),
  paymentId: z.string().max(255).nullable().optional(),
});
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ success: false, error: 'اطلاعات ثبت‌نام معتبر نیست' }, 400);
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) throw new Error('تنظیمات سرویس پرداخت موجود نیست');
    const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const result = await reconcileRafieipayEnrollment(db, parsed.data.enrollmentId, parsed.data.enrollmentType);
    return json(result);
  } catch (e) {
    console.error('Rafiei Pay verification failed', e);
    return json({ success: false, error: e instanceof Error ? e.message : 'استعلام پرداخت انجام نشد؛ دوباره تلاش کنید' }, 400);
  }
});
