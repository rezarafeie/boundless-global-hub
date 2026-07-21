import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Plug, Instagram, CheckCircle2, AlertCircle, Bot } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const SocialAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('social_accounts').select('*').order('created_at', { ascending: false });
    setAccounts(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const connect = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('social-novinhub-connect');
      if (error) throw error;
      toast({ title: 'همگام‌سازی موفق', description: `${data.synced} اکانت به‌روزرسانی شد` });
      await load();
    } catch (e: any) {
      toast({ title: 'خطا', description: e.message, variant: 'destructive' });
    } finally { setSyncing(false); }
  };

  const syncInbox = async (accountId?: string) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('social-inbox-sync', {
        body: accountId ? { account_id: accountId } : {},
      });
      if (error) throw error;
      toast({ title: 'صندوق پیام به‌روز شد', description: `${data.conversations} مکالمه، ${data.messages} پیام` });
      await load();
    } catch (e: any) {
      toast({ title: 'خطا', description: e.message, variant: 'destructive' });
    } finally { setSyncing(false); }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">اکانت‌های اینستاگرام</h1>
          <p className="text-sm text-muted-foreground mt-1">مدیریت اکانت‌های متصل از طریق NovinHub</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={connect} disabled={syncing}>
            <Plug className="w-4 h-4 ml-2" />
            همگام‌سازی اکانت‌ها
          </Button>
          <Button variant="outline" onClick={() => syncInbox()} disabled={syncing || !accounts.length}>
            <RefreshCw className={`w-4 h-4 ml-2 ${syncing ? 'animate-spin' : ''}`} />
            به‌روزرسانی صندوق
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">در حال بارگذاری...</div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <Instagram className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>هنوز هیچ اکانتی متصل نشده است.</p>
            <p className="text-sm mt-1">روی «همگام‌سازی اکانت‌ها» بزنید تا اکانت‌های نوین‌هاب شما بارگیری شوند.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Instagram className="w-4 h-4 text-pink-500" />
                  {a.username}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {a.can_send_direct && <Badge variant="secondary">DM</Badge>}
                  {a.can_send_comment && <Badge variant="secondary">کامنت</Badge>}
                  {a.can_send_post && <Badge variant="secondary">پست</Badge>}
                  {a.login_required ? (
                    <Badge variant="destructive"><AlertCircle className="w-3 h-3 ml-1" />نیاز به ورود</Badge>
                  ) : (
                    <Badge className="bg-green-500 hover:bg-green-500"><CheckCircle2 className="w-3 h-3 ml-1" />فعال</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  آخرین همگام‌سازی: {a.last_sync_at ? new Date(a.last_sync_at).toLocaleString('fa-IR') : '—'}
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={() => syncInbox(a.id)} disabled={syncing}>
                  <RefreshCw className={`w-3 h-3 ml-2 ${syncing ? 'animate-spin' : ''}`} />
                  به‌روزرسانی پیام‌های این اکانت
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialAccounts;
