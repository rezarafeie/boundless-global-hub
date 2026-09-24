// Boundless Challenge engine — a thin orchestration layer on top of existing
// assignments, telegram forms, AI feedback, coach review and the notification
// senders used by course gamification. It never touches course access unless a
// penalty rule explicitly uses the `lock_course` action.
import { supabase } from "./supabase.ts";
import { sendMessage, tgCall } from "./telegram.ts";
import { baleSendMessage, stripHtml } from "./bale.ts";
import { sendEmail, sendSms } from "./support-followup.ts";

export const HOUR = 3600_000;
export const DAY = 24 * HOUR;
const TEHRAN_OFFSET = "+03:30";
const SITE = "https://academy.rafiei.co";

export type Challenge = Record<string, any>;
export type Participant = Record<string, any>;

/* ---------------- time helpers ---------------- */

export function tehranDate(ms = Date.now()): string {
  return new Date(ms + 3.5 * HOUR).toISOString().slice(0, 10);
}
function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function at(date: string, time?: string | null): number {
  const t = /^\d{1,2}:\d{2}$/.test(time ?? "") ? String(time).padStart(5, "0") : "00:00";
  return Date.parse(`${date}T${t}:00${TEHRAN_OFFSET}`);
}
export function currentDayNumber(ch: Challenge, now = Date.now()): number {
  const start = at(ch.start_date, "00:00");
  if (now < start) return 0;
  return Math.min(Number(ch.days_count) || 1, Math.floor((now - start) / DAY) + 1);
}
export function dayWindow(ch: Challenge, day: Record<string, any>) {
  const date = addDays(ch.start_date, Number(day.day_number) - 1);
  const available = at(date, day.unlock_time ?? "00:00");
  let deadline = at(date, day.deadline_time ?? ch.default_deadline_time ?? "23:59");
  if (day.deadline_hours) deadline = available + Number(day.deadline_hours) * HOUR;
  if (deadline <= available) deadline += DAY;
  return { available, deadline };
}
export function humanRemaining(ms: number): string {
  if (ms <= 0) return "۰ دقیقه";
  const m = Math.floor(ms / 60000);
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  if (d > 0) return `${d} روز و ${h} ساعت`;
  if (h > 0) return `${h} ساعت و ${mm} دقیقه`;
  return `${mm} دقیقه`;
}

/* ---------------- variant selection ---------------- */

export function selectVariant(variants: any[], p: Participant) {
  const match = (list: string[] | null | undefined, v: unknown) =>
    !list || list.length === 0 ? 0 : list.includes(String(v ?? "")) ? 1 : -1;
  let best: any = null;
  let bestScore = -1;
  for (const v of variants) {
    if (v.is_fallback) continue;
    const parts = [
      match(v.boundless_codes, p.boundless_code),
      match(v.business_models, p.business_model),
      match(v.stages, p.stage),
      match(v.budgets, p.budget),
    ];
    if (parts.includes(-1)) continue;
    const score = parts.reduce((a, b) => a + b, 0) * 1000 + (Number(v.priority) || 0);
    if (score > bestScore) { best = v; bestScore = score; }
  }
  if (best) return best;
  return variants.find((v) => v.is_fallback) ?? variants[0] ?? null;
}

/* ---------------- messages ---------------- */

