import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { db, requireSocialAdmin } from '../_shared/social-enrollment.ts';

const svc = z.object({
  title: z.string().trim().min(1).max(200), url: z.string().trim().regex(/^https?:\/\//).max(500),
  description: z.string().trim().max(1000).nullable().optional(),
  discount_percentage: z.number().int().min(1).max(100),
  discount_code: z.string().trim().max(100).nullable().optional(),
  sort_order: z.number().int().optional(), is_active: z.boolean().optional(),
});
const body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }),
  z.object({ action: z.literal('create'), data: svc }),
  z.object({ action: z.literal('update'), id: z.string().uuid(), data: svc.partial() }),
  z.object({ action: z.literal('delete'), id: z.string().uuid() }),
]);

Deno.serve(async (req) => {
  const headers = { ...corsHeaders, 'Access-Control-Allow-Headers': `${corsHeaders['Access-Control-Allow-Headers']}, x-session-token`, 'Content-Type': 'application/json' };
  const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers });
  if (req.method === 'OPTIONS') return json({});
  const client = db();
  try { await requireSocialAdmin(req, client); } catch { return json({ error: 'دسترسی مدیریت معتبر نیست' }, 403); }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: 'اطلاعات نامعتبر است' }, 400);
  const b = parsed.data; const t = client.from('black_friday_services');
  const r = b.action === 'list' ? await t.select('*').order('sort_order').order('created_at')
    : b.action === 'create' ? await t.insert(b.data).select().single()
    : b.action === 'update' ? await t.update(b.data).eq('id', b.id).select().single()
    : await t.delete().eq('id', b.id);
  if (r.error) return json({ error: r.error.message }, 400);
  return json({ data: r.data });
});
