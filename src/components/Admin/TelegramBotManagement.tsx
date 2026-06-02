import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Send, Link2, RefreshCw, Trash2, Bell, BellOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LinkedUser {
  id: number;
  name: string;
  phone: string | null;
  role: string | null;
  is_messenger_admin: boolean | null;
  telegram_chat_id: number | null;
  telegram_username: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدیر',
  sales_manager: 'مدیر فروش',
  sales_agent: 'کارشناس فروش',
};

export const TelegramBotManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<LinkedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [chatIdInputs, setChatIdInputs] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [webhookInfo, setWebhookInfo] = useState<any>(null);
  const [registering, setRegistering] = useState(false);
  const [notifySettings, setNotifySettings] = useState({
    telegram_notify_lead_assigned: true,
    telegram_notify_consultation: true,
    telegram_notify_daily_summary: true,
    telegram_ai_assistant_enabled: false,
  });

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('chat_users')
      .select('id, name, phone, role, is_messenger_admin, telegram_chat_id, telegram_username' as any)
      .or('is_messenger_admin.eq.true,role.eq.admin,role.eq.sales_manager,role.eq.sales_agent')
      .order('name')
      .limit(200);
    setUsers((data ?? []) as any);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('admin_settings')
      .select('telegram_notify_lead_assigned, telegram_notify_consultation, telegram_notify_daily_summary, telegram_ai_assistant_enabled' as any)
      .eq('id', 1)
      .maybeSingle();
    if (data) setNotifySettings(data as any);
  };

  useEffect(() => { fetchUsers(); fetchSettings(); }, []);

  const linkUser = async (userId: number) => {
    const val = chatIdInputs[userId]?.trim();
    if (!val) return;
    const chatId = Number(val);
    if (!Number.isFinite(chatId)) {
      toast({ title: 'Chat ID نامعتبر', variant: 'destructive' });
      return;
    }
    setSavingId(userId);
    const { error } = await supabase
      .from('chat_users')
      .update({ telegram_chat_id: chatId, telegram_linked_at: new Date().toISOString() } as any)
      .eq('id', userId);
    setSavingId(null);
    if (error) {
      toast({ title: 'خطا', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ لینک شد' });
      setChatIdInputs(s => ({ ...s, [userId]: '' }));
      fetchUsers();
    }
  };

  const unlinkUser = async (userId: number) => {
    setSavingId(userId);
    await supabase.from('chat_users').update({ telegram_chat_id: null } as any).eq('id', userId);
    setSavingId(null);
    fetchUsers();
  };

  const registerWebhook = async () => {
    setRegistering(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-set-webhook');
      if (error) throw error;
      setWebhookInfo(data);
      toast({ title: '✅ وب‌هوک ثبت شد' });
    } catch (e: any) {
      toast({ title: 'خطا', description: e.message, variant: 'destructive' });
    }
    setRegistering(false);
  };

  const toggleNotify = async (key: keyof typeof notifySettings, val: boolean) => {
    setNotifySettings(s => ({ ...s, [key]: val }));
    await supabase.from('admin_settings').update({ [key]: val, updated_at: new Date().toISOString() } as any).eq('id', 1);
  };

  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="w-4 h-4" /> ربات تلگرام
          </CardTitle>
          <CardDescription>
            ربات را در BotFather بسازید، توکن را به‌عنوان TELEGRAM_BOT_TOKEN ذخیره کنید، سپس وب‌هوک را ثبت کنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={registerWebhook} disabled={registering} size="sm">
              <Link2 className="w-4 h-4 mr-2" />
              {registering ? 'در حال ثبت...' : 'ثبت وب‌هوک ربات'}
            </Button>
          </div>
          {webhookInfo && (
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48" dir="ltr">
              {JSON.stringify(webhookInfo, null, 2)}
            </pre>
          )}
          <p className="text-xs text-muted-foreground">
            راهنمای کاربر برای دریافت Chat ID: در ربات شما دستور <code>/myid</code> را ارسال کند.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" /> اعلان‌های خودکار
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'telegram_ai_assistant_enabled', label: '🤖 فعال‌سازی دستیار هوشمند AI در منوی ربات' },
            { key: 'telegram_notify_lead_assigned', label: 'اعلان تخصیص لید جدید به کارشناس' },
            { key: 'telegram_notify_consultation', label: 'اعلان رزرو مشاوره جدید' },
            { key: 'telegram_notify_daily_summary', label: 'خلاصه روزانه عملکرد' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between gap-2">
              <Label className="text-sm">{item.label}</Label>
              <Switch
                checked={(notifySettings as any)[item.key]}
                onCheckedChange={(v) => toggleNotify(item.key as any, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">لینک کردن کاربران</CardTitle>
          <CardDescription>هر کاربر باید Chat ID تلگرام خود را از طریق دستور /myid در ربات دریافت و به شما بدهد.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="جستجو بر اساس نام یا تلفن..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="outline" size="icon" onClick={fetchUsers}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-auto">
              {filtered.map(u => {
                const role = u.is_messenger_admin ? 'admin' : (u.role ?? '');
                return (
                  <div key={u.id} className="flex items-center justify-between gap-2 border rounded p-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{u.name}</span>
                        {role && <Badge variant="secondary" className="text-xs">{ROLE_LABELS[role] ?? role}</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground" dir="ltr">{u.phone}</div>
                    </div>
                    {u.telegram_chat_id ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs" dir="ltr">{u.telegram_chat_id}</Badge>
                        <Button variant="ghost" size="icon" disabled={savingId === u.id} onClick={() => unlinkUser(u.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Input
                          dir="ltr"
                          className="w-32 h-8 text-xs"
                          placeholder="Chat ID"
                          value={chatIdInputs[u.id] ?? ''}
                          onChange={(e) => setChatIdInputs(s => ({ ...s, [u.id]: e.target.value }))}
                        />
                        <Button size="sm" disabled={savingId === u.id} onClick={() => linkUser(u.id)}>لینک</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
