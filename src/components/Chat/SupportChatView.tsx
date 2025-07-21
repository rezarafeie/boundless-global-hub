
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supportMessageService } from '@/lib/supportMessageService';
import type { MessengerUser } from '@/lib/messengerService';
import type { SupportMessage } from '@/lib/supportMessageService';
import SupportResponseInput from './SupportResponseInput';

interface SupportRoom {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: React.ReactNode;
  isPermanent: boolean;
}

interface SupportChatViewProps {
  supportRoom: SupportRoom;
  currentUser: MessengerUser;
  sessionToken: string;
  onBack: () => void;
  conversationId: number;
  recipientUserId?: number;
}

const SupportChatView: React.FC<SupportChatViewProps> = ({
  supportRoom,
  currentUser,
  sessionToken,
  onBack,
  conversationId,
  recipientUserId
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!conversationId) return;
    
    try {
      console.log('Loading messages for conversation:', conversationId);
      const conversationMessages = await supportMessageService.getConversationMessages(conversationId);
      console.log('Loaded messages:', conversationMessages.length);
      setMessages(conversationMessages);
      
      // Mark messages as read when chat is opened
      await supportMessageService.markMessagesAsRead(conversationId);
      console.log('Messages marked as read for conversation:', conversationId);
    } catch (error) {
      console.error('Error loading conversation messages:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری پیام‌ها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (conversationId) {
      loadMessages();
    }
  }, [conversationId]);

  const handleMessageSent = () => {
    console.log('Message sent, refreshing conversation messages');
    loadMessages();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-500">در حال بارگذاری گفتگو...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">هنوز پیامی در این گفتگو وجود ندارد</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === 1 ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender_id === 1
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">
                    {message.sender?.name || (message.sender_id === 1 ? 'پشتیبانی' : 'کاربر')}
                  </span>
                  <span className="text-xs opacity-75">
                    {new Date(message.created_at).toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm">{message.message}</p>
                
                {/* Media content */}
                {message.media_url && (
                  <div className="mt-2">
                    {message.message_type === 'image' && (
                      <img 
                        src={message.media_url} 
                        alt="تصویر پیام" 
                        className="max-w-full rounded-lg"
                      />
                    )}
                    {message.message_type === 'voice' && (
                      <audio controls className="max-w-full">
                        <source src={message.media_url} type="audio/mpeg" />
                        مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
                      </audio>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Response Input */}
      <SupportResponseInput
        conversationId={conversationId}
        recipientUserId={recipientUserId || 0}
        onMessageSent={handleMessageSent}
      />
    </div>
  );
};

export default SupportChatView;
