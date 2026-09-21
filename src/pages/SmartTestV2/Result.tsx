import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Info, CheckCircle2, ArrowLeft } from 'lucide-react';
import { fetchSubmission, loadContent, trackEvent, updateSubmission } from '@/lib/smartTestV2/store';
import { DEFAULT_CONTENT, ROADMAPS, type ContentBlock } from '@/data/smartTestV2/content';
import { PATH_FA, PATH_LABELS, type PathId } from '@/data/smartTestV2/types';
import { computeResult } from '@/lib/smartTestV2/engine';
import BlockCard from '@/components/SmartTestV2/BlockCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const MAZA_COURSE_ID = 'b97c19b7-98d3-4891-b00f-93bfb7711487';

const ScoreBar: React.FC<{ label: string; value: number; muted?: boolean }> = ({ label, value, muted }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs sm:text-sm">
      <span className={muted ? 'text-muted-foreground' : ''}>{label}</span>
      <span className="font-bold">{value}%</span>
    </div>
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full ${muted ? 'bg-muted-foreground/40' : 'bg-primary'}`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

const SmartTestV2Result: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<Record<string, ContentBlock>>(DEFAULT_CONTENT);
  const [mazaProgress, setMazaProgress] = useState<number | null>(null);

  useEffect(() => {
    loadContent().then(setContent);
    if (!id) return;
    fetchSubmission(id).then((data) => {
      setRow(data);
      setLoading(false);
      trackEvent(id, 'result_view');
    });
  }, [id]);

  useEffect(() => {
    const uid = (user as any)?.id;
    if (!uid) return;
    supabase
      .from('user_course_progress')
      .select('progress_percentage')
      .eq('user_id', uid)
      .eq('course_id', MAZA_COURSE_ID)
      .maybeSingle()
      .then(({ data }) => {
        const p = (data as any)?.progress_percentage;
        if (typeof p === 'number') {
          setMazaProgress(p);
          if (id) updateSubmission(id, { maza_progress: Math.round(p) });
        }
      });
  }, [user, id]);

  const result = useMemo(() => (row?.answers ? computeResult(row.answers) : null), [row]);

  const ctaKey: 'finish_maza' | 'start_course' | 'consultation' | 'direct' = useMemo(() => {
    if (!result) return 'start_course';
    if (mazaProgress !== null && mazaProgress < 90) return 'finish_maza';
    if (result.readiness >= 70 && result.recommended.match >= 75) return 'direct';
    if (result.readiness >= 55) return 'consultation';
    return 'start_course';
  }, [result, mazaProgress]);

  useEffect(() => {
    if (id && result) updateSubmission(id, { cta_shown: ctaKey });
  }, [id, result, ctaKey]);

  if (loading) {
    return (
      <MainLayout>
        <div className="py-24 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
      </MainLayout>
    );
  }

  if (!row || !result) {
    return (
      <MainLayout>
        <div dir="rtl" className="container mx-auto px-4 py-20 text-center space-y-4">
          <p className="text-muted-foreground">نتیجه‌ای پیدا نشد.</p>
          <Button onClick={() => navigate('/smart-test-v2')}>شروع تست</Button>
        </div>
      </MainLayout>
    );
  }

  const path = result.recommended.path as PathId;
  const roadmap = ROADMAPS[path];

  const clickCta = (label: string, to: string) => {
    if (id) updateSubmission(id, { cta_clicked: label, cta_clicked_at: new Date().toISOString() });
    trackEvent(id || null, 'cta_click', ctaKey, { label });
    if (to.startsWith('http')) window.open(to, '_blank');
    else navigate(to);
  };

  const requestConsultation = async () => {
    if (id) await updateSubmission(id, { cta_clicked: 'consultation', cta_clicked_at: new Date().toISOString() });
    trackEvent(id || null, 'consultation_request', ctaKey);
    toast.success('نتیجه تستت همراه درخواست برای مشاور بدون مرز ارسال شد.');
    navigate('/consultations');
  };

  return (
    <MainLayout>
      <div dir="rtl" className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* headline */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-5">
          <p className="text-sm text-muted-foreground">مسیر پیشنهادی تو</p>
          <h1 className="text-2xl sm:text-4xl font-extrabold">{PATH_LABELS[path]}</h1>
          <p className="text-sm text-muted-foreground">{PATH_FA[path]}</p>
          <div className="text-4xl font-extrabold text-primary">{result.recommended.match}% Match</div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            Match Score نشان‌دهنده میزان تطابق پاسخ‌های شما با ویژگی‌های این مسیر است، نه تضمین نتیجه یا درآمد.
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              ['Readiness', `${result.readiness}%`],
              ['اطمینان', result.confidenceFa],
              ['پروفایل', result.profile.type],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-border p-3 text-center">
                <div className="text-[11px] text-muted-foreground">{k}</div>
                <div className="text-sm font-bold mt-1">{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* reasons */}
        <div className="rounded-3xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-lg font-bold">چرا این مسیر؟</h2>
          {result.reasonsForRecommended.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-sm leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{r.reason}</span>
            </div>
          ))}
          {result.weakness && (
            <p className="mt-4 rounded-2xl bg-muted p-4 text-sm leading-loose">{result.weakness}</p>
          )}
        </div>

        {/* alternative + not now */}
        <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-bold">مسیرهای دیگه</h2>
          <ScoreBar label={`مسیر دوم: ${PATH_LABELS[result.alternative.path]}`} value={result.alternative.match} />
          <p className="text-xs text-muted-foreground leading-loose">
            این مسیر هم با شرایط تو سازگاره؛ اگر تمرکزت روی چیزی که در {PATH_LABELS[result.alternative.path]} قوی‌تری بیشتر
            بشه، می‌تونه انتخاب اول بشه.
          </p>
          {result.notNow && (
            <>
              <ScoreBar label={`فعلاً پیشنهاد اول ما نیست: ${PATH_LABELS[result.notNow.path]}`} value={result.notNow.match} muted />
              <p className="text-xs text-muted-foreground leading-loose">
                علاقه وجود داره، اما سرمایه تست و مدل ریسک فعلیت باعث شده برای شروع امروز، انتخاب اول نباشه. این یعنی
                «نقطه شروع بهتری داری»، نه اینکه هیچ‌وقت نمی‌تونی سراغش بری.
              </p>
            </>
          )}
        </div>

        {/* contradictions / reality check */}
        {result.contradictions.length > 0 && (
          <div className="rounded-3xl border border-border bg-card p-6 space-y-3">
            <h2 className="text-lg font-bold">یه چیزی رو رک بگم.</h2>
            {result.contradictions.map((c) => (
              <p key={c.key} className="text-sm leading-loose text-muted-foreground">{c.text}</p>
            ))}
          </div>
        )}

        {/* roadmap */}
        <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-bold">۳۰ روز اول تو</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {roadmap.weeks.map((w, i) => (
              <div key={i} className="rounded-2xl border border-border p-4">
                <div className="text-xs text-muted-foreground">هفته {i + 1}</div>
                <div className="text-sm font-medium mt-1 leading-relaxed">{w}</div>
              </div>
            ))}
          </div>
          <p className="text-sm leading-loose">🎯 هدف اول پیشنهادی تو: {roadmap.goal}</p>
        </div>

        {/* boundless bridge + dynamic journey */}
        <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
          <BlockCard block={content['boundless_bridge'] || DEFAULT_CONTENT['boundless_bridge']} />
          <div className="flex flex-wrap gap-2">
            {roadmap.journey.map((j) => (
              <Badge key={j} variant="outline">{j}</Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {roadmap.tools.map((t) => (
              <span key={t} className="rounded-full bg-primary/10 text-primary text-xs px-3 py-1">{t}</span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-3xl border border-primary/40 bg-primary/5 p-6 space-y-4">
          {ctaKey === 'finish_maza' && (
            <>
              <p className="text-sm leading-loose">
                هنوز برای تصمیم گرفتن عجله نکن. تو فقط {Math.round(mazaProgress || 0)}% مزه بدون مرز رو دیدی. حالا که
                می‌دونی مسیر پیشنهادی تو {PATH_LABELS[path]}ـه، ادامه دوره رو با دید متفاوت ببین.
              </p>
              <Button size="lg" className="w-full h-12" onClick={() => clickCta('ادامه مزه بدون مرز', '/app/courses')}>
                ادامه مزه بدون مرز <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
              <Button variant="outline" className="w-full h-12" onClick={() => clickCta('مشاهده بدون مرز', '/courses/boundless-taste')}>
                من آماده‌ام؛ بدون مرز رو ببینم
              </Button>
            </>
          )}
          {ctaKey === 'start_course' && (
            <>
              <p className="text-sm leading-loose">
                قدم بعدی تو لازم نیست بزرگ باشه. با یک شروع کم‌ریسک، مسیر {PATH_LABELS[path]} رو در عمل امتحان کن.
              </p>
              <Button size="lg" className="w-full h-12" onClick={() => clickCta('شروع مسیر', '/start')}>
                شروع مسیر <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </>
          )}
          {ctaKey === 'consultation' && (
            <>
              <p className="text-sm leading-loose">
                نتیجه تو ارزش بررسی جدی‌تر داره. نتیجه تستت رو برای مشاور بدون مرز می‌فرستیم تا بر اساس همین تحلیل درباره
                مسیر شروع باهات صحبت کنه.
              </p>
              <Button size="lg" className="w-full h-12" onClick={requestConsultation}>
                درخواست مشاوره بدون مرز
              </Button>
              <p className="text-xs text-muted-foreground">
                لازم نیست همه‌چیز رو دوباره برای مشاور توضیح بدی؛ نتیجه تستت همراه درخواست ارسال می‌شه.
              </p>
            </>
          )}
          {ctaKey === 'direct' && (
            <>
              <p className="text-sm leading-loose">
                با این ترکیب از تطابق مسیر و آمادگی اجرا، منطقی‌ترین قدم بعدی دیدن شرایط ورود به بدون مرزه.
              </p>
              <Button size="lg" className="w-full h-12" onClick={() => clickCta('شرایط ورود بدون مرز', '/courses/boundless-taste')}>
                مشاهده شرایط ورود به بدون مرز
              </Button>
              <Button variant="outline" className="w-full h-12" onClick={requestConsultation}>
                اول با مشاور صحبت می‌کنم
              </Button>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default SmartTestV2Result;
