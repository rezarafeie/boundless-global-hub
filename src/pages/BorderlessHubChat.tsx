
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ModernChatMessage from '@/components/Chat/ModernChatMessage';
import ModernChatInput from '@/components/Chat/ModernChatInput';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useChatTopics } from '@/hooks/useChatTopics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TopicSelectorProps {
  selectedTopic: string;
  onTopicChange: (topicId: string) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ selectedTopic, onTopicChange }) => {
  const { topics, loading } = useChatTopics();

  if (loading) {
    return <div className="text-center py-4 text-gray-500">در حال بارگیری تاپیک‌ها...</div>;
  }

  return (
    <Tabs defaultValue={selectedTopic} className="border-b border-gray-200 dark:border-gray-700">
      <TabsList className="p-4 space-x-3 flex justify-center">
        {topics.map((topic) => (
          <TabsTrigger 
            key={topic.id} 
            value={topic.id.toString()} 
            onClick={() => onTopicChange(topic.id.toString())}
            className={`data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-300 rounded-full px-4 py-2 text-sm transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-950`}
          >
            {topic.title}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

interface ChatTopicMessagesProps {
  topicId: string;
  currentUserId?: string;
}

const ChatTopicMessages: React.FC<ChatTopicMessagesProps> = ({ topicId, currentUserId }) => {
  const { messages, loading, error } = useChatMessages(topicId);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading) {
    return <div className="text-center py-4 text-gray-500">در حال بارگیری پیام‌ها...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">خطا در بارگیری پیام‌ها</div>;
  }

  return (
    <div ref={chatContainerRef} className="space-y-3">
      {messages.map((message) => (
        <ModernChatMessage
          key={message.id}
          message={message}
          isOwnMessage={message.user_id?.toString() === currentUserId}
        />
      ))}
    </div>
  );
};

const BorderlessHubChat: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState('1');
  const { isAuthenticated, currentUser } = useAuth();
  const { toast } = useToast();
  const { onlineUsers } = useOnlineUsers();

  const handleSendMessage = async (messageText: string) => {
    if (!isAuthenticated || !currentUser?.approved) {
      toast({
        title: "خطا",
        description: "برای ارسال پیام وارد شوید و حساب کاربری خود را فعال کنید",
        variant: "destructive"
      });
      return;
    }

    if (!messageText.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([
          {
            topic_id: parseInt(selectedTopic),
            user_id: parseInt(currentUser?.id),
            sender_name: currentUser?.displayName || 'کاربر بدون نام',
            sender_role: currentUser?.role || 'member',
            message: messageText,
          },
        ]);

      if (error) throw error;
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ارسال پیام",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:via-black dark:to-gray-800" dir="rtl">
        <div className="h-screen flex flex-col">
          
          {/* Chat Header */}
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link to="/hub">
                  <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                      گفت‌وگوهای بدون مرز
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {onlineUsers.length} نفر آنلاین
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  فعال
                </Badge>
              </div>
            </div>
          </div>

          {/* Topic Selector */}
          <TopicSelector 
            selectedTopic={selectedTopic} 
            onTopicChange={setSelectedTopic} 
          />

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full p-4 overflow-y-auto">
              <ChatTopicMessages 
                topicId={selectedTopic} 
                currentUserId={currentUser?.id}
              />
            </div>
          </div>

          {/* Chat Input */}
          <ModernChatInput 
            onSendMessage={handleSendMessage}
            disabled={!isAuthenticated || !currentUser?.approved}
            placeholder={
              !isAuthenticated 
                ? "برای ارسال پیام وارد شوید..."
                : !currentUser?.approved 
                ? "حساب شما در انتظار تأیید است..."
                : "پیام خود را بنویسید..."
            }
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default BorderlessHubChat;
