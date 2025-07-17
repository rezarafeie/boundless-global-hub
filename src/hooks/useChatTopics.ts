
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ChatTopic } from '@/types/supabase';

export const useChatTopics = (roomId?: number) => {
  const [topics, setTopics] = useState<ChatTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchTopics = async () => {
      try {
        let query = supabase
          .from('chat_topics')
          .select('*')
          .eq('is_active', true);

        // If roomId is provided, filter by room
        if (roomId) {
          query = query.eq('room_id', roomId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        setTopics(data || []);
      } catch (error) {
        console.error('Error fetching topics:', error);
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();

    // Real-time subscription
    const channel = supabase
      .channel('topics_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'chat_topics',
          filter: roomId ? `room_id=eq.${roomId}` : undefined
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTopic = payload.new as ChatTopic;
            if (newTopic.is_active && (!roomId || (newTopic as any).room_id === roomId)) {
              setTopics(prev => [newTopic, ...prev]);
            }
          } else if (payload.eventType === 'DELETE') {
            setTopics(prev => prev.filter(t => t.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            const updatedTopic = payload.new as ChatTopic;
            setTopics(prev => prev.map(t => 
              t.id === updatedTopic.id ? updatedTopic : t
            ).filter(t => t.is_active && (!roomId || (t as any).room_id === roomId)));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return { topics, loading };
};
