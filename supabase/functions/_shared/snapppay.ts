// SnappPay client for Rafiei Academy.
// All calls go through the Rafiei payment proxy (public static IP 45.139.11.73)
// which is the only host whitelisted by SnappPay. Never call api.snapppay.ir
// directly from an Edge Function or the browser.

const DEFAULT_PROXY_URL = "https://rafeie.com/snappay/";

export function getProxyUrl(): string {
  const url = Deno.env.get("SNAPPPAY_PROXY_URL") || DEFAULT_PROXY_URL;
  return url.replace(/\/+$/, "") + "/";
}

function getProxySecret(): string {
  const secret = Deno.env.get("SNAPPPAY_PROXY_SECRET");
  if (!secret) throw new Error("SNAPPPAY_PROXY_SECRET is not configured");
  return secret;
}

export interface ProxyResult {
  status: number;
  ok: boolean;
  body: any;
}

async function proxyCall(
  route: string,
  method: "GET" | "POST",
  payload?: Record<string, unknown>,
  query?: Record<string, string>,
): Promise<ProxyResult> {
  const base = getProxyUrl();
  const url = new URL(base);
  url.searchParams.set("route", route);
  if (query) for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);

  let status = 0;
  let body: any = null;
  try {
    const res = await fetch(url.toString(), {
      method,
      headers: {
        "Authorization": `Bearer ${getProxySecret()}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: method === "POST" ? JSON.stringify(payload ?? {}) : undefined,
    });
    status = res.status;
    const text = await res.text();
    try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  } catch (e) {
    console.error(`[snapppay] proxy ${route} network error`, e);
    return { status: 0, ok: false, body: { successful: false, error: "proxy_network_error", message: String((e as any)?.message || e) } };
  }

  const ok = status >= 200 && status < 300 && body?.successful !== false;
  console.log(`[snapppay] ${route} -> http=${status} successful=${body?.successful}`);
  return { status, ok, body };
}

/** Toman -> Rial. Amounts are always computed server-side from the DB. */
export function tomanToRial(toman: number): number {
  return Math.round(Number(toman) * 10);
}

/** Normalize an Iranian mobile number to +989xxxxxxxxx. Returns null if not usable. */
export function normalizeMobile(phone?: string | null, countryCode?: string | null): string | null {
  if (!phone) return null;
  let digits = String(phone).replace(/[^\d+]/g, "");
  digits = digits.replace(/^\+/, "");
  if (digits.startsWith("0098")) digits = digits.slice(4);
  else if (digits.startsWith("98")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);

  // Non-Iranian numbers are not supported by SnappPay.
  const cc = (countryCode || "+98").replace(/[^\d]/g, "");
  if (cc && cc !== "98") return null;
  if (!/^9\d{9}$/.test(digits)) return null;
  return `+98${digits}`;
}

export function generateTransactionId(orderId: string): string {
  return `academy_${orderId}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export interface CartItem {
  name: string;
  count: number;
  amount: number;
  id: string;
  category: string;
}

export interface CreatePaymentInput {
  amountRial: number;
  returnURL: string;
  transactionId: string;
  mobile: string;
  cartId: string;
  items: CartItem[];
  discountAmount?: number;
}

export const snapppay = {
  eligibility: (amountRial: number) => proxyCall("eligibility", "POST", { amount: amountRial }),

  create: (input: CreatePaymentInput) =>
    proxyCall("create", "POST", {
      amount: input.amountRial,
      paymentMethodTypeDto: "INSTALLMENT",
      returnURL: input.returnURL,
      transactionId: input.transactionId,
      mobile: input.mobile,
      cartList: [
        {
          cartId: input.cartId,
          totalAmount: input.amountRial,
          cartItems: input.items,
          taxAmount: 0,
          shippingAmount: 0,
          isShipmentIncluded: false,
          isTaxIncluded: false,
        },
      ],
      discountAmount: input.discountAmount ?? 0,
    }),

  verify: (paymentToken: string) => proxyCall("verify", "POST", { paymentToken }),
  settle: (paymentToken: string) => proxyCall("settle", "POST", { paymentToken }),
  cancel: (paymentToken: string) => proxyCall("cancel", "POST", { paymentToken }),
  status: (paymentToken: string) => proxyCall("status", "GET", undefined, { paymentToken }),
};
