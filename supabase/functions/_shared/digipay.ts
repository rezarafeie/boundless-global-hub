// DigiPay client. All calls go through the Rafiei proxy on an Iranian host
// (rafeie.com/digipay) which holds the DigiPay OAuth credentials.
const DEFAULT_PROXY_URL = "https://rafeie.com/digipay/";

export function getDigipayProxyUrl(): string {
  return (Deno.env.get("DIGIPAY_PROXY_URL") || DEFAULT_PROXY_URL).replace(/\/+$/, "") + "/";
}

export interface DigipayResult { status: number; ok: boolean; body: any }

async function call(route: string, payload: Record<string, unknown>): Promise<DigipayResult> {
  const secret = Deno.env.get("DIGIPAY_PROXY_SECRET");
  if (!secret) throw new Error("DIGIPAY_PROXY_SECRET is not configured");
  const url = new URL(getDigipayProxyUrl());
  url.searchParams.set("route", route);
  try {
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let body: any; try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text.slice(0, 1000) }; }
    const ok = res.ok && Number(body?.result?.status ?? -1) === 0;
    console.log(`[digipay] ${route} http=${res.status} status=${body?.result?.status}`);
    return { status: res.status, ok, body };
  } catch (e) {
    console.error(`[digipay] ${route} network error`, e);
    return { status: 0, ok: false, body: { error: "proxy_network_error", message: String((e as any)?.message || e) } };
  }
}

/** Iranian mobile in the 09xxxxxxxxx form DigiPay expects; null if unusable. */
export function digipayMobile(phone?: string | null, countryCode?: string | null): string | null {
  if (!phone) return null;
  const cc = String(countryCode || "+98").replace(/\D/g, "");
  if (cc && cc !== "98") return null;
  let d = String(phone).replace(/\D/g, "");
  if (d.startsWith("0098")) d = d.slice(4); else if (d.startsWith("98")) d = d.slice(2); else if (d.startsWith("0")) d = d.slice(1);
  return /^9\d{9}$/.test(d) ? `0${d}` : null;
}

export const digipay = {
  ticket: (p: { amountRial: number; cellNumber: string; providerId: string; callbackUrl: string; productCode: string }) =>
    call("ticket", {
      amount: p.amountRial,
      cellNumber: p.cellNumber,
      providerId: p.providerId,
      callbackUrl: p.callbackUrl,
      basketDetailsDto: {
        basketId: p.providerId,
        items: [{ sellerId: 1, supplierId: 1, productCode: p.productCode, brand: "", productType: 1, count: 1, categoryId: "0" }],
      },
    }),
  verify: (trackingCode: string, providerId: string, type: string) =>
    call("verify", { trackingCode, providerId, type }),
};
