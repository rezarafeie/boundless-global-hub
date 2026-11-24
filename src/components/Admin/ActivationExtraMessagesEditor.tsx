import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { scheduleDuration } from './CourseScheduleSection';
import MessageMediaButtonsEditor, { MessageButton, MessageMediaItem } from './MessageMediaButtonsEditor';

export interface ExtraActivationMessage {
  event: 'welcome' | 'activated';
  target: 'bot' | 'business' | 'both';
  enabled: boolean;
  text: string;
  media_items: MessageMediaItem[];
  buttons: MessageButton[];
  delay_minutes: number;
}

interface Props {
  event: 'welcome' | 'activated';
  value: ExtraActivationMessage[];
  onChange: (next: ExtraActivationMessage[]) => void;
}

/** Editor for extra messages of one activation event (the full list is kept, only this event is shown). */
const ActivationExtraMessagesEditor: React.FC<Props> = ({ event, value, onChange }) => {
  const [expanded, setExpanded] = useState<number | null>(null);
  const all = Array.isArray(value) ? value : [];
  const indexed = all.map((m, i) => ({ m, i })).filter(({ m }) => (m.event ?? 'activated') === event);

  const patch = (i: number, p: Partial<ExtraActivationMessage>) =>
    onChange(all.map((m, idx) => (idx === i ? { ...m, ...p } : m)));
  const remove = (i: number) => onChange(all.filter((_, idx) => idx !== i));
  const add = () => {
    setExpanded(all.length);
    onChange([...all, { event, target: 'bot', enabled: true, text: '', media_items: [], buttons: [], delay_minutes: 0 }]);
  };


  return (
    <div dir="rtl" className="mt-5 space-y-3 border-t pt-4">
      <div className="flex items-center justify-between gap-3"><Label className="text-sm font-semibold">پیام‌های اضافه</Label><Button type="button" size="sm" variant="outline" onClick={add}><Plus className="h-4 w-4" /> افزودن پیام</Button></div>
      {indexed.map(({ m, i }, n) => (
        <Collapsible key={i} open={expanded === i} onOpenChange={open => setExpanded(open ? i : null)} className="border-b border-border">
          <div className="flex items-center gap-3 py-2">
            <Button type="button" variant="ghost" aria-expanded={expanded === i} onClick={() => setExpanded(expanded === i ? null : i)} className="h-auto min-w-0 flex-1 justify-start px-0 py-2 text-right whitespace-normal hover:bg-transparent">
              <span className="min-w-0 flex-1"><span className="block text-sm font-medium">پیام {(n + 1).toLocaleString('fa-IR')}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{m.target === 'business' ? 'چت پشتیبانی' : m.target === 'both' ? 'ربات و پشتیبانی' : 'ربات'} · {scheduleDuration(m.delay_minutes ?? 0)}{m.text ? ' · ' + m.text.slice(0, 45) : ''}</span></span><ChevronDown className={'h-4 w-4 shrink-0 ' + (expanded === i ? 'rotate-180' : '')} />
            </Button>
            <Switch checked={m.enabled !== false} onCheckedChange={v => patch(i, { enabled: v })} aria-label={'فعال بودن پیام ' + (n + 1)} />
          </div>
          <CollapsibleContent forceMount className="space-y-4 pb-5 data-[state=closed]:hidden">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>ارسال از</Label><Select value={m.target || 'bot'} onValueChange={v => patch(i, { target: v as ExtraActivationMessage['target'] })} dir="rtl"><SelectTrigger aria-label="ارسال پیام از"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bot">ربات</SelectItem><SelectItem value="business">چت پشتیبانی (Business)</SelectItem><SelectItem value="both">هر دو</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor={'extra-delay-' + event + i}>تأخیر ارسال (دقیقه)</Label><Input id={'extra-delay-' + event + i} type="number" min={0} value={m.delay_minutes ?? 0} onChange={e => patch(i, { delay_minutes: Math.max(0, Number(e.target.value) || 0) })} /></div>
            </div>
            <Textarea rows={4} dir="rtl" value={m.text || ''} placeholder="متن پیام (اختیاری اگر فایل دارد)" onChange={e => patch(i, { text: e.target.value })} />
            <MessageMediaButtonsEditor mediaUrl={null} mediaType={null} mediaItems={m.media_items ?? []} buttons={m.buttons ?? []} onChange={p => patch(i, { ...(p.media_items !== undefined ? { media_items: p.media_items } : {}), ...(p.buttons !== undefined ? { buttons: p.buttons } : {}) })} />
            <div className="flex justify-end"><Button type="button" size="sm" variant="ghost" onClick={() => { remove(i); setExpanded(null); }}><Trash2 className="h-4 w-4 text-destructive" /> حذف پیام</Button></div>
          </CollapsibleContent>
        </Collapsible>
      ))}
      <p className="text-xs text-muted-foreground">متغیرها: {'{{name}}, {{course_title}}'} · تأخیر صفر: ارسال فوری</p>
    </div>
  );
};
export default ActivationExtraMessagesEditor;
