// Helper for Rafiei Pay (pay.rafiei.co) HMAC-signed API calls.
// All amounts sent in Toman (amount_toman).
import { supabase } from "./supabase.ts";

const RAFIEIPAY_BASE = "https://buicdtvcecydwzornodw.supabase.co";
export const RAFIEIPAY_API_KEY = "rp_live_a745ffab1cb6aa856f06b6eb52fbcddb08dd64e88761edd3";

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
