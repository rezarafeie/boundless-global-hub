// Shared helpers for support-activation followups (used by cron + test function).
import { supabase } from "./supabase.ts";
import { sendMessage, tgCall } from "./telegram.ts";

export type Row = any;

export function render(tpl: string | null | undefined, vars: Record<string, string>): string {
  if (!tpl) return "";
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v ?? "").replaceAll(`{${k}}`, v ?? "");
  }
  return out;
}

export function minutesSince(iso: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  return (Date.now() - new Date(iso).getTime()) / 60000;
}

export async function logSend(
  row: Row,
  stage: number,
  channel: string,
  status: string,
  error?: string,
  payload?: any,
) {
  await supabase.from("support_activation_followup_log").insert({
    support_activation_id: row.id,
    course_id: row.course_id,
    user_id: row.user_id,
    stage,
    channel,
    status,
    error_message: error ?? null,
    payload: payload ?? null,
  });
}

export async function bumpCounter(row: Row, stage: number) {
  const patch: any = {
    last_followup_stage: stage,
    last_followup_sent_at: new Date().toISOString(),
  };
  patch[`followup_stage${stage}_sent_count`] = (row[`followup_stage${stage}_sent_count`] ?? 0) + 1;
  await supabase.from("support_activations").update(patch).eq("id", row.id);
}

const DEFAULT_KAVENEGAR_URL =
  "https://api.kavenegar.com/v1/{api_key}/verify/lookup.json?receptor={user_phone_number}&token={user_name}&token10={course_title}&template=welcomefollowup";

function normalizePhone(phone: string): string {
  return phone.replace(/^\+?98/, "0").replace(/[^0-9]/g, "");
}

// Send SMS: prefer template URL (Kavenegar lookup), fall back to plain send with body text
export async function sendSms(
  phone: string,
  bodyText: string,
  vars: Record<string, string>,
  templateUrl?: string | null,
): Promise<{ ok: boolean; error?: string; body?: any; url?: string }> {
  const key = Deno.env.get("KAVENEGAR_API_KEY");
  if (!key) return { ok: false, error: "KAVENEGAR_API_KEY missing" };
  const receptor = normalizePhone(phone);

  if (templateUrl && templateUrl.trim()) {
    // Substitute placeholders including api_key
    const substituted = render(templateUrl, {
      ...vars,
      api_key: key,
      user_phone_number: receptor,
      user_name: encodeURIComponent(vars.name ?? ""),
      course_title: encodeURIComponent(vars.course_title ?? ""),
      receptor,
    });
    try {
      const res = await fetch(substituted, { method: "GET" });
      const j = await res.json().catch(() => ({}));
      const ok = res.ok && j?.return?.status === 200;
      return { ok, error: ok ? undefined : `HTTP ${res.status} ${JSON.stringify(j)}`, body: j, url: substituted };
    } catch (e) {
      return { ok: false, error: String(e), url: substituted };
    }
  }

  // Fallback to plain SMS send
  const url = `https://api.kavenegar.com/v1/${key}/sms/send.json`;
  const body = new URLSearchParams({ receptor, message: bodyText }).toString();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const j = await res.json().catch(() => ({}));
    const ok = res.ok && j?.return?.status === 200;
    return { ok, error: ok ? undefined : `HTTP ${res.status} ${JSON.stringify(j)}`, body: j, url };
  } catch (e) {
    return { ok: false, error: String(e), url };
  }
}

// Gmail email (reuses gmail_credentials row)
let cachedAccessToken: { token: string; expires: number } | null = null;
async function getGmailAccessToken(): Promise<string | null> {
  if (cachedAccessToken && cachedAccessToken.expires > Date.now() + 60_000) return cachedAccessToken.token;
  const { data: creds } = await supabase.from("gmail_credentials").select("*").limit(1).single();
  if (!creds) return null;
  let accessToken = creds.access_token as string;
  const expiresAt = new Date(creds.token_expires_at).getTime();
  if (expiresAt <= Date.now() + 60_000) {
    const CLIENT_ID = "242349790411-gkb8upvjoo1rcmtiru50mb9tu32eqt4g.apps.googleusercontent.com";
    const CLIENT_SECRET = "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";
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: creds.refresh_token,
        grant_type: "refresh_token",
      }),
    });
    const j = await r.json();
    if (!r.ok) return null;
    accessToken = j.access_token;
    await supabase.from("gmail_credentials").update({
      access_token: accessToken,
      token_expires_at: new Date(Date.now() + j.expires_in * 1000).toISOString(),
    }).eq("id", creds.id);
  }
  cachedAccessToken = { token: accessToken, expires: Date.now() + 55 * 60_000 };
  return accessToken;
}

