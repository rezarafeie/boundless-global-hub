import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, ExternalLink, Check, X, Save } from 'lucide-react';

interface Reservation {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  amount: number;
  payment_method: string;
  payment_status: string;
  receipt_url: string | null;
  gateway_ref_id: string | null;
  source: string;
  notes: string | null;
  created_at: string;
}

const statusMeta: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  completed: { label: 'پرداخت شده', variant: 'default' },
  pending: { label: 'در انتظار پرداخت', variant: 'secondary' },
  pending_review: { label: 'در انتظار بررسی رسید', variant: 'outline' },
  failed: { label: 'ناموفق', variant: 'destructive' },
  rejected: { label: 'رد شده', variant: 'destructive' },
};

const ReservationsManagement: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: rows }, { data: s }] = await Promise.all([
      supabase.from('consultation_reservations').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('consultation_reservation_settings').select('*').eq('id', 1).maybeSingle(),
    ]);
    setItems((rows || []) as unknown as Reservation[]);
    setSettings(s || null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, payment_status: string) => {
    const { error } = await supabase.from('consultation_reservations').update({ payment_status }).eq('id', id);
    if (error) return toast({ title: 'خطا در بروزرسانی', variant: 'destructive' });
    toast({ title: 'وضعیت بروزرسانی شد' });
    setItems(prev => prev.map(i => (i.id === id ? { ...i, payment_status } : i)));
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from('consultation_reservation_settings')
      .update({
        is_active: settings.is_active,
        title: settings.title,
        description: settings.description,
        price: Number(settings.price) || 0,
        card_details: settings.card_details,
        success_message: settings.success_message,
      })
      .eq('id', 1);
    setSavingSettings(false);
    toast({ title: error ? 'خطا در ذخیره تنظیمات' : 'تنظیمات ذخیره شد', variant: error ? 'destructive' : undefined });
  };

  const paidCount = items.filter(i => i.payment_status === 'completed').length;
  const revenue = items.filter(i => i.payment_status === 'completed').reduce((s, i) => s + Number(i.amount || 0), 0);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">کل رزروها</p><p className="text-2xl font-bold">{items.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">پرداخت موفق</p><p className="text-2xl font-bold text-green-600">{paidCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">درآمد</p><p className="text-2xl font-bold">{revenue.toLocaleString('fa-IR')} تومان</p></CardContent></Card>
      </div>

      {settings && (
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">تنظیمات صفحه رزرو (/reserve)</CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-xs">فعال</Label>
              <Switch checked={!!settings.is_active} onCheckedChange={v => setSettings({ ...settings, is_active: v })} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>عنوان</Label><Input value={settings.title || ''} onChange={e => setSettings({ ...settings, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>مبلغ (تومان)</Label><Input type="number" value={settings.price ?? 0} onChange={e => setSettings({ ...settings, price: e.target.value })} dir="ltr" /></div>
            </div>
            <div className="space-y-1.5"><Label>توضیحات</Label><Textarea rows={2} value={settings.description || ''} onChange={e => setSettings({ ...settings, description: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>اطلاعات کارت به کارت</Label><Textarea rows={2} value={settings.card_details || ''} onChange={e => setSettings({ ...settings, card_details: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>پیام موفقیت</Label><Textarea rows={2} value={settings.success_message || ''} onChange={e => setSettings({ ...settings, success_message: e.target.value })} /></div>
            <Button onClick={saveSettings} disabled={savingSettings} size="sm">
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
              ذخیره تنظیمات
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <h3 className="font-semibold">لیست رزروها</h3>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 ml-2" />بروزرسانی</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">هنوز رزروی ثبت نشده است</p>
      ) : (
        <div className="space-y-2">
          {items.map(r => {
            const meta = statusMeta[r.payment_status] || { label: r.payment_status, variant: 'secondary' as const };
            return (
              <Card key={r.id}>
                <CardContent className="p-4 flex flex-wrap items-center gap-3 justify-between">
                  <div className="space-y-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.full_name}</span>
                      <Badge variant={meta.variant} className="text-xs">{meta.label}</Badge>
                      <Badge variant="outline" className="text-xs">{r.payment_method}</Badge>
                      {r.source === 'webinar' && <Badge variant="outline" className="text-xs">وبینار</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground" dir="ltr">{r.phone}{r.email ? ` · ${r.email}` : ''}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })} · {Number(r.amount).toLocaleString('fa-IR')} تومان
                      {r.gateway_ref_id ? ` · کد رهگیری: ${r.gateway_ref_id}` : ''}
                    </p>
                    {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {r.receipt_url && (
                      <Button variant="outline" size="sm" onClick={() => window.open(r.receipt_url!, '_blank')}>
                        <ExternalLink className="h-3.5 w-3.5 ml-1.5" />رسید
                      </Button>
                    )}
                    {r.payment_status !== 'completed' && (
                      <Button size="sm" onClick={() => setStatus(r.id, 'completed')}>
                        <Check className="h-3.5 w-3.5 ml-1.5" />تأیید
                      </Button>
                    )}
                    {r.payment_status !== 'rejected' && (
                      <Button variant="destructive" size="sm" onClick={() => setStatus(r.id, 'rejected')}>
                        <X className="h-3.5 w-3.5 ml-1.5" />رد
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReservationsManagement;
