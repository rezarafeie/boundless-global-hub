import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Paperclip, Plus, Trash2, X } from 'lucide-react';

export interface MessageButton {
  text: string;
  url: string;
  type?: string;
}

export interface MessageMediaItem {
  url: string;
  type?: string | null;
}

export const MEDIA_TYPES = [
  { value: 'photo', label: '🖼 عکس' },
  { value: 'video', label: '🎬 ویدیو' },
  { value: 'voice', label: '🎙 پیام صوتی' },
  { value: 'audio', label: '🎵 موسیقی / صوت' },
  { value: 'animation', label: '🌀 گیف' },
  { value: 'document', label: '📎 فایل' },
];

const VOICE_EXT = ['ogg', 'oga', 'opus'];

const guessType = (file: File): string => {
  const t = file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (VOICE_EXT.includes(ext) || t === 'audio/ogg' || t === 'audio/opus' || t === 'audio/webm') return 'voice';
  if (t.startsWith('image/gif') || ext === 'gif') return 'animation';
  if (t.startsWith('image/')) return 'photo';
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('audio/')) return 'audio';
  return 'document';
};

interface Props {
  mediaUrl: string | null;
  mediaType: string | null;
  buttons: MessageButton[] | null;
  /** Extra attachments (multi-file). When provided the editor works in multi-file mode. */
  mediaItems?: MessageMediaItem[] | null;
  onChange: (patch: {
    media_url?: string | null;
    media_type?: string | null;
    media_items?: MessageMediaItem[];
    buttons?: MessageButton[];
  }) => void;
  /** @deprecated buttons are now sent as real inline buttons on business chats too */
  buttonsAsLinksHint?: boolean;
  extraButtonTypes?: { value: string; label: string }[];
  hideButtons?: boolean;
}

const MessageMediaButtonsEditor: React.FC<Props> = ({
  mediaUrl,
  mediaType,
  buttons,
  mediaItems,
  onChange,
  extraButtonTypes,
  hideButtons,
}) => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const list = Array.isArray(buttons) ? buttons : [];
  const multi = Array.isArray(mediaItems);

  // Unified attachment list (multi mode falls back to the legacy single field).
  const items: MessageMediaItem[] = multi
    ? (mediaItems as MessageMediaItem[])
    : (mediaUrl ? [{ url: mediaUrl, type: mediaType }] : []);

  const commitItems = (next: MessageMediaItem[]) => {
    if (multi) {
      onChange({
        media_items: next,
        media_url: next[0]?.url ?? null,
        media_type: next[0]?.type ?? null,
      });
    } else {
      onChange({ media_url: next[0]?.url ?? null, media_type: next[0]?.type ?? null });
    }
  };

  const handleUpload = async (files: FileList) => {
    const chosen = Array.from(files).slice(0, multi ? 10 : 1);
    for (const file of chosen) {
      if (file.size > 50 * 1024 * 1024) {
        toast({ title: 'خطا', description: `${file.name}: حداکثر حجم فایل ۵۰ مگابایت است`, variant: 'destructive' });
        return;
      }
    }
    setUploading(true);
    try {
      const uploaded: MessageMediaItem[] = [];
      for (const file of chosen) {
        const ext = file.name.split('.').pop();
        const path = `followup-media/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('messenger-files').upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from('messenger-files').getPublicUrl(path);
        uploaded.push({ url: data.publicUrl, type: guessType(file) });
      }
      commitItems(multi ? [...items, ...uploaded] : uploaded);
      toast({ title: uploaded.length > 1 ? `${uploaded.length} فایل آپلود شد` : 'فایل آپلود شد' });
    } catch (e: any) {
      toast({ title: 'خطا در آپلود', description: e?.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const patchItem = (i: number, p: Partial<MessageMediaItem>) =>
    commitItems(items.map((m, idx) => (idx === i ? { ...m, ...p } : m)));

  const patchButton = (i: number, p: Partial<MessageButton>) =>
    onChange({ buttons: list.map((b, idx) => (idx === i ? { ...b, ...p } : b)) });

  return (
    <div className="space-y-3 rounded border bg-background/50 p-3">
      {/* Media */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">{multi ? 'رسانه‌های پیام (چند فایل مجاز است)' : 'رسانه پیام (اختیاری)'}</Label>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              multiple={multi}
              className="hidden"
              accept="image/*,video/*,audio/*,application/pdf,.zip,.rar,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.ogg,.oga,.opus"
              onChange={(e) => e.target.files?.length && handleUpload(e.target.files)}
            />
            <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
              {uploading ? <Loader2 className="h-3 w-3 animate-spin ml-1" /> : <Paperclip className="h-3 w-3 ml-1" />} آپلود فایل
            </Button>
            {multi && (
              <Button type="button" size="sm" variant="outline" onClick={() => commitItems([...items, { url: '', type: 'photo' }])}>
                <Plus className="h-3 w-3 ml-1" /> افزودن لینک
              </Button>
            )}
          </div>
        </div>

        {items.length === 0 && (
          <p className="text-[11px] text-muted-foreground">هنوز فایلی اضافه نشده است.</p>
        )}

        {items.map((m, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <Select value={m.type || 'photo'} onValueChange={(v) => patchItem(i, { type: v })}>
              <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MEDIA_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              value={m.url}
              onChange={(e) => patchItem(i, { url: e.target.value })}
              placeholder="https://..."
              dir="ltr"
              className="h-8 flex-1 min-w-[220px] font-mono text-xs"
            />
            {(m.type === 'photo' || m.type === 'animation') && m.url && (
              <img src={m.url} alt="پیش‌نمایش رسانه پیگیری" className="h-10 w-10 rounded object-cover" loading="lazy" />
            )}
            <Button type="button" size="sm" variant="ghost" onClick={() => commitItems(items.filter((_, idx) => idx !== i))}>
              <X className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
        <p className="text-[10px] text-muted-foreground">
          متن پیام به‌صورت کپشن روی رسانه ارسال می‌شود؛ فقط اگر متن از ۱۰۲۴ کاراکتر بیشتر باشد، ادامهٔ آن در پیام بعدی می‌آید.
        </p>
      </div>

      {/* Buttons */}
      {!hideButtons && (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">دکمه‌های زیر پیام</Label>
          <Button type="button" size="sm" variant="outline" onClick={() => onChange({ buttons: [...list, { text: '', url: '' }] })}>
            <Plus className="h-3 w-3 ml-1" /> افزودن دکمه
          </Button>
        </div>
        {list.map((b, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <Input value={b.text || ''} onChange={(e) => patchButton(i, { text: e.target.value })} placeholder="عنوان دکمه" className="h-8 w-44" dir="rtl" />
            {extraButtonTypes?.length ? (
              <Select value={b.type || 'url'} onValueChange={(v) => patchButton(i, { type: v })}>
                <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">لینک دلخواه</SelectItem>
                  {extraButtonTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : null}
            {(!b.type || b.type === 'url') && (
              <Input value={b.url || ''} onChange={(e) => patchButton(i, { url: e.target.value })} placeholder="https://..." className="h-8 flex-1 min-w-[200px] font-mono text-xs" dir="ltr" />
            )}
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange({ buttons: list.filter((_, idx) => idx !== i) })}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export default MessageMediaButtonsEditor;
