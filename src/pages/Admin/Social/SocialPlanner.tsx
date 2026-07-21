import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus, Send, Trash2, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Account { id: string; username: string | null; }
interface Scheduled {
  id: string; account_id: string; caption: string | null; media_urls: any;
  post_type: string; scheduled_at: string; status: string; last_error: string | null;
  published_at: string | null;
}

const SocialPlanner: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [items, setItems] = useState<Scheduled[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    account_id: '', post_type: 'post', caption: '',
    media_urls: [] as string[], scheduled_at: '',
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: accs }, { data: sched }] = await Promise.all([
      supabase.from('social_accounts').select('id, username'),
      supabase.from('social_scheduled_posts').select('*').order('scheduled_at', { ascending: false }).limit(100),
    ]);
    setAccounts(accs || []);
    setItems(sched as Scheduled[] || []);
    if (accs?.[0] && !form.account_id) setForm(f => ({ ...f, account_id: accs[0].id }));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async (publishImmediately = false) => {
    if (!form.account_id) return toast.error('اکانت الزامی است');
    if (!publishImmediately && !form.scheduled_at) return toast.error('زمان انتشار الزامی است');
    if (form.media_urls.length === 0) return toast.error('حداقل یک فایل رسانه آپلود کنید');
    setSaving(true);
    const scheduledAt = publishImmediately
      ? new Date(Date.now() - 1000).toISOString()
      : new Date(form.scheduled_at).toISOString();
    const { data: inserted, error } = await supabase.from('social_scheduled_posts').insert({
      account_id: form.account_id,
      post_type: form.post_type,
      caption: form.caption || null,
      media_urls: form.media_urls,
      scheduled_at: scheduledAt,
      status: 'scheduled',
    }).select('id').single();
    if (error) { setSaving(false); return toast.error(error.message); }
    if (publishImmediately && inserted?.id) {
      const { error: pubErr } = await supabase.functions.invoke('social-publish-cron', {
        body: { scheduled_post_id: inserted.id },
      });
      if (pubErr) toast.error('ذخیره شد ولی انتشار خطا داد');
      else toast.success('در حال انتشار...');
    } else {
      toast.success('پست زمان‌بندی شد');
    }
    setSaving(false);
    setOpen(false);
    setForm({ account_id: form.account_id, post_type: 'post', caption: '', media_urls: [], scheduled_at: '' });
    setTimeout(load, 1500);
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop() || 'bin';
        const path = `planner/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('social-media').upload(path, file, {
          contentType: file.type, upsert: false,
        });
        if (upErr) { toast.error(`${file.name}: ${upErr.message}`); continue; }
        const { data } = await supabase.storage.from('social-media').createSignedUrl(path, 60 * 60 * 24 * 30);
        if (data?.signedUrl) uploaded.push(data.signedUrl);
      }
      if (uploaded.length) {
        setForm(f => ({ ...f, media_urls: [...f.media_urls, ...uploaded] }));
        toast.success(`${uploaded.length} فایل آپلود شد`);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeMedia = (idx: number) => {
    setForm(f => ({ ...f, media_urls: f.media_urls.filter((_, i) => i !== idx) }));
  };


  const publishNow = async (id: string) => {
    const { error } = await supabase.functions.invoke('social-publish-cron', {
      body: { scheduled_post_id: id },
    });
    if (error) return toast.error('خطا در انتشار');
    toast.success('در حال انتشار...');
    setTimeout(load, 1500);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('social_scheduled_posts').delete().eq('id', id);
    if (error) return toast.error(error.message);
    load();
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      scheduled: 'bg-blue-500', publishing: 'bg-yellow-500',
      published: 'bg-green-500', failed: 'bg-red-500',
    };
    return <Badge className={map[s] || 'bg-gray-500'}>{s}</Badge>;
  };

  return (
    <div dir="rtl" className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            برنامه‌ریز محتوا
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} پست</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 ml-2" />پست جدید</Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>زمان‌بندی پست</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>اکانت</Label>
                <Select value={form.account_id} onValueChange={v => setForm(f => ({ ...f, account_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.username || a.id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>نوع پست</Label>
                <Select value={form.post_type} onValueChange={v => setForm(f => ({ ...f, post_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post">پست عادی</SelectItem>
                    <SelectItem value="reel">ریلز</SelectItem>
                    <SelectItem value="story">استوری</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>فایل‌های رسانه (تصویر / ویدیو — برای کاروسل چند فایل انتخاب کنید)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={e => uploadFiles(e.target.files)}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.media_urls.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded overflow-hidden border">
                      {/\.(mp4|mov|webm)($|\?)/i.test(url) ? (
                        <video src={url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(i)}
                        className="absolute top-0 left-0 bg-black/60 text-white p-0.5 rounded-br"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-20 h-20 rounded border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:bg-accent disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /><span className="text-[10px] mt-1">آپلود</span></>}
                  </button>
                </div>
                {form.media_urls.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">کاروسل با {form.media_urls.length} فایل</p>
                )}
              </div>
              <div>
                <Label>کپشن</Label>
                <Textarea rows={4} value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} />
              </div>
              <div>
                <Label>زمان انتشار</Label>
                <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => create(false)} disabled={saving} variant="outline" className="flex-1">
                  {saving ? '...' : 'زمان‌بندی'}
                </Button>
                <Button onClick={() => create(true)} disabled={saving} className="flex-1">
                  <Send className="w-4 h-4 ml-2" />
                  {saving ? '...' : 'انتشار فوری'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">در حال بارگذاری...</div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">هنوز پستی زمان‌بندی نشده.</Card>
      ) : (
        <div className="space-y-3">
          {items.map(it => (
            <Card key={it.id} className="p-4 flex gap-4">
              {Array.isArray(it.media_urls) && it.media_urls[0] && (
                <img src={it.media_urls[0]} alt="" className="w-20 h-20 rounded object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {statusBadge(it.status)}
                  <Badge variant="outline">{it.post_type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(it.scheduled_at).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })}
                  </span>
                </div>
                <p className="text-sm line-clamp-2">{it.caption || <span className="text-muted-foreground">بدون کپشن</span>}</p>
                {it.last_error && <p className="text-xs text-red-500 mt-1">{it.last_error}</p>}
              </div>
              <div className="flex gap-2">
                {it.status === 'scheduled' && (
                  <Button size="sm" variant="outline" onClick={() => publishNow(it.id)}>
                    <Send className="w-3 h-3 ml-1" />انتشار
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => remove(it.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialPlanner;