const DEFAULT_MESSAGES: Record<string, { title: string; text: string }> = {
  challenge_joined: { title: "به {challenge_title} خوش آمدی 🎯", text: "{name} عزیز، ثبت‌نامت در چالش انجام شد. هر روز یک ماموریت شخصی‌سازی‌شده برایت باز می‌شود.\n{challenge_url}" },
  challenge_started: { title: "چالش شروع شد 🚀", text: "{name}، {challenge_title} از امروز شروع شد. اولین ماموریتت آماده است.\n{mission_url}" },
  mission_available: { title: "ماموریت روز {day} آماده است 🔥", text: "{name}، ماموریت امروز: «{mission_title}»\nمهلت: {deadline}\nپاداش: {xp} امتیاز\n{mission_url}" },
  deadline_approaching: { title: "⏰ {remaining_time} تا پایان ماموریت", text: "{name}، ماموریت روز {day} («{mission_title}») هنوز انجام نشده.\n{mission_url}" },
  mission_submitted: { title: "ماموریت ارسال شد 📤", text: "ماموریت روز {day} دریافت شد و در حال بررسی است." },
  ai_feedback_ready: { title: "بازخورد هوشمند آماده است 🤖", text: "{name}، بازخورد ماموریت روز {day} آماده است.\n{mission_url}" },
  coach_feedback_ready: { title: "مربی ماموریتت را بررسی کرد 👤", text: "{name}، بازخورد مربی برای روز {day} ثبت شد.\n{mission_url}" },
  revision_requested: { title: "نیاز به اصلاح 🔄", text: "{name}، ماموریت روز {day} «{mission_title}» نیاز به اصلاح دارد.\n\n{reasons}\n\nاصلاح کن و دوباره بفرست:\n{mission_url}" },
  mission_completed: { title: "ماموریت روز {day} کامل شد ✅", text: "آفرین {name}! +{xp} امتیاز. استریک فعلی: {streak} روز 🔥" },
  mission_missed: { title: "ماموریت روز {day} از دست رفت", text: "{name}، مهلت ماموریت «{mission_title}» تمام شد. امروز دوباره شروع کن 💪\n{challenge_url}" },
  streak_achieved: { title: "🔥 استریک {streak} روزه!", text: "{name}، {streak} روز پشت سر هم ماموریت‌ها را انجام دادی. ادامه بده!" },
  streak_broken: { title: "استریک قطع شد", text: "{name}، استریک تو قطع شد. با ماموریت امروز دوباره بساز." },
  first_sale: { title: "🎉 اولین فروش!", text: "تبریک {name}! اولین فروش تو در {challenge_title} ثبت شد." },
  reward_unlocked: { title: "🎁 جایزه جدید باز شد", text: "{name}، جایزه «{reward}» را گرفتی.\n{challenge_url}" },
  penalty_applied: { title: "هشدار چالش", text: "{feedback}" },
  payment_required: { title: "⛔ چالش متوقف شد", text: "{name}، ماموریت روز {day} از دست رفت. برای بازگشت به {challenge_title} باید {usd} دلار جریمه پرداخت کنی.\n{challenge_url}" },
  penalty_released: { title: "✅ به چالش برگشتی", text: "{name}، {feedback}\n{mission_url}" },
  inactive: { title: "دلمون برات تنگ شده 👋", text: "{name}، چند وقتی است در {challenge_title} فعالیتی نداشتی. ماموریت امروز منتظرته.\n{challenge_url}" },
  challenge_completed: { title: "🏆 چالش تمام شد", text: "{name}، {challenge_title} به پایان رسید. امتیاز نهایی: {xp} — پیشرفت: {progress}٪" },
};

function render(tpl: string, vars: Record<string, unknown>) {
  return tpl.replace(/\{(\w+)\}/g, (_m, k) => (vars[k] == null ? "" : String(vars[k])));
}

const DEFAULT_CHANNELS = { telegram_bot: true, telegram_business: true, bale: true, email: true, in_app: true, sms: false };

/* ---------------- events + delivery ---------------- */

