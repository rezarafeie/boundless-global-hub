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
import { Calendar, Plus, Send, Trash2 } from 'lucide-react';
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
    media_url: '', scheduled_at: '',
  });

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

  const create = async () => {
    if (!form.account_id || !form.scheduled_at) return toast.error('اکانت و زمان الزامی است');
    setSaving(true);
    const { error } = await supabase.from('social_scheduled_posts').insert({
      account_id: form.account_id,
      post_type: form.post_type,
      caption: form.caption || null,
      media_urls: form.media_url ? [form.media_url] : [],
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      status: 'scheduled',
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('پست زمان‌بندی شد');
    setOpen(false);
    setForm({ account_id: form.account_id, post_type: 'post', caption: '', media_url: '', scheduled_at: '' });
    load();
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
                <Label>لینک تصویر / ویدیو</Label>
                <Input value={form.media_url} onChange={e => setForm(f => ({ ...f, media_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <Label>کپشن</Label>
                <Textarea rows={4} value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} />
              </div>
              <div>
                <Label>زمان انتشار</Label>
                <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
              </div>
              <Button onClick={create} disabled={saving} className="w-full">
                {saving ? 'در حال ذخیره...' : 'ذخیره'}
              </Button>
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
