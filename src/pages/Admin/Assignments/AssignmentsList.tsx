import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Assignment } from '@/types/assignment';

const AssignmentsList: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('assignments').select('*').order('created_at', { ascending: false });
    setItems((data || []) as unknown as Assignment[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    if (!confirm('حذف شود؟')) return;
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) toast.error('خطا در حذف'); else { toast.success('حذف شد'); load(); }
  };

  const duplicate = async (a: Assignment) => {
    const { id, created_at, updated_at, ...rest } = a as any;
    const { error } = await supabase.from('assignments').insert({ ...rest, title: rest.title + ' (کپی)', status: 'draft' });
    if (error) toast.error('خطا در کپی'); else { toast.success('کپی شد'); load(); }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">مدیریت تمرین‌ها</h1>
        <Button onClick={() => navigate('/admin/assignments/new')}>
          <Plus className="h-4 w-4 ml-2" /> تمرین جدید
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
      ) : items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          هیچ تمرینی ثبت نشده است.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{a.title}</span>
                    <Badge variant={a.status === 'published' ? 'default' : 'secondary'}>{a.status}</Badge>
                    {a.required && <Badge variant="outline">اجباری</Badge>}
                    {a.ai_feedback_enabled && <Badge variant="outline">AI</Badge>}
                  </div>
                  {a.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.description}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/assignments/${a.id}`)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => duplicate(a)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => del(a.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentsList;
