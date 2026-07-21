import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface KB {
  id: string; title: string; content: string; kind: string;
  tags: string[]; is_active: boolean; priority: number;
}

const empty = { title: '', content: '', kind: 'faq', tags: '', priority: 0, is_active: true };

const SocialKnowledge: React.FC = () => {
  const [items, setItems] = useState<KB[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('social_knowledge_base').select('*').order('priority', { ascending: false });
    setItems(data as KB[] || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title || !form.content) return toast.error('عنوان و محتوا الزامی');
    const payload = {
      title: form.title, content: form.content, kind: form.kind,
      priority: Number(form.priority) || 0, is_active: form.is_active,
      tags: (form.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
    };
    const { error } = editing
      ? await supabase.from('social_knowledge_base').update(payload).eq('id', editing)
      : await supabase.from('social_knowledge_base').insert(payload);
    if (error) return toast.error(error.message);
    toast.success('ذخیره شد');
    setOpen(false); setEditing(null); setForm(empty);
    load();
  };

  const edit = (kb: KB) => {
    setEditing(kb.id);
    setForm({ ...kb, tags: (kb.tags || []).join(', ') });
    setOpen(true);
  };
  const remove = async (id: string) => {
    if (!confirm('حذف شود؟')) return;
    await supabase.from('social_knowledge_base').delete().eq('id', id);
    load();
  };
  const toggle = async (kb: KB) => {
    await supabase.from('social_knowledge_base').update({ is_active: !kb.is_active }).eq('id', kb.id);
    load();
  };

  return (
    <div dir="rtl" className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            پایگاه دانش هوش مصنوعی
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            محتوایی که AI هنگام پاسخ به پیام‌ها و کامنت‌ها از آن استفاده می‌کند.
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(empty); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 ml-2" />افزودن</Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? 'ویرایش' : 'دانش جدید'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>عنوان</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>نوع</Label>
                <Select value={form.kind} onValueChange={v => setForm({ ...form, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faq">پرسش متداول</SelectItem>
                    <SelectItem value="document">سند</SelectItem>
                    <SelectItem value="policy">قانون / سیاست</SelectItem>
                    <SelectItem value="url">لینک</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>محتوا</Label>
                <Textarea rows={6} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
              </div>
              <div>
                <Label>برچسب‌ها (با کاما)</Label>
                <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="قیمت, ثبت‌نام" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>اولویت</Label>
                  <Input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                  <Label>فعال</Label>
                </div>
              </div>
              <Button onClick={save} className="w-full">ذخیره</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">در حال بارگذاری...</div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">هنوز محتوایی اضافه نشده.</Card>
      ) : (
        <div className="space-y-2">
          {items.map(kb => (
            <Card key={kb.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{kb.title}</h3>
                    <Badge variant="outline">{kb.kind}</Badge>
                    {!kb.is_active && <Badge variant="secondary">غیرفعال</Badge>}
                    {kb.priority > 0 && <Badge>اولویت {kb.priority}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{kb.content}</p>
                  {kb.tags?.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {kb.tags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Switch checked={kb.is_active} onCheckedChange={() => toggle(kb)} />
                  <Button size="sm" variant="ghost" onClick={() => edit(kb)}><Edit className="w-3 h-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(kb.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialKnowledge;
