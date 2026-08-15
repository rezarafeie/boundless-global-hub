import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Clock, Flame, PhoneMissed } from 'lucide-react';
import CallButton from '@/components/CallCenter/CallButton';
import CallsTable from '@/components/CallCenter/CallsTable';
import { callCenter, tehranDateTime, PRIORITY_LABELS } from '@/lib/callCenterService';
import { useToast } from '@/hooks/use-toast';

const priorityTone: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-600 border-red-500/20',
  high: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  medium: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  low: 'bg-muted text-muted-foreground',
};

const CallQueues: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setData(await callCenter.queues()); }
    catch (e) { toast({ title: 'خطا', description: (e as Error).message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const complete = async (id: string) => {
    try {
      await callCenter.completeFollowup(id);
      toast({ title: 'پیگیری انجام شد' });
      load();
    } catch (e) {
      toast({ title: 'خطا', description: (e as Error).message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">در حال بارگذاری…</div>;

  const followups: any[] = data?.followups ?? [];

  const FollowupCard = ({ f }: { f: any }) => {
    const phone = f.calls?.direction === 'outgoing' ? f.calls?.destination_number : f.calls?.caller_number;
    return (
      <div className="rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{f.title}</span>
            <Badge variant="outline" className={priorityTone[f.priority] ?? ''}>{PRIORITY_LABELS[f.priority] ?? f.priority}</Badge>
            {f.status === 'overdue' && <Badge variant="destructive">معوق</Badge>}
          </div>
          {f.description && <p className="text-xs text-muted-foreground line-clamp-2">{f.description}</p>}
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> سررسید: {tehranDateTime(f.due_at)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CallButton phone={phone} userId={f.user_id} leadId={f.lead_id} variant="button" className="h-8" source="followup_queue" />
          <Button size="sm" variant="secondary" className="gap-1 h-8" onClick={() => complete(f.id)}>
            <CheckCircle2 className="h-4 w-4" /> انجام شد
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">صف‌های تماس</h2>
        <p className="text-sm text-muted-foreground">اولویت‌بندی هوشمند تماس‌های امروز</p>
      </div>

      <Tabs defaultValue="missed" dir="rtl">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="missed" className="gap-1"><PhoneMissed className="h-4 w-4" /> از دست رفته ({data?.missed?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="followups" className="gap-1"><Clock className="h-4 w-4" /> پیگیری‌ها ({followups.length})</TabsTrigger>
          <TabsTrigger value="overdue" className="gap-1">معوق ({data?.overdue?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="intent" className="gap-1"><Flame className="h-4 w-4" /> قصد خرید بالا ({data?.highIntent?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="missed" className="mt-4">
          <CallsTable calls={data?.missed ?? []} />
        </TabsContent>

        <TabsContent value="followups" className="mt-4 space-y-3">
          {followups.length ? followups.map((f) => <FollowupCard key={f.id} f={f} />)
            : <Card><CardContent className="p-8 text-center text-muted-foreground">پیگیری بازی وجود ندارد</CardContent></Card>}
        </TabsContent>

        <TabsContent value="overdue" className="mt-4 space-y-3">
          {(data?.overdue ?? []).length ? data.overdue.map((f: any) => <FollowupCard key={f.id} f={f} />)
            : <Card><CardContent className="p-8 text-center text-muted-foreground">پیگیری معوقی وجود ندارد</CardContent></Card>}
        </TabsContent>

        <TabsContent value="intent" className="mt-4">
          <Card className="mb-3">
            <CardHeader className="pb-2"><CardTitle className="text-sm">مشتریانی که تحلیل هوشمند، قصد خرید بالایی برایشان تشخیص داده است</CardTitle></CardHeader>
          </Card>
          <CallsTable calls={data?.highIntent ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CallQueues;
