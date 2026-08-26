// Helper for Rafiei Pay (pay.rafiei.co) HMAC-signed API calls.
// All amounts sent in Toman (amount_toman).
import { supabase } from "./supabase.ts";

const RAFIEIPAY_BASE = (Deno.env.get("RAFIEIPAY_URL") || "https://buicdtvcecydwzornodw.supabase.co").replace(/\/+$/, "");
export const RAFIEIPAY_API_KEY = Deno.env.get("RAFIEIPAY_API_KEY") ||
  "rp_live_a745ffab1cb6aa856f06b6eb52fbcddb08dd64e88761edd3";

export function getRafieipaySecret(): string {
  const secret = Deno.env.get("RAFIEIPAY_SECRET");
  if (!secret) throw new Error("RAFIEIPAY_SECRET is not configured");
  return secret;
}

function redact(value: string | undefined): string {
  if (!value) return "";
  if (value.length <= 12) return value.slice(0, 4) + "***";
  return value.slice(0, 8) + "***" + value.slice(-4);
}

async function sign(ts: string, rawBody: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${ts}.${rawBody}`));
  return Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface RafieipayCallResult {
  status: number;
  ok: boolean;
  body: any;
  errorCode?: string;
  errorMessage?: string;
}

export async function rafieipayFetch(
  path: string,
  body: object,
  opts?: { enrollmentId?: string },
): Promise<RafieipayCallResult> {
  const raw = JSON.stringify(body);
  const ts = Math.floor(Date.now() / 1000).toString();
  const signature = await sign(ts, raw, getRafieipaySecret());
  const url = `${RAFIEIPAY_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  console.log(`[rafieipay] -> ${url}`);

  const redactedHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-API-Key": redact(RAFIEIPAY_API_KEY),
    "X-Timestamp": ts,
    "X-Signature": redact(signature),
  };

  let status = 0;
  let json: any = null;
  let errorCode: string | undefined;
  let errorMessage: string | undefined;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-API-Key": RAFIEIPAY_API_KEY,
        "X-Timestamp": ts,
        "X-Signature": signature,
      },
      body: raw,
    });
    status = res.status;
    const text = await res.text();
    try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
    console.log(`[rafieipay] <- ${status}`, json);

    if (json && typeof json === "object") {
      errorCode = json?.error?.code || json?.code || (json?.success === false ? "unknown_error" : undefined);
      errorMessage = json?.error?.message || json?.message;
    }
  } catch (e: any) {
    errorCode = "network_error";
    errorMessage = String(e?.message || e);
    json = { error: { code: errorCode, message: errorMessage } };
    console.error(`[rafieipay] network error`, e);
  }

  const ok = status >= 200 && status < 300 && !errorCode;

  // Best-effort debug log insert (never throws)
  try {
    await supabase.from("rafieipay_debug_logs").insert({
      endpoint: path,
      request_payload: body as any,
      request_headers: redactedHeaders as any,
      response_status: status,
      response_body: json,
      error_code: errorCode || null,
      error_message: errorMessage || null,
      enrollment_id: opts?.enrollmentId || null,
      success: ok,
    });
  } catch (logErr) {
    console.error("[rafieipay] failed to write debug log", logErr);
  }

  return { status, ok, body: json, errorCode, errorMessage };
}

/**
 * Signed GET helper for Rafiei Pay read endpoints (e.g. /functions/v1/payments-get?id=...).
 * The HMAC is computed over `${ts}.` + empty body, matching the POST scheme.
 */
export async function rafieipayGet(
  path: string,
  query: Record<string, string> = {},
  opts?: { enrollmentId?: string },
): Promise<RafieipayCallResult> {
  const ts = Math.floor(Date.now() / 1000).toString();
  const signature = await sign(ts, "", getRafieipaySecret());
  const qs = new URLSearchParams(query).toString();
  const url = `${RAFIEIPAY_BASE}${path.startsWith("/") ? path : `/${path}`}${qs ? `?${qs}` : ""}`;
  console.log(`[rafieipay] GET -> ${url}`);

  let status = 0;
  let json: any = null;
  let errorCode: string | undefined;
  let errorMessage: string | undefined;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-API-Key": RAFIEIPAY_API_KEY,
        "X-Timestamp": ts,
        "X-Signature": signature,
      },
    });
    status = res.status;
    const text = await res.text();
    try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
    console.log(`[rafieipay] GET <- ${status}`, json);
    if (json && typeof json === "object") {
      errorCode = json?.error?.code || (json?.success === false ? "unknown_error" : undefined);
      errorMessage = json?.error?.message || json?.message;
    }
  } catch (e: any) {
    errorCode = "network_error";
    errorMessage = String(e?.message || e);
    json = { error: { code: errorCode, message: errorMessage } };
  }

  const ok = status >= 200 && status < 300 && !errorCode;

  try {
    await supabase.from("rafieipay_debug_logs").insert({
      endpoint: path,
      request_payload: query as any,
      request_headers: { "X-API-Key": redact(RAFIEIPAY_API_KEY), "X-Timestamp": ts, "X-Signature": redact(signature) } as any,
      response_status: status,
      response_body: json,
      error_code: errorCode || null,
      error_message: errorMessage || null,
      enrollment_id: opts?.enrollmentId || null,
      success: ok,
    });
  } catch (logErr) {
    console.error("[rafieipay] failed to write debug log", logErr);
  }

  return { status, ok, body: json, errorCode, errorMessage };
}

