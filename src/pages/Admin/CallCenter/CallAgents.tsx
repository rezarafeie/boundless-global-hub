import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { callCenter, formatDuration } from '@/lib/callCenterService';
import { useToast } from '@/hooks/use-toast';

const CallAgents: React.FC = () => {
  const { toast } = useToast();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callCenter.agents()
      .then((r: any) => setAgents(r.agents ?? []))
      .catch((e) => toast({ title: 'خطا', description: (e as Error).message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">در حال بارگذاری…</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">عملکرد کارشناسان</h2>
        <p className="text-sm text-muted-foreground">۳۰ روز گذشته</p>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">تعداد تماس و مکالمه</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agents.slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="agent_name" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="calls" name="تماس" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="answered" name="پاسخ داده شده" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr className="text-right">
              <th className="p-3 font-medium">کارشناس</th>
              <th className="p-3 font-medium">تماس‌ها</th>
              <th className="p-3 font-medium">پاسخ داده</th>
              <th className="p-3 font-medium">مکالمه</th>
              <th className="p-3 font-medium">میانگین</th>
              <th className="p-3 font-medium">پیگیری انجام‌شده</th>
              <th className="p-3 font-medium">معوق</th>
              <th className="p-3 font-medium">فروش</th>
              <th className="p-3 font-medium">درآمد</th>
              <th className="p-3 font-medium">نرخ تبدیل</th>
              <th className="p-3 font-medium">امتیاز AI</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.agent_id ?? 'unknown'} className="border-t">
                <td className="p-3 font-medium">{a.agent_name}</td>
                <td className="p-3">{a.calls}</td>
                <td className="p-3">{a.answered}</td>
                <td className="p-3 font-mono text-xs">{formatDuration(a.talk)}</td>
                <td className="p-3 font-mono text-xs">{formatDuration(a.avgTalk)}</td>
                <td className="p-3">{a.followupsCompleted}</td>
                <td className="p-3">{a.followupsOverdue ? <Badge variant="destructive">{a.followupsOverdue}</Badge> : '۰'}</td>
                <td className="p-3">{a.sales}</td>
                <td className="p-3">{Number(a.revenue).toLocaleString('fa-IR')}</td>
                <td className="p-3">{a.conversionRate}٪</td>
                <td className="p-3">{a.avgAiScore != null ? <Badge variant="secondary">{a.avgAiScore}</Badge> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">امتیازهای هوش مصنوعی جنبهٔ مربی‌گری دارند و معیار قطعی ارزیابی نیستند.</p>
    </div>
  );
};

export default CallAgents;
