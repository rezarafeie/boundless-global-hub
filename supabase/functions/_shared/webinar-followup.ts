// Shared helpers for webinar followups (used by cron + test function).
import { supabase } from "./supabase.ts";
import { sendMessage, tgCall } from "./telegram.ts";
import { render, sendEmail, sendSms } from "./support-followup.ts";

export type Followup = any;
export type Recipient = {
  phone: string;
  registered_at: string | null;
  attended_at: string | null;
  display_name?: string | null;
};

export const WEBINAR_KAVENEGAR_DEFAULT =
  "https://api.kavenegar.com/v1/{api_key}/verify/lookup.json?receptor={user_phone_number}&token={user_name}&token10={webinar_title}&template=welcomefollowup";

export function normalizePhone(phone: string): string {
  return String(phone ?? "").replace(/^\+?98/, "0").replace(/[^0-9]/g, "");
}

export function minutesSince(iso: string | null | undefined): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  return (Date.now() - new Date(iso).getTime()) / 60000;
}

export function buildWebinarVars(webinar: any, rec: Recipient, user: any | null): Record<string, string> {
  const fullName = user?.name ?? user?.full_name ?? rec.display_name ?? "";
  const firstName = user?.first_name ?? (fullName ? String(fullName).split(" ")[0] : "");
  const lastName = user?.last_name ?? (fullName ? String(fullName).split(" ").slice(1).join(" ") : "");
  const startDate = webinar?.start_date ? new Date(webinar.start_date) : null;
  const link = webinar?.slug ? `https://academy.rafiei.co/webinar/${webinar.slug}` : (webinar?.webinar_link ?? "");
  return {
    name: fullName,
    user_name: fullName,
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    email: user?.email ?? "",
    phone: rec.phone,
    user_phone: rec.phone,
    user_phone_number: rec.phone,
    user_id: String(user?.id ?? ""),
    webinar_title: webinar?.title ?? "",
    webinar_slug: webinar?.slug ?? "",
    webinar_id: String(webinar?.id ?? ""),
    webinar_link: link,
    webinar_host: webinar?.host_name ?? "",
    webinar_date: startDate
      ? startDate.toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" })
      : "",
    webinar_time: startDate
      ? startDate.toLocaleTimeString("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" })
      : "",
    telegram_channel: webinar?.telegram_channel_link ?? "",
  };
}

export async function logWebinarSend(
  fu: Followup,
  rec: Recipient,
  userId: number | null,
  channel: string,
  status: string,
  error?: string,
  payload?: any,
) {
  await supabase.from("webinar_followup_log").insert({
    followup_id: fu.id,
    webinar_id: fu.webinar_id,
    phone: rec.phone,
    user_id: userId,
    channel,
    status,
    error_message: error ?? null,
    payload: payload ?? null,
  });
}

export async function bumpWebinarRecipient(fu: Followup, rec: Recipient, current: number) {
  await supabase.from("webinar_followup_recipients").upsert({
    followup_id: fu.id,
    webinar_id: fu.webinar_id,
    phone: rec.phone,
    sent_count: current + 1,
    last_sent_at: new Date().toISOString(),
  }, { onConflict: "followup_id,phone" });
}

