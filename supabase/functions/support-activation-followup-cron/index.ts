// Support Activation Followup cron
// Runs every ~5 minutes via pg_cron. Processes 3 stages:
//   Stage 1: purchased, never opened bot  -> Email + SMS
//   Stage 2: opened bot, no support click -> Telegram bot message
//   Stage 3: clicked support, not activated -> Telegram bot DM (business-style)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";
import { sendMessage, tgCall } from "../_shared/telegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Row = any;

function render(tpl: string | null | undefined, vars: Record<string, string>): string {
  if (!tpl) return "";
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v ?? "").replaceAll(`{${k}}`, v ?? "");
  }
  return out;
}

function minutesSince(iso: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  return (Date.now() - new Date(iso).getTime()) / 60000;
}

async function logSend(row: Row, stage: number, channel: string, status: string, error?: string, payload?: any) {
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

async function bumpCounter(row: Row, stage: number) {
  const patch: any = {
    last_followup_stage: stage,
    last_followup_sent_at: new Date().toISOString(),
  };
  patch[`followup_stage${stage}_sent_count`] = (row[`followup_stage${stage}_sent_count`] ?? 0) + 1;
  await supabase.from("support_activations").update(patch).eq("id", row.id);
}

// ---------- Kavenegar SMS ----------
async function sendSms(phone: string, text: string): Promise<{ ok: boolean; error?: string; body?: any }> {
  const key = Deno.env.get("KAVENEGAR_API_KEY");
  if (!key) return { ok: false, error: "KAVENEGAR_API_KEY missing" };
  const receptor = phone.replace(/^\+?98/, "0").replace(/[^0-9]/g, "");
  const url = `https://api.kavenegar.com/v1/${key}/sms/send.json`;
  const body = new URLSearchParams({ receptor, message: text }).toString();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || j?.return?.status !== 200) {
      return { ok: false, error: `HTTP ${res.status} ${JSON.stringify(j)}`, body: j };
    }
    return { ok: true, body: j };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ---------- Gmail email (reuses gmail_credentials row) ----------
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

async function sendEmail(to: string, subject: string, htmlBody: string, senderName = "آکادمی رفیعی"): Promise<{ ok: boolean; error?: string }> {
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

// ---------- Main ----------
async function processStage1(row: Row) {
  const course = row.courses;
  const user = row.chat_users;
  const vars = {
    name: user?.name ?? user?.first_name ?? "",
    course_title: course?.title ?? "",
  };
  const email = user?.email;
  const phone = user?.phone;
  const emailSubject = render(course.support_followup_stage1_email_subject, vars);
  const emailBodyText = render(course.support_followup_stage1_email_body, vars);
  const emailHtml = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.9">${emailBodyText.replace(/\n/g, "<br/>")}</div>`;
  const smsText = render(course.support_followup_stage1_sms_text, vars);

  const results: any[] = [];
  if (email && emailBodyText) {
    const r = await sendEmail(email, emailSubject, emailHtml);
    await logSend(row, 1, "email", r.ok ? "sent" : "failed", r.error, { to: email, subject: emailSubject });
    results.push({ channel: "email", ...r });
  }
  if (phone && smsText) {
    const r = await sendSms(phone, smsText);
    await logSend(row, 1, "sms", r.ok ? "sent" : "failed", r.error, { to: phone });
    results.push({ channel: "sms", ...r });
  }
  await bumpCounter(row, 1);
  return results;
}

async function processStage2(row: Row) {
  if (!row.telegram_id) return [{ ok: false, error: "no telegram_id" }];
  const vars = {
    name: row.chat_users?.name ?? row.telegram_first_name ?? "",
    course_title: row.courses?.title ?? "",
  };
  const text = render(row.courses.support_followup_stage2_bot_text, vars);
  const res = await sendMessage(row.telegram_id, text, {
    keyboard: [[{ text: "✅ فعال‌سازی پشتیبانی", url: row.support_prefilled_link || row.bot_deep_link }]],
    parse_mode: "HTML",
  });
  const ok = (res as any)?.ok !== false;
  await logSend(row, 2, "telegram_bot", ok ? "sent" : "failed", ok ? undefined : JSON.stringify(res), { chat_id: row.telegram_id });
  await bumpCounter(row, 2);
  return [{ ok }];
}

async function processStage3(row: Row) {
  if (!row.telegram_id) return [{ ok: false, error: "no telegram_id" }];
  const vars = {
    name: row.chat_users?.name ?? row.telegram_first_name ?? "",
    course_title: row.courses?.title ?? "",
  };
  const text = render(row.courses.support_followup_stage3_business_text, vars);
  // Try business connection if configured on admin_settings, else fallback to bot DM
  const { data: settings } = await supabase.from("admin_settings").select("telegram_business_connection_id" as any).eq("id", 1).maybeSingle();
  const bcid = (settings as any)?.telegram_business_connection_id;
  let res: any;
  if (bcid) {
    res = await tgCall("sendMessage", { chat_id: row.telegram_id, text, business_connection_id: bcid });
  } else {
    res = await sendMessage(row.telegram_id, text, { parse_mode: "HTML" });
  }
  const ok = (res as any)?.ok !== false;
  await logSend(row, 3, bcid ? "telegram_business" : "telegram_bot_dm", ok ? "sent" : "failed", ok ? undefined : JSON.stringify(res), { chat_id: row.telegram_id, business: !!bcid });
  await bumpCounter(row, 3);
  return [{ ok }];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { data: rows, error } = await supabase
      .from("support_activations")
      .select(`
        *,
        courses:course_id (
          id, title, slug,
          support_followup_enabled,
          support_followup_stage1_delay_minutes,
          support_followup_stage2_delay_minutes,
          support_followup_stage3_delay_minutes,
          support_followup_max_repeats,
          support_followup_stage1_email_subject,
          support_followup_stage1_email_body,
          support_followup_stage1_sms_text,
          support_followup_stage2_bot_text,
          support_followup_stage3_business_text
        ),
        chat_users:user_id (id, name, first_name, email, phone)
      `)
      .neq("status", "activated")
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) throw error;

    const summary: any[] = [];
    for (const row of rows ?? []) {
      const course = row.courses;
      if (!course?.support_followup_enabled) continue;
      const maxRepeats = course.support_followup_max_repeats ?? 2;

      // Determine current stage from status
      let stage: 1 | 2 | 3 | null = null;
      let elapsedMin = 0;
      let delayMin = 0;
      let sentCount = 0;

      if (row.status === "not_started" || (!row.opened_bot_at && !row.clicked_support_button_at)) {
        stage = 1;
        elapsedMin = minutesSince(row.created_at);
        delayMin = course.support_followup_stage1_delay_minutes ?? 60;
        sentCount = row.followup_stage1_sent_count ?? 0;
      } else if (row.opened_bot_at && !row.clicked_support_button_at) {
        stage = 2;
        elapsedMin = minutesSince(row.opened_bot_at);
        delayMin = course.support_followup_stage2_delay_minutes ?? 60;
        sentCount = row.followup_stage2_sent_count ?? 0;
      } else if (row.clicked_support_button_at && row.status !== "activated") {
        stage = 3;
        elapsedMin = minutesSince(row.clicked_support_button_at);
        delayMin = course.support_followup_stage3_delay_minutes ?? 180;
        sentCount = row.followup_stage3_sent_count ?? 0;
      }

      if (!stage) continue;
      if (sentCount >= maxRepeats) continue;
      // Require elapsed >= (sentCount + 1) * delay so repeats are spaced
      const required = (sentCount + 1) * delayMin;
      if (elapsedMin < required) continue;

      try {
        let result: any[] = [];
        if (stage === 1) result = await processStage1(row);
        else if (stage === 2) result = await processStage2(row);
        else if (stage === 3) result = await processStage3(row);
        summary.push({ id: row.id, stage, result });
      } catch (e) {
        console.error("followup send failed", row.id, e);
        summary.push({ id: row.id, stage, error: String(e) });
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: summary.length, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cron error", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
