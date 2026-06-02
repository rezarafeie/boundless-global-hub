// Helper for Zarinpal API calls with optional proxy support.
// When `zarinpal_use_proxy` is enabled in admin_settings, requests are routed
// through `zarinpal_proxy_url` (an Iran-hosted reverse proxy) instead of going
// directly to api.zarinpal.com — Supabase edge runtime cannot reach Zarinpal
// from outside Iran.
//
// The proxy must accept the same path as Zarinpal (e.g. /pg/v4/payment/request.json)
// and forward the request body to https://api.zarinpal.com, returning the response unchanged.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ZARINPAL_BASE = "https://api.zarinpal.com";

let cachedProxy: { useProxy: boolean; proxyUrl: string | null; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 30_000;

async function getProxySetting(): Promise<{ useProxy: boolean; proxyUrl: string | null }> {
  if (cachedProxy && Date.now() - cachedProxy.fetchedAt < CACHE_TTL_MS) {
    return { useProxy: cachedProxy.useProxy, proxyUrl: cachedProxy.proxyUrl };
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data } = await supabase
      .from("admin_settings")
      .select("zarinpal_use_proxy, zarinpal_proxy_url")
      .eq("id", 1)
      .single();

    const useProxy = !!(data as any)?.zarinpal_use_proxy;
    const proxyUrl = ((data as any)?.zarinpal_proxy_url || "").toString().trim().replace(/\/$/, "") || null;

    cachedProxy = { useProxy, proxyUrl, fetchedAt: Date.now() };
    return { useProxy, proxyUrl };
  } catch (e) {
    console.error("Failed to read zarinpal proxy setting:", e);
    return { useProxy: false, proxyUrl: null };
  }
}

/**
 * Resolves the base URL for Zarinpal API calls (proxy or direct).
 * Pass a relative path like "/pg/v4/payment/request.json".
 */
export async function zarinpalFetch(path: string, init: RequestInit): Promise<Response> {
  const { useProxy, proxyUrl } = await getProxySetting();
  const base = useProxy && proxyUrl ? proxyUrl : ZARINPAL_BASE;
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  console.log(`[zarinpal] ${useProxy && proxyUrl ? "PROXY" : "DIRECT"} -> ${url}`);
  return fetch(url, init);
}
