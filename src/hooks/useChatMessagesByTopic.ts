
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ChatMessage } from '@/types/supabase';

export const useChatMessagesByTopic = (topicId: number | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!topicId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('topic_id', topicId)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        setMessages((data || []) as ChatMessage[]);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel(`messages_topic_${topicId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `topic_id=eq.${topicId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new as ChatMessage]);
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => 
              m.id === payload.new.id ? payload.new as ChatMessage : m
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [topicId]);

  return { messages, loading };
};