export async function emitEvent(
  ch: Challenge,
  p: Participant,
  kind: string,
  refId: string,
  vars: Record<string, unknown> = {},
  link?: string,
) {
  const { data: existing } = await supabase
    .from("challenge_events").select("id, channels")
    .eq("participant_id", p.id).eq("kind", kind).eq("ref_id", refId).maybeSingle();
  if (existing) return { skipped: true };

  const { data: user } = await supabase
    .from("chat_users").select("id, name, full_name, phone, email, telegram_chat_id, bale_chat_id")
    .eq("id", p.user_id).maybeSingle();
  const firstName = String(user?.full_name ?? user?.name ?? "").trim().split(/\s+/)[0] || "دوست عزیز";
  const url = link ?? `${SITE}/challenges/${ch.slug}`;
  const allVars = {
    name: firstName,
    challenge_title: ch.title,
    days_count: ch.days_count,
    xp: p.xp,
    streak: p.streak,
    challenge_url: `${SITE}/challenges/${ch.slug}`,
    mission_url: url,
    ...vars,
  };
  const custom = (ch.messages ?? {})[kind] ?? {};
  if (custom.enabled === false) return { skipped: true, reason: "disabled" };
  const base = DEFAULT_MESSAGES[kind] ?? { title: kind, text: "" };
  const title = render(custom.title ?? base.title, allVars);
  const text = render(custom.text ?? base.text, allVars);

  const { data: row, error } = await supabase.from("challenge_events").insert({
    challenge_id: ch.id, participant_id: p.id, user_id: p.user_id, kind, ref_id: refId,
    title, message: text, link: url.replace(SITE, ""), metadata: vars,
  }).select("id").single();
  if (error) return { skipped: true, reason: error.message }; // unique conflict → already sent

  const settings = { ...DEFAULT_CHANNELS, ...((ch.notification_settings ?? {}).channels ?? {}) };
  const eventChannels: string[] | null = Array.isArray(custom.channels) ? custom.channels : null;
  const allow = (c: string) => ch.notifications_enabled && (settings as any)[c] && (!eventChannels || eventChannels.includes(c));
  const channels: string[] = allow("in_app") ? ["in_app"] : [];
  const errors: Record<string, string> = {};
  const body = `${title}\n\n${text}`;

  if (user) {
    if (allow("telegram_bot") && user.telegram_chat_id) {
      try { const r: any = await sendMessage(Number(user.telegram_chat_id), body); r?.ok ? channels.push("telegram_bot") : (errors.telegram_bot = JSON.stringify(r)); }
      catch (e) { errors.telegram_bot = String(e); }
    }
    if (allow("bale") && !channels.includes("telegram_bot") && user.bale_chat_id) {
      try { const r: any = await baleSendMessage(Number(user.bale_chat_id), stripHtml(body)); r?.ok ? channels.push("bale_bot") : (errors.bale_bot = JSON.stringify(r)); }
      catch (e) { errors.bale_bot = String(e); }
    }
    if (allow("telegram_business")) {
      try {
        const { data: act } = await supabase.from("support_activations").select("telegram_id")
          .eq("user_id", p.user_id).eq("status", "activated").not("telegram_id", "is", null)
          .order("activated_at", { ascending: false }).limit(1).maybeSingle();
        if (act?.telegram_id) {
          const { data: s } = await supabase.from("admin_settings").select("telegram_business_connection_id" as any).eq("id", 1).maybeSingle();
          const bcid = (s as any)?.telegram_business_connection_id;
          if (bcid) {
            const r: any = await tgCall("sendMessage", { chat_id: Number(act.telegram_id), text: body, business_connection_id: bcid });
            r?.ok ? channels.push("telegram_business") : (errors.telegram_business = JSON.stringify(r));
          }
        }
      } catch (e) { errors.telegram_business = String(e); }
    }
    if (allow("email") && user.email) {
      const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.9"><h2>${title}</h2><p>${text.replace(/\n/g, "<br/>")}</p><p><a href="${url}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">مشاهده در چالش</a></p></div>`;
      const r = await sendEmail(user.email, title, html);
      r.ok ? channels.push("email") : (errors.email = r.error ?? "email error");
    }
    if (allow("sms") && user.phone) {
      const r = await sendSms(user.phone, body, { name: firstName }, null);
      r.ok ? channels.push("sms") : (errors.sms = r.error ?? "sms error");
    }
  }
  await supabase.from("challenge_events").update({ channels, delivery_errors: errors }).eq("id", row.id);
  return { channels, errors };
}

/* ---------------- loaders ---------------- */

export async function loadStructure(challengeId: string) {
  const [{ data: days }, { data: variants }] = await Promise.all([
    supabase.from("challenge_days").select("*").eq("challenge_id", challengeId).order("day_number"),
    supabase.from("challenge_variants").select("*").eq("challenge_id", challengeId),
  ]);
  return { days: days ?? [], variants: variants ?? [] };
}

/* ---------------- progress ---------------- */

const OPEN = ["available", "started", "submitted", "pending_ai", "pending_review", "needs_revision"];

// Highest day number the participant may open: the calendar day, or — when
// the challenge allows early unlock — one past the last consecutively completed day.
export async function unlockedDay(ch: Challenge, p: Participant) {
  const today = currentDayNumber(ch);
  if (!(ch as any).unlock_next_on_complete || today < 1) return today;
  const { data: rows } = await supabase.from("challenge_progress").select("day_number, status").eq("participant_id", p.id).order("day_number");
  let last = 0;
  for (const r of rows ?? []) {
    if (r.day_number !== last + 1) break;
    if (!["completed", "skipped"].includes(r.status)) break;
    last = r.day_number;
  }
  return Math.min(Number(ch.days_count) || 1, Math.max(today, last + 1));
}

