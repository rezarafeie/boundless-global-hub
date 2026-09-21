import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, ChevronDown, CircleAlert, Compass, Route, Send, ShieldCheck } from 'lucide-react';
import { fetchSubmission, loadContent, trackEvent, updateSubmission } from '@/lib/smartTestV2/store';
import { DEFAULT_CONTENT, ROADMAPS, type ContentBlock } from '@/data/smartTestV2/content';
import { PATH_FA, PATH_LABELS, type PathId } from '@/data/smartTestV2/types';
import { computeResult } from '@/lib/smartTestV2/engine';
import { alternativeNote, notNowNote, pathActions, pathReasonLine, profileNarrative, riskCorrection } from '@/lib/smartTestV2/presentation';
import BlockCard from '@/components/SmartTestV2/BlockCard';
import DiagnosticShell from '@/components/SmartTestV2/DiagnosticShell';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MAZA_COURSE_ID = 'b97c19b7-98d3-4891-b00f-93bfb7711487';
const DIMENSIONS = [['تجاری', 'commercial'], ['خلاق', 'creative'], ['فنی', 'technical'], ['اجرا', 'execution']] as const;

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
    supabase.from('user_course_progress').select('progress_percentage').eq('user_id', uid).eq('course_id', MAZA_COURSE_ID).maybeSingle().then(({ data }) => {
      const progressValue = (data as any)?.progress_percentage;
      if (typeof progressValue === 'number') {
        setMazaProgress(progressValue);
        if (id) updateSubmission(id, { maza_progress: Math.round(progressValue) });
      }
    });
  }, [user, id]);

  const result = useMemo(() => row?.answers ? computeResult(row.answers) : null, [row]);
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

  if (loading) return <DiagnosticShell compact><div className="max-w-4xl mx-auto px-4 py-24"><div className="h-px bg-border overflow-hidden"><div className="h-full w-1/2 bg-primary animate-pulse" /></div><p className="mt-5 text-sm text-muted-foreground">نتیجه ذخیره‌شده در حال بازشدنه...</p></div></DiagnosticShell>;
  if (!row || !result) return <DiagnosticShell compact><div className="max-w-xl mx-auto px-4 py-24 text-center space-y-5"><p className="text-muted-foreground">نتیجه‌ای پیدا نشد.</p><Button onClick={() => navigate('/smart-test-v2')}>شروع تست</Button></div></DiagnosticShell>;

  const path = result.recommended.path as PathId;
  const roadmap = ROADMAPS[path];
  const actions = pathActions[path];
  const profileCopy = profileNarrative(result.profile);
  const proof = content[`result_proof_${path}`];
  const hasProof = proof?.media?.some((item) => item.kind === 'text' ? item.caption : item.url || item.urls?.length);

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
    <DiagnosticShell compact>
      <div dir="rtl" className="overflow-hidden">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-24 min-h-[calc(100dvh-5rem)] flex items-center">
          <div className="w-full grid lg:grid-cols-[.72fr_1.28fr] gap-12 items-end">
            <div className="lg:pb-5 space-y-6 animate-fade-in">
              <p className="text-sm font-black text-primary">از بین ۵ مسیر...</p>
              <div className="space-y-2 text-muted-foreground">
                {result.ranked.slice(1).map((item) => <div key={item.path} className="flex items-center gap-3 text-sm line-through opacity-50"><span className="w-5 h-px bg-border" />{PATH_LABELS[item.path]}</div>)}
              </div>
              <p className="text-sm leading-loose text-muted-foreground border-r border-border pr-4">چهار مسیر کنار نرفتن چون بد هستن؛ کنار رفتن چون امروز نقطه شروع بهتری برای تو وجود داره.</p>
            </div>
            <div className="space-y-7 animate-fade-up">
              <p className="text-sm text-muted-foreground">مسیر پیشنهادی تو</p>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[1.15]" dir="ltr">{PATH_LABELS[path]}</h1>
              <p className="text-lg sm:text-2xl text-muted-foreground">{PATH_FA[path]}</p>
              <div className="border-r-4 border-primary pr-5"><p className="text-xl sm:text-3xl font-black leading-[1.7]">{pathReasonLine(path, result.profile)}</p></div>
              <a href="#why" className="inline-flex items-center gap-2 text-sm font-bold text-primary">بذار بگم چرا <ArrowLeft className="w-4 h-4" /></a>
            </div>
          </div>
        </section>

        <section id="why" className="bg-foreground text-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-[.55fr_1.45fr] gap-12">
            <div><p className="text-primary font-black text-sm">شواهد خودت</p><h2 className="text-3xl sm:text-5xl font-black leading-[1.5] mt-3">چرا این مسیر؟</h2><p className="text-background/60 leading-loose mt-5">این دلیل‌ها توضیح عمومی مسیر نیستن؛ مستقیم از جواب‌هایی اومدن که خودت دادی.</p></div>
            <div className="space-y-2">
              {result.reasonsForRecommended.map((reason, index) => (
                <div key={`${reason.reason}-${index}`} className="grid grid-cols-[42px_1fr] gap-4 py-5 border-b border-background/15"><span className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center"><Check className="w-4 h-4" /></span><p className="text-base sm:text-xl leading-loose">{reason.reason}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid lg:grid-cols-[.65fr_1.35fr] gap-12">
            <div><span className="text-sm font-black text-primary">نسخه عملی نتیجه</span><h2 className="text-4xl sm:text-6xl font-black leading-[1.45] mt-4">اگر جای تو بودم...</h2><p className="text-muted-foreground leading-loose mt-5">به جای جمع‌کردن اطلاعات بیشتر، این سه خروجی رو می‌ساختم.</p></div>
            <ol className="border-t border-border">
              {actions.map((item, index) => <li key={item.title} className="grid sm:grid-cols-[80px_1fr] gap-5 py-7 border-b border-border"><span className="text-4xl font-black text-primary/25">۰{index + 1}</span><div><p className="text-xs font-black text-primary">{item.title}</p><p className="text-lg font-bold leading-loose mt-2">{item.action}</p><p className="text-sm text-muted-foreground mt-2">{item.output}</p></div></li>)}
            </ol>
          </div>
        </section>

        <section className="bg-muted/50 border-y border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid lg:grid-cols-[.7fr_1.3fr] gap-10 items-start">
            <CircleAlert className="w-14 h-14 text-destructive" />
            <div className="space-y-5"><p className="text-sm font-black text-destructive">بزرگ‌ترین ریسک تو</p><h2 className="text-3xl sm:text-5xl font-black leading-[1.5]">اما یه چیز ممکنه کل این برنامه رو خراب کنه.</h2><p className="text-lg sm:text-xl leading-loose">{result.weakness || 'مسیر عوض‌کردن قبل از اینکه از انتخاب فعلی یک خروجی واقعی بگیری.'}</p><div className="border-r-4 border-primary pr-5"><p className="text-sm text-muted-foreground">اصلاح مشخص</p><p className="font-bold leading-loose mt-2">{riskCorrection(result.weakness)}</p></div></div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-12">
          <div className="space-y-5"><p className="text-sm font-black text-primary">مسیر دوم تو</p><h2 className="text-3xl sm:text-5xl font-black" dir="ltr">{PATH_LABELS[result.alternative.path]}</h2><p className="text-muted-foreground leading-loose">{alternativeNote(row.answers, result.alternative.path)}</p></div>
          {result.notNow && <div className="lg:border-r lg:border-border lg:pr-10 space-y-5"><p className="text-sm font-black text-muted-foreground">فعلاً سراغ چی نری؟</p><h2 className="text-3xl sm:text-5xl font-black text-muted-foreground" dir="ltr">{PATH_LABELS[result.notNow.path]}</h2><p className="text-muted-foreground leading-loose">{notNowNote(row.answers, result.notNow.path)}</p></div>}
        </section>

        {result.contradictions.length > 0 && <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24"><div className="border-r-4 border-foreground pr-6 max-w-4xl"><p className="text-sm font-black text-primary">یه چیزی رو رک بگم.</p>{result.contradictions.map((item) => <p key={item.key} className="text-lg sm:text-2xl font-bold leading-loose mt-4">{item.text}</p>)}</div></section>}

        <section className="bg-primary text-primary-foreground">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <div className="max-w-3xl mb-12"><p className="text-sm font-black opacity-75">نقشه شروع</p><h2 className="text-4xl sm:text-6xl font-black mt-3">۳۰ روز اول تو</h2><p className="mt-5 text-lg leading-loose opacity-80">هدف این ۳۰ روز: {roadmap.goal}</p></div>
            <div className="grid lg:grid-cols-4 border-t border-primary-foreground/30">
              {roadmap.weeks.map((week, index) => <div key={week} className={cn('py-7 lg:px-6 border-b lg:border-b-0 border-primary-foreground/30', index > 0 && 'lg:border-r')}><span className="text-xs opacity-70">هفته {index + 1}</span><h3 className="text-xl font-black leading-relaxed mt-3">{week.split('+')[0]}</h3><p className="text-sm leading-loose opacity-80 mt-4">{actions[index]?.action}</p><p className="text-xs mt-5 pt-4 border-t border-primary-foreground/20 opacity-70">{actions[index]?.output}</p></div>)}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-4xl space-y-7"><p className="text-sm font-black text-primary">تست مسیر رو پیدا کرد.</p><h2 className="text-4xl sm:text-7xl font-black leading-[1.35]">ولی مسیر به‌تنهایی پول نمی‌سازه.<br />اجرا می‌سازه.</h2><p className="text-lg sm:text-xl leading-loose text-muted-foreground">مسئله بعدی اینه که چطور همین مسیر رو از داخل ایران یا خارج ایران، با ابزار، زیرساخت، پرداخت، فروش و اجرای واقعی جلو ببری.</p></div>
          <div className="mt-14 grid lg:grid-cols-[.65fr_1.35fr] gap-10">
            <BlockCard block={content.boundless_bridge || DEFAULT_CONTENT.boundless_bridge} />
            <div><p className="text-sm font-black text-primary mb-5">مسیر تو داخل بدون مرز</p><div className="flex flex-col">{roadmap.journey.map((item, index) => <div key={item} className="flex items-center gap-4 py-3"><span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-xs font-black">{index + 1}</span><span className="font-bold">{item}</span>{index < roadmap.journey.length - 1 && <span className="h-px bg-border flex-1" />}</div>)}</div><div className="flex flex-wrap gap-2 mt-7">{roadmap.tools.map((tool) => <span key={tool} className="px-3 py-2 bg-muted text-xs font-bold rounded-md">{tool}</span>)}</div></div>
          </div>
        </section>

        {hasProof && <section className="bg-muted/40 border-y border-border"><div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24"><BlockCard block={proof} /></div></section>}

        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid lg:grid-cols-[.7fr_1.3fr] gap-10 items-start">
            <div><Compass className="w-10 h-10 text-primary" /><p className="text-sm font-black text-primary mt-6">قدم بعدی تو</p></div>
            <div className="space-y-6">
              {ctaKey === 'finish_maza' && <><h2 className="text-3xl sm:text-5xl font-black leading-[1.5]">هنوز تصمیم نگیر.</h2><p className="text-lg text-muted-foreground leading-loose">تو فقط {Math.round(mazaProgress || 0)}٪ مزه بدون مرز رو دیدی. حالا که می‌دونی مسیر پیشنهادی تو {PATH_LABELS[path]}ـه، ادامه‌ش رو با نگاه متفاوت ببین.</p><Button size="lg" className="w-full sm:w-auto h-14 px-8" onClick={() => clickCta('ادامه مزه بدون مرز', '/app/courses')}>ادامه مزه بدون مرز <ArrowLeft className="w-4 h-4 mr-2" /></Button><Button variant="ghost" size="lg" className="w-full sm:w-auto h-14" onClick={() => clickCta('مشاهده بدون مرز', '/courses/boundless-taste')}>من آماده‌ام مسیر بعدی رو ببینم</Button></>}
              {ctaKey === 'start_course' && <><h2 className="text-3xl sm:text-5xl font-black leading-[1.5]">اول مسیر رو امتحان کن.</h2><p className="text-lg text-muted-foreground leading-loose">قدم بعدی لازم نیست بزرگ باشه. با یک شروع کم‌ریسک، {PATH_LABELS[path]} رو در عمل امتحان کن.</p><Button size="lg" className="h-14 px-8" onClick={() => clickCta('شروع مسیر', '/start')}>شروع مسیر <ArrowLeft className="w-4 h-4 mr-2" /></Button></>}
              {ctaKey === 'consultation' && <><h2 className="text-3xl sm:text-5xl font-black leading-[1.5]">نتیجه تو ارزش بررسی جدی‌تر داره.</h2><p className="text-lg text-muted-foreground leading-loose">نتیجه کامل تست به‌صورت خودکار همراه درخواست برای مشاور ارسال می‌شه؛ لازم نیست جواب‌ها رو دوباره توضیح بدی.</p><Button size="lg" className="h-14 px-8" onClick={requestConsultation}>نتیجه‌م رو برای مشاور بفرست <Send className="w-4 h-4 mr-2" /></Button></>}
              {ctaKey === 'direct' && <><h2 className="text-3xl sm:text-5xl font-black leading-[1.5]">مسیرت روشنه. حالا ساختار کاملش رو ببین.</h2><p className="text-lg text-muted-foreground leading-loose">اگر این نتیجه با چیزی که از خودت می‌شناسی هم‌خوانه، قدم بعدی دیدن مسیر {PATH_LABELS[path]} داخل بدون مرزه.</p><Button size="lg" className="w-full sm:w-auto h-14 px-8" onClick={() => clickCta('مسیر من داخل بدون مرز', '/courses/boundless-taste')}>مسیر من داخل بدون مرز <ArrowLeft className="w-4 h-4 mr-2" /></Button><Button variant="ghost" size="lg" className="w-full sm:w-auto h-14" onClick={requestConsultation}>اول با مشاور صحبت می‌کنم</Button></>}
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          <details className="group border-y border-border py-6">
            <summary className="cursor-pointer flex items-center justify-between font-black text-lg">جزئیات تحلیل من <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" /></summary>
            <div className="pt-8 grid lg:grid-cols-[.65fr_1.35fr] gap-10">
              <div className="space-y-5"><div><p className="text-xs text-muted-foreground">Match</p><p className="text-4xl font-black text-primary">{result.recommended.match}٪</p></div><div><p className="text-xs text-muted-foreground">آمادگی اجرا</p><p className="text-3xl font-black">{result.readiness}٪</p></div><div><p className="text-xs text-muted-foreground">اطمینان تحلیل</p><p className="text-xl font-black">{result.confidenceFa}</p></div><p className="text-xs leading-loose text-muted-foreground flex gap-2"><ShieldCheck className="w-4 h-4 shrink-0" />Match فقط میزان تطابق پاسخ‌های تو با ویژگی‌های مسیر است؛ تضمین نتیجه یا درآمد نیست.</p></div>
              <div><h3 className="text-2xl font-black">{profileCopy.title}</h3><p className="text-sm text-muted-foreground leading-loose mt-3">{profileCopy.description}</p><div className="space-y-5 mt-8">{DIMENSIONS.map(([label, key]) => <div key={key}><div className="flex justify-between text-xs"><span>{label}</span><span>{result.profile[key]}</span></div><div className="h-1 bg-muted mt-2"><div className="h-full bg-primary" style={{ width: `${result.profile[key]}%` }} /></div></div>)}</div></div>
            </div>
          </details>
          <Button variant="ghost" className="mt-6" onClick={() => navigate('/smart-test-v2')}><ArrowRight className="w-4 h-4 ml-2" /> شروع یک تحلیل تازه</Button>
        </section>
      </div>
    </DiagnosticShell>
  );
};

export default SmartTestV2Result;
