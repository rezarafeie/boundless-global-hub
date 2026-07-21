import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Image as ImageIcon, Calendar, Heart, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Post {
  id: string;
  provider_post_id: string;
  post_type: string | null;
  caption: string | null;
  media_url: string | null;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  comments_count: number;
  likes_count: number;
  permalink: string | null;
}

const SocialPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('social_posts')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(60);
    setPosts(data as Post[] || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sync = async () => {
    setSyncing(true);
    const { error } = await supabase.functions.invoke('social-comments-sync', { body: {} });
    setSyncing(false);
    if (error) return toast.error('خطا در همگام‌سازی');
    toast.success('همگام‌سازی انجام شد');
    load();
  };

  return (
    <div dir="rtl" className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="w-6 h-6" />
            پست‌ها
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{posts.length} پست</p>
        </div>
        <Button onClick={sync} disabled={syncing}>
          <RefreshCw className={`w-4 h-4 ml-2 ${syncing ? 'animate-spin' : ''}`} />
          همگام‌سازی
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">در حال بارگذاری...</div>
      ) : posts.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          هیچ پستی پیدا نشد.
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {posts.map(p => (
            <Card key={p.id} className="overflow-hidden">
              {p.media_url && (
                <div className="aspect-square bg-muted overflow-hidden">
                  <img src={p.media_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={p.status === 'scheduled' ? 'secondary' : 'default'} className="text-xs">
                    {p.status === 'scheduled' ? 'زمان‌بندی شده' : (p.post_type || 'post')}
                  </Badge>
                  {p.scheduled_at && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(p.scheduled_at).toLocaleString('fa-IR')}
                    </span>
                  )}
                </div>
                {p.caption && (
                  <p className="text-xs text-muted-foreground line-clamp-3">{p.caption}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{p.likes_count}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{p.comments_count}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialPosts;
