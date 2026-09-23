import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabase.ts";
import { resolveGamificationUserId } from "../_shared/gamification.ts";
import {
  loadStructure, syncParticipant, emitEvent, reportMetrics, recalcParticipant, completeMission,
  grantReward, participantStats, currentDayNumber, dayWindow, selectVariant, processRewards,
} from "../_shared/challenge.ts";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const VISIBLE = ["scheduled", "active", "paused", "finished"];

async function isAdmin(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const { data } = await supabase.auth.getUser(token);
  if (!data?.user) return false;
  const { data: u } = await supabase.from("academy_users").select("role").eq("id", data.user.id).maybeSingle();
  return u?.role === "admin";
}

async function leaderboard(ch: any, myId?: string) {
  const { data: parts } = await supabase.from("challenge_participants")
    .select("id, user_id, xp, streak, best_streak, first_sale_at").eq("challenge_id", ch.id).limit(2000);
  const list = parts ?? [];
  const ids = list.map((p: any) => p.user_id);
  const { data: users } = ids.length ? await supabase.from("chat_users").select("id, name, full_name").in("id", ids.slice(0, 1000)) : { data: [] };
  const nm = new Map((users ?? []).map((u: any) => [u.id, String(u.full_name ?? u.name ?? "دانشجو").trim().split(/\s+/)[0]]));
  const { data: metrics } = await supabase.from("challenge_daily_metrics").select("participant_id, revenue, date").eq("challenge_id", ch.id);
  const growth = new Map<string, number>();
  const half = new Date(Date.parse(ch.start_date) + (ch.days_count / 2) * 86400000).toISOString().slice(0, 10);
  const firstHalf = new Map<string, number>(), secondHalf = new Map<string, number>();
  for (const m of metrics ?? []) {
    const map = m.date < half ? firstHalf : secondHalf;
    map.set(m.participant_id, (map.get(m.participant_id) ?? 0) + Number(m.revenue || 0));
  }
  for (const p of list) growth.set(p.id, (secondHalf.get(p.id) ?? 0) - (firstHalf.get(p.id) ?? 0));
  const board = (sorted: any[], value: (p: any) => any) => {
    const rank = sorted.findIndex((p) => p.id === myId);
    return { top: sorted.slice(0, 10).map((p) => ({ name: nm.get(p.user_id) ?? "دانشجو", value: value(p), me: p.id === myId })), myRank: rank >= 0 ? rank + 1 : null, total: sorted.length };
  };
  return {
    xp: board([...list].sort((a, b) => b.xp - a.xp), (p) => p.xp),
    streak: board([...list].sort((a, b) => b.best_streak - a.best_streak || b.streak - a.streak), (p) => p.best_streak),
    first_sale: board(list.filter((p: any) => p.first_sale_at).sort((a: any, b: any) => a.first_sale_at.localeCompare(b.first_sale_at)), (p) => p.first_sale_at),
    revenue_growth: board([...list].filter((p) => growth.get(p.id)! > 0).sort((a, b) => growth.get(b.id)! - growth.get(a.id)!), (p) => growth.get(p.id)),
  };
}

