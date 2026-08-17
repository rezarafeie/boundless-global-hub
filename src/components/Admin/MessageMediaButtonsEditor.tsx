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

export const MEDIA_TYPES = [
  { value: 'photo', label: '🖼 عکس' },
  { value: 'video', label: '🎬 ویدیو' },
  { value: 'voice', label: '🎙 پیام صوتی' },
  { value: 'audio', label: '🎵 موسیقی / صوت' },
  { value: 'animation', label: '🌀 گیف' },
  { value: 'document', label: '📎 فایل' },
];

const guessType = (file: File): string => {
  const t = file.type;
  if (t.startsWith('image/gif')) return 'animation';
  if (t.startsWith('image/')) return 'photo';
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('audio/')) return 'audio';
  return 'document';
};

interface Props {
  mediaUrl: string | null;
  mediaType: string | null;
  buttons: MessageButton[] | null;
  onChange: (patch: { media_url?: string | null; media_type?: string | null; buttons?: MessageButton[] }) => void;
  /** Business channels can't render inline keyboards; buttons are appended as links. */
  buttonsAsLinksHint?: boolean;
  extraButtonTypes?: { value: string; label: string }[];
  hideButtons?: boolean;
}

const MessageMediaButtonsEditor: React.FC<Props> = ({
  mediaUrl,
  mediaType,
  buttons,
  onChange,
  buttonsAsLinksHint,
  extraButtonTypes,
  hideButtons,
}) => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const list = Array.isArray(buttons) ? buttons : [];

  const handleUpload = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: 'خطا', description: 'حداکثر حجم فایل ۵۰ مگابایت است', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `followup-media/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('messenger-files').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('messenger-files').getPublicUrl(path);
      onChange({ media_url: data.publicUrl, media_type: guessType(file) });
      toast({ title: 'فایل آپلود شد' });
    } catch (e: any) {
      toast({ title: 'خطا در آپلود', description: e?.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const patchButton = (i: number, p: Partial<MessageButton>) =>
    onChange({ buttons: list.map((b, idx) => (idx === i ? { ...b, ...p } : b)) });

  return (
    <div className="space-y-3 rounded border bg-background/50 p-3">
      {/* Media */}
      <div className="space-y-2">
        <Label className="text-xs">رسانه پیام (اختیاری)</Label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,application/pdf,.zip,.rar,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
          <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? <Loader2 className="h-3 w-3 animate-spin ml-1" /> : <Paperclip className="h-3 w-3 ml-1" />} آپلود فایل
          </Button>
          <Select value={mediaType || 'photo'} onValueChange={(v) => onChange({ media_type: v })}>
            <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MEDIA_TYPES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {mediaUrl && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange({ media_url: null, media_type: null })}>
              <X className="h-3 w-3 ml-1" /> حذف رسانه
            </Button>
          )}
        </div>
        <Input
          value={mediaUrl || ''}
          onChange={(e) => onChange({ media_url: e.target.value })}
          placeholder="یا آدرس مستقیم فایل را وارد کنید (https://...)"
          dir="ltr"
          className="h-8 font-mono text-xs"
        />
        {mediaUrl && (mediaType === 'photo' || mediaType === 'animation') && (
          <img src={mediaUrl} alt="پیش‌نمایش رسانه پیگیری" className="h-24 rounded object-cover" loading="lazy" />
        )}
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
        {buttonsAsLinksHint && list.length > 0 && (
          <p className="text-[10px] text-muted-foreground">
            در کانال «چت پشتیبانی (Business)» تلگرام امکان نمایش دکمه شیشه‌ای وجود ندارد؛ دکمه‌ها به‌صورت لینک در انتهای پیام ارسال می‌شوند.
          </p>
        )}
      </div>
      )}
    </div>
  );
};

export default MessageMediaButtonsEditor;
