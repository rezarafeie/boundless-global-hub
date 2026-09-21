import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight, RefreshCw, Save, Eye, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_CONTENT, type ContentBlock, type MediaBlock } from '@/data/smartTestV2/content';
import { QUESTIONS } from '@/data/smartTestV2/questions';
import { PATH_LABELS, type PathId } from '@/data/smartTestV2/types';
import { loadContent, saveContentBlock } from '@/lib/smartTestV2/store';

const BLOCK_TITLES: Record<string, string> = {
  trust_block: 'بلوک اعتماد (۵ مسیر)',
  objection_time: 'اعتراض: وقت ندارم',
  objection_money: 'اعتراض: پول ندارم',
  objection_country: 'اعتراض: از ایران نمی‌شه',
  objection_dream_selling: 'اعتراض: رویافروشی',
  objection_skill: 'اعتراض: مهارت ندارم',
  objection_trust: 'اعتراض: اعتماد ندارم',
  objection_failure: 'اعتراض: ترس از شکست',
  objection_later: 'اعتراض: بعداً',
  objection_confusion: 'اعتراض: سردرگمی',
  boundless_bridge: 'پل ورود به بدون مرز',
  analysis_media: 'رسانه هنگام تحلیل',
  result_proof_dropshipping: 'اثبات مسیر Dropshipping',
  result_proof_drop_service: 'اثبات مسیر Drop Service',
  result_proof_digital_product: 'اثبات مسیر Digital Product',
  result_proof_ai: 'اثبات مسیر AI Business',
  result_proof_vibe_coding: 'اثبات مسیر Vibe Coding',
};

