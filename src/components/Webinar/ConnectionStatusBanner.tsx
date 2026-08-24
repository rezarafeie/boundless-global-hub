import React, { useEffect, useState } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import {
  subscribeWebinarConnection,
  reconnectWebinarBroadcast,
  type WebinarConnectionStatus,
} from '@/lib/webinarBroadcast';

interface Props {
  webinarId: string | undefined;
}

/**
 * Non-blocking realtime health indicator for the live page.
 * The video/iframe never depends on this — only chat & engagement do.
 * Reconnection is automatic (exponential backoff); the button forces it now.
 */
const ConnectionStatusBanner: React.FC<Props> = ({ webinarId }) => {
  const [status, setStatus] = useState<WebinarConnectionStatus>('connecting');
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!webinarId) return;
    return subscribeWebinarConnection(webinarId, setStatus);
  }, [webinarId]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // Avoid flashing the banner on brief hiccups — only show after 4s of trouble
  useEffect(() => {
    const degraded = !online || status !== 'connected';
    if (!degraded) {
      setVisible(false);
      return;
    }
    const t = window.setTimeout(() => setVisible(true), 4000);
    return () => window.clearTimeout(t);
  }, [online, status]);

  if (!visible) return null;

  return (
    <div
      dir="rtl"
      className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="h-3.5 w-3.5 shrink-0" />
        <span>
          {online
            ? 'ارتباط لحظه‌ای گفتگو موقتاً قطع شده است. پخش زنده ادامه دارد و اتصال به‌صورت خودکار برقرار می‌شود؛ ممنون از شکیبایی شما.'
            : 'اینترنت شما قطع شده است. پخش زنده به محض برقراری اتصال ادامه می‌یابد.'}
        </span>
      </div>
      <button
        type="button"
        onClick={() => webinarId && reconnectWebinarBroadcast(webinarId)}
        className="flex shrink-0 items-center gap-1 rounded-md border border-amber-500/40 px-2 py-1 hover:bg-amber-500/20"
      >
        <RefreshCw className="h-3 w-3" />
        تلاش مجدد
      </button>
    </div>
  );
};

export default ConnectionStatusBanner;
