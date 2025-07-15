
import React, { useRef, useEffect, useState } from 'react';
import { Pin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import ModernChatMessage from './ModernChatMessage';
import type { ChatMessage } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';

interface ChatTopicMessagesProps {
  messages: ChatMessage[];
  loading: boolean;
  currentUserId: number | null;
}

const ChatTopicMessages: React.FC<ChatTopicMessagesProps> = ({ 
  messages, 
  loading, 
  currentUserId 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userAvatars, setUserAvatars] = useState<Record<number, string>>({});
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch user avatars for all message senders
  useEffect(() => {
    const fetchUserAvatars = async () => {
      const userIds = [...new Set(messages.map(msg => msg.user_id).filter(Boolean))];
      if (userIds.length === 0) return;

      try {
        const { data, error } = await supabase
          .from('chat_users')
          .select('id, avatar_url')
          .in('id', userIds);

        if (error) throw error;

        const avatarMap: Record<number, string> = {};
        data?.forEach(user => {
          if (user.avatar_url) {
            avatarMap[user.id] = user.avatar_url;
          }
        });
        
        setUserAvatars(avatarMap);
      } catch (error) {
        console.error('Error fetching user avatars:', error);
      }
    };

    fetchUserAvatars();
  }, [messages]);

  const pinnedMessages = messages.filter(msg => msg.is_pinned);
  const regularMessages = messages.filter(msg => !msg.is_pinned);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-800">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-600 dark:text-slate-400">در حال بارگذاری پیام‌ها...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <Card className="m-4 border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50">
          <div className="p-3 border-b border-amber-200 dark:border-amber-700">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Pin className="w-4 h-4" />
              <span className="font-semibold text-sm">پیام‌های مهم</span>
            </div>
          </div>
          <div className="p-3 space-y-2">
            {pinnedMessages.map((message) => (
              <div key={message.id} 
                   className="p-2 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-xs text-amber-800 dark:text-amber-300">
                    {message.sender_name}
                  </span>
                  <Badge className="bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200 text-xs">
                    {message.sender_role === 'admin' ? 'مدیر' : message.sender_role === 'moderator' ? 'مدیر بحث' : 'عضو'}
                  </Badge>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-200">{message.message}</p>
                <span className="text-xs text-amber-600 dark:text-amber-400 mt-1 block">
                  {new Date(message.created_at).toLocaleString('fa-IR')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Regular Messages */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-800 p-4 pb-24">
        {regularMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-lg font-medium mb-2">
                اولین نفری باشید که در این موضوع پیام می‌فرستد!
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                گفتگو رو شروع کنید
              </p>
            </div>
          </div>
        ) : (
          regularMessages.map((message) => (
            <ModernChatMessage
              key={message.id}
              message={message}
              isOwnMessage={message.user_id === currentUserId}
              senderAvatarUrl={message.user_id ? userAvatars[message.user_id] : undefined}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatTopicMessages;
