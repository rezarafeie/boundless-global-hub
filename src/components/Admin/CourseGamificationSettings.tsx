import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, Plus, Loader2, RotateCcw, MessageSquare, Paperclip, Mic, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GAM_MESSAGES } from '@/lib/gamificationMessages';

interface Reward {
  id?: string;
  title: string;
  description: string;
  emoji: string;
  within_days: number;
  reward_type: string;
  reward_value: string;
  is_active: boolean;
  sort_order: number;
}

export const GAM_DEFAULTS = {
  enabled: false,
  free_days: 7,
  reactivation_price_usd: 10,
  reactivation_days: 7,
  mission_hours: 24,
  fast_finish_days: 3,
  notifications_enabled: true,
  messages: {} as Record<string, { title?: string; text?: string }>,
};

interface Props {
  courseId: string;
  onSaved?: () => void;
}

export interface CourseGamificationSettingsHandle {
  save: () => Promise<void>;
}

const CourseGamificationSettings = forwardRef<CourseGamificationSettingsHandle, Props>(({ courseId, onSaved }, ref) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<any>(GAM_DEFAULTS);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    (async () => {
      const [{ data: s }, { data: r }] = await Promise.all([
        (supabase as any).from('course_gamification_settings').select('*').eq('course_id', courseId).maybeSingle(),
        (supabase as any)
          .from('course_gamification_rewards')
          .select('*')
          .eq('course_id', courseId)
          .order('sort_order', { ascending: true }),
      ]);
      setSettings({ ...GAM_DEFAULTS, ...(s ?? {}) });
      setRewards((r ?? []) as Reward[]);
      setLoading(false);
    })();
  }, [courseId]);

  const persist = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any).from('course_gamification_settings').upsert(
        {
          course_id: courseId,
          enabled: settings.enabled,
          free_days: Number(settings.free_days) || 7,
          reactivation_price_usd: Number(settings.reactivation_price_usd) || 10,
          reactivation_days: Number(settings.reactivation_days) || 7,
          mission_hours: Number(settings.mission_hours) || 24,
          fast_finish_days: Number(settings.fast_finish_days) || 3,
          notifications_enabled: settings.notifications_enabled,
          messages: settings.messages ?? {},
        },
        { onConflict: 'course_id' },
      );
      if (error) throw error;

      for (const [i, rw] of rewards.entries()) {
        const payload = {
          course_id: courseId,
          title: rw.title,
          description: rw.description,
          emoji: rw.emoji,
          within_days: Number(rw.within_days) || 7,
          reward_type: rw.reward_type,
          reward_value: rw.reward_value,
          is_active: rw.is_active,
          sort_order: i,
        };
        if (rw.id) await (supabase as any).from('course_gamification_rewards').update(payload).eq('id', rw.id);
        else await (supabase as any).from('course_gamification_rewards').insert(payload);
      }
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    try {
      await persist();
      toast({ title: 'ذخیره شد', description: 'تنظیمات دسترسی گیمیفای به‌روزرسانی شد' });
      onSaved?.();
    } catch (e: any) {
      toast({ title: 'خطا', description: e.message, variant: 'destructive' });
    }
  };

  useImperativeHandle(ref, () => ({ save: persist }), [courseId, settings, rewards]);

  const removeReward = async (idx: number) => {
    const rw = rewards[idx];
    if (rw.id) await (supabase as any).from('course_gamification_rewards').delete().eq('id', rw.id);
    setRewards(rewards.filter((_, i) => i !== idx));
  };

  const field = (key: string, label: string, type = 'number') => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={settings[key] ?? ''}
        onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <div className="font-medium">فعال‌سازی برای این دوره</div>
          <div className="text-xs text-muted-foreground">دوره‌های دیگر بدون تغییر باقی می‌مانند</div>
        </div>
        <Switch checked={!!settings.enabled} onCheckedChange={(v) => setSettings({ ...settings, enabled: v })} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {field('free_days', 'مدت دسترسی رایگان (روز)')}
        {field('reactivation_price_usd', 'هزینه تمدید (دلار)')}
        {field('reactivation_days', 'مدت تمدید (روز)')}
        {field('mission_hours', 'مهلت هر ماموریت (ساعت)')}
        {field('fast_finish_days', 'مهلت تکمیل سریع (روز)')}
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <span className="text-sm">ارسال پیام‌های یادآوری (بات، ایمیل، پیامک)</span>
        <Switch
          checked={!!settings.notifications_enabled}
          onCheckedChange={(v) => setSettings({ ...settings, notifications_enabled: v })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 font-medium">
          <MessageSquare className="h-4 w-4" /> متن پیام‌ها
        </div>
        <p className="text-xs text-muted-foreground">
          این متن‌ها در ایمیل، پیام بات تلگرام، پیام تلگرام بیزینس، پیامک و داخل سایت نمایش داده می‌شوند. اگر خالی
          بماند، متن پیش‌فرض استفاده می‌شود. متغیرهای قابل استفاده در هر بخش ذکر شده است.
        </p>

        <Accordion type="multiple" className="rounded-lg border">
          {(['notification', 'site'] as const).map((group) => (
            <AccordionItem key={group} value={group}>
              <AccordionTrigger className="px-3 text-sm">
                {group === 'notification' ? 'پیام‌های ارسالی (ایمیل / بات / تلگرام بیزینس / پیامک)' : 'متن‌های داخل سایت'}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 px-3">
                {GAM_MESSAGES.filter((d) => d.group === group).map((d) => {
                  const current = (settings.messages ?? {})[d.key] ?? {};
                  const setMsg = (patch: any) =>
                    setSettings({
                      ...settings,
                      messages: { ...(settings.messages ?? {}), [d.key]: { ...current, ...patch } },
                    });
                  const reset = () => {
                    const next = { ...(settings.messages ?? {}) };
                    delete next[d.key];
                    setSettings({ ...settings, messages: next });
                  };
                  return (
                    <div key={d.key} className="space-y-2 rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs font-medium">{d.label}</Label>
                        <Button type="button" size="sm" variant="ghost" onClick={reset} title="بازگشت به متن پیش‌فرض">
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {d.hasTitle && (
                        <Input
                          placeholder={d.title}
                          value={current.title ?? ''}
                          onChange={(e) => setMsg({ title: e.target.value })}
                        />
                      )}
                      <Textarea
                        rows={d.text.split('\n').length + 1}
                        placeholder={d.text}
                        value={current.text ?? ''}
                        onChange={(e) => setMsg({ text: e.target.value })}
                      />
                      {group === 'notification' && (
                        <MessageAttachments value={current.attachments ?? []} onChange={(attachments) => setMsg({ attachments })} />
                      )}
                      {!!d.vars.length && (
                        <div className="text-[11px] text-muted-foreground">
                          متغیرها: {d.vars.map((v) => `{${v}}`).join(' ، ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">جوایز</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setRewards([
                ...rewards,
                {
                  title: '',
                  description: '',
                  emoji: '🎁',
                  within_days: 3,
                  reward_type: 'custom',
                  reward_value: '',
                  is_active: true,
                  sort_order: rewards.length,
                },
              ])
            }
          >
            <Plus className="ml-1 h-4 w-4" /> جایزه جدید
          </Button>
        </div>

        {rewards.map((rw, i) => (
          <Card key={rw.id ?? `new-${i}`}>
            <CardContent className="space-y-2 p-3">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <Input
                  placeholder="عنوان"
                  value={rw.title}
                  onChange={(e) => setRewards(rewards.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                />
                <Input
                  placeholder="ایموجی"
                  value={rw.emoji}
                  onChange={(e) => setRewards(rewards.map((x, j) => (j === i ? { ...x, emoji: e.target.value } : x)))}
                />
                <Input
                  type="number"
                  placeholder="تکمیل تا (روز)"
                  value={rw.within_days}
                  onChange={(e) =>
                    setRewards(rewards.map((x, j) => (j === i ? { ...x, within_days: Number(e.target.value) } : x)))
                  }
                />
                <Input
                  placeholder="نوع جایزه (store/bnets/...)"
                  value={rw.reward_type}
                  onChange={(e) =>
                    setRewards(rewards.map((x, j) => (j === i ? { ...x, reward_type: e.target.value } : x)))
                  }
                />
              </div>
              <Input
                placeholder="توضیح"
                value={rw.description ?? ''}
                onChange={(e) =>
                  setRewards(rewards.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))
                }
              />
              <div className="flex items-center justify-between gap-2">
                <Input
                  placeholder="مقدار جایزه (مثلاً 1 ماه اشتراک)"
                  value={rw.reward_value ?? ''}
                  onChange={(e) =>
                    setRewards(rewards.map((x, j) => (j === i ? { ...x, reward_value: e.target.value } : x)))
                  }
                />
                <div className="flex shrink-0 items-center gap-2">
                  <Switch
                    checked={rw.is_active}
                    onCheckedChange={(v) => setRewards(rewards.map((x, j) => (j === i ? { ...x, is_active: v } : x)))}
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeReward(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button type="button" className="w-full" onClick={() => void save()} disabled={saving}>
        {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} ذخیره تنظیمات گیمیفای
      </Button>
    </div>
  );
});

CourseGamificationSettings.displayName = 'CourseGamificationSettings';

export default CourseGamificationSettings;


type Attachment = { type: 'document' | 'voice' | 'audio' | 'photo' | 'video'; url: string; name?: string; caption?: string };
const TYPE_LABEL: Record<Attachment['type'], string> = { document: 'فایل', voice: 'ویس', audio: 'صوت', photo: 'عکس', video: 'ویدیو' };
const detectType = (f: File): Attachment['type'] =>
  f.type.startsWith('image/') ? 'photo' : f.type.startsWith('video/') ? 'video'
    : /ogg|opus/.test(f.type) ? 'voice' : f.type.startsWith('audio/') ? 'audio' : 'document';

const MessageAttachments: React.FC<{ value: Attachment[]; onChange: (v: Attachment[]) => void }> = ({ value, onChange }) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const upload = async (blob: Blob, name: string, type: Attachment['type']) => {
    setBusy(true);
    try {
      const ext = name.includes('.') ? name.split('.').pop() : 'bin';
      const path = `gamification/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('messenger-files').upload(path, blob, { contentType: blob.type || undefined });
      if (error) throw error;
      const { data } = supabase.storage.from('messenger-files').getPublicUrl(path);
      onChange([...(value ?? []), { type, url: data.publicUrl, name }]);
    } catch (e: any) {
      toast({ title: 'آپلود ناموفق بود', description: e.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };
  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/mp4'].find((m) => MediaRecorder.isTypeSupported(m)) || '';
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: BlobPart[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = r.mimeType || 'audio/webm';
        const ext = type.includes('ogg') ? 'ogg' : type.includes('mp4') ? 'm4a' : 'webm';
        upload(new Blob(chunks, { type }), `voice.${ext}`, ext === 'ogg' ? 'voice' : 'audio');
        setRec(null);
      };
      r.start();
      setRec(r);
    } catch { toast({ title: 'دسترسی به میکروفون ممکن نشد', variant: 'destructive' }); }
  };
  return (
    <div className="space-y-2 rounded-md bg-muted/40 p-2">
      {(value ?? []).map((a, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <select className="rounded border bg-background px-1 py-1" value={a.type}
            onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, type: e.target.value as Attachment['type'] } : x)))}>
            {Object.entries(TYPE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          {a.type === 'voice' || a.type === 'audio'
            ? <audio controls src={a.url} className="h-8 max-w-[220px]" />
            : <a href={a.url} target="_blank" rel="noreferrer" className="truncate text-primary underline">{a.name || a.url}</a>}
          <Input className="h-8 flex-1 text-xs" placeholder="کپشن (اختیاری)" value={a.caption ?? ''}
            onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))} />
          <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => onChange(value.filter((_, j) => j !== i))}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" disabled={busy} asChild>
          <label className="cursor-pointer">
            {busy ? <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin" /> : <Paperclip className="ml-1 h-3.5 w-3.5" />}افزودن فایل
            <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, f.name, detectType(f)); e.target.value = ''; }} />
          </label>
        </Button>
        {rec
          ? <Button type="button" size="sm" variant="destructive" onClick={() => rec.stop()}><Square className="ml-1 h-3.5 w-3.5" />توقف ضبط</Button>
          : <Button type="button" size="sm" variant="outline" disabled={busy} onClick={startRec}><Mic className="ml-1 h-3.5 w-3.5" />ضبط ویس</Button>}
        <span className="text-[11px] text-muted-foreground">بعد از متن، در بات و تلگرام بیزینس ارسال می‌شود.</span>
      </div>
    </div>
  );
};