export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  senderName = "آکادمی رفیعی",
): Promise<{ ok: boolean; error?: string }> {
  const token = await getGmailAccessToken();
  if (!token) return { ok: false, error: "gmail not configured" };
  const raw = `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=\r\nTo: ${to}\r\nFrom: ${senderName} <me>\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${htmlBody}`;
  const b64 = btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: b64 }),
  });
  if (!res.ok) {
    const err = await res.text();
    return { ok: false, error: err };
  }
  return { ok: true };
}

// Build the full template variable map for a support_activations row.
// All keys are exposed to templates as {key} / {{key}} for both email, SMS and telegram.
export function buildVars(row: Row): Record<string, string> {
  const user = row.chat_users ?? {};
  const course = row.courses ?? {};
  const fullName = user.name ?? user.full_name ?? row.telegram_first_name ?? "";
  const firstName = user.first_name ?? (fullName ? String(fullName).split(" ")[0] : "");
  const lastName = user.last_name ?? (fullName ? String(fullName).split(" ").slice(1).join(" ") : "");
  const activationLink = row.support_prefilled_link || row.bot_deep_link || "";
  return {
    // user
    name: fullName,
    user_name: fullName,
    first_name: firstName,
    user_first_name: firstName,
    last_name: lastName,
    user_last_name: lastName,
    full_name: fullName,
    email: user.email ?? "",
    user_email: user.email ?? "",
    phone: user.phone ?? "",
    user_phone: user.phone ?? "",
    user_phone_number: user.phone ?? "",
    user_id: String(row.user_id ?? user.id ?? ""),
    // course
    course_title: course.title ?? "",
    course_slug: course.slug ?? "",
    course_id: String(course.id ?? row.course_id ?? ""),
    // enrollment / activation
    enrollment_id: String(row.enrollment_id ?? ""),
    activation_id: String(row.id ?? ""),
    activation_token: row.activation_token ?? "",
    activation_link: activationLink,
    activationlink: activationLink,
    support_link: activationLink,
    bot_deep_link: row.bot_deep_link ?? "",
  };
}

// ---------- Stage processors (return debug info; do NOT bump counter here) ----------
export async function runStage1(row: Row, opts: { isTest?: boolean } = {}) {
  const course = row.courses;
  const user = row.chat_users;
  const vars = buildVars(row);
  const email = user?.email;
  const phone = user?.phone;
  const emailSubject = render(course.support_followup_stage1_email_subject, vars);
  const emailBodyText = render(course.support_followup_stage1_email_body, vars);
  const emailHtml = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.9">${emailBodyText.replace(/\n/g, "<br/>")}</div>`;
  const smsText = render(course.support_followup_stage1_sms_text, vars);
  const templateUrl = course.support_followup_stage1_sms_template_url;

  const results: any[] = [];
  if (email && (emailBodyText || opts.isTest)) {
    const r = await sendEmail(email, emailSubject || "[TEST] followup", emailHtml || "[TEST] body");
    await logSend(row, 1, "email", r.ok ? "sent" : "failed", r.error, { to: email, subject: emailSubject, is_test: !!opts.isTest });
    results.push({ channel: "email", to: email, subject: emailSubject, ...r });
  } else {
    results.push({ channel: "email", skipped: true, reason: email ? "empty body" : "no email address" });
  }
  if (phone) {
    const r = await sendSms(phone, smsText, vars, templateUrl);
    await logSend(row, 1, "sms", r.ok ? "sent" : "failed", r.error, { to: phone, template_url: templateUrl, resolved_url: r.url, response: r.body, is_test: !!opts.isTest });
    results.push({ channel: "sms", to: phone, resolved_url: r.url, ...r });
  } else {
    results.push({ channel: "sms", skipped: true, reason: "no phone" });
  }
  return results;
}

