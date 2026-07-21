import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const SocialSettings: React.FC = () => {
  const [s, setS] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from('social_settings').select('*').eq('id', 1).single().then(({ data }) => setS(data));
  }, []);

  const save = async () => {
    if (!s) return;
    setSaving(true);
    const { error } = await supabase.from('social_settings').update({
      ai_tone: s.ai_tone,
      ai_language: s.ai_language,
      ai_auto_reply_enabled: s.ai_auto_reply_enabled,
      ai_confidence_threshold: s.ai_confidence_threshold,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);
    setSaving(false);
    if (error) toast({ title: 'خطا', description: error.message, variant: 'destructive' });
    else toast({ title: 'ذخیره شد' });
  };

  if (!s) return <div className="p-6 text-muted-foreground">در حال بارگذاری...</div>;

  return (
    <div className="p-6 max-w-2xl space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">تنظیمات</h1>
        <p className="text-sm text-muted-foreground mt-1">پیکربندی رفتار AI و پاسخگویی</p>
      </div>

      <Card>
        <CardHeader><CardTitle>هوش مصنوعی</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>لحن پاسخ‌ها</Label>
            <Select value={s.ai_tone} onValueChange={(v) => setS({ ...s, ai_tone: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="friendly">صمیمی</SelectItem>
                <SelectItem value="professional">حرفه‌ای</SelectItem>
                <SelectItem value="casual">خودمانی</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <Label>پاسخ خودکار</Label>
              <p className="text-xs text-muted-foreground mt-1">
                فعلاً غیرفعال؛ در فاز بعدی برای پاسخ خودکار بدون تایید انسان استفاده می‌شود.
              </p>
            </div>
            <Switch
              checked={s.ai_auto_reply_enabled}
              onCheckedChange={(v) => setS({ ...s, ai_auto_reply_enabled: v })}
            />
          </div>

          <div className="space-y-2">
            <Label>حد اطمینان AI ({s.ai_confidence_threshold})</Label>
            <Input
              type="number" step="0.05" min={0} max={1}
              value={s.ai_confidence_threshold}
              onChange={(e) => setS({ ...s, ai_confidence_threshold: parseFloat(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>NovinHub</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>کلید API نوین‌هاب در Secrets پروژه با نام <code>NOVINHUB_API_KEY</code> ذخیره شده است.</p>
          <p>برای تغییر آن، از تنظیمات Secrets پروژه استفاده کنید.</p>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>
        {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
      </Button>
    </div>
  );
};

export default SocialSettings;
