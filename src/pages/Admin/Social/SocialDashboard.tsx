import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Bell, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';

const SocialDashboard: React.FC = () => {
  const [stats, setStats] = useState({ accounts: 0, convs: 0, unread: 0, aiToday: 0 });

  useEffect(() => {
    (async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [a, c, u, ai] = await Promise.all([
        supabase.from('social_accounts').select('id', { count: 'exact', head: true }),
        supabase.from('social_conversations').select('id', { count: 'exact', head: true }),
        supabase.from('social_conversations').select('unread_count').gt('unread_count', 0),
        supabase.from('social_ai_logs').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      ]);
      setStats({
        accounts: a.count || 0,
        convs: c.count || 0,
        unread: (u.data || []).reduce((s, r: any) => s + (r.unread_count || 0), 0),
        aiToday: ai.count || 0,
      });
    })();
  }, []);

  const cards = [
    { label: 'اکانت‌های متصل', value: stats.accounts, icon: Users, href: '/enroll/admin/social/accounts' },
    { label: 'مکالمات', value: stats.convs, icon: MessageSquare, href: '/enroll/admin/social/inbox' },
    { label: 'پیام‌های خوانده‌نشده', value: stats.unread, icon: Bell, href: '/enroll/admin/social/inbox' },
    { label: 'پاسخ‌های AI امروز', value: stats.aiToday, icon: Bot, href: '/enroll/admin/social/inbox' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">داشبورد Social CRM</h1>
        <p className="text-sm text-muted-foreground mt-1">مدیریت یکپارچه اینستاگرام و شبکه‌های اجتماعی</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm text-muted-foreground">{c.label}</CardTitle>
                <c.icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{c.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>راهنمای شروع</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>۱. به بخش <Link to="/enroll/admin/social/accounts" className="text-primary underline">اکانت‌ها</Link> بروید و اکانت‌های نوین‌هاب را همگام‌سازی کنید.</p>
          <p>۲. در <Link to="/enroll/admin/social/inbox" className="text-primary underline">صندوق پیام‌ها</Link> DMها را مشاهده و پاسخ دهید.</p>
          <p>۳. از دکمه‌های AI برای پیشنهاد پاسخ، خلاصه‌سازی و پیگیری استفاده کنید.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialDashboard;
