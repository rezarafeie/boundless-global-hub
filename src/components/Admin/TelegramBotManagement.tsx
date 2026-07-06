import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Link2, RefreshCw, Trash2, Bell, BellOff, ShoppingCart, Save } from 'lucide-react';
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
  const [salesSettings, setSalesSettings] = useState({
    telegram_sales_ai_enabled: false,
    telegram_sales_ai_prompt: '',
    telegram_sales_ai_model: 'google/gemini-2.5-flash',
    telegram_sales_default_course_id: null as string | null,
  });
  const [savingSales, setSavingSales] = useState(false);
  const [welcomeSettings, setWelcomeSettings] = useState({
    telegram_bot_welcome_logged_in: '',
    telegram_bot_welcome_logged_out: '',
  });
  const [savingWelcome, setSavingWelcome] = useState(false);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);

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
      .select('telegram_notify_lead_assigned, telegram_notify_consultation, telegram_notify_daily_summary, telegram_ai_assistant_enabled, telegram_sales_ai_enabled, telegram_sales_ai_prompt, telegram_sales_ai_model, telegram_sales_default_course_id, telegram_bot_welcome_logged_in, telegram_bot_welcome_logged_out' as any)
      .eq('id', 1)
      .maybeSingle();
    if (data) {
      const d = data as any;
      setNotifySettings({
        telegram_notify_lead_assigned: d.telegram_notify_lead_assigned ?? true,
        telegram_notify_consultation: d.telegram_notify_consultation ?? true,
        telegram_notify_daily_summary: d.telegram_notify_daily_summary ?? true,
        telegram_ai_assistant_enabled: d.telegram_ai_assistant_enabled ?? false,
      });
      setSalesSettings({
        telegram_sales_ai_enabled: d.telegram_sales_ai_enabled ?? false,
        telegram_sales_ai_prompt: d.telegram_sales_ai_prompt ?? '',
        telegram_sales_ai_model: d.telegram_sales_ai_model ?? 'google/gemini-2.5-flash',
        telegram_sales_default_course_id: d.telegram_sales_default_course_id ?? null,
      });
      setWelcomeSettings({
        telegram_bot_welcome_logged_in: d.telegram_bot_welcome_logged_in ?? '',
        telegram_bot_welcome_logged_out: d.telegram_bot_welcome_logged_out ?? '',
      });
    }
  };

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('id, title').eq('is_active', true).order('title');
    setCourses((data ?? []) as any);
  };

  useEffect(() => { fetchUsers(); fetchSettings(); fetchCourses(); }, []);

  const saveSalesSettings = async () => {
    setSavingSales(true);
    const { error } = await supabase.from('admin_settings').update({
      telegram_sales_ai_enabled: salesSettings.telegram_sales_ai_enabled,
      telegram_sales_ai_prompt: salesSettings.telegram_sales_ai_prompt,
      telegram_sales_ai_model: salesSettings.telegram_sales_ai_model,
      telegram_sales_default_course_id: salesSettings.telegram_sales_default_course_id,
      updated_at: new Date().toISOString(),
    } as any).eq('id', 1);
    setSavingSales(false);
    if (error) toast({ title: 'خطا', description: error.message, variant: 'destructive' });
    else toast({ title: '✅ تنظیمات مشاور فروش ذخیره شد' });
  };

  const saveWelcomeSettings = async () => {
    setSavingWelcome(true);
    const { error } = await supabase.from('admin_settings').update({
      telegram_bot_welcome_logged_in: welcomeSettings.telegram_bot_welcome_logged_in || null,
      telegram_bot_welcome_logged_out: welcomeSettings.telegram_bot_welcome_logged_out || null,
      updated_at: new Date().toISOString(),
    } as any).eq('id', 1);
    setSavingWelcome(false);
    if (error) toast({ title: 'خطا', description: error.message, variant: 'destructive' });
    else toast({ title: '✅ پیام‌های خوش‌آمدگویی ذخیره شد' });
  };




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
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> 🛒 مشاور هوشمند فروش
          </CardTitle>
          <CardDescription>
            دکمه «مشاور دوره‌های آکادمی» در /start ربات نمایش داده می‌شود. هوش مصنوعی با تکنیک‌های فروش به کاربر مشاوره می‌دهد، شماره می‌گیرد، لید را در «مدیریت لیدها» ثبت و در صورت آماده بودن، لینک پرداخت می‌فرستد و به کارشناس انسانی ارجاع می‌دهد.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">فعال‌سازی مشاور هوشمند فروش در ربات</Label>
            <Switch
              checked={salesSettings.telegram_sales_ai_enabled}
              onCheckedChange={(v) => setSalesSettings(s => ({ ...s, telegram_sales_ai_enabled: v }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">مدل هوش مصنوعی</Label>
            <Select
              value={salesSettings.telegram_sales_ai_model}
              onValueChange={(v) => setSalesSettings(s => ({ ...s, telegram_sales_ai_model: v }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash (سریع و ارزان)</SelectItem>
                <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro (دقیق‌تر)</SelectItem>
                <SelectItem value="google/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (ارزان‌ترین)</SelectItem>
                <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
                <SelectItem value="openai/gpt-5">GPT-5 (قوی‌ترین)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">دوره پیشنهادی پیش‌فرض (اختیاری)</Label>
            <Select
              value={salesSettings.telegram_sales_default_course_id ?? 'none'}
              onValueChange={(v) => setSalesSettings(s => ({ ...s, telegram_sales_default_course_id: v === 'none' ? null : v }))}
            >
              <SelectTrigger><SelectValue placeholder="بدون پیش‌فرض" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون پیش‌فرض</SelectItem>
                {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">پرامپت سیستم (هویت، لحن، تکنیک‌های فروش)</Label>
            <Textarea
              dir="rtl"
              rows={14}
              className="text-sm font-mono"
              value={salesSettings.telegram_sales_ai_prompt}
              onChange={(e) => setSalesSettings(s => ({ ...s, telegram_sales_ai_prompt: e.target.value }))}
              placeholder="شما مشاور هوشمند فروش آکادمی هستید..."
            />
            <p className="text-xs text-muted-foreground">
              فهرست دوره‌های فعال به‌صورت خودکار در انتهای پرامپت به مدل اضافه می‌شود.
            </p>
          </div>

          <Button onClick={saveSalesSettings} disabled={savingSales} size="sm" className="w-full sm:w-auto">
            <Save className="w-4 h-4 ml-2" />
            {savingSales ? 'در حال ذخیره...' : 'ذخیره تنظیمات مشاور فروش'}
          </Button>
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
