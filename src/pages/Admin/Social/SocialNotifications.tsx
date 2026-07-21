import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Notif {
  id: string; kind: string; title: string; body: string | null;
  link: string | null; is_read: boolean; created_at: string;
}

const kindColors: Record<string, string> = {
  new_dm: 'bg-blue-500',
  new_lead: 'bg-green-500',
  post_published: 'bg-purple-500',
  post_failed: 'bg-red-500',
  comment: 'bg-orange-500',
};

const SocialNotifications: React.FC = () => {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('social_notifications')
      .select('*').order('created_at', { ascending: false }).limit(100);
    setItems(data as Notif[] || []);
    setLoading(false);
  };
  useEffect(() => {
    load();
    const channel = supabase.channel(`social-notif-${Math.random()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'social_notifications' },
        (payload) => setItems(prev => [payload.new as Notif, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const markRead = async (id: string) => {
    await supabase.from('social_notifications').update({ is_read: true }).eq('id', id);
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };
  const markAllRead = async () => {
    await supabase.from('social_notifications').update({ is_read: true }).eq('is_read', false);
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('همه خوانده شد');
  };

  const unread = items.filter(n => !n.is_read).length;

  return (
    <div dir="rtl" className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            اعلان‌ها
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unread > 0 ? `${unread} اعلان جدید` : 'همه خوانده شده'}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4 ml-2" />همه را خوانده کن
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">در حال بارگذاری...</div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">اعلانی نیست.</Card>
      ) : (
        <div className="space-y-2">
          {items.map(n => (
            <Card key={n.id} className={`p-4 ${n.is_read ? '' : 'border-primary'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${kindColors[n.kind] || 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{n.title}</h3>
                    <Badge variant="outline" className="text-xs">{n.kind}</Badge>
                    {!n.is_read && <Badge className="text-xs">جدید</Badge>}
                  </div>
                  {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{new Date(n.created_at).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })}</span>
                    {n.link && <Link to={n.link} className="text-primary underline">مشاهده</Link>}
                  </div>
                </div>
                {!n.is_read && (
                  <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                    <Check className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialNotifications;
