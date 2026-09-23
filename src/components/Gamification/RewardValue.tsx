import React, { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { openInNewTab } from '@/lib/utils';

interface Props {
  label?: string | null;
  value?: string | null;
  type?: string | null;
}

/** Shows the actual gift payload (discount code, link, credit) with copy support. */
const RewardValue: React.FC<Props> = ({ label, value, type }) => {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  const isLink = /^https?:\/\//i.test(value) || type === 'link' || type === 'file';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1.5">
      <span className="truncate text-xs font-bold text-primary" dir="ltr">
        {label || value}
      </span>
      {isLink ? (
        <button
          type="button"
          onClick={() => openInNewTab(value)}
          className="shrink-0 text-primary hover:opacity-80"
          aria-label="باز کردن هدیه"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={copy}
          className="shrink-0 text-primary hover:opacity-80"
          aria-label="کپی کد هدیه"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
};

export default RewardValue;
