
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, HeadphonesIcon, Star } from 'lucide-react';
import ModernChatInput from './ModernChatInput';
import ModernChatMessage from './ModernChatMessage';
import SupportChat from './SupportChat';
import type { ChatMessage } from '@/types/supabase';

interface MessengerChatProps {
  conversation: any;
  messages: ChatMessage[];
  loading: boolean;
  currentUserId: number | null;
  onSendMessage: (message: string) => void;
  onBack: () => void;
  showBackButton: boolean;
}

const MessengerChat: React.FC<MessengerChatProps> = ({
  conversation,
  messages,
  loading,
  currentUserId,
  onSendMessage,
  onBack,
  showBackButton
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getConversationIcon = () => {
    switch (conversation.type) {
      case 'support':
        return <HeadphonesIcon className="w-6 h-6 text-green-600" />;
      case 'topic':
        return conversation.title.includes('بدون مرز') || conversation.is_bedoun_marz_only
          ? <Star className="w-6 h-6 text-amber-600" />
          : <Users className="w-6 h-6 text-blue-600" />;
      default:
        return <Users className="w-6 h-6 text-blue-600" />;
    }
  };

  // Special case for support chat
  if (conversation.type === 'support') {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-2xl h-10 w-10"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            )}
            {getConversationIcon()}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{conversation.title}</h3>
              {conversation.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400">{conversation.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Support Chat Component */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <SupportChat currentUserId={currentUserId!} userName="کاربر" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-2xl h-10 w-10"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          )}
          {getConversationIcon()}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{conversation.title}</h3>
            {conversation.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400">{conversation.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-800 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-300">در حال بارگذاری پیام‌ها...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">
                شروع گفتگو
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                اولین پیام خود را ارسال کنید
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ModernChatMessage
                key={message.id}
                message={message}
                isOwnMessage={message.user_id === currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t border-slate-200 dark:border-slate-700">
        <ModernChatInput 
          onSendMessage={onSendMessage}
          disabled={loading}
        />
      </div>
    </div>
  );
};

export default MessengerChat;