export async function ensureProgress(ch: Challenge, p: Participant, structure?: { days: any[]; variants: any[] }) {
  if (!["active", "finished"].includes(ch.status)) return 0;
  const { days, variants } = structure ?? await loadStructure(ch.id);
  const today = currentDayNumber(ch);
  const limit = await unlockedDay(ch, p);
  const { data: rows } = await supabase.from("challenge_progress").select("day_id").eq("participant_id", p.id);
  const have = new Set((rows ?? []).map((r: any) => r.day_id));
  const joinedDay = currentDayNumber(ch, Date.parse(p.joined_at)) || 1;
  let created = 0;
  for (const d of days) {
    if (d.day_number > limit || have.has(d.id)) continue;
    const w = dayWindow(ch, d);
    const early = d.day_number > today;
    const variant = selectVariant(variants.filter((v: any) => v.day_id === d.id), p);
    const skipped = d.day_number < joinedDay;
    const { error } = await supabase.from("challenge_progress").insert({
      participant_id: p.id, challenge_id: ch.id, day_id: d.id, day_number: d.day_number,
      variant_id: variant?.id ?? null, assignment_id: variant?.assignment_id ?? null, form_id: variant?.form_id ?? null,
      status: skipped ? "skipped" : "available",
      available_at: new Date(early ? Date.now() : w.available).toISOString(), deadline_at: new Date(w.deadline).toISOString(),
    });
    if (error) continue; // unique → already created by a parallel run
    created++;
    if (!skipped && (d.day_number === today || early)) {
      await emitEvent(ch, p, d.day_number === 1 ? "challenge_started" : "mission_available", `day:${d.day_number}`, {
        day: d.day_number, mission_title: d.title, xp: d.xp,
        deadline: new Date(w.deadline).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" }),
      }, `${SITE}/challenges/${ch.slug}?day=${d.day_number}`);
    }
  }
  if (today > 0 && p.current_day !== today) {
    await supabase.from("challenge_participants").update({ current_day: today }).eq("id", p.id);
    p.current_day = today;
  }
  return created;
}

function aiPassed(sub: any, assignment: any): boolean | null {
  const fb = sub?.ai_feedback;
  if (!fb) return null;
  if (typeof fb.pass === "boolean") return fb.pass;
  if (fb.needs_revision === true) return false;
  const pass = assignment?.passing_score;
  if (pass == null) return true;
  const score = Number(fb.score ?? sub.score);
  return Number.isFinite(score) ? score >= Number(pass) : true;
}

// Human-readable list of exactly what must be fixed (coach feedback first, then AI).
export function revisionReasons(sub: any): string {
  const out: string[] = [];
  if (sub?.admin_feedback) out.push(`بازخورد مربی: ${String(sub.admin_feedback).trim()}`);
  let fb = sub?.ai_feedback;
  if (typeof fb === "string") { try { fb = JSON.parse(fb); } catch { out.push(fb.slice(0, 800)); fb = null; } }
  if (fb && typeof fb === "object") {
    const arr = (v: any) => (Array.isArray(v) ? v : v ? [v] : []).map((x: any) => (typeof x === "string" ? x : x?.text ?? x?.title ?? JSON.stringify(x))).filter(Boolean);
    const fixes = [...arr(fb.required_changes), ...arr(fb.revisions), ...arr(fb.weaknesses), ...arr(fb.improvements)];
    const steps = [...arr(fb.next_steps), ...arr(fb.nextSteps)];
    if (fixes.length) out.push("موارد نیازمند اصلاح:\n" + fixes.slice(0, 6).map((x) => `• ${x}`).join("\n"));
    if (steps.length) out.push("قدم‌های بعدی:\n" + steps.slice(0, 5).map((x) => `• ${x}`).join("\n"));
    if (!fixes.length && !steps.length && (fb.summary || fb.feedback)) out.push(String(fb.summary ?? fb.feedback).slice(0, 800));
  }
  return out.join("\n\n");
}

