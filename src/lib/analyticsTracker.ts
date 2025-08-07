// Lightweight client-side analytics sender
// Sends pageviews to a public Edge Function using sendBeacon (fallback to fetch keepalive)

const EDGE_URL = "https://ihhetvwuhqohbfgkqoxw.supabase.co/functions/v1/track-analytics";
const SESSION_KEY = "an_session_id";
const SESSION_TS_KEY = "an_session_ts";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity -> new session

// requestIdleCallback polyfill
const ric: (cb: () => void) => void = (cb) => {
  if (typeof (window as any).requestIdleCallback === "function") {
    (window as any).requestIdleCallback(cb);
  } else {
    setTimeout(cb, 0);
  }
};

function genId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

function getSessionId() {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    const lastTsStr = localStorage.getItem(SESSION_TS_KEY);
    const now = Date.now();
    const lastTs = lastTsStr ? parseInt(lastTsStr, 10) : 0;
    if (stored && lastTs && now - lastTs < SESSION_TIMEOUT_MS) {
      localStorage.setItem(SESSION_TS_KEY, String(now));
      return stored;
    }
    const id = genId();
    localStorage.setItem(SESSION_KEY, id);
    localStorage.setItem(SESSION_TS_KEY, String(now));
    return id;
  } catch {
    // Fallback if storage blocked
    return genId();
  }
}

function getSource(url: URL, referrer: string) {
  const utm = url.searchParams.get("utm_source");
  if (utm) return utm;
  try {
    if (referrer) {
      const refUrl = new URL(referrer);
      return refUrl.hostname.replace("www.", "");
    }
  } catch {}
  return "direct";
}

function getDevice() {
  const ua = navigator.userAgent || "";
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || window.innerWidth < 768;
  return isMobile ? "mobile" : "desktop";
}

export function trackPageview(pathname?: string) {
  ric(() => {
    const url = new URL(window.location.href);
    const payload = {
      sessionId: getSessionId(),
      path: pathname || url.pathname + url.search,
      referrer: document.referrer || "",
      browser: navigator.userAgent,
      device: getDevice(),
      screenW: window.screen?.width || window.innerWidth,
      screenH: window.screen?.height || window.innerHeight,
      source: getSource(url, document.referrer || ""),
      eventType: "pageview",
      occurredAt: new Date().toISOString(),
    };

    try {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(EDGE_URL, blob);
      } else {
        // Fallback, keepalive avoids blocking unload
        fetch(EDGE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // swallow
    }
  });
}

export function initAnalytics() {
  // Fire first pageview slightly after first paint
  setTimeout(() => trackPageview(), 0);
}
