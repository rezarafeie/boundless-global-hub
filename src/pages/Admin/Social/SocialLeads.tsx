import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Lead {
  id: string;
  username: string | null;
  name: string | null;
  score: number;
  stage: string;
  source: string;
  ai_summary: string | null;
  created_at: string;
  conversation_id: string | null;
}

const STAGES = ['new', 'contacted', 'qualified', 'won', 'lost'];

const SocialLeads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('social_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setLeads(data as Lead[] || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStage = async (id: string, stage: string) => {
    const { error } = await supabase.from('social_leads').update({ stage }).eq('id', id);
    if (error) toast.error('خطا در به‌روزرسانی');
    else {
      toast.success('به‌روزرسانی شد');
      setLeads(ls => ls.map(l => l.id === id ? { ...l, stage } : l));
    }
  };

  const scoreColor = (s: number) => s >= 70 ? 'bg-green-500' : s >= 40 ? 'bg-amber-500' : 'bg-gray-400';

  return (
    <div dir="rtl" className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="w-6 h-6" />
            لیدهای شبکه‌های اجتماعی
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{leads.length} لید</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">در حال بارگذاری...</div>
      ) : leads.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          لیدی یافت نشد. از صندوق پیام‌ها یک گفتگو را به عنوان لید ثبت کنید.
        </Card>
      ) : (
        <div className="grid gap-3">
          {leads.map(l => (
            <Card key={l.id} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${scoreColor(l.score)}`} />
                    <div className="font-semibold">@{l.username || 'unknown'}</div>
                    <Badge variant="outline" className="text-xs">امتیاز {l.score}</Badge>
                    <Badge variant="secondary" className="text-xs">{l.source}</Badge>
                  </div>
                  {l.ai_summary && (
                    <p className="text-sm text-muted-foreground mt-2">{l.ai_summary}</p>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(l.created_at).toLocaleString('fa-IR')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={l.stage} onValueChange={(v) => updateStage(l.id, v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {l.conversation_id && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/enroll/admin/social/inbox?c=${l.conversation_id}`}>
                        <ExternalLink className="w-3 h-3 ml-1" />
                        گفتگو
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialLeads;