// Reads the linked assignment submission / form submission and derives the
// mission status. Idempotent; safe to call from cron, student page and admin.
export async function syncProgressRow(ch: Challenge, p: Participant, row: any, day: any) {
  if (!OPEN.includes(row.status)) return row.status;
  const mode = day?.review_mode ?? "ai";
  let next = row.status;
  let submissionId = row.submission_id;
  let submittedAt = row.submitted_at;
  let lastSub: any = null;

  if (row.assignment_id) {
    const { data: subs } = await supabase.from("assignment_submissions").select("*")
      .eq("assignment_id", row.assignment_id).eq("student_id", p.user_id)
      .gte("created_at", new Date(Date.parse(row.available_at) - 7 * DAY).toISOString())
      .order("updated_at", { ascending: false }).limit(5);
    const sub = (subs ?? []).find((s: any) => s.status !== "draft") ?? (subs ?? [])[0];
    if (sub) {
      lastSub = sub;
      submissionId = sub.id;
      submittedAt = sub.submitted_at ?? submittedAt;
      const { data: assignment } = await supabase.from("assignments").select("passing_score").eq("id", row.assignment_id).maybeSingle();
      const coachApproved = sub.status === "completed";
      const coachRevision = sub.status === "needs_revision";
      const passed = aiPassed(sub, assignment);
      if (sub.status === "draft") next = row.started_at ? "started" : row.status;
      else if (coachRevision) next = "needs_revision";
      else if (coachApproved) next = "completed";
      else if (mode === "auto") next = "completed";
      else if (mode === "ai") next = passed == null ? "pending_ai" : passed ? "completed" : "needs_revision";
      else if (mode === "human") next = "pending_review";
      else if (mode === "ai_human") next = passed === false ? "needs_revision" : passed == null ? "pending_ai" : "pending_review";

      if (sub.ai_feedback && next !== row.status) await emitEvent(ch, p, "ai_feedback_ready", `sub:${sub.id}:ai`, { day: row.day_number }, `${SITE}/challenges/${ch.slug}?day=${row.day_number}&view=feedback`);
      if (sub.reviewed_at && (coachApproved || coachRevision || sub.admin_feedback)) await emitEvent(ch, p, "coach_feedback_ready", `sub:${sub.id}:coach:${sub.reviewed_at}`, { day: row.day_number, feedback: sub.admin_feedback ?? "" }, `${SITE}/challenges/${ch.slug}?day=${row.day_number}&view=feedback`);
    }
  } else if (row.form_id) {
    const { data: fs } = await supabase.from("telegram_form_submissions").select("id, status, created_at")
      .eq("form_id", row.form_id).eq("chat_user_id", p.user_id)
      .gte("created_at", new Date(Date.parse(row.available_at) - DAY).toISOString())
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (fs && fs.status !== "in_progress") {
      submissionId = fs.id;
      submittedAt = fs.created_at;
      next = mode === "human" || mode === "ai_human" ? "pending_review" : "completed";
    }
  }

  if (next === row.status && submissionId === row.submission_id) return row.status;
  const patch: Record<string, unknown> = { status: next, submission_id: submissionId, submitted_at: submittedAt };
  await supabase.from("challenge_progress").update(patch).eq("id", row.id);
  if (next === "needs_revision" && row.status !== "needs_revision") {
    const reasons = lastSub ? revisionReasons(lastSub) : "";
    await emitEvent(ch, p, "revision_requested", `prog:${row.id}:rev:${Date.now() - (Date.now() % HOUR)}`, { day: row.day_number, mission_title: day?.title ?? "", reasons }, `${SITE}/challenges/${ch.slug}?day=${row.day_number}&action=revision`);
  }
  if (next === "completed") await completeMission(ch, p, { ...row, ...patch }, day);
  return next;
}

export async function completeMission(ch: Challenge, p: Participant, row: any, day: any, opts: { force?: boolean } = {}) {
  const { data: fresh } = await supabase.from("challenge_progress").select("*").eq("id", row.id).maybeSingle();
  if (fresh?.xp_awarded && !opts.force && fresh.status === "completed") return;
  const now = Date.now();
  const rules = ch.xp_rules ?? {};
  let xp = ch.gamification_enabled ? Number(day?.xp ?? 10) : 0;
  if (ch.gamification_enabled && rules.on_time_bonus && row.deadline_at && now <= Date.parse(row.deadline_at)) xp += Number(rules.on_time_bonus);
  await supabase.from("challenge_progress").update({
    status: "completed", completed_at: new Date(now).toISOString(), xp_awarded: xp,
  }).eq("id", row.id);
  await recalcParticipant(ch, p);
  await emitEvent(ch, p, "mission_completed", `day:${row.day_number}`, { day: row.day_number, xp, streak: p.streak, mission_title: day?.title });
  const milestones: number[] = Array.isArray(rules.streak_milestones) ? rules.streak_milestones : [3, 7, 14, 21, 30];
  if (ch.streak_enabled && milestones.includes(p.streak)) await emitEvent(ch, p, "streak_achieved", `streak:${p.streak}`, { streak: p.streak });
  await processRewards(ch, p);
}