/** Normalize an Iranian mobile to 09xxxxxxxxx (SnappPay requirement). Returns undefined if invalid. */
export function normalizeIranMobile(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  let d = String(raw).replace(/\D/g, "");
  if (d.startsWith("0098")) d = d.slice(4);
  else if (d.startsWith("98") && d.length > 10) d = d.slice(2);
  if (d.length === 10 && d.startsWith("9")) d = `0${d}`;
  return /^09\d{9}$/.test(d) ? d : undefined;
}

export interface RafieipayCustomerInput {
  userId?: string | number | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  countryCode?: string | null;
  nationalId?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Build the `customer` object for /payments-request, enriching missing fields from
 * the platform's chat_users profile (matched by id, phone or email) so the hosted
 * checkout is pre-filled and never re-asks for data we already have.
 */
export async function buildRafieipayCustomer(input: RafieipayCustomerInput) {
  const clean = (v: unknown) => {
    const s = typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
    return s ? s : undefined;
  };

  let profile: any = null;
  try {
    const digits = String(input.phone || "").replace(/\D/g, "");
    const phoneVariants = new Set<string>();
    if (digits) {
      phoneVariants.add(digits);
      if (digits.startsWith("98")) phoneVariants.add(digits.slice(2)).add(`0${digits.slice(2)}`);
      if (digits.startsWith("0")) phoneVariants.add(digits.slice(1)).add(`98${digits.slice(1)}`);
      if (digits.startsWith("9") && digits.length === 10) phoneVariants.add(`0${digits}`).add(`98${digits}`);
    }

    const idNum = Number(input.userId);
    if (Number.isFinite(idNum) && idNum > 0) {
      const { data } = await supabase.from("chat_users").select("*").eq("id", idNum).maybeSingle();
      profile = data || null;
    }
    if (!profile && phoneVariants.size) {
      const { data } = await supabase
        .from("chat_users").select("*").in("phone", Array.from(phoneVariants)).limit(1);
      profile = data?.[0] || null;
    }
    if (!profile && clean(input.email)) {
      const { data } = await supabase
        .from("chat_users").select("*").ilike("email", clean(input.email)!).limit(1);
      profile = data?.[0] || null;
    }
  } catch (e) {
    console.error("[rafieipay] customer enrichment failed", e);
  }

  const firstName = clean(input.firstName) || clean(profile?.first_name);
  const lastName = clean(input.lastName) || clean(profile?.last_name);
  const fullName = clean(input.name) ||
    clean([firstName, lastName].filter(Boolean).join(" ")) ||
    clean(profile?.full_name) || clean(profile?.name);
  const email = clean(input.email) || clean(profile?.email);
  const rawPhone = clean(input.phone) || clean(profile?.phone);
  const phone = normalizeIranMobile(rawPhone) || rawPhone;
  const userId = clean(input.userId) || clean(profile?.id);

  const metadata: Record<string, unknown> = {
    ...(input.metadata || {}),
    platform: "rafiei-academy",
  };
  const countryCode = clean(input.countryCode) || clean(profile?.country_code);
  if (countryCode) metadata.country_code = countryCode;
  if (clean(profile?.username)) metadata.username = clean(profile?.username);
  if (clean(profile?.country)) metadata.country = clean(profile?.country);
  if (clean(profile?.telegram_chat_id)) metadata.telegram_chat_id = clean(profile?.telegram_chat_id);

  const customer: Record<string, unknown> = { metadata };
  if (userId) customer.user_id = userId;
  if (firstName) customer.first_name = firstName;
  if (lastName) customer.last_name = lastName;
  if (fullName) customer.name = fullName;
  if (email) customer.email = email;
  if (phone) customer.phone = phone;
  const nationalId = clean(input.nationalId);
  if (nationalId) customer.national_id = nationalId;

  return customer;
}