async function fullState(ch: any, uid: number | null) {
  const { days, variants } = await loadStructure(ch.id);
  let participant: any = null;
  if (uid) {
    const { data } = await supabase.from("challenge_participants").select("*").eq("challenge_id", ch.id).eq("user_id", uid).maybeSingle();
    participant = data;
  }
  const today = currentDayNumber(ch);
  const publicDays = days.map((d: any) => {
    const w = dayWindow(ch, d);
    return {
      id: d.id, day_number: d.day_number, title: d.title, short_description: d.day_number <= today ? d.short_description : null,
      goal: d.day_number <= today ? d.goal : null, estimated_minutes: d.estimated_minutes, xp: d.xp, required: d.required,
      review_mode: d.review_mode, stage_update_enabled: d.stage_update_enabled, stage_update_prompt: d.stage_update_prompt,
      stage_update_suggest: d.stage_update_suggest, available_at: new Date(w.available).toISOString(), deadline_at: new Date(w.deadline).toISOString(),
    };
  });
  const base: any = {
    challenge: { ...ch, messages: undefined, notification_settings: undefined, penalty_rules: undefined },
    days: publicDays, today, participant,
  };
  if (!participant) return base;

  if (ch.status === "active") await syncParticipant(ch, participant, { days, variants });
  const { data: fresh } = await supabase.from("challenge_participants").select("*").eq("id", participant.id).maybeSingle();
  participant = fresh ?? participant;
  const { data: progress } = await supabase.from("challenge_progress").select("*").eq("participant_id", participant.id).order("day_number");
  const vIds = (progress ?? []).map((r: any) => r.variant_id).filter(Boolean);
  const aIds = (progress ?? []).map((r: any) => r.assignment_id).filter(Boolean);
  const fIds = (progress ?? []).map((r: any) => r.form_id).filter(Boolean);
  const sIds = (progress ?? []).map((r: any) => r.submission_id).filter(Boolean);
  const [{ data: assignments }, { data: forms }, { data: subs }, { data: events }] = await Promise.all([
    aIds.length ? supabase.from("assignments").select("*").in("id", aIds) : Promise.resolve({ data: [] as any[] }),
    fIds.length ? supabase.from("telegram_forms").select("id, title, slug").in("id", fIds) : Promise.resolve({ data: [] as any[] }),
    sIds.length ? supabase.from("assignment_submissions").select("id, status, score, ai_feedback, admin_feedback, reviewed_at, submitted_at").in("id", sIds) : Promise.resolve({ data: [] as any[] }),
    supabase.from("challenge_events").select("id, kind, title, message, link, metadata, read_at, created_at").eq("participant_id", participant.id).order("created_at", { ascending: false }).limit(60),
  ]);
  const vMap = new Map(variants.filter((v: any) => vIds.includes(v.id)).map((v: any) => [v.id, v]));
  const aMap = new Map((assignments ?? []).map((a: any) => [a.id, a]));
  const fMap = new Map((forms ?? []).map((f: any) => [f.id, f]));
  const sMap = new Map((subs ?? []).map((s: any) => [s.id, s]));
  const st = await participantStats(participant);
  const todayStr = new Date(Date.now() + 3.5 * 3600000).toISOString().slice(0, 10);
  const rewards = (Array.isArray(ch.reward_rules) ? ch.reward_rules : []).map((r: any) => {
    const earned = (events ?? []).find((e: any) => e.kind === "reward_unlocked" && e.metadata?.reward_key === (r.key ?? r.title));
    return { key: r.key ?? r.title, title: r.title, description: r.description, emoji: r.emoji, trigger: r.trigger, earned: !!earned, reward_type: earned ? r.reward_type : null, reward_value: earned ? r.reward_value : null, link: earned ? r.link : null };
  });
  return {
    ...base,
    participant,
    progress: (progress ?? []).map((r: any) => ({
      ...r,
      variant: vMap.get(r.variant_id) ? { ...vMap.get(r.variant_id), business_models: undefined, stages: undefined, budgets: undefined } : null,
      assignment: aMap.get(r.assignment_id) ?? null,
      form: fMap.get(r.form_id) ?? null,
      submission: sMap.get(r.submission_id) ?? null,
    })),
    stats: {
      completed: st.completed, missed: st.missed, sales: st.sales, revenue: st.revenue,
      leads: st.metrics.reduce((a: number, m: any) => a + m.leads, 0),
      conversations: st.metrics.reduce((a: number, m: any) => a + m.conversations, 0),
      todayMetrics: st.metrics.find((m: any) => m.date === todayStr) ?? null,
      progressPercent: Math.round((st.completed / Math.max(1, ch.days_count)) * 100),
    },
    rewards,
    events: events ?? [],
    leaderboard: ch.leaderboard_enabled ? await leaderboard(ch, participant.id) : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");
    const uid = await resolveGamificationUserId(body.userId, body.email);

    const getChallenge = async () => {
      let q = supabase.from("challenges").select("*");
      q = body.challengeId ? q.eq("id", body.challengeId) : q.eq("slug", String(body.slug ?? ""));
      const { data } = await q.maybeSingle();
      return data;
    };
    const getParticipant = async (ch: any) => {
      if (!uid) return null;
      const { data } = await supabase.from("challenge_participants").select("*").eq("challenge_id", ch.id).eq("user_id", uid).maybeSingle();
      return data;
    };

    if (action === "list") {
      const { data: chs } = await supabase.from("challenges").select("id, title, slug, description, cover_image, start_date, end_date, days_count, status").in("status", VISIBLE).order("start_date", { ascending: false });
      let mine: any[] = [];
      if (uid) {
        const { data } = await supabase.from("challenge_participants").select("challenge_id, xp, streak, current_day, status").eq("user_id", uid);
        mine = data ?? [];
      }
      const withStats = await Promise.all((chs ?? []).map(async (c: any) => {
        const m = mine.find((x) => x.challenge_id === c.id);
        let completed = 0;
        if (m) {
          const { count } = await supabase.from("challenge_progress").select("id", { count: "exact", head: true }).eq("challenge_id", c.id).eq("status", "completed").eq("participant_id", (await supabase.from("challenge_participants").select("id").eq("challenge_id", c.id).eq("user_id", uid!).maybeSingle()).data?.id);
          completed = count ?? 0;
        }
        return { ...c, today: currentDayNumber(c), participation: m ? { ...m, completed } : null };
      }));
      return json({ success: true, challenges: withStats });
    }

    const ch = await getChallenge();
    if (!ch) return json({ success: false, error: "چالش یافت نشد" }, 404);
    const admin = ["admin_action"].includes(action) ? await isAdmin(req) : false;
    // Draft preview: read-only view of an unpublished challenge (no joining/actions)
    if (!VISIBLE.includes(ch.status) && action === "get" && body.preview) {
      return json({ success: true, preview: true, ...(await fullState(ch, null)) });
    }
    if (!VISIBLE.includes(ch.status) && !admin) return json({ success: false, notPublished: true, error: "چالش هنوز منتشر نشده است" }, 200);

    if (action === "get") return json({ success: true, ...(await fullState(ch, uid)) });

    if (!uid && action !== "admin_action") return json({ success: false, error: "ابتدا وارد حساب کاربری شوید" }, 401);

    if (action === "join") {
      if (!["scheduled", "active"].includes(ch.status)) return json({ success: false, error: "ثبت‌نام در این چالش باز نیست" }, 400);
      const pr = body.profile ?? {};
      const clean = (v: unknown, n = 300) => (v == null || v === "" ? null : String(v).slice(0, n));
      const { data: existing } = await supabase.from("challenge_participants").select("id").eq("challenge_id", ch.id).eq("user_id", uid).maybeSingle();
      const row = {
        challenge_id: ch.id, user_id: uid,
        boundless_code: clean(pr.boundless_code, 20), business_model: clean(pr.business_model, 60), stage: clean(pr.stage, 60),
        budget: clean(pr.budget, 30), monthly_revenue: pr.monthly_revenue ? Number(pr.monthly_revenue) || null : null,
        goal: clean(pr.goal, 1000), website: clean(pr.website, 300), socials: clean(pr.socials, 600),
      };
      const { data: p, error } = existing
        ? await supabase.from("challenge_participants").update(row).eq("id", existing.id).select("*").single()
        : await supabase.from("challenge_participants").insert(row).select("*").single();
      if (error) return json({ success: false, error: error.message }, 400);
      if (!existing) await emitEvent(ch, p, "challenge_joined", "joined", {});
      return json({ success: true, ...(await fullState(ch, uid)) });
    }

    const p = await getParticipant(ch);
    if (!p && action !== "admin_action") return json({ success: false, error: "ابتدا در چالش ثبت‌نام کنید" }, 400);

    if (action === "sync") return json({ success: true, ...(await fullState(ch, uid)) });

    if (action === "start") {
      await supabase.from("challenge_progress").update({ status: "started", started_at: new Date().toISOString() })
        .eq("id", body.progressId).eq("participant_id", p.id).eq("status", "available");
      await supabase.from("challenge_participants").update({ last_activity_at: new Date().toISOString() }).eq("id", p.id);
      return json({ success: true });
    }

    if (action === "complete_manual") {
      const { data: row } = await supabase.from("challenge_progress").select("*").eq("id", body.progressId).eq("participant_id", p.id).maybeSingle();
      if (!row || row.assignment_id || row.form_id) return json({ success: false, error: "این ماموریت نیاز به ارسال تمرین دارد" }, 400);
      if (!["available", "started"].includes(row.status)) return json({ success: false, error: "وضعیت ماموریت اجازه این کار را نمی‌دهد" }, 400);
      const { data: day } = await supabase.from("challenge_days").select("*").eq("id", row.day_id).maybeSingle();
      if (day?.review_mode === "human" || day?.review_mode === "ai_human") {
        await supabase.from("challenge_progress").update({ status: "pending_review", submitted_at: new Date().toISOString() }).eq("id", row.id);
      } else await completeMission(ch, p, row, day);
      return json({ success: true, ...(await fullState(ch, uid)) });
    }

    if (action === "update_stage") {
      const stage = String(body.stage ?? "").slice(0, 60);
      if (!stage) return json({ success: false, error: "مرحله نامعتبر است" }, 400);
      const history = Array.isArray(p.profile?.stage_history) ? p.profile.stage_history : [];
      await supabase.from("challenge_participants").update({
        stage, profile: { ...(p.profile ?? {}), stage_history: [...history, { from: p.stage, to: stage, at: new Date().toISOString(), by: "student" }] },
      }).eq("id", p.id);
      return json({ success: true, ...(await fullState(ch, uid)) });
    }

    if (action === "report_metrics") {
      await reportMetrics(ch, p, body.metrics ?? {});
      return json({ success: true, ...(await fullState(ch, uid)) });
    }

    if (action === "read_events") {
      await supabase.from("challenge_events").update({ read_at: new Date().toISOString() }).eq("participant_id", p.id).is("read_at", null);
      return json({ success: true });
    }

    if (action === "admin_action") {
      if (!(await isAdmin(req))) return json({ success: false, error: "دسترسی ادمین لازم است" }, 403);
      const { data: target } = await supabase.from("challenge_participants").select("*").eq("id", body.participantId).eq("challenge_id", ch.id).maybeSingle();
      if (!target) return json({ success: false, error: "شرکت‌کننده یافت نشد" }, 404);
      const op = String(body.op ?? "");
      if (op === "set_profile") {
        const f = body.fields ?? {};
        const patch: Record<string, unknown> = {};
        for (const k of ["stage", "business_model", "budget", "boundless_code", "status"]) if (f[k] !== undefined) patch[k] = f[k];
        if (patch.stage && patch.stage !== target.stage) {
          const history = Array.isArray(target.profile?.stage_history) ? target.profile.stage_history : [];
          patch.profile = { ...(target.profile ?? {}), stage_history: [...history, { from: target.stage, to: patch.stage, at: new Date().toISOString(), by: "coach" }] };
        }
        await supabase.from("challenge_participants").update(patch).eq("id", target.id);
      } else if (op === "adjust_xp") {
        const profile = { ...(target.profile ?? {}), xp_adjustment: Number(target.profile?.xp_adjustment ?? 0) + Number(body.amount ?? 0) };
        await supabase.from("challenge_participants").update({ profile }).eq("id", target.id);
        target.profile = profile;
        await recalcParticipant(ch, target);
        await processRewards(ch, target);
      } else if (op === "mark_complete" || op === "reopen" || op === "extend") {
        const { data: row } = await supabase.from("challenge_progress").select("*").eq("id", body.progressId).eq("participant_id", target.id).maybeSingle();
        if (!row) return json({ success: false, error: "ماموریت یافت نشد" }, 404);
        const { data: day } = await supabase.from("challenge_days").select("*").eq("id", row.day_id).maybeSingle();
        if (op === "mark_complete") await completeMission(ch, target, row, day, { force: true });
        if (op === "reopen") {
          await supabase.from("challenge_progress").update({ status: "available", completed_at: null, missed_at: null, xp_awarded: 0, deadline_at: new Date(Date.now() + Number(body.hours ?? 24) * 3600000).toISOString() }).eq("id", row.id);
          await recalcParticipant(ch, target);
        }
        if (op === "extend") {
          const base = Math.max(Date.now(), Date.parse(row.deadline_at ?? new Date().toISOString()));
          await supabase.from("challenge_progress").update({ deadline_at: new Date(base + Number(body.hours ?? 24) * 3600000).toISOString(), ...(row.status === "missed" ? { status: "available", missed_at: null } : {}) }).eq("id", row.id);
        }
      } else if (op === "grant_reward") {
        const r = (ch.reward_rules ?? []).find((x: any) => (x.key ?? x.title) === body.rewardKey);
        if (!r) return json({ success: false, error: "جایزه یافت نشد" }, 404);
        await grantReward(ch, target, r);
      } else if (op === "sync") {
        await syncParticipant(ch, target);
      } else return json({ success: false, error: "عملیات نامعتبر" }, 400);
      return json({ success: true });
    }

    return json({ success: false, error: "عملیات نامعتبر" }, 400);
  } catch (e) {
    console.error("challenge-api error", e);
    return json({ success: false, error: String((e as Error).message ?? e) }, 500);
  }
});

