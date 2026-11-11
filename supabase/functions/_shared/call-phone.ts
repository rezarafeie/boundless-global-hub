export interface NormalizedPhone {
  raw: string
  normalized: string | null
  e164: string | null
}

/**
 * Normalizes Iranian and international numbers so that
 * 09123456789 / +989123456789 / 989123456789 / 00989123456789
 * all resolve to the same key: "989123456789".
 * Internal extensions (<= 6 digits) are returned as-is.
 */
export function normalizePhone(input?: string | null): NormalizedPhone {
  const raw = (input ?? '').toString().trim()
  if (!raw) return { raw, normalized: null, e164: null }

  let d = raw.replace(/[۰-۹]/g, c => String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g, c => String(c.charCodeAt(0)-1632)).replace(/[^0-9]/g, '')
  if (!d) return { raw, normalized: null, e164: null }

  // internal extension
  if (d.length <= 6) return { raw, normalized: d, e164: null }

  if (d.startsWith('0098')) d = '98' + d.slice(4)
  else if (d.startsWith('0') && d.length === 11) d = '98' + d.slice(1)
  else if (d.length === 10 && d.startsWith('9')) d = '98' + d
  else if (d.startsWith('00')) d = d.slice(2)

  // Iranian landline without country code e.g. 02112345678 handled above
  return { raw, normalized: d, e164: '+' + d }
}

/** Last 9 significant digits – used for fuzzy matching against stored records. */
export function phoneTail(input?: string | null, len = 9): string | null {
  const d = (input ?? '').replace(/[^0-9]/g, '')
  if (d.length < len) return null
  return d.slice(-len)
}