export async function runStage2(row: Row, opts: { isTest?: boolean } = {}) {
  if (!row.telegram_id) {
    await logSend(row, 2, "telegram_bot", "failed", "no telegram_id", { is_test: !!opts.isTest });
    return [{ ok: false, error: "no telegram_id" }];
  }
  const vars = buildVars(row);
  const text = render(row.courses.support_followup_stage2_bot_text, vars) || "[TEST] followup";
  const res = await sendMessage(row.telegram_id, text, {
    keyboard: [[{ text: "✅ فعال‌سازی پشتیبانی", url: vars.activation_link }]],
    parse_mode: "HTML",
  });
  const ok = (res as any)?.ok !== false;
  await logSend(row, 2, "telegram_bot", ok ? "sent" : "failed", ok ? undefined : JSON.stringify(res), { chat_id: row.telegram_id, text, response: res, is_test: !!opts.isTest });
  return [{ ok, chat_id: row.telegram_id, text, response: res }];
}

export async function runStage3(row: Row, opts: { isTest?: boolean } = {}) {
  if (!row.telegram_id) {
    await logSend(row, 3, "telegram_business", "failed", "no telegram_id", { is_test: !!opts.isTest });
    return [{ ok: false, error: "no telegram_id" }];
  }
  const vars = buildVars(row);
  const text = render(row.courses.support_followup_stage3_business_text, vars) || "[TEST] followup";
  const { data: settings } = await supabase.from("admin_settings").select("telegram_business_connection_id" as any).eq("id", 1).maybeSingle();
  const bcid = (settings as any)?.telegram_business_connection_id;
  if (!bcid) {
    const error = "telegram_business_connection_id is not configured";
    await logSend(row, 3, "telegram_business", "failed", error, { chat_id: row.telegram_id, text, business: false, is_test: !!opts.isTest });
    return [{ ok: false, chat_id: row.telegram_id, text, business: false, error }];
  }
  const res = await tgCall("sendMessage", { chat_id: row.telegram_id, text, business_connection_id: bcid, parse_mode: "HTML" });
  const ok = (res as any)?.ok !== false;
  await logSend(row, 3, "telegram_business", ok ? "sent" : "failed", ok ? undefined : JSON.stringify(res), { chat_id: row.telegram_id, text, business: true, business_connection_id: bcid, response: res, is_test: !!opts.isTest });
  return [{ ok, chat_id: row.telegram_id, text, business: true, business_connection_id: bcid, response: res }];
}