export async function recalcParticipant(ch: Challenge, p: Participant) {
  const { data: rows } = await supabase.from("challenge_progress").select("day_number, status, xp_awarded").eq("participant_id", p.id).order("day_number");
  const list = rows ?? [];
  const bonus = Number(p.profile?.xp_adjustment ?? 0);
  const penalty = Number(p.profile?.xp_penalty ?? 0);
  const xp = Math.max(0, list.reduce((a: number, r: any) => a + (r.status === "completed" ? Number(r.xp_awarded) || 0 : 0), 0) + bonus - penalty);
  let streak = 0;
  if (ch.streak_enabled) {
    for (let i = list.length - 1; i >= 0; i--) {
      const s = list[i].status;
      if (s === "completed") streak++;
      else if (s === "skipped" || OPEN.includes(s)) { if (streak === 0 && OPEN.includes(s)) continue; if (s === "skipped") continue; break; }
      else break;
    }
    if (p.profile?.streak_reset_at_day) {
      const after = list.filter((r: any) => r.day_number > p.profile.streak_reset_at_day && r.status === "completed").length;
      streak = Math.min(streak, after);
    }
  }
  const best = Math.max(Number(p.best_streak) || 0, streak);
  await supabase.from("challenge_participants").update({ xp, streak, best_streak: best, last_activity_at: new Date().toISOString() }).eq("id", p.id);
  Object.assign(p, { xp, streak, best_streak: best });
}

/* ---------------- rewards & penalties ---------------- */

export async function participantStats(p: Participant) {
  const [{ data: rows }, { data: metrics }] = await Promise.all([
    supabase.from("challenge_progress").select("status, day_number, completed_at").eq("participant_id", p.id),
    supabase.from("challenge_daily_metrics").select("sales, revenue, leads, conversations, date").eq("participant_id", p.id),
  ]);
  const completed = (rows ?? []).filter((r: any) => r.status === "completed");
  const missed = (rows ?? []).filter((r: any) => r.status === "missed").length;
  const sales = (metrics ?? []).reduce((a: number, m: any) => a + Number(m.sales || 0), 0);
  const revenue = (metrics ?? []).reduce((a: number, m: any) => a + Number(m.revenue || 0), 0);
  return { completed: completed.length, missed, sales, revenue, rows: rows ?? [], metrics: metrics ?? [] };
}

export async function processRewards(ch: Challenge, p: Participant) {
  if (!ch.gamification_enabled) return;
  const rules: any[] = Array.isArray(ch.reward_rules) ? ch.reward_rules : [];
  if (!rules.length) return;
  const st = await participantStats(p);
  const allDone = st.completed >= Number(ch.days_count);
  for (const r of rules) {
    const t = r.trigger ?? {};
    const v = Number(t.value ?? 0);
    let ok = false;
    switch (t.type) {
      case "missions_completed": ok = st.completed >= v; break;
      case "xp": ok = p.xp >= v; break;
      case "streak": ok = p.streak >= v || p.best_streak >= v; break;
      case "challenge_completed": ok = allDone; break;
      case "complete_before_day": ok = allDone && currentDayNumber(ch) <= v; break;
      case "first_sale": ok = !!p.first_sale_at; break;
      case "revenue": ok = st.revenue >= v; break;
      default: ok = false; // custom/manual → granted by admin
    }
    if (ok) await grantReward(ch, p, r);
  }
}

export async function grantReward(ch: Challenge, p: Participant, r: any) {
  const key = r.key ?? r.title;
  await emitEvent(ch, p, "reward_unlocked", `reward:${key}`, {
    reward: r.title, reward_key: key, reward_type: r.reward_type ?? null, reward_value: r.reward_value ?? null,
    emoji: r.emoji ?? "🎁", description: r.description ?? null, cta: r.link ?? null,
  });
}

