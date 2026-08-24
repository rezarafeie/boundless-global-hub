import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Code2, Copy, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  webinarId: string;
  currentMaxOrder: number;
  onImported: () => void;
}

const VALID_TYPES = ['poll', 'quiz', 'checkin', 'task', 'cta', 'reaction', 'banner'];

const SAMPLES: { key: string; label: string; json: string }[] = [
  {
    key: 'poll',
    label: '📊 نظرسنجی (poll)',
    json: `{
  "type": "poll",
  "title": "نظرسنجی سریع",
  "question": "کدام موضوع برای شما جذاب‌تر است؟",
  "options": [
    { "id": "1", "text": "فروش بین‌المللی" },
    { "id": "2", "text": "درآمد دلاری" }
  ],
  "settings": {
    "allow_late": false,
    "show_results_immediately": true,
    "timer_duration": 30,
    "anonymous": false
  }
}`,
  },
  {
    key: 'quiz',
    label: '🧠 کوییز (quiz)',
    json: `{
  "type": "quiz",
  "title": "کوییز شماره ۱",
  "question": "کدام گزینه درست است؟",
  "options": [
    { "id": "1", "text": "گزینه درست", "is_correct": true },
    { "id": "2", "text": "گزینه غلط", "is_correct": false }
  ],
  "settings": {
    "timer_duration": 20,
    "points_enabled": true,
    "show_results_immediately": true,
    "explanation": "توضیح پاسخ صحیح اینجا نمایش داده می‌شود"
  }
}`,
  },
  {
    key: 'checkin',
    label: '✋ حضور (checkin)',
    json: `{
  "type": "checkin",
  "title": "اعلام حضور",
  "question": "اگر همراه ما هستید کلیک کنید",
  "settings": { "timer_duration": 60 }
}`,
  },
  {
    key: 'task',
    label: '📝 تکلیف (task)',
    json: `{
  "type": "task",
  "title": "تمرین کلاسی",
  "question": "در یک جمله هدف امسال خود را بنویسید",
  "settings": { "char_limit": 200, "anonymous": false }
}`,
  },
  {
    key: 'cta',
    label: '🔗 لینک / CTA (cta)',
    json: `{
  "type": "cta",
  "title": "ثبت‌نام دوره",
  "settings": {
    "cta_description": "ظرفیت محدود است، همین حالا ثبت‌نام کنید",
    "button_label": "ثبت‌نام",
    "link_url": "https://academy.rafiei.co/courses/boundless"
  }
}`,
  },
  {
    key: 'reaction',
    label: '⚡ واکنش (reaction)',
    json: `{
  "type": "reaction",
  "title": "واکنش شما؟",
  "settings": { "scale_max": 5 }
}`,
  },
  {
    key: 'banner',
    label: '📢 بنر اعلان (banner)',
    json: `{
  "type": "banner",
  "title": "شروع وبینار",
  "settings": {
    "banner_title": "وبینار راس ساعت ۸ شروع خواهد شد",
    "banner_description": "از ساعت ۷:۴۵ محتواهای جذاب پخش می‌شود",
    "banner_icon": "🔴",
    "banner_background": "linear-gradient(135deg,#1e3a8a,#3b82f6)",
    "banner_text_color": "#ffffff",
    "button_label": "ورود به وبینار",
    "link_url": "https://academy.rafiei.co/webinar/live",
    "countdown_to": "2026-08-24T20:00:00+03:30"
  }
}`,
  },
  {
    key: 'bulk',
    label: '📦 چند کارت با هم (آرایه)',
    json: `[
  {
    "type": "banner",
    "title": "خوش آمدید",
    "settings": { "banner_title": "به وبینار خوش آمدید", "banner_icon": "👋" }
  },
  {
    "type": "poll",
    "title": "نظرسنجی ورودی",
    "question": "از کجا ما را شناختید؟",
    "options": [
      { "id": "1", "text": "اینستاگرام" },
      { "id": "2", "text": "دوستان" }
    ]
  }
]`,
  },
];

