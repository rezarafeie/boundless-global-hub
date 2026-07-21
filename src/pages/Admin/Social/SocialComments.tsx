import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RefreshCw, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Comment {
  id: string;
  provider_comment_id: string;
  provider_post_id: string | null;
  author_username: string | null;
  author_name: string | null;
  text: string;
  status: string;
  created_at: string;
  reply_text: string | null;
  account_id: string;
}

const SocialComments: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('social_comments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setComments(data as Comment[] || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sync = async () => {
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke('social-comments-sync', { body: {} });
    setSyncing(false);
    if (error) return toast.error('خطا در همگام‌سازی');
    toast.success(`${data?.comments || 0} کامنت و ${data?.posts || 0} پست همگام شد`);
    load();
  };

  const sendReply = async (c: Comment) => {
    const text = replyMap[c.id]?.trim();
    if (!text) return;
    setSending(c.id);
    const { error } = await supabase.functions.invoke('social-comment-reply', {
      body: { comment_id: c.id, text },
    });
    setSending(null);
    if (error) return toast.error('ارسال پاسخ ناموفق');
    toast.success('پاسخ ارسال شد');
    setReplyMap(m => ({ ...m, [c.id]: '' }));
    load();
  };

  const aiSuggest = async (c: Comment) => {
    const { data, error } = await supabase.functions.invoke('social-ai-reply', {
      body: { action: 'suggest', text: c.text, context: 'instagram_comment' },
    });
    if (error) return toast.error('پیشنهاد AI ناموفق');
    setReplyMap(m => ({ ...m, [c.id]: data?.reply || data?.text || '' }));
  };

  return (
    <div dir="rtl" className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">مدیریت کامنت‌ها</h1>
          <p className="text-sm text-muted-foreground mt-1">{comments.length} کامنت</p>
        </div>
        <Button onClick={sync} disabled={syncing}>
          <RefreshCw className={`w-4 h-4 ml-2 ${syncing ? 'animate-spin' : ''}`} />
          همگام‌سازی
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">در حال بارگذاری...</div>
      ) : comments.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          کامنتی یافت نشد. برای شروع «همگام‌سازی» را بزنید.
        </Card>
      ) : (
        <div className="space-y-3">
          {comments.map(c => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-semibold text-sm">@{c.author_username || 'unknown'}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleString('fa-IR')}
                  </div>
                </div>
                <Badge variant={c.status === 'replied' ? 'default' : 'secondary'}>
                  {c.status === 'replied' ? 'پاسخ داده شده' : 'جدید'}
                </Badge>
              </div>
              <p className="text-sm mb-3">{c.text}</p>
              {c.reply_text && (
                <div className="text-xs bg-muted p-2 rounded mb-3">
                  <span className="font-semibold">پاسخ: </span>{c.reply_text}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="پاسخ خود را بنویسید..."
                  value={replyMap[c.id] || ''}
                  onChange={(e) => setReplyMap(m => ({ ...m, [c.id]: e.target.value }))}
                />
                <Button variant="outline" size="icon" onClick={() => aiSuggest(c)} title="پیشنهاد AI">
                  <Sparkles className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => sendReply(c)}
                  disabled={sending === c.id || !replyMap[c.id]?.trim()}
                >
                  <Send className="w-4 h-4 ml-2" />
                  ارسال
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialComments;