// Run one followup for one recipient. Returns { ok, results } — ok means "counts as delivered attempt".
export async function runWebinarFollowup(
  fu: Followup,
  webinar: any,
  rec: Recipient,
  user: any | null,
  opts: { isTest?: boolean } = {},
): Promise<{ ok: boolean; results: any[] }> {
  const vars = buildWebinarVars(webinar, rec, user);
  const userId = user?.id ?? null;
  const logExtra = { is_test: !!opts.isTest, followup_name: fu.name, audience: fu.audience };
  const results: any[] = [];

  if (fu.channel === "email") {
    const to = user?.email;
    if (!to) {
      await logWebinarSend(fu, rec, userId, "email", "unreachable", "no email address", logExtra);
      return { ok: true, results: [{ channel: "email", ok: false, unreachable: true, reason: "no email address" }] };
    }
    const subject = render(fu.email_subject, vars) || "[TEST] webinar followup";
    const bodyText = render(fu.email_body, vars) || "[TEST] body";
    const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.9">${bodyText.replace(/\n/g, "<br/>")}</div>`;
    const r = await sendEmail(to, subject, html);
    await logWebinarSend(fu, rec, userId, "email", r.ok ? "sent" : "failed", r.error, { ...logExtra, to, subject });
    results.push({ channel: "email", to, subject, ...r });
    return { ok: r.ok, results };
  }

  if (fu.channel === "sms") {
    const text = render(fu.sms_text, vars);
    const templateUrl = fu.sms_template_url || WEBINAR_KAVENEGAR_DEFAULT;
    const r = await sendSms(rec.phone, text, vars, templateUrl);
    await logWebinarSend(fu, rec, userId, "sms", r.ok ? "sent" : "failed", r.error, {
      ...logExtra, to: rec.phone, template_url: templateUrl, resolved_url: r.url, response: r.body,
    });
    results.push({ channel: "sms", to: rec.phone, resolved_url: r.url, ...r });
    return { ok: r.ok, results };
  }

  // Telegram channels need a linked telegram chat id
  const chatId = user?.telegram_chat_id;
  if (!chatId) {
    const ch = fu.channel === "business" ? "telegram_business" : "telegram_bot";
    await logWebinarSend(fu, rec, userId, ch, "unreachable", "no linked telegram account", logExtra);
    return { ok: true, results: [{ channel: ch, ok: false, unreachable: true, reason: "no linked telegram account" }] };
  }

  const text = render(fu.bot_text, vars) || "[TEST] webinar followup";
  const kb = vars.webinar_link ? [[{ text: "🎥 ورود به وبینار", url: vars.webinar_link }]] : undefined;

  if (fu.channel === "bot") {
    const res = await sendMessage(chatId, text, { keyboard: kb as any, parse_mode: "HTML" });
    const ok = (res as any)?.ok !== false;
    const errStr = ok ? "" : JSON.stringify(res);
    const permanent = !ok && /chat not found|bot was blocked|user is deactivated|PEER_ID_INVALID|Forbidden/i.test(errStr);
    await logWebinarSend(fu, rec, userId, "telegram_bot", ok ? "sent" : (permanent ? "unreachable" : "failed"), ok ? undefined : errStr, { ...logExtra, chat_id: chatId, text, response: res });
    results.push({ channel: "bot", ok, unreachable: permanent, chat_id: chatId, text, response: res });
    return { ok: ok || permanent, results };
  }

  // business
  const { data: settings } = await supabase
    .from("admin_settings")
    .select("telegram_business_connection_id" as any)
    .eq("id", 1)
    .maybeSingle();
  const bcid = (settings as any)?.telegram_business_connection_id;
  let res: any = null;
  if (bcid) {
    res = await tgCall("sendMessage", { chat_id: chatId, text, business_connection_id: bcid, parse_mode: "HTML" });
  }
  const ok = res?.ok === true;
  if (ok) {
    await logWebinarSend(fu, rec, userId, "telegram_business", "sent", undefined, { ...logExtra, chat_id: chatId, text, business_connection_id: bcid, response: res });
    return { ok: true, results: [{ channel: "business", ok: true, chat_id: chatId, text, response: res }] };
  }
  const err = bcid ? JSON.stringify(res) : "telegram_business_connection_id is not configured";
  const permanent = /BUSINESS_PEER_USAGE_MISSING|PEER_ID_INVALID|must not be sent to self|bot was blocked|user is deactivated|chat not found|Forbidden/i.test(err);
  await logWebinarSend(fu, rec, userId, "telegram_business", permanent ? "unreachable" : "failed", err, { ...logExtra, chat_id: chatId, text, business_connection_id: bcid, response: res, fallback_to_bot: false });
  return { ok: permanent, results: [{ channel: "business", ok: false, unreachable: permanent, chat_id: chatId, text, error: err }] };
}

// Collect recipients for a webinar matching an audience.
export async function collectRecipients(webinarId: string, audience: string): Promise<Recipient[]> {
  const regs = new Map<string, string | null>(); // phone -> registered_at
  const atts = new Map<string, { at: string | null; name: string | null }>();

  const pageAll = async (table: string, cols: string) => {
    const out: any[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase.from(table).select(cols).eq("webinar_id", webinarId).range(from, from + 999);
      if (error) throw error;
      const batch = (data as any[]) ?? [];
      out.push(...batch);
      if (batch.length < 1000) break;
      from += 1000;
      if (from >= 50000) break;
    }
    return out;
  };

  for (const r of await pageAll("webinar_registrations", "mobile_number, registered_at")) {
    const p = normalizePhone(r.mobile_number);
    if (p) regs.set(p, r.registered_at ?? null);
  }
  for (const r of await pageAll("webinar_signups", "mobile_number, signup_time")) {
    const p = normalizePhone(r.mobile_number);
    if (p && !regs.has(p)) regs.set(p, r.signup_time ?? null);
  }
  for (const r of await pageAll("webinar_participants", "phone, joined_at, display_name")) {
    const p = normalizePhone(r.phone);
    if (p) atts.set(p, { at: r.joined_at ?? null, name: r.display_name ?? null });
  }

  const phones = new Set<string>([...regs.keys(), ...atts.keys()]);
  const list: Recipient[] = [];
  for (const phone of phones) {
    const attended = atts.get(phone);
    const rec: Recipient = {
      phone,
      registered_at: regs.get(phone) ?? null,
      attended_at: attended?.at ?? null,
      display_name: attended?.name ?? null,
    };
    if (audience === "registered" && !regs.has(phone)) continue;
    if (audience === "attended" && !attended) continue;
    if (audience === "registered_not_attended" && (!regs.has(phone) || attended)) continue;
    list.push(rec);
  }
  return list;
}

