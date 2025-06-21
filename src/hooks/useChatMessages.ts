
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ChatMessage } from '@/types/supabase';

export const useChatMessages = (topicId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('topic_id', parseInt(topicId))
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        // Ensure proper typing by casting sender_role to the expected union type
        const typedMessages: ChatMessage[] = (data || []).map(msg => ({
          ...msg,
          sender_role: (msg.sender_role as 'admin' | 'moderator' | 'member') || 'member'
        }));
        
        setMessages(typedMessages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطا در بارگیری پیام‌ها');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`chat_messages_${topicId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `topic_id=eq.${parseInt(topicId)}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [topicId]);

  return { messages, loading, error };
};
