// Convert basic markdown to Telegram-safe HTML (supports <b>, <i>, <code>, <pre>, <a>)
export function escapeHtml(s: string): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function markdownToTelegramHtml(input: string): string {
  if (!input) return '';
  // Process line by line so we can convert headings/lists without breaking inline rules
  const lines = input.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  for (let raw of lines) {
    let line = raw;
    // Headings: # / ## / ### -> bold line
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      line = h[2];
      // Escape, then wrap in <b>
      out.push(`<b>${escapeInline(line)}</b>`);
      continue;
    }
    // List item: - text / * text -> • text
    const li = /^\s*[-*]\s+(.*)$/.exec(line);
    if (li) {
      out.push(`• ${escapeInline(li[1])}`);
      continue;
    }
    out.push(escapeInline(line));
  }
  return out.join('\n');
}

function escapeInline(s: string): string {
  // Tokenize **bold** and *italic* and `code` BEFORE escaping, then escape rest.
  const parts: string[] = [];
  const regex = /(\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|`([^`\n]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(s))) {
    if (m.index > last) parts.push(escapeHtml(s.slice(last, m.index)));
    if (m[2] !== undefined) parts.push(`<b>${escapeHtml(m[2])}</b>`);
    else if (m[3] !== undefined) parts.push(`<i>${escapeHtml(m[3])}</i>`);
    else if (m[4] !== undefined) parts.push(`<code>${escapeHtml(m[4])}</code>`);
    last = m.index + m[0].length;
  }
  if (last < s.length) parts.push(escapeHtml(s.slice(last)));
  return parts.join('');
}