// Match phones to chat_users (batched)
export async function fetchUsersByPhones(phones: string[]): Promise<Record<string, any>> {
  const out: Record<string, any> = {};
  const variants = new Map<string, string>(); // variant -> normalized
  for (const p of phones) {
    variants.set(p, p);
    variants.set(`+98${p.replace(/^0/, "")}`, p);
    variants.set(`98${p.replace(/^0/, "")}`, p);
    variants.set(p.replace(/^0/, ""), p);
  }
  const all = Array.from(variants.keys());
  for (let i = 0; i < all.length; i += 500) {
    const chunk = all.slice(i, i + 500);
    const { data } = await supabase
      .from("chat_users")
      .select("id, name, full_name, first_name, last_name, email, phone, telegram_chat_id")
      .in("phone", chunk);
    for (const u of ((data as any[]) ?? [])) {
      const norm = normalizePhone(u.phone);
      if (norm && (!out[norm] || (!out[norm].telegram_chat_id && u.telegram_chat_id))) out[norm] = u;
    }
  }
  return out;
}

// Compute the anchor timestamp for a followup and recipient.
export function anchorTime(fu: Followup, webinar: any, rec: Recipient): string | null {
  if (fu.anchor === "webinar_start") return webinar?.start_date ?? null;
  if (fu.anchor === "attendance") return rec.attended_at;
  return rec.registered_at;
}

// ---------------------------------------------------------------------------
// Adaptive scheduling: distribute the remaining followups across the time left
// until the webinar starts. The closer the webinar, the tighter the spacing.
// ---------------------------------------------------------------------------

const TEHRAN_OFFSET_MIN = 210; // UTC+3:30

function tehranHour(d: Date): number {
  return new Date(d.getTime() + TEHRAN_OFFSET_MIN * 60000).getUTCHours();
}

// Push a timestamp out of the configured quiet hours (Tehran local hours).
export function applyQuietHours(d: Date, start: number | null | undefined, end: number | null | undefined): Date {
  if (start == null || end == null || start === end) return d;
  let out = new Date(d.getTime());
  for (let i = 0; i < 48; i++) {
    const h = tehranHour(out);
    const inQuiet = start < end ? (h >= start && h < end) : (h >= start || h < end);
    if (!inQuiet) return out;
    out = new Date(out.getTime() + 60 * 60000); // step forward one hour
  }
  return out;
}

export type AdaptiveSlot = { id: string; at: Date; index: number };

/**
 * @param remaining followups still pending for this recipient, in intended order
 * @param webinarStart webinar start timestamp
 * @param anchor recipient anchor (registration time)
 */
export function adaptiveSchedule(
  remaining: Followup[],
  webinarStart: string | null | undefined,
  anchor: string | null | undefined,
  now: Date = new Date(),
): AdaptiveSlot[] {
  if (!remaining.length || !webinarStart) return [];
  const startTs = Math.max(anchor ? new Date(anchor).getTime() : now.getTime(), now.getTime());
  const leadMin = Math.max(0, ...remaining.map((f) => f.final_lead_minutes ?? 15));
  const endTs = new Date(webinarStart).getTime() - leadMin * 60000;
  const availableMin = (endTs - startTs) / 60000;
  if (availableMin <= 0) return [];

  const minInterval = Math.max(1, ...remaining.map((f) => f.min_interval_minutes ?? 30));
  const n = remaining.length;
  const step = n > 1 ? availableMin / (n - 1) : availableMin;

  let selected = remaining;
  let slots: number[] = [];

  if (step >= minInterval) {
    // First pending message goes out immediately, the rest are spread across
    // the remaining window (last one lands at endTs).
    slots = remaining.map((_, i) => (n === 1 ? startTs : startTs + step * i * 60000));
  } else {
    // Not enough room: keep the highest-priority ones (lower number = higher priority)
    const capacity = Math.max(1, Math.min(n, Math.floor(availableMin / minInterval) + 1));
    const byPriority = [...remaining]
      .map((f, i) => ({ f, i }))
      .sort((a, b) => ((a.f.priority ?? 100) - (b.f.priority ?? 100)) || (a.i - b.i))
      .slice(0, capacity)
      .sort((a, b) => a.i - b.i);
    selected = byPriority.map((x) => x.f);
    const k = selected.length;
    slots = selected.map((_, i) => endTs - (k - 1 - i) * minInterval * 60000);
  }

  return selected.map((f, i) => {
    let at = applyQuietHours(new Date(slots[i]), f.quiet_hours_start, f.quiet_hours_end);
    if (at.getTime() > endTs) at = new Date(endTs);
    return { id: f.id, at, index: i };
  });
}

// Is this followup allowed to fire right now under adaptive rules?
export function adaptiveDue(
  fu: Followup,
  remaining: Followup[],
  webinar: any,
  rec: Recipient,
  now: Date = new Date(),
): { due: boolean; at: Date | null } {
  if ((fu.do_not_send_after_webinar_start ?? true) && webinar?.start_date && new Date(webinar.start_date).getTime() <= now.getTime()) {
    return { due: false, at: null };
  }
  const anchor = rec.registered_at ?? rec.attended_at ?? null;
  const plan = adaptiveSchedule(remaining, webinar?.start_date, anchor, now);
  const slot = plan.find((s) => s.id === fu.id);
  if (!slot) return { due: false, at: null };
  return { due: slot.at.getTime() <= now.getTime(), at: slot.at };
}
