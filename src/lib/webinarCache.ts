/**
 * Offline-first cache for the webinar live page.
 *
 * Goal: the live page shell + the video iframe must render with ZERO Supabase
 * round-trips. Once a viewer has opened the webinar (or the login page) the
 * essential metadata is persisted locally and reused instantly on every next
 * load; Supabase is refreshed in the background only.
 */

export interface CachedWebinar {
  id: string;
  title: string;
  slug: string;
  start_date: string;
  webinar_link: string;
  iframe_embed_code: string | null;
  status: string;
  host_name: string | null;
  description: string | null;
  allow_late_responses: boolean;
  chat_enabled: boolean;
  chat_mode: string;
}

const KEY = (slug: string) => `webinar_meta_${slug}`;
const PARTICIPANT_KEY = (webinarId: string) => `webinar_participant_${webinarId}`;

export function readCachedWebinar(slug: string | undefined): CachedWebinar | null {
  if (!slug) return null;
  try {
    const raw = localStorage.getItem(KEY(slug));
    return raw ? (JSON.parse(raw) as CachedWebinar) : null;
  } catch {
    return null;
  }
}

export function writeCachedWebinar(webinar: CachedWebinar) {
  try {
    localStorage.setItem(KEY(webinar.slug), JSON.stringify(webinar));
  } catch {
    /* storage full / private mode — non fatal */
  }
}

export function readCachedParticipant<T = any>(webinarId: string | undefined): T | null {
  if (!webinarId) return null;
  try {
    const raw = localStorage.getItem(PARTICIPANT_KEY(webinarId));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeCachedParticipant(webinarId: string, participant: unknown) {
  try {
    localStorage.setItem(PARTICIPANT_KEY(webinarId), JSON.stringify(participant));
  } catch {
    /* non fatal */
  }
}

export function clearCachedParticipant(webinarId: string) {
  try {
    localStorage.removeItem(PARTICIPANT_KEY(webinarId));
  } catch {
    /* non fatal */
  }
}

/** Extract the playable URL from an embed snippet without any network call. */
export function resolveIframeSrc(webinar: {
  iframe_embed_code: string | null;
  webinar_link: string;
}): string {
  if (webinar.iframe_embed_code) {
    const match = webinar.iframe_embed_code.match(/src=["']([^"']+)["']/);
    if (match) return match[1];
  }
  return webinar.webinar_link;
}

/**
 * Resolve any embed snippet (plain URL, <iframe>, <script>, <div>+<script>, …)
 * into something renderable with zero network round-trips.
 *  - `src`  → put directly on an <iframe src>
 *  - `html` → arbitrary HTML/JS, must run inside a sandboxed <iframe srcDoc>
 */
export function resolveWebinarEmbed(webinar: {
  iframe_embed_code: string | null;
  webinar_link: string;
}): { mode: 'src' | 'html'; value: string } {
  const code = (webinar.iframe_embed_code || '').trim();

  if (code) {
    const hasHtml = /<[a-z!/]/i.test(code);
    if (!hasHtml) {
      // Raw URL pasted in the embed field
      return { mode: 'src', value: code };
    }
    // A single plain <iframe> can be rendered natively (best perf + fullscreen)
    const isSingleIframe =
      /^<iframe[\s\S]*<\/iframe>$/i.test(code) || /^<iframe[^>]*\/?>$/i.test(code);
    const srcMatch = code.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
    if (isSingleIframe && srcMatch) {
      return { mode: 'src', value: srcMatch[1] };
    }
    // Anything else (script embeds, wrappers, players) → run it as HTML
    return { mode: 'html', value: code };
  }

  return { mode: 'src', value: webinar.webinar_link };
}

/** Wrap an arbitrary embed snippet into a full, responsive HTML document. */
export function buildEmbedDocument(snippet: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<base target="_blank" />
<style>
  html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden}
  body>*{max-width:100%}
  iframe,video,embed,object,canvas{position:absolute;inset:0;width:100%!important;height:100%!important;border:0}
</style></head>
<body>${snippet}</body></html>`;
}
