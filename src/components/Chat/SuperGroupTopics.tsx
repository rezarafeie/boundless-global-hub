import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Hash, Pin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ChatTopic } from '@/types/supabase';

interface SuperGroupTopicsProps {
  roomId: number;
  currentUser: any;
  onTopicSelect: (topic: ChatTopic | null) => void;
  selectedTopic: ChatTopic | null;
  onCreateTopic?: () => void;
}

const SuperGroupTopics: React.FC<SuperGroupTopicsProps> = ({
  roomId,
  currentUser,
  onTopicSelect,
  selectedTopic,
  onCreateTopic
}) => {
  const { toast } = useToast();
  const [topics, setTopics] = useState<ChatTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopics();
    subscribeToTopics();
  }, [roomId]);

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_topics')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
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
    const channel = supabase
      .channel(`topics_room_${roomId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_topics',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
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
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
            <Hash className="w-4 h-4" />
            موضوعات
          </h3>
          {currentUser?.is_messenger_admin && onCreateTopic && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('Create topic clicked, currentUser:', currentUser);
                console.log('Is messenger admin:', currentUser?.is_messenger_admin);
                onCreateTopic();
              }}
              className="flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              افزودن
            </Button>
          )}
        </div>

        <ScrollArea className="h-32">
          <div className="space-y-1">
            <Button
              variant={!selectedTopic ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onTopicSelect(null)}
              className="w-full justify-start"
            >
              عمومی
            </Button>
            
            {topics.map((topic) => (
              <Button
                key={topic.id}
                variant={selectedTopic?.id === topic.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onTopicSelect(topic)}
                className="w-full justify-start"
              >
                <Hash className="w-3 h-3 mr-2" />
                {topic.title}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default SuperGroupTopics;