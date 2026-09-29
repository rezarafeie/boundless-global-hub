// Sends coach reports for challenge mission submissions that were never reported.
import { supabase } from '../_shared/supabase.ts';
import { notifySubmissionReview } from '../_shared/assignment-report.ts';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const limit = 25;
  const { data: vars, error: e1 } = await supabase.from('challenge_variants').select('assignment_id').not('assignment_id', 'is', null);
  const ids = [...new Set((vars ?? []).map((v: any) => String(v.assignment_id)).filter((x) => /^[0-9a-f-]{36}$/i.test(x)))];
  if (!ids.length) return Response.json({ sent: 0, remaining: 0, e1 }, { headers: cors });
  const { data: subs, error: e2 } = await supabase.from('assignment_submissions')
    .select('id').in('assignment_id', ids).neq('status', 'draft').order('submitted_at', { ascending: true });
  const { data: done } = await supabase.from('assignment_ai_logs').select('submission_id').eq('kind', 'coach_report');
  const sentSet = new Set((done ?? []).map((d: any) => d.submission_id));
  const todo = (subs ?? []).filter((s: any) => !sentSet.has(s.id));
  let sent = 0;
  for (const s of todo.slice(0, limit)) {
    await notifySubmissionReview(s.id);
    sent++;
    await new Promise((r) => setTimeout(r, 400));
  }
  return Response.json({ sent, remaining: todo.length - sent, e2 }, { headers: cors });
});
