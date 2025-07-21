import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supportMessageService } from '@/lib/supportMessageService';
import type { MessengerUser } from '@/lib/messengerService';
import type { SupportMessage } from '@/lib/supportMessageService';
import SupportResponseInput from './SupportResponseInput';
import MediaMessage from './MediaMessage';

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
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 overflow-hidden w-full">
      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 space-y-3 w-full"
        style={{ maxWidth: '100%' }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">هنوز پیامی در این گفتگو وجود ندارد</p>
          </div>
        ) : (
          <div className="w-full space-y-3" style={{ maxWidth: '100%' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === 1 ? 'justify-end' : 'justify-start'} w-full`}
                style={{ maxWidth: '100%', overflow: 'hidden' }}
              >
                <div
                  className={`rounded-lg p-2 sm:p-3 ${
                    message.sender_id === 1
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                  }`}
                  style={{ 
                    maxWidth: '85%',
                    wordBreak: 'break-word', 
                    overflowWrap: 'anywhere',
                    overflow: 'hidden'
                  }}
                >
                  <div 
                    className="flex items-center gap-2 mb-1 flex-wrap text-xs overflow-hidden"
                    style={{ maxWidth: '100%' }}
                  >
                    <span className="font-medium truncate flex-1 min-w-0">
                      {message.sender?.name || (message.sender_id === 1 ? 'پشتیبانی' : 'کاربر')}
                    </span>
                    <span className="opacity-75 flex-shrink-0">
                      {new Date(message.created_at).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  {message.message && (
                    <div 
                      className="text-sm leading-relaxed overflow-hidden"
                      style={{ 
                        wordBreak: 'break-word', 
                        overflowWrap: 'anywhere',
                        whiteSpace: 'pre-wrap',
                        maxWidth: '100%'
                      }}
                    >
                      {message.message}
                    </div>
                  )}
                  
                  {/* Media content */}
                  {message.media_url && (
                    <div 
                      className="mt-2 overflow-hidden w-full" 
                      style={{ maxWidth: '100%' }}
                    >
                      <MediaMessage
                        url={message.media_url}
                        type={message.message_type || 'file'}
                        name={message.media_content || 'فایل'}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Response Input */}
      <div className="flex-shrink-0 overflow-hidden w-full">
        <SupportResponseInput
          conversationId={conversationId}
          recipientUserId={recipientUserId || 0}
          onMessageSent={handleMessageSent}
        />
      </div>
    </div>
  );
};

export default SupportChatView;