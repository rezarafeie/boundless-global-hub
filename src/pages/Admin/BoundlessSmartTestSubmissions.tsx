import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowRight, Eye, Search, RefreshCw } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface Row {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  interest: string | null;
  mindset: string | null;
  track_id: string | null;
  outcome: string | null;
  answers: any;
  created_at: string;
}

const outcomeBadge = (o: string | null) => {
  if (o === 'passed') return <Badge className="bg-emerald-600">قبول</Badge>;
  if (o === 'rejected') return <Badge variant="destructive">رد</Badge>;
  return <Badge variant="secondary">در حال انجام</Badge>;
};

const BoundlessSmartTestSubmissions: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [viewing, setViewing] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('boundless_smart_test_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);
    setRows((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      (r.full_name || '').toLowerCase().includes(s) ||
      (r.phone || '').toLowerCase().includes(s) ||
      (r.email || '').toLowerCase().includes(s) ||
      (r.track_id || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="container mx-auto px-4 py-6" dir="rtl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/enroll/admin?section=forms')}>
              <ArrowRight className="w-4 h-4 ml-1" /> بازگشت
            </Button>
            <CardTitle>پاسخ‌های تست هوشمند بدون مرز</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 ml-1" /> به‌روز رسانی
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="جستجو بر اساس نام، موبایل، ایمیل یا مسیر..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-md"
            />
            <span className="text-sm text-muted-foreground mr-auto">{filtered.length} مورد</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">در حال بارگذاری...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">پاسخی یافت نشد.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-right p-3">نام</th>
                    <th className="text-right p-3">موبایل</th>
                    <th className="text-right p-3">ایمیل</th>
                    <th className="text-right p-3">مسیر</th>
                    <th className="text-right p-3">نتیجه</th>
                    <th className="text-right p-3">تاریخ</th>
                    <th className="text-right p-3">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-3 font-medium">{r.full_name || '—'}</td>
                      <td className="p-3 ltr-direction">{r.phone || '—'}</td>
                      <td className="p-3">{r.email || '—'}</td>
                      <td className="p-3"><Badge variant="outline">{r.track_id || '—'}</Badge></td>
                      <td className="p-3">{outcomeBadge(r.outcome)}</td>
                      <td className="p-3 text-xs">{new Date(r.created_at).toLocaleString('fa-IR')}</td>
                      <td className="p-3">
                        <Button size="sm" variant="outline" onClick={() => setViewing(r)}>
                          <Eye className="w-4 h-4 ml-1" /> مشاهده
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>جزئیات پاسخ — {viewing?.full_name || ''}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><b>موبایل:</b> {viewing.phone || '—'}</div>
                <div><b>ایمیل:</b> {viewing.email || '—'}</div>
                <div><b>مسیر:</b> {viewing.track_id || '—'}</div>
                <div><b>نتیجه:</b> {outcomeBadge(viewing.outcome)}</div>
                <div className="col-span-2"><b>علاقه:</b> {viewing.interest || '—'}</div>
                <div className="col-span-2"><b>نگرش:</b> {viewing.mindset || '—'}</div>
              </div>
              <div>
                <b>پاسخ‌ها:</b>
                <pre className="mt-2 p-3 rounded-lg bg-muted text-xs overflow-x-auto whitespace-pre-wrap">
{JSON.stringify(viewing.answers, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BoundlessSmartTestSubmissions;
