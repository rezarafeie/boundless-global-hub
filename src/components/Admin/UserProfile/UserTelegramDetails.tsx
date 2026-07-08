import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, RefreshCw, Send, Inbox, FileText, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  userId: number;
  telegramChatId?: number | null;
  telegramUsername?: string | null;
  telegramLinkedAt?: string | null;
}

const fmt = (v?: string | null) => (v ? format(new Date(v), 'yyyy-MM-dd HH:mm') : '—');

export const UserTelegramDetails: React.FC<Props> = ({
  userId,
  telegramChatId: initialChatId,
  telegramUsername,
  telegramLinkedAt,
}) => {
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<number | null>(initialChatId ?? null);
  const [username, setUsername] = useState<string | null>(telegramUsername ?? null);
  const [linkedAt, setLinkedAt] = useState<string | null>(telegramLinkedAt ?? null);
  const [session, setSession] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [formSubs, setFormSubs] = useState<any[]>([]);
  const [followupLogs, setFollowupLogs] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      // Refresh chat_users telegram fields
      const { data: cu } = await supabase
        .from('chat_users')
        .select('telegram_chat_id, telegram_username, telegram_linked_at' as any)
        .eq('id', userId)
        .maybeSingle();
      const cid = (cu as any)?.telegram_chat_id ?? null;
      setChatId(cid);
      setUsername((cu as any)?.telegram_username ?? null);
      setLinkedAt((cu as any)?.telegram_linked_at ?? null);

      if (cid) {
        const [{ data: sess }, { data: notif }, { data: fsubs }, { data: flogs }] = await Promise.all([
          supabase.from('telegram_bot_sessions').select('*').eq('chat_id', cid).maybeSingle(),
          supabase
            .from('telegram_notification_queue')
            .select('*')
            .eq('chat_id', cid)
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('telegram_form_submissions')
            .select('id, form_id, status, source, phone, full_name, ai_response, created_at, completed_at')
            .eq('chat_id', cid)
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('support_activation_followup_log')
            .select('id, stage, channel, status, error_message, payload, created_at, course_id')
            .eq('user_id', userId)
            .like('channel', 'telegram%')
            .order('created_at', { ascending: false })
            .limit(50),
        ]);
        setSession(sess);
        setNotifications((notif as any[]) ?? []);
        setFormSubs((fsubs as any[]) ?? []);
        setFollowupLogs((flogs as any[]) ?? []);
      } else {
        setSession(null);
        setNotifications([]);
        setFormSubs([]);
        setFollowupLogs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      sent: 'default',
      failed: 'destructive',
      pending: 'secondary',
      queued: 'secondary',
      completed: 'default',
      skipped: 'outline',
    };
    return <Badge variant={(map[s] as any) ?? 'outline'}>{s}</Badge>;
  };

  if (!chatId && !loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-3">
          <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            این کاربر هنوز حساب تلگرام خود را متصل نکرده است.
          </p>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 ml-2" /> بارگذاری مجدد
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> اطلاعات تلگرام
          </CardTitle>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Chat ID</div>
            <div dir="ltr" className="font-mono">{chatId ?? '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">نام کاربری</div>
            <div dir="ltr">{username ? `@${username}` : '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">زمان اتصال</div>
            <div>{fmt(linkedAt)}</div>
          </div>
          {session && (
            <>
              <div>
                <div className="text-muted-foreground text-xs">وضعیت سشن ربات</div>
                <div>{session.state ?? '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">آخرین بروزرسانی سشن</div>
                <div>{fmt(session.updated_at)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">انقضای سشن</div>
                <div>{fmt(session.expires_at)}</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="w-4 h-4" /> اعلان‌های ارسال‌شده ({notifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">اعلانی ثبت نشده است.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-auto">
              {notifications.map((n) => (
                <div key={n.id} className="border rounded p-2 text-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{n.notification_type ?? '—'}</span>
                    <div className="flex items-center gap-2">
                      {statusBadge(n.status)}
                      <span className="text-muted-foreground">{fmt(n.sent_at ?? n.created_at)}</span>
                    </div>
                  </div>
                  {n.last_error && <div className="text-destructive">{n.last_error}</div>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Inbox className="w-4 h-4" /> پیام‌های پیگیری پشتیبانی ({followupLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {followupLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لاگی ثبت نشده است.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-auto">
              {followupLogs.map((l) => (
                <div key={l.id} className="border rounded p-2 text-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span>مرحله {l.stage} • {l.channel}</span>
                    <div className="flex items-center gap-2">
                      {statusBadge(l.status)}
                      <span className="text-muted-foreground">{fmt(l.created_at)}</span>
                    </div>
                  </div>
                  {l.error_message && <div className="text-destructive">{l.error_message}</div>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" /> فرم‌های ارسال‌شده در ربات ({formSubs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formSubs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">فرمی ثبت نشده است.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-auto">
              {formSubs.map((f) => (
                <div key={f.id} className="border rounded p-2 text-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{f.source ?? 'form'} — {f.full_name ?? f.phone ?? '—'}</span>
                    <div className="flex items-center gap-2">
                      {statusBadge(f.status)}
                      <span className="text-muted-foreground">{fmt(f.completed_at ?? f.created_at)}</span>
                    </div>
                  </div>
                  {f.ai_response && <div className="text-muted-foreground truncate">{f.ai_response}</div>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserTelegramDetails;
