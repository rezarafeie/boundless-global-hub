import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus } from 'lucide-react';

type Service = { id: string; title: string; description: string | null; url: string; discount_percentage: number; discount_code: string | null; sort_order: number; is_active: boolean };
const empty = { title: '', description: '', url: '', discount_percentage: 20, discount_code: '', sort_order: 0 };

const BlackFridayServicesManager = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const db = supabase as any;

  const { data: services = [] } = useQuery({
    queryKey: ['bf-services-admin'],
    queryFn: async () => {
      const { data, error } = await db.from('black_friday_services').select('*').order('sort_order').order('created_at');
      if (error) throw error;
      return data as Service[];
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['bf-services-admin'] }); qc.invalidateQueries({ queryKey: ['bf-landing-services'] }); };

  const add = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !/^https?:\/\//.test(form.url.trim())) throw new Error('عنوان و لینک معتبر (با https://) لازم است');
      const pct = Math.min(100, Math.max(1, Math.round(Number(form.discount_percentage))));
      const { error } = await db.from('black_friday_services').insert({
        title: form.title.trim(), description: form.description.trim() || null, url: form.url.trim(),
        discount_percentage: pct, discount_code: form.discount_code.trim() || null, sort_order: Number(form.sort_order) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => { setForm(empty); refresh(); toast({ title: 'سرویس اضافه شد' }); },
    onError: (e: any) => toast({ title: 'خطا', description: e.message, variant: 'destructive' }),
  });
  const update = async (id: string, patch: Partial<Service>) => {
    const { error } = await db.from('black_friday_services').update(patch).eq('id', id);
    if (error) toast({ title: 'خطا', description: error.message, variant: 'destructive' }); else refresh();
  };
  const remove = async (id: string) => {
    const { error } = await db.from('black_friday_services').delete().eq('id', id);
    if (error) toast({ title: 'خطا', description: error.message, variant: 'destructive' }); else refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>تخفیف سرویس‌های گروه رفیعی</CardTitle>
        <CardDescription>این سرویس‌ها در صفحه /blackfriday زیر دوره‌ها نمایش داده می‌شوند</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1"><Label>عنوان</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1"><Label>لینک</Label><Input dir="ltr" placeholder="https://" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
          <div className="space-y-1 md:col-span-2"><Label>توضیح کوتاه</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="space-y-1"><Label>درصد تخفیف</Label><Input type="number" min={1} max={100} value={form.discount_percentage} onChange={(e) => setForm({ ...form, discount_percentage: Number(e.target.value) })} /></div>
          <div className="space-y-1"><Label>کد تخفیف (اختیاری)</Label><Input dir="ltr" value={form.discount_code} onChange={(e) => setForm({ ...form, discount_code: e.target.value })} /></div>
          <div className="space-y-1"><Label>ترتیب نمایش</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
        </div>
        <Button onClick={() => add.mutate()} disabled={add.isPending}><Plus className="ml-1 h-4 w-4" />افزودن سرویس</Button>

        <div className="space-y-2">
          {services.length === 0 && <p className="text-center text-muted-foreground py-4">هنوز سرویسی اضافه نشده است</p>}
          {services.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{s.title} <span className="text-muted-foreground">— {s.discount_percentage}٪</span></div>
                <div className="truncate text-xs text-muted-foreground" dir="ltr">{s.url}{s.discount_code ? ` · ${s.discount_code}` : ''}</div>
              </div>
              <Switch checked={s.is_active} onCheckedChange={(c) => update(s.id, { is_active: c })} />
              <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BlackFridayServicesManager;