// Custom (time-based, any channel) followup — independent of stage.
export async function runCustom(row: Row, cf: any, opts: { isTest?: boolean } = {}) {
  const vars = buildVars(row);
  const user = row.chat_users ?? {};
  const results: any[] = [];
  const logExtra = { custom_followup_id: cf.id, name: cf.name, is_test: !!opts.isTest };

  if (cf.channel === "email") {
    const email = user.email;
    if (!email) {
      await logSendCustom(row, cf, "email", "skipped", "no email", logExtra);
      return [{ channel: "email", skipped: true, reason: "no email" }];
    }
    const subject = render(cf.email_subject, vars) || "[TEST] followup";
    const bodyText = render(cf.email_body, vars) || "[TEST] body";
    const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.9">${bodyText.replace(/\n/g, "<br/>")}</div>`;
    const r = await sendEmail(email, subject, html);
    await logSendCustom(row, cf, "email", r.ok ? "sent" : "failed", r.error, { ...logExtra, to: email, subject });
    results.push({ channel: "email", to: email, subject, ...r });
  } else if (cf.channel === "sms") {
    const phone = user.phone;
    if (!phone) {
      await logSendCustom(row, cf, "sms", "skipped", "no phone", logExtra);
      return [{ channel: "sms", skipped: true, reason: "no phone" }];
    }
    const smsText = render(cf.sms_text, vars);
    const r = await sendSms(phone, smsText, vars, cf.sms_template_url);
    await logSendCustom(row, cf, "sms", r.ok ? "sent" : "failed", r.error, { ...logExtra, to: phone, resolved_url: r.url, response: r.body });
    results.push({ channel: "sms", to: phone, resolved_url: r.url, ...r });
  } else if (cf.channel === "bot") {
    if (!row.telegram_id) {
      await logSendCustom(row, cf, "telegram_bot", "failed", "no telegram_id", logExtra);
      return [{ channel: "bot", ok: false, error: "no telegram_id" }];
    }
    const text = render(cf.bot_text, vars) || "[TEST] followup";
    const kb = vars.activation_link ? { keyboard: [[{ text: "✅ فعال‌سازی پشتیبانی", url: vars.activation_link }]] } : {};
    const res = await sendMessage(row.telegram_id, text, { ...(kb as any), parse_mode: "HTML" });
    const ok = (res as any)?.ok !== false;
    await logSendCustom(row, cf, "telegram_bot", ok ? "sent" : "failed", ok ? undefined : JSON.stringify(res), { ...logExtra, chat_id: row.telegram_id, text, response: res });
    results.push({ channel: "bot", ok, chat_id: row.telegram_id, text, response: res });
  } else if (cf.channel === "business") {
    if (!row.telegram_id) {
      await logSendCustom(row, cf, "telegram_business", "failed", "no telegram_id", logExtra);
      return [{ channel: "business", ok: false, error: "no telegram_id" }];
    }
    const text = render(cf.bot_text, vars) || "[TEST] followup";
    const { data: settings } = await supabase.from("admin_settings").select("telegram_business_connection_id" as any).eq("id", 1).maybeSingle();
    const bcid = (settings as any)?.telegram_business_connection_id;
    if (!bcid) {
      const error = "telegram_business_connection_id is not configured";
      await logSendCustom(row, cf, "telegram_business", "failed", error, { ...logExtra, chat_id: row.telegram_id, text, business: false });
      results.push({ channel: "business", ok: false, chat_id: row.telegram_id, text, business: false, error });
      return results;
    }
    const res = await tgCall("sendMessage", { chat_id: row.telegram_id, text, business_connection_id: bcid, parse_mode: "HTML" });
    const ok = (res as any)?.ok !== false;
    await logSendCustom(row, cf, "telegram_business", ok ? "sent" : "failed", ok ? undefined : JSON.stringify(res), { ...logExtra, chat_id: row.telegram_id, text, business: true, business_connection_id: bcid, response: res });
    results.push({ channel: "business", ok, chat_id: row.telegram_id, text, business: true, business_connection_id: bcid, response: res });
  }
  return results;
}

async function logSendCustom(row: Row, cf: any, channel: string, status: string, error?: string, payload?: any) {
  await supabase.from("support_activation_followup_log").insert({
    support_activation_id: row.id,
    course_id: row.course_id,
    user_id: row.user_id,
    stage: 0,
    channel,
    status,
    error_message: error ?? null,
    payload: payload ?? null,
    custom_followup_id: cf.id,
  });
}

export async function bumpCustomCounter(row: Row, cf: any) {
  const counts = (row.custom_followup_sent_counts ?? {}) as Record<string, number>;
  counts[cf.id] = (counts[cf.id] ?? 0) + 1;
  await supabase.from("support_activations").update({
    custom_followup_sent_counts: counts,
    last_followup_sent_at: new Date().toISOString(),
  }).eq("id", row.id);
}

// Fetch custom followups for a course (cached in-memory per invocation)
export async function fetchCustomFollowups(courseIds: string[]) {
  if (!courseIds.length) return {} as Record<string, any[]>;
  const { data } = await supabase
    .from("support_activation_custom_followups")
    .select("*")
    .in("course_id", courseIds)
    .eq("enabled", true);
  const out: Record<string, any[]> = {};
  for (const r of (data ?? []) as any[]) {
    (out[r.course_id] ||= []).push(r);
  }
  return out;
}

export const SUPPORT_ACTIVATION_SELECT = `
  *,
  courses:course_id (
    id, title, slug,
    support_followup_enabled,
    support_followup_stage1_enabled,
    support_followup_stage2_enabled,
    support_followup_stage3_enabled,
    support_followup_stage1_delay_minutes,
    support_followup_stage2_delay_minutes,
    support_followup_stage3_delay_minutes,
    support_followup_stage1_repeat_delay_minutes,
    support_followup_stage2_repeat_delay_minutes,
    support_followup_stage3_repeat_delay_minutes,
    support_followup_max_repeats,
    support_followup_stage1_email_subject,
    support_followup_stage1_email_body,
    support_followup_stage1_sms_text,
    support_followup_stage1_sms_template_url,
    support_followup_stage2_bot_text,
    support_followup_stage3_business_text
  ),
  chat_users:user_id (id, name, first_name, last_name, full_name, email, phone)
`;