/* ---------------- content editor ---------------- */
const BlockEditor: React.FC<{ block: ContentBlock; onSaved: (b: ContentBlock) => void }> = ({ block, onSaved }) => {
  const [draft, setDraft] = useState<ContentBlock>(block);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(block), [block]);

  const setMedia = (i: number, patch: Partial<MediaBlock>) => {
    const media = [...(draft.media || [])];
    media[i] = { ...media[i], ...patch };
    setDraft({ ...draft, media });
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveContentBlock(draft);
      onSaved(draft);
      toast.success('ذخیره شد');
    } catch (e: any) {
      toast.error(e?.message || 'ذخیره ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="عنوان" />
      <Textarea
        rows={6}
        value={(draft.body || []).join('\n')}
        onChange={(e) => setDraft({ ...draft, body: e.target.value.split('\n') })}
        placeholder="هر خط یک پاراگراف"
      />
      <Input value={draft.cta || ''} onChange={(e) => setDraft({ ...draft, cta: e.target.value })} placeholder="متن دکمه ادامه" />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">مدیا (ویدیو، تصویر، گالری، متن اثبات)</span>
          <Button size="sm" variant="outline" onClick={() => setDraft({ ...draft, media: [...(draft.media || []), { kind: 'video', url: '' }] })}>
            <Plus className="w-4 h-4 ml-1" /> افزودن
          </Button>
        </div>
        {(draft.media || []).map((m, i) => (
          <div key={i} className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex gap-2">
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={m.kind}
                onChange={(e) => setMedia(i, { kind: e.target.value as MediaBlock['kind'] })}
              >
                <option value="video">ویدیو</option>
                <option value="image">تصویر</option>
                <option value="gallery">گالری</option>
                <option value="text">متن اثبات / تستیمونیال</option>
              </select>
              <Button size="sm" variant="ghost" onClick={() => setDraft({ ...draft, media: (draft.media || []).filter((_, j) => j !== i) })}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            {m.kind === 'gallery' ? (
              <Textarea
                rows={3}
                value={(m.urls || []).join('\n')}
                onChange={(e) => setMedia(i, { urls: e.target.value.split('\n').filter(Boolean) })}
                placeholder="هر خط یک آدرس تصویر"
              />
            ) : m.kind !== 'text' ? (
              <Input value={m.url || ''} onChange={(e) => setMedia(i, { url: e.target.value })} placeholder="آدرس ویدیو / تصویر" />
            ) : null}
            <Input value={m.caption || ''} onChange={(e) => setMedia(i, { caption: e.target.value })} placeholder="متن / توضیح" />
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          تا وقتی آدرس یا متنی وارد نشده، این بخش به کاربر نمایش داده نمی‌شود.
        </p>
      </div>

      <Button onClick={save} disabled={saving}>
        <Save className="w-4 h-4 ml-1" /> ذخیره بلوک
      </Button>
    </div>
  );
};

/* ---------------- page ---------------- */
const SmartTestV2Admin: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<Record<string, ContentBlock>>(DEFAULT_CONTENT);
  const [activeBlock, setActiveBlock] = useState('trust_block');
  const [rows, setRows] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [viewing, setViewing] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: subs }, { data: evs }] = await Promise.all([
      supabase.from('smart_test_v2_submissions' as any).select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('smart_test_v2_events' as any).select('event_type, step_key, created_at').limit(5000),
    ]);
    setRows((subs as any[]) || []);
    setEvents((evs as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadContent().then(setContent); load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    if (filter === 'high_readiness' && (r.readiness_score ?? 0) < 70) return false;
    if (filter === 'consultation' && r.cta_shown !== 'consultation') return false;
    if (filter === 'objection_money' && r.primary_objection !== 'money') return false;
    if (filter === 'objection_trust' && !['trust', 'dream_selling'].includes(r.primary_objection)) return false;
    if (filter === 'maza_incomplete' && !((r.maza_progress ?? 0) < 90)) return false;
    if (filter === 'high_match_no_click' && !((r.recommended_match ?? 0) >= 75 && !r.cta_clicked)) return false;
    if (filter === 'abandoned' && r.status === 'completed') return false;
    if (filter === 'completed_no_click' && !(r.status === 'completed' && !r.cta_clicked)) return false;
    if (filter === 'ai_path' && r.recommended_path !== 'ai') return false;
    if (filter === 'ai_ready' && r.ai_status !== 'ready') return false;
    if (filter === 'ai_failed' && r.ai_status === 'ready') return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return [r.full_name, r.phone, r.email, r.recommended_path].some((v) => (v || '').toLowerCase().includes(s));
  }), [rows, q, filter]);

  const stats = useMemo(() => {
    const started = events.filter((e) => e.event_type === 'test_started').length || rows.length;
    const completed = rows.filter((r) => r.status === 'completed');
    const abandonMap: Record<string, number> = {};
    rows.filter((r) => r.status !== 'completed' && r.current_step).forEach((r) => {
      abandonMap[r.current_step] = (abandonMap[r.current_step] || 0) + 1;
    });
    const topAbandon = Object.entries(abandonMap).sort((a, b) => b[1] - a[1])[0];
    const pathCount: Record<string, number> = {};
    completed.forEach((r) => { if (r.recommended_path) pathCount[r.recommended_path] = (pathCount[r.recommended_path] || 0) + 1; });
    const objCount: Record<string, number> = {};
    rows.forEach((r) => { if (r.primary_objection) objCount[r.primary_objection] = (objCount[r.primary_objection] || 0) + 1; });
    const durations = completed.map((r) => r.duration_seconds).filter(Boolean) as number[];
    return {
      started,
      completed: completed.length,
      completionRate: started ? Math.round((completed.length / started) * 100) : 0,
      avgDuration: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60) : 0,
      topAbandon,
      pathCount,
      objCount,
      avgReadiness: completed.length
        ? Math.round(completed.reduce((a, r) => a + (r.readiness_score || 0), 0) / completed.length)
        : 0,
      ctaClicks: rows.filter((r) => r.cta_clicked).length,
      ctaShown: rows.filter((r) => r.cta_shown).length,
      consultations: events.filter((e) => e.event_type === 'consultation_request').length,
    };
  }, [rows, events]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/enroll/admin')}>
            <ArrowRight className="w-4 h-4 ml-1" /> بازگشت
          </Button>
          <h1 className="text-xl font-bold">تست هوشمند بدون مرز — نسخه ۲</h1>
          <Badge variant="outline">boundless_smart_test_v2</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 ml-1" /> به‌روزرسانی</Button>
          <Button variant="outline" size="sm" onClick={() => window.open('/smart-test-v2', '_blank')}>
            <Eye className="w-4 h-4 ml-1" /> مشاهده تست
          </Button>
        </div>
      </div>

      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">پاسخ‌ها</TabsTrigger>
          <TabsTrigger value="analytics">تحلیل‌ها</TabsTrigger>
          <TabsTrigger value="content">محتوا</TabsTrigger>
          <TabsTrigger value="questions">سؤالات و امتیازدهی</TabsTrigger>
        </TabsList>

        {/* submissions */}
        <TabsContent value="submissions">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Input placeholder="جستجو..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
                <select
                  className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">همه</option>
                  <option value="ai_path">لیدهای مسیر AI</option>
                  <option value="high_readiness">آمادگی بالا</option>
                  <option value="consultation">آماده مشاوره</option>
                  <option value="objection_money">اعتراض مالی</option>
                  <option value="objection_trust">اعتراض اعتماد</option>
                  <option value="maza_incomplete">مزه ناتمام</option>
                  <option value="high_match_no_click">تطابق بالا بدون اقدام</option>
                  <option value="abandoned">رهاشده</option>
                  <option value="completed_no_click">کامل ولی بدون کلیک</option>
                  <option value="ai_ready">تحلیل هوشمند آماده</option>
                  <option value="ai_failed">تحلیل هوشمند ناموفق</option>
                </select>
                <span className="text-sm text-muted-foreground mr-auto">{filtered.length} مورد</span>
              </div>
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">در حال بارگذاری...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        {['نام', 'مسیر', 'تطابق', 'آمادگی', 'اعتراض', 'وضعیت', 'CTA', 'تاریخ', ''].map((h) => (
                          <th key={h} className="text-right p-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.id} className="border-t">
                          <td className="p-3">{r.full_name || r.phone || '—'}</td>
                          <td className="p-3">{r.recommended_path ? PATH_LABELS[r.recommended_path as PathId] : '—'}</td>
                          <td className="p-3">{r.recommended_match ?? '—'}</td>
                          <td className="p-3">{r.readiness_score ?? '—'}</td>
                          <td className="p-3">{r.primary_objection || '—'}</td>
                          <td className="p-3">
                            {r.status === 'completed'
                              ? <Badge className="bg-emerald-600">کامل</Badge>
                              : <Badge variant="secondary">ناتمام</Badge>}
                          </td>
                          <td className="p-3 text-xs">{r.cta_clicked || r.cta_shown || '—'}</td>
                          <td className="p-3 text-xs">{new Date(r.created_at).toLocaleString('fa-IR')}</td>
                          <td className="p-3">
                            <Button size="sm" variant="outline" onClick={() => setViewing(r)}>جزئیات</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ['شروع', stats.started],
              ['تکمیل', stats.completed],
              ['نرخ تکمیل', `${stats.completionRate}%`],
              ['میانگین زمان', `${stats.avgDuration} دقیقه`],
              ['میانگین آمادگی', stats.avgReadiness],
              ['CTA نمایش', stats.ctaShown],
              ['CTA کلیک', stats.ctaClicks],
              ['درخواست مشاوره', stats.consultations],
            ].map(([k, v]) => (
              <Card key={k as string}><CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold">{v as any}</div>
                <div className="text-xs text-muted-foreground mt-1">{k as string}</div>
              </CardContent></Card>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">مسیرهای پیشنهادی</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(stats.pathCount).map(([p, c]) => (
                <div key={p} className="flex justify-between text-sm">
                  <span>{PATH_LABELS[p as PathId] || p}</span><span className="font-bold">{c}</span>
                </div>
              ))}
              {Object.keys(stats.pathCount).length === 0 && <p className="text-sm text-muted-foreground">داده‌ای نیست.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">اعتراض‌های اصلی و نقطه رها کردن</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {Object.entries(stats.objCount).map(([o, c]) => (
                <div key={o} className="flex justify-between"><span>{o}</span><span className="font-bold">{c}</span></div>
              ))}
              <div className="pt-2 border-t">
                بیشترین نقطه رها کردن: <b>{stats.topAbandon ? `${stats.topAbandon[0]} (${stats.topAbandon[1]})` : '—'}</b>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* content */}
        <TabsContent value="content">
          <div className="grid md:grid-cols-[240px_1fr] gap-4">
            <Card><CardContent className="pt-6 space-y-1">
              {Object.keys(BLOCK_TITLES).map((k) => (
                <button
                  key={k}
                  onClick={() => setActiveBlock(k)}
                  className={`w-full text-right rounded-lg px-3 py-2 text-sm ${activeBlock === k ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                >
                  {BLOCK_TITLES[k]}
                </button>
              ))}
            </CardContent></Card>
            <Card>
              <CardHeader><CardTitle className="text-base">{BLOCK_TITLES[activeBlock]}</CardTitle></CardHeader>
              <CardContent>
                <BlockEditor
                  block={content[activeBlock] || DEFAULT_CONTENT[activeBlock]}
                  onSaved={(b) => setContent((c) => ({ ...c, [b.key]: b }))}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* questions */}
        <TabsContent value="questions">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                ساختار سؤالات و امتیاز هر گزینه برای هر مسیر. تغییر امتیازها روی نتیجه همه پاسخ‌های بعدی اثر می‌گذارد.
              </p>
              {QUESTIONS.map((qq, i) => (
                <div key={qq.id} className="rounded-xl border border-border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{i + 1}</Badge>
                    <span className="font-medium text-sm">{qq.title}</span>
                    <Badge variant="secondary" className="mr-auto">{qq.kind}</Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="text-right p-2">گزینه</th>
                          {Object.keys(PATH_LABELS).map((p) => (
                            <th key={p} className="p-2">{PATH_LABELS[p as PathId]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {qq.options.map((o) => (
                          <tr key={o.value} className="border-t">
                            <td className="p-2">{o.label}</td>
                            {Object.keys(PATH_LABELS).map((p) => (
                              <td key={p} className="p-2 text-center">{(o.scores as any)?.[p] ?? 0}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>پروفایل CRM — {viewing?.full_name || viewing?.phone || ''}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><b>مسیر:</b> {viewing.recommended_path} ({viewing.recommended_match}%)</div>
                <div><b>مسیر دوم:</b> {viewing.alternative_path} ({viewing.alternative_match}%)</div>
                <div><b>آمادگی:</b> {viewing.readiness_score}</div>
                <div><b>اطمینان:</b> {viewing.confidence}</div>
                <div><b>پروفایل:</b> {viewing.profile_type}</div>
                <div><b>مزه:</b> {viewing.maza_progress ?? '—'}%</div>
                <div><b>CTA:</b> {viewing.cta_shown} / {viewing.cta_clicked || 'بدون کلیک'}</div>
                <div><b>مدت:</b> {viewing.duration_seconds ?? '—'} ثانیه</div>
              </div>
              {viewing.id && (
                <Button size="sm" variant="outline" onClick={() => window.open(`/smart-test-v2/result/${viewing.id}`, '_blank')}>
                  مشاهده صفحه نتیجه
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div><b>وضعیت تحلیل هوشمند:</b> {viewing.ai_status || '—'}</div>
                <div><b>اطمینان AI:</b> {viewing.ai_confidence || '—'}</div>
                <div><b>مسیر بلندمدت:</b> {viewing.long_term_fit || '—'}</div>
                <div><b>نقطه شروع:</b> {viewing.best_starting_path || '—'}</div>
                <div><b>اقدام پیشنهادی AI:</b> {viewing.next_action || '—'}</div>
                <div><b>سؤالات تکمیلی:</b> {(viewing.adaptive_questions || []).length}</div>
              </div>

              {[
                ['پاسخ‌های خام', viewing.answers],
                ['امتیاز قطعی مسیرها', viewing.path_scores],
                ['شواهد امتیازدهی', viewing.score_evidence],
                ['تناقض‌ها', viewing.contradictions],
                ['تحلیل‌های میان‌راه (checkpoints)', viewing.ai_checkpoints],
                ['سؤالات تکمیلی و جواب‌ها', { questions: viewing.adaptive_questions, answers: viewing.adaptive_answers }],
                ['تشخیص نهایی AI', viewing.ai_diagnosis],
              ].map(([label, value]) => (
                <details key={label as string} className="rounded-lg border border-border p-3">
                  <summary className="cursor-pointer text-xs font-bold">{label as string}</summary>
                  <pre className="mt-2 p-3 rounded-lg bg-muted text-[11px] overflow-x-auto whitespace-pre-wrap">
{JSON.stringify(value ?? null, null, 2)}
                  </pre>
                </details>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmartTestV2Admin;
