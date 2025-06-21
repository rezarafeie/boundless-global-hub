
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, MessageCircle, Users } from 'lucide-react';
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
    return (
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="text-center text-gray-500">در حال بارگیری تاپیک‌ها...</div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 py-2">
        <div className="flex gap-2 overflow-x-auto">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onTopicChange(topic.id.toString())}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                selectedTopic === topic.id.toString()
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {topic.title}
            </button>
          ))}
        </div>
      </div>
    </div>
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
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-500">در حال بارگیری پیام‌ها...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">خطا در بارگیری پیام‌ها</p>
          <p className="text-gray-500 text-sm mt-2">لطفاً صفحه را دوباره بارگیری کنید</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={chatContainerRef} 
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full min-h-64">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">هنوز پیامی ارسال نشده</p>
            <p className="text-gray-400 text-sm">اولین نفری باشید که پیام می‌فرستد!</p>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <ModernChatMessage
            key={message.id}
            message={message}
            isOwnMessage={message.user_id?.toString() === currentUserId}
          />
        ))
      )}
    </div>
  );
};

const UnapprovedMessage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:via-black dark:to-gray-800 flex items-center justify-center" dir="rtl">
    <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center">
      <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <MessageCircle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        در انتظار تایید
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
        حساب کاربری شما هنوز توسط مدیر تایید نشده است. لطفاً منتظر بمانید تا دسترسی شما فعال شود.
      </p>
      <Link to="/hub">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
          بازگشت به مرکز بدون مرز
        </Button>
      </Link>
    </div>
  </div>
);

const BorderlessHubChat: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState('1');
  const { isAuthenticated, currentUser } = useAuth();
  const { toast } = useToast();
  const { onlineUsers } = useOnlineUsers();
  const navigate = useNavigate();

  // Check authentication and approval status
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login?redirect=/hub/chat');
      return;
    }
  }, [isAuthenticated, navigate]);

  const handleSendMessage = async (messageText: string) => {
    if (!isAuthenticated || !currentUser?.approved) {
      toast({
        title: "خطا",
        description: "برای ارسال پیام ابتدا باید تایید شوید",
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

  // Show unapproved message if user is not approved
  if (isAuthenticated && currentUser && !currentUser.approved) {
    return <UnapprovedMessage />;
  }

  // Don't render anything if not authenticated (will be redirected)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:via-black dark:to-gray-800" dir="rtl" style={{ paddingTop: '100px' }}>
        <div className="h-screen flex flex-col" style={{ height: 'calc(100vh - 100px)' }}>
          
          {/* Chat Header - Telegram Style */}
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Link to="/hub">
                    <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2">
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        💬 گفت‌وگوهای بدون مرز
                      </h1>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{onlineUsers.length} نفر آنلاین</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20">
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

          {/* Chat Messages Area - Telegram Style */}
          <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
            <ChatTopicMessages 
              topicId={selectedTopic} 
              currentUserId={currentUser?.id}
            />
          </div>

          {/* Chat Input - Telegram Style */}
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
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
      </div>
    </MainLayout>
  );
};

export default BorderlessHubChat;
