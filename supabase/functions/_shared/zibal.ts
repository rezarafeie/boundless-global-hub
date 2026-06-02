// Helper for Zibal IPG API calls.
// Zibal docs: https://gateway.zibal.ir
// Amounts are in Rial (Toman × 10). Successful result code is 100.

const ZIBAL_BASE = "https://gateway.zibal.ir";

export function getZibalMerchant(): string {
  // Falls back to the public test merchant `zibal` if no secret is set.
  return Deno.env.get("ZIBAL_MERCHANT") || "zibal";
}

export async function zibalFetch(path: string, init: RequestInit): Promise<Response> {
  const url = `${ZIBAL_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  console.log(`[zibal] -> ${url}`);
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  return await fetch(url, { ...init, headers });
}

export function zibalStartUrl(trackId: number | string) {
  return `${ZIBAL_BASE}/start/${trackId}`;
}