const InteractionJsonImport: React.FC<Props> = ({ webinarId, currentMaxOrder, onImported }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState('');
  const [saving, setSaving] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'کپی شد ✅' });
  };

  const handleImport = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      toast({ title: 'JSON نامعتبر است', description: 'ساختار کد را بررسی کنید', variant: 'destructive' });
      return;
    }

    const items = Array.isArray(parsed) ? parsed : [parsed];
    const rows: Record<string, unknown>[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i] as Record<string, any>;
      if (!item || typeof item !== 'object') {
        toast({ title: `آیتم ${i + 1} نامعتبر است`, variant: 'destructive' });
        return;
      }
      if (!VALID_TYPES.includes(item.type)) {
        toast({ title: `آیتم ${i + 1}: نوع نامعتبر «${item.type}»`, description: `مجاز: ${VALID_TYPES.join(', ')}`, variant: 'destructive' });
        return;
      }
      if (!item.title || typeof item.title !== 'string') {
        toast({ title: `آیتم ${i + 1}: عنوان (title) الزامی است`, variant: 'destructive' });
        return;
      }
      const options = ['poll', 'quiz'].includes(item.type) && Array.isArray(item.options)
        ? item.options
            .filter((o: any) => o && typeof o.text === 'string' && o.text.trim())
            .map((o: any, idx: number) => ({
              id: String(o.id ?? idx + 1),
              text: String(o.text),
              is_correct: Boolean(o.is_correct),
            }))
        : null;

      if (['poll', 'quiz'].includes(item.type) && (!options || options.length < 2)) {
        toast({ title: `آیتم ${i + 1}: حداقل ۲ گزینه لازم است`, variant: 'destructive' });
        return;
      }

      rows.push({
        webinar_id: webinarId,
        type: item.type,
        title: item.title,
        question: item.question ?? null,
        options,
        settings: typeof item.settings === 'object' && item.settings ? item.settings : {},
        status: 'draft',
        order_index: currentMaxOrder + i,
      });
    }

    setSaving(true);
    const { error } = await supabase.from('webinar_interactions').insert(rows as never);
    setSaving(false);

    if (error) {
      toast({ title: 'خطا در ذخیره', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: `${rows.length} تعامل ایجاد شد ✅` });
    setRaw('');
    setOpen(false);
    onImported();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Code2 className="h-4 w-4 ml-2" />
          افزودن با JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader><DialogTitle>ایجاد تعامل با JSON</DialogTitle></DialogHeader>

        <Tabs defaultValue="import" className="space-y-4">
          <TabsList>
            <TabsTrigger value="import">ورود JSON</TabsTrigger>
            <TabsTrigger value="guide">راهنما و نمونه‌ها</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-3">
            <p className="text-xs text-muted-foreground">
              یک آبجکت یا آرایه‌ای از آبجکت‌ها را وارد کنید. کارت‌ها به صورت «پیش‌نویس» ساخته می‌شوند و بعداً می‌توانید آن‌ها را زنده کنید.
            </p>
            <Textarea
              dir="ltr"
              rows={14}
              className="font-mono text-xs"
              placeholder={SAMPLES[0].json}
              value={raw}
              onChange={e => setRaw(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setRaw('')}>پاک کردن</Button>
              <Button onClick={handleImport} disabled={saving || !raw.trim()}>
                <Upload className="h-4 w-4 ml-2" />
                {saving ? 'در حال ذخیره...' : 'ایجاد تعامل‌ها'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="guide" className="space-y-3">
            <div className="text-xs text-muted-foreground space-y-1 leading-relaxed">
              <p><b>ساختار کلی:</b> <code dir="ltr">{'{ type, title, question?, options?, settings? }'}</code></p>
              <p><b>type</b> (الزامی): {VALID_TYPES.join(' | ')}</p>
              <p><b>title</b> (الزامی): عنوان داخلی کارت</p>
              <p><b>question</b>: متن سوال (برای poll/quiz/checkin/task)</p>
              <p><b>options</b>: فقط برای poll و quiz، حداقل ۲ گزینه، هر گزینه <code dir="ltr">{'{ id, text, is_correct? }'}</code></p>
              <p><b>settings</b>: کلیدهای اختیاری — <code dir="ltr">allow_late, show_results_immediately, timer_duration, points_enabled, anonymous, char_limit, explanation, scale_max, button_label, link_url, cta_description, banner_title, banner_description, banner_icon, banner_background, banner_text_color, countdown_to</code></p>
              <p><b>countdown_to</b>: تاریخ ISO با تایم‌زون تهران، مثال <code dir="ltr">2026-08-24T20:00:00+03:30</code></p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {SAMPLES.map(s => (
                <AccordionItem key={s.key} value={s.key}>
                  <AccordionTrigger className="text-sm">{s.label}</AccordionTrigger>
                  <AccordionContent>
                    <pre dir="ltr" className="bg-muted rounded-lg p-3 text-[11px] overflow-x-auto">{s.json}</pre>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={() => copy(s.json)}>
                        <Copy className="h-3 w-3 ml-1" /> کپی
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setRaw(s.json)}>
                        استفاده در ویرایشگر
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default InteractionJsonImport;
