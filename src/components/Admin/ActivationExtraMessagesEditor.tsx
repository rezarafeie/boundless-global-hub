import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
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
  const all = Array.isArray(value) ? value : [];
  const indexed = all.map((m, i) => ({ m, i })).filter(({ m }) => (m.event ?? 'activated') === event);

  const patch = (i: number, p: Partial<ExtraActivationMessage>) =>
    onChange(all.map((m, idx) => (idx === i ? { ...m, ...p } : m)));
  const remove = (i: number) => onChange(all.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([...all, { event, target: 'bot', enabled: true, text: '', media_items: [], buttons: [], delay_minutes: 0 }]);

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>پیام‌های اضافه</Label>
          <p className="text-xs text-muted-foreground mt-1">
            هر تعداد پیام دیگر (متن، عکس، ویدیو، فایل، ویس) با تاخیر دلخواه. تاخیر ۰ یعنی ارسال فوری. پیام‌های دارای تاخیر حداکثر چند دقیقه دیرتر از زمان تعیین‌شده ارسال می‌شوند.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={add}><Plus className="h-3 w-3 ml-1" /> افزودن پیام</Button>
      </div>
      {indexed.map(({ m, i }, n) => (
        <div key={i} className="border rounded p-3 space-y-3 bg-background/60">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold">پیام {n + 1}</span>
            <Switch checked={m.enabled !== false} onCheckedChange={(v) => patch(i, { enabled: v })} />
            <Select value={m.target || 'bot'} onValueChange={(v) => patch(i, { target: v as any })}>
              <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bot">ربات</SelectItem>
                <SelectItem value="business">چت پشتیبانی (Business)</SelectItem>
                <SelectItem value="both">هر دو</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Label className="text-xs">تاخیر (دقیقه)</Label>
              <Input type="number" min={0} className="h-8 w-24" value={m.delay_minutes ?? 0}
                onChange={(e) => patch(i, { delay_minutes: Math.max(0, Number(e.target.value) || 0) })} />
            </div>
            <Button type="button" size="sm" variant="ghost" className="mr-auto" onClick={() => remove(i)}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
          <Textarea rows={4} dir="rtl" value={m.text || ''} placeholder="متن پیام (اختیاری اگر فایل دارد)"
            onChange={(e) => patch(i, { text: e.target.value })} />
          <MessageMediaButtonsEditor
            mediaUrl={null}
            mediaType={null}
            mediaItems={m.media_items ?? []}
            buttons={m.buttons ?? []}
            onChange={(p) => patch(i, {
              ...(p.media_items !== undefined ? { media_items: p.media_items } : {}),
              ...(p.buttons !== undefined ? { buttons: p.buttons } : {}),
            })}
          />
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground">متغیرها: {'{{name}}, {{course_title}}'} — در بله، پیام‌های «چت پشتیبانی» از ربات بله ارسال می‌شوند.</p>
    </div>
  );
};

export default ActivationExtraMessagesEditor;
