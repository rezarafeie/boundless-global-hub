
import React, { useState, useEffect } from 'react';
import { useChatTopics } from '@/hooks/useChatTopics';
import { useChatMessagesByTopic } from '@/hooks/useChatMessagesByTopic';
import { chatUserService, chatService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import TopicSelector from '@/components/Chat/TopicSelector';
import ModernChatInput from '@/components/Chat/ModernChatInput';
import ModernChatMessage from '@/components/Chat/ModernChatMessage';
import ChatAuth from '@/components/Chat/ChatAuth';
import type { ChatTopic } from '@/types/supabase';

const BorderlessHubChat = () => {
  const { toast } = useToast();
  const { topics, loading: topicsLoading } = useChatTopics();
  const [activeTopic, setActiveTopic] = useState<ChatTopic | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { messages, loading: messagesLoading } = useChatMessagesByTopic(activeTopic?.id || null);

  useEffect(() => {
    // Set first topic as active when topics load
    if (topics.length > 0 && !activeTopic) {
      setActiveTopic(topics[0]);
    }
  }, [topics, activeTopic]);

  useEffect(() => {
    const checkAuth = async () => {
      const sessionToken = localStorage.getItem('chat_session_token');
      if (sessionToken) {
        try {
          const authData = await chatUserService.validateSession(sessionToken);
          if (authData) {
            setUser(authData.user);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('chat_session_token');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('chat_session_token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!user || !activeTopic) return;

    try {
      await chatService.sendMessage({
        sender_name: user.name,
        sender_role: 'member',
        message,
        topic_id: activeTopic.id,
        user_id: user.id
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ارسال پیام',
        variant: 'destructive',
      });
    }
  };

  const handleAuthenticated = (token: string, name: string) => {
    setUser({ name, id: Date.now() }); // Simple user object
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <ChatAuth onAuthenticated={handleAuthenticated} />;
  }

  if (topicsLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">در حال بارگذاری تاپیک‌ها...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white dark:bg-slate-900 flex flex-col chat-rtl" dir="rtl">
      {/* Topic Selector */}
      <TopicSelector
        topics={topics}
        activeTopic={activeTopic}
        onTopicChange={setActiveTopic}
        isMobile={window.innerWidth < 768}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500 mx-auto mb-2"></div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">در حال بارگذاری پیام‌ها...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                {activeTopic ? `هنوز پیامی در "${activeTopic.title}" نیست` : 'موضوعی انتخاب نشده'}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                اولین نفری باشید که پیام می‌فرستد!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ModernChatMessage
                key={message.id}
                message={message}
                isOwn={message.user_id === user?.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Chat Input */}
      <ModernChatInput 
        onSendMessage={handleSendMessage}
        disabled={!activeTopic}
      />
    </div>
  );
};

export default BorderlessHubChat;
