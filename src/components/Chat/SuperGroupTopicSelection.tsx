
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hash, Users, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ChatTopic } from '@/types/supabase';

interface SuperGroupTopicSelectionProps {
  roomId: number;
  onTopicSelect: (topic: ChatTopic | null) => void;
}

const SuperGroupTopicSelection: React.FC<SuperGroupTopicSelectionProps> = ({
  roomId,
  onTopicSelect
}) => {
  const { toast } = useToast();
  const [topics, setTopics] = useState<ChatTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let channel: any = null;

    const fetchTopics = async () => {
      try {
        console.log('SuperGroupTopicSelection: Fetching topics for room:', roomId);
        const { data, error } = await supabase
          .from('chat_topics')
          .select('*')
          .eq('room_id', roomId)
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        console.log('SuperGroupTopicSelection: Topics query result:', { data, error });
        if (error) throw error;
        
        if (mounted) {
          console.log('SuperGroupTopicSelection: Setting topics:', data || []);
          setTopics(data || []);
        }
      } catch (error) {
        console.error('SuperGroupTopicSelection: Error fetching topics:', error);
        if (mounted) {
          toast({
            title: 'خطا',
            description: 'خطا در بارگذاری موضوعات',
            variant: 'destructive',
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const subscribeToTopics = () => {
      // Create a unique channel name with timestamp to avoid conflicts
      const channelName = `topics_selection_${roomId}_${Date.now()}_${Math.random()}`;
      
      channel = supabase
        .channel(channelName)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_topics',
            filter: `room_id=eq.${roomId}`
          },
          (payload) => {
            if (!mounted) return;
            
            console.log('Topics selection subscription event:', payload);
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
    };

    fetchTopics();
    subscribeToTopics();

    return () => {
      mounted = false;
      if (channel) {
        console.log('Cleaning up topics selection subscription for room:', roomId);
        supabase.removeChannel(channel);
      }
    };
  }, [roomId, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">در حال بارگذاری موضوعات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">انتخاب موضوع</h2>
        <p className="text-slate-600 dark:text-slate-400">
          برای شروع گفتگو یکی از موضوعات زیر را انتخاب کنید
        </p>
      </div>

      <div className="space-y-2">
        {/* Custom Topics */}
        {topics.map((topic) => (
          <div 
            key={topic.id}
            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 p-3 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center gap-3"
            onClick={() => onTopicSelect(topic)}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-lg text-white">
                {(topic as any).icon || '🔹'}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-slate-900 dark:text-white">
                {topic.title}
              </h3>
              {topic.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {topic.description}
                </p>
              )}
            </div>
            <MessageSquare className="w-5 h-5 text-slate-400" />
          </div>
        ))}
      </div>

      {topics.length === 0 && (
        <div className="text-center py-12">
          <Hash className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            هنوز موضوعی ایجاد نشده
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            ادمین می‌تواند موضوعات جدید برای این سوپر گروه اضافه کند
          </p>
        </div>
      )}
    </div>
  );
};

export default SuperGroupTopicSelection;