export async function applyPenalties(ch: Challenge, p: Participant, trigger: string, ref: string) {
  const rules: any[] = Array.isArray(ch.penalty_rules) ? ch.penalty_rules : [];
  const st = await participantStats(p);
  for (const r of rules) {
    const t = r.trigger ?? {};
    const hit = t.type === trigger || (t.type === "missed_count" && trigger === "mission_missed" && st.missed >= Number(t.value ?? 1));
    if (!hit) continue;
    const key = `penalty:${r.key ?? t.type}:${t.type === "missed_count" ? "once" : ref}`;
    const { data: done } = await supabase.from("challenge_events").select("id").eq("participant_id", p.id).eq("kind", "penalty_applied").eq("ref_id", key).maybeSingle();
    if (done) continue;
    const a = r.action ?? {};
    const profile = { ...(p.profile ?? {}) };
    if (a.type === "pay_to_return") {
      // Paid penalty: participant is paused until they pay (USD, converted at live rate).
      if (profile.payment_lock?.active) continue; // don't stack while already locked
      const usd = Math.max(1, Number(a.value ?? 10));
      profile.payment_lock = { active: true, usd, rule_key: r.key ?? t.type, ref, reason: a.message ?? null, at: new Date().toISOString() };
      await supabase.from("challenge_participants").update({ profile }).eq("id", p.id);
      p.profile = profile;
      const custom = a.message ? { feedback: String(a.message).replace(/\{usd\}/g, String(usd)) } : {};
      await emitEvent(ch, p, "payment_required", key, { usd, day: String(ref).replace("day:", ""), ...custom });
      continue;
    }
    if (a.type === "lose_xp") profile.xp_penalty = Number(profile.xp_penalty ?? 0) + Number(a.value ?? 0);
    if (a.type === "reset_streak") profile.streak_reset_at_day = currentDayNumber(ch);
    if (a.type === "lose_xp" || a.type === "reset_streak") {
      await supabase.from("challenge_participants").update({ profile }).eq("id", p.id);
      p.profile = profile;
      await recalcParticipant(ch, p);
    }
    if (a.type === "lock_course" && Array.isArray(ch.eligible_course_ids) && ch.eligible_course_ids.length) {
      // Only when explicitly configured by an admin.
      await supabase.from("course_access_windows").update({ status: "locked" })
        .eq("user_id", p.user_id).in("course_id", a.course_ids ?? ch.eligible_course_ids).neq("status", "completed");
    }
    await emitEvent(ch, p, "penalty_applied", key, { feedback: a.message ?? "یک قانون جریمه چالش برای تو اعمال شد." });
  }
}

/* ---------------- metrics ---------------- */

export async function reportMetrics(ch: Challenge, p: Participant, input: { date?: string; leads?: number; conversations?: number; sales?: number; revenue?: number; note?: string }) {
  const date = input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? input.date : tehranDate();
  const row = {
    participant_id: p.id, challenge_id: ch.id, date,
    leads: Math.max(0, Math.floor(Number(input.leads) || 0)),
    conversations: Math.max(0, Math.floor(Number(input.conversations) || 0)),
    sales: Math.max(0, Math.floor(Number(input.sales) || 0)),
    revenue: Math.max(0, Number(input.revenue) || 0),
    note: input.note?.slice(0, 1000) ?? null,
  };
  await supabase.from("challenge_daily_metrics").upsert(row, { onConflict: "participant_id,date" });
  await supabase.from("challenge_participants").update({ last_activity_at: new Date().toISOString() }).eq("id", p.id);
  if (row.sales > 0 && !p.first_sale_at) {
    const at = new Date().toISOString();
    await supabase.from("challenge_participants").update({ first_sale_at: at }).eq("id", p.id);
    p.first_sale_at = at;
    await emitEvent(ch, p, "first_sale", "first_sale", {});
  }
  await processRewards(ch, p);
}

/* ---------------- participant sync ---------------- */

export async function syncParticipant(ch: Challenge, p: Participant, structure?: { days: any[]; variants: any[] }) {
  const s = structure ?? await loadStructure(ch.id);
  await ensureProgress(ch, p, s);
  const open = (ch as any).allow_late_submission ? [...OPEN, "missed"] : OPEN;
  const { data: rows } = await supabase.from("challenge_progress").select("*").eq("participant_id", p.id).in("status", open);
  const byId = new Map(s.days.map((d: any) => [d.id, d]));
  let completedAny = false;
  for (const r of rows ?? []) if ((await syncProgressRow(ch, p, r, byId.get(r.day_id))) === "completed") completedAny = true;
  if ((ch as any).unlock_next_on_complete) await ensureProgress(ch, p, s);
}
