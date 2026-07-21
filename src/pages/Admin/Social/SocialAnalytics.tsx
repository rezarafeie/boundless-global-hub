import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, RefreshCw, MessageSquare, Bot, UserPlus, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Daily {
  day: string;
  dm_count: number;
  reply_count: number;
  ai_reply_count: number;
  comment_count: number;
  lead_count: number;
  posts_published: number;
}

const SocialAnalytics: React.FC = () => {
  const [rows, setRows] = useState<Daily[]>([]);
  const [loading, setLoading] = useState(true);
  const [aggregating, setAggregating] = useState(false);

  const load = async () => {
    setLoading(true);
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 30);
    const { data } = await supabase
      .from('social_analytics_daily')
      .select('day, dm_count, reply_count, ai_reply_count, comment_count, lead_count, posts_published')
      .gte('day', since.toISOString().slice(0, 10))
      .order('day', { ascending: false });

    // aggregate by day across accounts
    const map = new Map<string, Daily>();
    (data || []).forEach((r: any) => {
      const cur = map.get(r.day) || { day: r.day, dm_count: 0, reply_count: 0, ai_reply_count: 0, comment_count: 0, lead_count: 0, posts_published: 0 };
      cur.dm_count += r.dm_count; cur.reply_count += r.reply_count;
      cur.ai_reply_count += r.ai_reply_count; cur.comment_count += r.comment_count;
      cur.lead_count += r.lead_count; cur.posts_published += r.posts_published;
      map.set(r.day, cur);
    });
    setRows(Array.from(map.values()).sort((a, b) => b.day.localeCompare(a.day)));
    setLoading(false);
  };

  const aggregate = async () => {
    setAggregating(true);
    const { error } = await supabase.functions.invoke('social-analytics-aggregate', { body: { days: 30 } });
    setAggregating(false);
    if (error) return toast.error('خطا در محاسبه');
    toast.success('محاسبه شد');
    load();
  };

  useEffect(() => { load(); }, []);

  const totals = rows.reduce((a, r) => ({
    dm: a.dm + r.dm_count, reply: a.reply + r.reply_count,
    ai: a.ai + r.ai_reply_count, lead: a.lead + r.lead_count,
    comment: a.comment + r.comment_count, post: a.post + r.posts_published,
  }), { dm: 0, reply: 0, ai: 0, lead: 0, comment: 0, post: 0 });

  const cards = [
    { icon: MessageSquare, label: 'پیام دریافتی', value: totals.dm, color: 'text-blue-500' },
    { icon: MessageSquare, label: 'پاسخ‌ها', value: totals.reply, color: 'text-green-500' },
    { icon: Bot, label: 'پاسخ AI', value: totals.ai, color: 'text-purple-500' },
    { icon: MessageSquare, label: 'کامنت‌ها', value: totals.comment, color: 'text-orange-500' },
    { icon: UserPlus, label: 'لیدهای جدید', value: totals.lead, color: 'text-pink-500' },
    { icon: ImageIcon, label: 'پست منتشرشده', value: totals.post, color: 'text-cyan-500' },
  ];

  const max = Math.max(1, ...rows.map(r => r.dm_count + r.comment_count));

  return (
    <div dir="rtl" className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            آمار و تحلیل
          </h1>
          <p className="text-sm text-muted-foreground mt-1">۳۰ روز اخیر</p>
        </div>
        <Button onClick={aggregate} disabled={aggregating} variant="outline">
          <RefreshCw className={`w-4 h-4 ml-2 ${aggregating ? 'animate-spin' : ''}`} />
          محاسبه مجدد
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {cards.map(c => (
          <Card key={c.label} className="p-4">
            <c.icon className={`w-5 h-5 mb-2 ${c.color}`} />
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs text-muted-foreground">{c.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-4">فعالیت روزانه</h2>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">در حال بارگذاری...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">داده‌ای موجود نیست. روی «محاسبه مجدد» بزنید.</div>
        ) : (
          <div className="space-y-2">
            {rows.map(r => (
              <div key={r.day} className="flex items-center gap-3">
                <div className="w-24 text-xs text-muted-foreground">
                  {new Date(r.day).toLocaleDateString('fa-IR')}
                </div>
                <div className="flex-1 bg-muted rounded h-6 overflow-hidden flex">
                  <div className="bg-blue-500 h-full" style={{ width: `${(r.dm_count / max) * 100}%` }} title={`DM: ${r.dm_count}`} />
                  <div className="bg-orange-500 h-full" style={{ width: `${(r.comment_count / max) * 100}%` }} title={`Comments: ${r.comment_count}`} />
                </div>
                <div className="text-xs w-40 text-left tabular-nums">
                  DM {r.dm_count} · نظر {r.comment_count} · لید {r.lead_count}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SocialAnalytics;
