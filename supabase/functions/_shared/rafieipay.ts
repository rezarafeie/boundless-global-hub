// Helper for Rafiei Pay (pay.rafiei.co) HMAC-signed API calls.
// All amounts sent in Toman (amount_toman).

const RAFIEIPAY_BASE = "https://buicdtvcecydwzornodw.supabase.co";
export const RAFIEIPAY_API_KEY = "rp_live_a745ffab1cb6aa856f06b6eb52fbcddb08dd64e88761edd3";

export function getRafieipaySecret(): string {
  const secret = Deno.env.get("RAFIEIPAY_SECRET");
  if (!secret) throw new Error("RAFIEIPAY_SECRET is not configured");
  return secret;
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

export async function rafieipayFetch(path: string, body: object): Promise<any> {
  const raw = JSON.stringify(body);
  const ts = Math.floor(Date.now() / 1000).toString();
  const signature = await sign(ts, raw, getRafieipaySecret());
  const url = `${RAFIEIPAY_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  console.log(`[rafieipay] -> ${url}`);
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
  const text = await res.text();
  let json: any;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  console.log(`[rafieipay] <- ${res.status}`, json);
  return json;
}
