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
    fetchTopics();
    const cleanup = subscribeToTopics();
    return cleanup;
  }, [roomId]);

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
      
      console.log('SuperGroupTopicSelection: Setting topics:', data || []);
      setTopics(data || []);
    } catch (error) {
      console.error('SuperGroupTopicSelection: Error fetching topics:', error);
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
    const channelName = `topics_selection_${roomId}_${Date.now()}`;
    
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

    return () => {
      console.log('Cleaning up topics selection subscription for room:', roomId);
      supabase.removeChannel(channel);
    };
  };

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* General Topic Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400"
          onClick={() => onTopicSelect(null)}
        >
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Hash className="w-8 h-8 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">عمومی</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              پیام‌های عمومی گروه
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                ورود به چت عمومی
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Custom Topics */}
        {topics.map((topic) => (
          <Card 
            key={topic.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border hover:border-blue-500 dark:hover:border-blue-400"
            onClick={() => onTopicSelect(topic)}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">
                  {(topic as any).icon || '🔹'}
                </span>
              </div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
                {topic.title}
              </h3>
              {topic.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {topic.description}
                </p>
              )}
              <div className="mt-4">
                <Button variant="default" size="sm" className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  ورود به {topic.title}
                </Button>
              </div>
            </CardContent>
          </Card>
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
          
          {/* Show general topic even when no custom topics exist */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 max-w-sm mx-auto"
            onClick={() => onTopicSelect(null)}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <Hash className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2">چت عمومی</h3>
              <Button variant="outline" size="sm" className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                شروع گفتگو
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SuperGroupTopicSelection;