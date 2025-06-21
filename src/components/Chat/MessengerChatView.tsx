
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Users, HeadphonesIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { messengerService, type MessengerUser, type MessengerMessage } from '@/lib/messengerService';
import { useToast } from '@/hooks/use-toast';
import ModernChatInput from './ModernChatInput';

interface ChatRoom {
  id: number;
  name: string;
  type: string;
  description: string;
  is_boundless_only: boolean;
}

interface MessengerChatViewProps {
  room: ChatRoom;
  currentUser: MessengerUser;
  onBack: () => void;
}

const MessengerChatView: React.FC<MessengerChatViewProps> = ({
  room,
  currentUser,
  onBack
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  const cleanupChannel = () => {
    if (channelRef.current && isSubscribedRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
        console.log('Channel cleaned up successfully');
      } catch (error) {
        console.error('Error cleaning up channel:', error);
      }
      channelRef.current = null;
      isSubscribedRef.current = false;
    }
  };

  const fetchMessages = async () => {
    try {
      setError(null);
      const sessionToken = localStorage.getItem('messenger_session_token');
      if (!sessionToken) {
        throw new Error('No session token found. Please log in again.');
      }

      console.log(`Fetching messages for room: ${room.name} (${room.type})`);

      let fetchedMessages: MessengerMessage[] = [];
      if (room.type === 'support_chat') {
        fetchedMessages = await messengerService.getPrivateMessages(currentUser.id, sessionToken);
      } else {
        fetchedMessages = await messengerService.getRoomMessages(room.id, sessionToken);
      }
      
      setMessages(fetchedMessages);
      console.log(`Successfully loaded ${fetchedMessages.length} messages`);
      
      // Reset retry count on successful fetch
      setRetryCount(0);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      const errorMessage = error.message || 'خطا در بارگذاری پیام‌ها. لطفاً دوباره تلاش کنید.';
      setError(errorMessage);
      
      // Show toast for user feedback
      toast({
        title: 'خطا در بارگذاری پیام‌ها',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const setupMessagesAndSubscription = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch initial messages
        await fetchMessages();

        // Clean up any existing channel
        cleanupChannel();

        // Create unique channel name with timestamp to avoid conflicts
        const channelName = `messages_${room.type}_${room.id}_${currentUser.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('Setting up realtime subscription:', channelName);
        channelRef.current = supabase.channel(channelName);
        
        channelRef.current
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messenger_messages' },
            (payload) => {
              try {
                console.log('New message received:', payload);
                const newMessage = payload.new as MessengerMessage;
                if (room.type === 'support_chat') {
                  // For support chat, show messages where user is sender or recipient
                  if (newMessage.sender_id === currentUser.id || newMessage.recipient_id === currentUser.id) {
                    setMessages((prevMessages) => [...prevMessages, newMessage]);
                  }
                } else {
                  // For room messages, show messages in this room
                  if (newMessage.room_id === room.id) {
                    setMessages((prevMessages) => [...prevMessages, newMessage]);
                  }
                }
              } catch (error) {
                console.error('Error processing new message:', error);
              }
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status);
            if (status === 'SUBSCRIBED') {
              isSubscribedRef.current = true;
              console.log('Successfully subscribed to channel:', channelName);
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Channel subscription error');
              toast({
                title: 'خطا در اتصال',
                description: 'خطا در اتصال به‌روزرسانی زنده. پیام‌های جدید ممکن است با تاخیر نمایش داده شوند.',
                variant: 'destructive',
              });
            }
          });

      } catch (error) {
        console.error('Error setting up messages and subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    setupMessagesAndSubscription();

    return cleanupChannel;
  }, [room.id, room.type, currentUser.id]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (messageText: string): Promise<void> => {
    if (!messageText.trim() || sendingMessage) return;
    
    setSendingMessage(true);
    try {
      const sessionToken = localStorage.getItem('messenger_session_token');
      if (!sessionToken) {
        throw new Error('No session token found. Please log in again.');
      }

      const messageData = {
        room_id: room.type === 'support_chat' ? undefined : room.id,
        sender_id: currentUser.id,
        recipient_id: room.type === 'support_chat' ? 1 : undefined, // Support agent ID
        message: messageText,
        message_type: 'text'
      };

      console.log('Sending message with data:', messageData);
      
      const sentMessage = await messengerService.sendMessage(messageData, sessionToken);
      
      // Immediately add the message to the local state for instant feedback
      setMessages((prevMessages) => [...prevMessages, sentMessage]);
      
      // Success feedback
      toast({
        title: 'پیام ارسال شد',
        description: 'پیام شما با موفقیت ارسال شد.',
      });
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Show detailed error message
      const errorMessage = error?.message || 'ارسال پیام با مشکل مواجه شد.';
      
      toast({
        title: 'خطا در ارسال پیام',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error; // Re-throw to let ModernChatInput handle it
    } finally {
      setSendingMessage(false);
    }
  };

  const getChatTitle = () => {
    if (room.type === 'support_chat') {
      return 'پشتیبانی';
    } else {
      return room.name;
    }
  };

  const getChatIcon = () => {
    if (room.type === 'support_chat') {
      return <HeadphonesIcon className="w-5 h-5 text-green-500" />;
    } else {
      return <Users className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setLoading(true);
    fetchMessages().finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">در حال بارگذاری پیام‌ها...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-500 mb-4 text-center">{error}</p>
        <div className="space-y-2">
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            تلاش مجدد
          </Button>
          {retryCount > 2 && (
            <p className="text-xs text-slate-500 text-center">
              اگر مشکل ادامه دارد، لطفاً از حساب خود خارج شده و دوباره وارد شوید
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Minimal Chat Header with Title */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Button>
          
          <div className="flex items-center gap-2">
            {getChatIcon()}
            <h2 className="font-semibold text-slate-900 dark:text-white text-lg">
              {getChatTitle()}
            </h2>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-500">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-lg font-medium mb-2">هنوز پیامی ارسال نشده</p>
              <p className="text-sm">اولین پیام را ارسال کنید!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`mb-3 flex flex-col ${message.sender_id === currentUser.id ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${message.sender_id === currentUser.id
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-600'}`}>
                <p className="text-sm leading-relaxed">{message.message}</p>
                <div className={`text-xs mt-2 ${message.sender_id === currentUser.id 
                  ? 'text-blue-100' 
                  : 'text-slate-500 dark:text-slate-400'}`}>
                  {new Date(message.created_at).toLocaleTimeString('fa-IR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Modern Chat Input */}
      <ModernChatInput 
        onSendMessage={handleSendMessage}
        disabled={sendingMessage}
      />
    </div>
  );
};

export default MessengerChatView;
