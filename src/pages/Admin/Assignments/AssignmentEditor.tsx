import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Sparkles, Save, Eye } from 'lucide-react';
import type { Assignment, AssignmentBlock } from '@/types/assignment';
import { AssignmentSection } from '@/components/Assignment/AssignmentSection';
import { BlockBuilder } from '@/components/Assignment/BlockBuilder';

const EMPTY: Partial<Assignment> = {
  title: '',
  description: '',
  blocks: [],
  required: false,
  ai_feedback_enabled: true,
  manual_review_enabled: false,
  ai_feedback_prompt: '',
  estimated_minutes: 10,
  status: 'draft',
  allow_resubmit: true,
  tags: [],
  cta_config: {},
};

const AssignmentEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const [a, setA] = useState<Partial<Assignment>>(EMPTY);
  const [blocks, setBlocks] = useState<AssignmentBlock[]>([]);
  const [blocksJson, setBlocksJson] = useState('[]');
  const [showJson, setShowJson] = useState(false);
  const [ctaJson, setCtaJson] = useState('{}');
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState({ lesson_title: '', lesson_summary: '', learning_goal: '', difficulty: 'متوسط' });
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    supabase.from('courses').select('id, title, slug').eq('is_active', true).order('title').then(({ data }) => setCourses(data || []));
  }, []);

  useEffect(() => {
    if (!a.course_id) { setLessons([]); return; }
    supabase.from('course_lessons').select('id, title, lesson_number').eq('course_id', a.course_id).order('lesson_number')
      .then(({ data }) => setLessons(data || []));
  }, [a.course_id]);

  useEffect(() => {
    if (isNew) return;
    supabase.from('assignments').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setA(data as unknown as Assignment);
        const bl = (data.blocks as unknown as AssignmentBlock[]) || [];
        setBlocks(bl);
        setBlocksJson(JSON.stringify(bl, null, 2));
        setCtaJson(JSON.stringify(data.cta_config, null, 2));
      }
    });
  }, [id, isNew]);

  const syncBlocks = (b: AssignmentBlock[]) => {
    setBlocks(b);
    setBlocksJson(JSON.stringify(b, null, 2));
  };

  const save = async () => {
    let blocksToSave: AssignmentBlock[]; let cta_config: any;
    if (showJson) {
      try { blocksToSave = JSON.parse(blocksJson); } catch { toast.error('JSON بلوک‌ها نامعتبر است'); return; }
    } else {
      blocksToSave = blocks;
    }
    try { cta_config = JSON.parse(ctaJson); } catch { toast.error('JSON CTAها نامعتبر است'); return; }
    if (!a.title) { toast.error('عنوان الزامی است'); return; }

    setSaving(true);
    const payload = { ...a, blocks: blocksToSave, cta_config };
    delete (payload as any).id; delete (payload as any).created_at; delete (payload as any).updated_at;

    if (isNew) {
      const { data, error } = await supabase.from('assignments').insert(payload as any).select().single();
      if (error) { toast.error('خطا: ' + error.message); setSaving(false); return; }
      toast.success('ذخیره شد');
      navigate(`/admin/assignments/${data.id}`);
    } else {
      const { error } = await supabase.from('assignments').update(payload as any).eq('id', id);
      if (error) toast.error('خطا: ' + error.message);
      else toast.success('ذخیره شد');
    }
    setSaving(false);
  };

  const runAI = async () => {
    setAiLoading(true);
    const { data, error } = await supabase.functions.invoke('ai-generate-assignment', {
      body: { ...aiPrompt, ai_feedback: true },
    });
    setAiLoading(false);
    if (error) { toast.error('خطا در AI'); return; }
    const gen = (data as any)?.assignment;
    if (!gen) { toast.error('پاسخ نامعتبر'); return; }
    setA((prev) => ({
      ...prev,
      title: gen.title || prev.title,
      description: gen.description || prev.description,
      estimated_minutes: gen.estimated_minutes || prev.estimated_minutes,
      ai_feedback_enabled: gen.ai_feedback_enabled ?? prev.ai_feedback_enabled,
      ai_feedback_prompt: gen.ai_feedback_prompt || prev.ai_feedback_prompt,
    }));
    const genBlocks = (gen.blocks || []) as AssignmentBlock[];
    setBlocks(genBlocks);
    setBlocksJson(JSON.stringify(genBlocks, null, 2));
    setAiOpen(false);
    toast.success('پیش‌نویس با AI ساخته شد. قبل از ذخیره بررسی کنید.');
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl" dir="rtl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{isNew ? 'تمرین جدید' : 'ویرایش تمرین'}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAiOpen(!aiOpen)}>
            <Sparkles className="h-4 w-4 ml-2" /> ساخت با AI
          </Button>
          <Button onClick={save} disabled={saving}>
            <Save className="h-4 w-4 ml-2" /> {saving ? 'در حال ذخیره...' : 'ذخیره'}
          </Button>
        </div>
      </div>

      {aiOpen && (
        <Card className="mb-4 border-primary/40">
          <CardHeader><CardTitle className="text-base">ساخت تمرین با AI</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>عنوان درس</Label><Input value={aiPrompt.lesson_title} onChange={(e) => setAiPrompt({ ...aiPrompt, lesson_title: e.target.value })} /></div>
              <div><Label>سطح</Label>
                <Select value={aiPrompt.difficulty} onValueChange={(v) => setAiPrompt({ ...aiPrompt, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="مقدماتی">مقدماتی</SelectItem>
                    <SelectItem value="متوسط">متوسط</SelectItem>
                    <SelectItem value="پیشرفته">پیشرفته</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>هدف یادگیری</Label><Input value={aiPrompt.learning_goal} onChange={(e) => setAiPrompt({ ...aiPrompt, learning_goal: e.target.value })} /></div>
            <div><Label>خلاصه درس</Label><Textarea rows={3} value={aiPrompt.lesson_summary} onChange={(e) => setAiPrompt({ ...aiPrompt, lesson_summary: e.target.value })} /></div>
            <Button onClick={runAI} disabled={aiLoading}>{aiLoading ? 'در حال ساخت...' : 'ساخت'}</Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">اطلاعات کلی</TabsTrigger>
          <TabsTrigger value="blocks">بلوک‌ها (JSON)</TabsTrigger>
          <TabsTrigger value="ai">AI و بازخورد</TabsTrigger>
          <TabsTrigger value="cta">CTA</TabsTrigger>
          {!isNew && <TabsTrigger value="preview"><Eye className="h-4 w-4 ml-1" />پیش‌نمایش</TabsTrigger>}
        </TabsList>

        <TabsContent value="general" className="space-y-3">
          <div><Label>عنوان</Label><Input value={a.title || ''} onChange={(e) => setA({ ...a, title: e.target.value })} /></div>
          <div><Label>توضیح</Label><Textarea rows={3} value={a.description || ''} onChange={(e) => setA({ ...a, description: e.target.value })} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>دوره</Label>
              <Select value={a.course_id || ''} onValueChange={(v) => setA({ ...a, course_id: v, lesson_id: null })}>
                <SelectTrigger><SelectValue placeholder="انتخاب دوره" /></SelectTrigger>
                <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>درس</Label>
              <Select value={a.lesson_id || ''} onValueChange={(v) => setA({ ...a, lesson_id: v })}>
                <SelectTrigger><SelectValue placeholder="انتخاب درس" /></SelectTrigger>
                <SelectContent>{lessons.map((l) => <SelectItem key={l.id} value={l.id}>{l.lesson_number}. {l.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><Label>زمان تخمینی (دقیقه)</Label><Input type="number" value={a.estimated_minutes || 0} onChange={(e) => setA({ ...a, estimated_minutes: Number(e.target.value) })} /></div>
            <div><Label>حداقل نمره قبولی</Label><Input type="number" value={a.passing_score || 0} onChange={(e) => setA({ ...a, passing_score: Number(e.target.value) })} /></div>
            <div>
              <Label>وضعیت</Label>
              <Select value={a.status} onValueChange={(v: any) => setA({ ...a, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">پیش‌نویس</SelectItem>
                  <SelectItem value="published">منتشر شده</SelectItem>
                  <SelectItem value="archived">بایگانی</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2"><Switch checked={!!a.required} onCheckedChange={(v) => setA({ ...a, required: v })} /><Label>اجباری</Label></div>
            <div className="flex items-center gap-2"><Switch checked={!!a.allow_resubmit} onCheckedChange={(v) => setA({ ...a, allow_resubmit: v })} /><Label>اجازه ارسال مجدد</Label></div>
            <div className="flex items-center gap-2"><Switch checked={!!a.manual_review_enabled} onCheckedChange={(v) => setA({ ...a, manual_review_enabled: v })} /><Label>بررسی توسط ادمین</Label></div>
          </div>
        </TabsContent>

        <TabsContent value="blocks">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-muted-foreground">
              بلوک‌ها را به صورت بصری بسازید. برای تنظیمات پیشرفته می‌توانید به حالت JSON بروید.
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={showJson}
                onCheckedChange={(v) => {
                  if (v) {
                    setBlocksJson(JSON.stringify(blocks, null, 2));
                  } else {
                    try {
                      const parsed = JSON.parse(blocksJson) as AssignmentBlock[];
                      setBlocks(parsed);
                    } catch { toast.error('JSON نامعتبر؛ اصلاح کنید یا حالت بصری را انتخاب کنید'); return; }
                  }
                  setShowJson(v);
                }}
              />
              <Label className="text-xs">حالت JSON</Label>
            </div>
          </div>
          {showJson ? (
            <Textarea rows={20} className="font-mono text-xs" dir="ltr" value={blocksJson} onChange={(e) => setBlocksJson(e.target.value)} />
          ) : (
            <BlockBuilder blocks={blocks} onChange={syncBlocks} />
          )}

        <TabsContent value="ai" className="space-y-3">
          <div className="flex items-center gap-2"><Switch checked={!!a.ai_feedback_enabled} onCheckedChange={(v) => setA({ ...a, ai_feedback_enabled: v })} /><Label>فعال‌سازی بازخورد هوشمند</Label></div>
          <div><Label>پرامپت بازخورد AI</Label>
            <Textarea rows={6} value={a.ai_feedback_prompt || ''} onChange={(e) => setA({ ...a, ai_feedback_prompt: e.target.value })} placeholder="به عنوان کوچ آکادمی رفیعی، پاسخ کاربر را تحلیل کن..." />
          </div>
        </TabsContent>

        <TabsContent value="cta">
          <div className="text-xs text-muted-foreground mb-2">
            مثال: {'{ "ctas": [ { "type": "smart_test", "label": "انجام تست هوشمند" }, { "type": "support", "label": "فعال‌سازی پشتیبانی" } ] }'}
          </div>
          <Textarea rows={10} className="font-mono text-xs" dir="ltr" value={ctaJson} onChange={(e) => setCtaJson(e.target.value)} />
        </TabsContent>

        {!isNew && a.lesson_id && (
          <TabsContent value="preview">
            <AssignmentSection lessonId={a.lesson_id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AssignmentEditor;
