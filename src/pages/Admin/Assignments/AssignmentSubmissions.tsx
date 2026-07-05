import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowRight, RefreshCw, Sparkles } from 'lucide-react';
import { STATUS_LABELS_FA, type AssignmentBlock, type AssignmentSubmission, type Assignment, type SubmissionStatus } from '@/types/assignment';
import { FeedbackReport } from '@/components/Assignment/FeedbackReport';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  reviewed: 'bg-green-500/15 text-green-700 dark:text-green-300',
  needs_revision: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  completed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
};

const AssignmentSubmissions: React.FC = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [subs, setSubs] = useState<AssignmentSubmission[]>([]);
  const [users, setUsers] = useState<Record<number, { name: string; phone?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<AssignmentSubmission | null>(null);
  const [adminFeedback, setAdminFeedback] = useState('');
  const [adminScore, setAdminScore] = useState<number | ''>('');
  const [adminStatus, setAdminStatus] = useState<SubmissionStatus>('reviewed');
  const [savingReview, setSavingReview] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [aRes, sRes] = await Promise.all([
      supabase.from('assignments').select('*').eq('id', id).single(),
      supabase.from('assignment_submissions').select('*').eq('assignment_id', id).order('updated_at', { ascending: false }),
    ]);
    if (aRes.data) setAssignment(aRes.data as unknown as Assignment);
    const list = (sRes.data || []) as unknown as AssignmentSubmission[];
    setSubs(list);
    const ids = Array.from(new Set(list.map((s) => s.student_id).filter(Boolean)));
    if (ids.length) {
      const { data } = await supabase.from('chat_users').select('id, name, phone').in('id', ids);
      const map: Record<number, { name: string; phone?: string }> = {};
      (data || []).forEach((u: any) => { map[u.id] = { name: u.name, phone: u.phone }; });
      setUsers(map);
    }
    setLoading(false);
  };

  useEffect(() => { if (id) load(); }, [id]);

  const filtered = useMemo(() => {
    return subs.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (search) {
        const u = users[s.student_id];
        const hay = `${u?.name || ''} ${u?.phone || ''} ${s.student_id}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [subs, users, statusFilter, search]);

  const stats = useMemo(() => {
    const c: Record<string, number> = { total: subs.length };
    subs.forEach((s) => { c[s.status] = (c[s.status] || 0) + 1; });
    const scored = subs.filter((s) => typeof s.score === 'number');
    c.avg = scored.length ? Math.round(scored.reduce((a, b) => a + (b.score || 0), 0) / scored.length) : 0;
    return c;
  }, [subs]);

  const openReview = (s: AssignmentSubmission) => {
    setActive(s);
    setAdminFeedback(s.admin_feedback || '');
    setAdminScore(typeof s.score === 'number' ? s.score : '');
    setAdminStatus((s.status === 'draft' ? 'reviewed' : s.status) as SubmissionStatus);
  };

  const saveReview = async () => {
    if (!active) return;
    setSavingReview(true);
    const { error } = await supabase
      .from('assignment_submissions')
      .update({
        admin_feedback: adminFeedback || null,
        score: adminScore === '' ? null : Number(adminScore),
        status: adminStatus,
        reviewed_at: new Date().toISOString(),
      } as any)
      .eq('id', active.id);
    setSavingReview(false);
    if (error) return toast.error('خطا در ذخیره: ' + error.message);
    toast.success('بازخورد ثبت شد');
    setActive(null);
    load();
  };

  const regenAI = async () => {
    if (!active) return;
    setRegenLoading(true);
    const { error } = await supabase.functions.invoke('ai-feedback-assignment', {
      body: { submission_id: active.id },
    });
    setRegenLoading(false);
    if (error) return toast.error('خطا در تولید بازخورد AI');
    toast.success('بازخورد AI بازتولید شد');
    load();
    setActive(null);
  };

  const renderAnswer = (block: AssignmentBlock) => {
    if (!active) return null;
    const val = (active.answers as any)?.[block.id];
    if (block.type === 'file_upload' || block.type === 'image_upload') {
      const file = active.files?.find((f) => f.block_id === block.id);
      if (!file) return <span className="text-muted-foreground text-sm">— بدون فایل —</span>;
      return <a href={file.url} target="_blank" rel="noreferrer" className="text-primary underline text-sm">{file.name}</a>;
    }
    if (val === undefined || val === null || val === '') return <span className="text-muted-foreground text-sm">— بدون پاسخ —</span>;
    if (Array.isArray(val)) return <div className="text-sm">{val.join('، ')}</div>;
    return <div className="text-sm whitespace-pre-wrap">{String(val)}</div>;
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl" dir="rtl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <Link to="/admin/assignments" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ArrowRight className="h-4 w-4" /> بازگشت به فهرست
          </Link>
          <h1 className="text-2xl font-bold mt-1">پاسخ‌های تمرین: {assignment?.title || '...'}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="h-4 w-4 ml-2" />بروزرسانی</Button>
          <Link to={`/admin/assignments/${id}`}><Button variant="outline">ویرایش تمرین</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <StatCard label="کل پاسخ‌ها" value={stats.total || 0} />
        <StatCard label="ارسال شده" value={stats.submitted || 0} />
        <StatCard label="بررسی شده" value={stats.reviewed || 0} />
        <StatCard label="نیاز به بازنگری" value={stats.needs_revision || 0} />
        <StatCard label="میانگین نمره" value={stats.avg || 0} />
      </div>

      <Card className="mb-4">
        <CardContent className="pt-4 flex flex-wrap gap-2">
          <Input placeholder="جستجو (نام / موبایل / ID)" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              {Object.entries(STATUS_LABELS_FA).filter(([k]) => k !== 'not_started').map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{filtered.length} پاسخ</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">پاسخی یافت نشد</div>
          ) : (
            <div className="divide-y">
              {filtered.map((s) => {
                const u = users[s.student_id];
                return (
                  <div key={s.id} className="py-3 flex items-center justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-medium">{u?.name || `کاربر #${s.student_id}`}</div>
                      <div className="text-xs text-muted-foreground">{u?.phone || '-'} • آخرین بروزرسانی: {new Date(s.updated_at).toLocaleString('fa-IR')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLORS[s.status] || ''} variant="outline">{STATUS_LABELS_FA[s.status]}</Badge>
                      {typeof s.score === 'number' && <Badge variant="secondary">نمره: {s.score}</Badge>}
                      <Button size="sm" onClick={() => openReview(s)}>بررسی</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>بررسی پاسخ — {active && (users[active.student_id]?.name || `کاربر #${active.student_id}`)}</DialogTitle>
          </DialogHeader>

          {active && assignment && (
            <div className="space-y-4">
              <section>
                <h3 className="font-semibold mb-2">پاسخ‌های دانشجو</h3>
                <div className="space-y-3">
                  {(assignment.blocks || []).filter((b) => !['title', 'description', 'hint'].includes(b.type)).map((b) => (
                    <div key={b.id} className="border rounded p-3">
                      <div className="text-sm font-medium mb-1">{b.label}</div>
                      {renderAnswer(b)}
                    </div>
                  ))}
                </div>
              </section>

              {active.ai_feedback && (
                <section>
                  <h3 className="font-semibold mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4" /> بازخورد هوشمند</h3>
                  <FeedbackReport feedback={active.ai_feedback} />
                  <Button size="sm" variant="outline" className="mt-2" onClick={regenAI} disabled={regenLoading}>
                    {regenLoading ? 'در حال تولید...' : 'بازتولید بازخورد AI'}
                  </Button>
                </section>
              )}

              <section className="border-t pt-4 space-y-3">
                <h3 className="font-semibold">بازخورد ادمین</h3>
                <div>
                  <Label>یادداشت برای دانشجو</Label>
                  <Textarea rows={4} value={adminFeedback} onChange={(e) => setAdminFeedback(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>نمره (۰ تا ۱۰۰)</Label>
                    <Input type="number" min={0} max={100} value={adminScore} onChange={(e) => setAdminScore(e.target.value === '' ? '' : Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>وضعیت</Label>
                    <Select value={adminStatus} onValueChange={(v: SubmissionStatus) => setAdminStatus(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reviewed">بررسی شده</SelectItem>
                        <SelectItem value="needs_revision">نیاز به بازنگری</SelectItem>
                        <SelectItem value="completed">تکمیل شده</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={saveReview} disabled={savingReview}>{savingReview ? 'در حال ذخیره...' : 'ذخیره بازخورد'}</Button>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <Card><CardContent className="pt-4">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-2xl font-bold">{value}</div>
  </CardContent></Card>
);

export default AssignmentSubmissions;
