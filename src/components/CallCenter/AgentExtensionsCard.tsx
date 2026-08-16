import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Users } from 'lucide-react';
import { callCenter } from '@/lib/callCenterService';
import { useToast } from '@/hooks/use-toast';

interface Row {
  id?: string;
  email: string;
  extension: string;
  display_name?: string | null;
  is_active?: boolean;
}

const AgentExtensionsCard: React.FC = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [readOnly, setReadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Row>({ email: '', extension: '', display_name: '' });

  const load = () => callCenter.agentExtensions()
    .then((r) => { setRows(r.extensions ?? []); setReadOnly(!!r.readOnly); })
    .catch((e) => toast({ title: 'خطا', description: (e as Error).message, variant: 'destructive' }))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const save = async (row: Row) => {
    if (!row.email.trim() || !row.extension.trim()) {
      toast({ title: 'ایمیل و داخلی الزامی است', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await callCenter.saveAgentExtension(row as any);
      toast({ title: 'داخلی کارشناس ذخیره شد' });
      setDraft({ email: '', extension: '', display_name: '' });
      load();
    } catch (e) {
      toast({ title: 'ذخیره ناموفق', description: (e as Error).message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try {
      await callCenter.deleteAgentExtension(id);
      load();
    } catch (e) {
      toast({ title: 'حذف ناموفق', description: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> داخلی کارشناسان</CardTitle>
        <CardDescription>
          برای هر فروشنده/ادمین، ایمیل حساب آکادمی و داخلی همان کاربر در پنل دفتر شما را ثبت کنید.
          تماس‌های خروجی هر کارشناس از داخلی خودش برقرار می‌شود.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">در حال بارگذاری…</div>
        ) : (
          <div className="space-y-2">
            {rows.length === 0 && <div className="text-sm text-muted-foreground">هنوز داخلی‌ای ثبت نشده است.</div>}
            {rows.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
                <Input
                  dir="ltr"
                  className="flex-1 min-w-[200px]"
                  value={r.email}
                  disabled={readOnly}
                  onChange={(e) => setRows((s) => s.map((x) => (x.id === r.id ? { ...x, email: e.target.value } : x)))}
                />
                <Input
                  dir="ltr"
                  className="w-28"
                  value={r.extension}
                  disabled={readOnly}
                  onChange={(e) => setRows((s) => s.map((x) => (x.id === r.id ? { ...x, extension: e.target.value } : x)))}
                />
                <Input
                  className="w-40"
                  placeholder="نام نمایشی"
                  value={r.display_name ?? ''}
                  disabled={readOnly}
                  onChange={(e) => setRows((s) => s.map((x) => (x.id === r.id ? { ...x, display_name: e.target.value } : x)))}
                />
                {r.user_id ? <Badge variant="secondary">متصل به کاربر</Badge> : <Badge variant="outline">بدون کاربر</Badge>}
                {!readOnly && (
                  <>
                    <div className="flex items-center gap-1">
                      <Label className="text-xs">فعال</Label>
                      <Switch
                        checked={!!r.is_active}
                        onCheckedChange={(v) => setRows((s) => s.map((x) => (x.id === r.id ? { ...x, is_active: v } : x)))}
                      />
                    </div>
                    <Button size="sm" variant="outline" onClick={() => save(r)}>ذخیره</Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {!readOnly && (
          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed p-3">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label className="text-xs">ایمیل کارشناس</Label>
              <Input dir="ltr" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="agent@rafiei.co" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">داخلی</Label>
              <Input dir="ltr" className="w-28" value={draft.extension} onChange={(e) => setDraft({ ...draft, extension: e.target.value })} placeholder="1001" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">نام نمایشی</Label>
              <Input className="w-40" value={draft.display_name ?? ''} onChange={(e) => setDraft({ ...draft, display_name: e.target.value })} />
            </div>
            <Button onClick={() => save(draft)} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} افزودن
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentExtensionsCard;
