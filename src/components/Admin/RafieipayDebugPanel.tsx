import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DebugLog {
  id: string;
  created_at: string;
  endpoint: string;
  request_payload: any;
  request_headers: any;
  response_status: number | null;
  response_body: any;
  error_code: string | null;
  error_message: string | null;
  enrollment_id: string | null;
  success: boolean;
}

const RafieipayDebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rafieipay_debug_logs' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (!error && data) setLogs(data as any);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmt = (d: string) =>
    new Date(d).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' });

  return (
    <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">دیباگ درگاه رفیعی پی</h4>
          <p className="text-xs text-muted-foreground">آخرین ۱۰ درخواست/پاسخ (کلیدها مخفی شده‌اند)</p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ml-1 ${loading ? 'animate-spin' : ''}`} />
          بازخوانی
        </Button>
      </div>

      {logs.length === 0 && (
        <div className="text-xs text-muted-foreground text-center py-4">
          هنوز لاگی ثبت نشده است. پس از اولین تلاش پرداخت، اینجا نمایش داده می‌شود.
        </div>
      )}

      <div className="space-y-2">
        {logs.map((log) => {
          const isOpen = expanded === log.id;
          return (
            <div key={log.id} className="border rounded-md bg-background">
              <button
                onClick={() => setExpanded(isOpen ? null : log.id)}
                className="w-full flex items-center justify-between p-3 text-right"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {log.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-xs font-mono">{log.endpoint}</span>
                  <Badge variant={log.success ? 'default' : 'destructive'} className="text-[10px]">
                    {log.response_status || '—'}
                  </Badge>
                  {log.error_code && (
                    <Badge variant="outline" className="text-[10px] border-destructive text-destructive">
                      {log.error_code}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{fmt(log.created_at)}</span>
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t p-3 space-y-3 text-xs">
                  {log.error_message && (
                    <div className="p-2 rounded bg-destructive/10 text-destructive">
                      <strong>پیام خطا:</strong> {log.error_message}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold mb-1">Request Headers (redacted)</div>
                    <pre className="bg-muted p-2 rounded overflow-auto text-[10px] max-h-40" dir="ltr">
{JSON.stringify(log.request_headers, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Request Body</div>
                    <pre className="bg-muted p-2 rounded overflow-auto text-[10px] max-h-40" dir="ltr">
{JSON.stringify(log.request_payload, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Response</div>
                    <pre className="bg-muted p-2 rounded overflow-auto text-[10px] max-h-60" dir="ltr">
{JSON.stringify(log.response_body, null, 2)}
                    </pre>
                  </div>
                  {log.enrollment_id && (
                    <div className="text-muted-foreground">
                      Enrollment ID: <span className="font-mono">{log.enrollment_id}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RafieipayDebugPanel;
