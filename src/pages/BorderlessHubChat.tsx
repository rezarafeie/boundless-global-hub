
import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
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

interface TopicSelectorProps {
  selectedTopic: string;
  onTopicChange: (topicId: string) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ selectedTopic, onTopicChange }) => {
  const { topics, loading } = useChatTopics();

  if (loading) {
    return <div className="text-center py-2 text-gray-500">در حال بارگیری...</div>;
  }

  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onTopicChange(topic.id.toString())}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
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
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-500">در حال بارگیری پیام‌ها...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">خطا در بارگیری پیام‌ها</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">هنوز پیامی ارسال نشده است</p>
          <p className="text-gray-400 text-sm">اولین نفری باشید که پیام می‌فرستد!</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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

const WaitingApprovalPage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4" dir="rtl">
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
      <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <MessageCircle className="w-10 h-10 text-orange-600 dark:text-orange-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        ⏳ در انتظار تایید
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        حساب شما هنوز تایید نشده است. لطفاً منتظر بمانید تا مدیر حساب شما را تایید کند.
      </p>
      <Link to="/hub">
        <Button variant="outline" className="w-full">
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

  // Check authentication and approval status
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!currentUser?.approved) {
    return <WaitingApprovalPage />;
  }

  const handleSendMessage = async (messageText: string) => {
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
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col" dir="rtl">
      {/* Chat Header - Fixed with proper spacing */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 mt-16 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/hub">
              <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  💬 گفت‌وگوهای بدون مرز
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{onlineUsers.length} نفر آنلاین</span>
                </div>
              </div>
            </div>
          </div>
          
          <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-400">
            فعال
          </Badge>
        </div>
      </div>

      {/* Topic Selector */}
      <TopicSelector 
        selectedTopic={selectedTopic} 
        onTopicChange={setSelectedTopic} 
      />

      {/* Chat Messages Area - Flexible height */}
      <div className="flex-1 flex flex-col min-h-0">
        <ChatTopicMessages 
          topicId={selectedTopic} 
          currentUserId={currentUser?.id}
        />
      </div>

      {/* Chat Input - Fixed at bottom */}
      <div className="flex-shrink-0">
        <ModernChatInput 
          onSendMessage={handleSendMessage}
          placeholder="پیام خود را بنویسید..."
        />
      </div>
    </div>
  );
};

export default BorderlessHubChat;
