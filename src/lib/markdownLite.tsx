import React from 'react';

/**
 * Minimal markdown renderer for AI outputs.
 * Supports: # ## ### headings, **bold**, *italic*, `code`, - / * lists, paragraphs, line breaks.
 * No external deps; safe-ish (no raw HTML passthrough).
 */

function renderInline(text: string, keyPrefix = ''): React.ReactNode[] {
  // Tokenize: **bold**, *italic*, `code`
  const out: React.ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2] !== undefined) {
      out.push(<strong key={`${keyPrefix}b${i}`}>{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      out.push(<em key={`${keyPrefix}i${i}`}>{m[3]}</em>);
    } else if (m[4] !== undefined) {
      out.push(<code key={`${keyPrefix}c${i}`} className="px-1 py-0.5 rounded bg-muted text-xs">{m[4]}</code>);
    }
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export const MarkdownLite: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  if (!text) return null;
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let listBuf: string[] = [];
  let paraBuf: string[] = [];

  const flushList = () => {
    if (!listBuf.length) return;
    blocks.push(
      <ul key={`ul${blocks.length}`} className="list-disc pr-5 space-y-1 my-2">
        {listBuf.map((li, idx) => <li key={idx}>{renderInline(li, `li${blocks.length}-${idx}-`)}</li>)}
      </ul>
    );
    listBuf = [];
  };
  const flushPara = () => {
    if (!paraBuf.length) return;
    blocks.push(
      <p key={`p${blocks.length}`} className="my-2 leading-loose">
        {paraBuf.map((l, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <br />}
            {renderInline(l, `p${blocks.length}-${idx}-`)}
          </React.Fragment>
        ))}
      </p>
    );
    paraBuf = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushPara(); flushList(); continue; }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    const li = /^[-*]\s+(.*)$/.exec(line);
    if (h) {
      flushPara(); flushList();
      const level = h[1].length;
      const content = renderInline(h[2], `h${blocks.length}-`);
      const cls = level === 1 ? 'text-xl font-bold mt-3 mb-2'
        : level === 2 ? 'text-lg font-bold mt-3 mb-1.5'
        : 'text-base font-semibold mt-2 mb-1';
      blocks.push(React.createElement(`h${Math.min(level + 1, 6)}`, { key: `h${blocks.length}`, className: cls }, content));
    } else if (li) {
      flushPara();
      listBuf.push(li[1]);
    } else {
      flushList();
      paraBuf.push(line);
    }
  }
  flushPara(); flushList();
  return <div className={className}>{blocks}</div>;
};

/** Strip markdown to plain text (for places that don't render JSX). */
export const stripMarkdown = (text: string): string =>
  (text ?? '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^[-*]\s+/gm, '• ');
