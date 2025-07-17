import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Hash, Crown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ChatTopic } from '@/types/supabase';

interface SuperGroupSidebarProps {
  roomId: number;
  roomName: string;
  currentUser: any;
  onTopicSelect: (topic: ChatTopic | null) => void;
  selectedTopic: ChatTopic | null;
  onBackToRooms: () => void;
}

const SuperGroupSidebar: React.FC<SuperGroupSidebarProps> = ({
  roomId,
  roomName,
  currentUser,
  onTopicSelect,
  selectedTopic,
  onBackToRooms
}) => {
  const { toast } = useToast();
  const [topics, setTopics] = useState<ChatTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopics();
    const cleanup = subscribeToTopics();
    return cleanup;
  }, [roomId]);

  const fetchTopics = async () => {
    try {
      console.log('SuperGroupSidebar: Fetching topics for room:', roomId);
      const { data, error } = await supabase
        .from('chat_topics')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      console.log('SuperGroupSidebar: Topics query result:', { data, error });
      if (error) throw error;
      
      console.log('SuperGroupSidebar: Setting topics:', data || []);
      setTopics(data || []);
    } catch (error) {
      console.error('SuperGroupSidebar: Error fetching topics:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری موضوعات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToTopics = () => {
    const channelName = `topics_sidebar_${roomId}_${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_topics',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Topics sidebar subscription event:', payload);
          if (payload.eventType === 'INSERT') {
            const newTopic = payload.new as ChatTopic;
            if (newTopic.is_active) {
              setTopics(prev => [...prev, newTopic]);
            }
          } else if (payload.eventType === 'DELETE') {
            setTopics(prev => prev.filter(t => t.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            const updatedTopic = payload.new as ChatTopic;
            setTopics(prev => prev.map(t =>
              t.id === updatedTopic.id ? updatedTopic : t
            ).filter(t => t.is_active));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up topics sidebar subscription for room:', roomId);
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToRooms}
          className="mb-3 w-full justify-start"
        >
          <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
          بازگشت به گروه‌ها
        </Button>
        
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold text-slate-900 dark:text-white">{roomName}</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          موضوعی را برای مشاهده پیام‌ها انتخاب کنید
        </p>
      </div>

      {/* Topics List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* General Topic */}
          <Button
            variant={!selectedTopic ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onTopicSelect(null)}
            className="w-full justify-start mb-1 h-12"
          >
            <Hash className="w-4 h-4 mr-3" />
            <div className="text-right">
              <div className="font-medium">عمومی</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                پیام‌های عمومی گروه
              </div>
            </div>
          </Button>
          
          {/* Custom Topics */}
          {topics.map((topic) => (
            <Button
              key={topic.id}
              variant={selectedTopic?.id === topic.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onTopicSelect(topic)}
              className="w-full justify-start mb-1 h-12"
            >
              <span className="w-4 h-4 mr-3 text-center">
                {(topic as any).icon || '🔹'}
              </span>
              <div className="text-right flex-1 min-w-0">
                <div className="font-medium truncate">{topic.title}</div>
                {topic.description && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {topic.description}
                  </div>
                )}
              </div>
            </Button>
          ))}

          {topics.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Hash className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">هنوز موضوعی ایجاد نشده</p>
              <p className="text-xs mt-1">ادمین می‌تواند موضوع جدید اضافه کند</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SuperGroupSidebar;