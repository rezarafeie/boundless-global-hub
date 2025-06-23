import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, HeadphonesIcon, AlertCircle, RefreshCw, GraduationCap } from 'lucide-react';
import { messengerService, type MessengerUser, type MessengerMessage } from '@/lib/messengerService';
import { useToast } from '@/hooks/use-toast';
import MessageAvatar from './MessageAvatar';
import MessageReactions from './MessageReactions';
import MessageActions from './MessageActions';
import EnhancedChatInput from './EnhancedChatInput';

interface ChatRoom {
  id: number;
  name: string;
  type: string;
  description: string;
  is_boundless_only: boolean;
  thread_type_id?: number;
}

interface EnhancedMessage extends MessengerMessage {
  sender_name?: string;
  is_from_support?: boolean;
  reactions?: any[];
}

interface ReplyingTo {
  messageId: number;
  message: string;
  senderName: string;
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
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null);
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
      console.log(`Fetching messages for room: ${room.name} (${room.type})`);

      let fetchedMessages: EnhancedMessage[] = [];
      if (room.type === 'academy_support' || room.type === 'boundless_support') {
        fetchedMessages = await messengerService.getPrivateMessages(currentUser.id) as EnhancedMessage[];
      } else {
        fetchedMessages = await messengerService.getMessages(room.id) as EnhancedMessage[];
      }
      
      setMessages(fetchedMessages);
      console.log(`Successfully loaded ${fetchedMessages.length} messages`);
      setRetryCount(0);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      const errorMessage = error.message || 'خطا در بارگذاری پیام‌ها. لطفاً دوباره تلاش کنید.';
      setError(errorMessage);
      
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
        
        await fetchMessages();
        cleanupChannel();

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
                const newMessage = payload.new as EnhancedMessage;
                
                // For support rooms, check if message is for current user
                if (room.type === 'academy_support' || room.type === 'boundless_support') {
                  const isRelevantMessage = (
                    (newMessage.sender_id === currentUser.id && newMessage.recipient_id === 1) ||
                    (newMessage.sender_id === 1 && newMessage.recipient_id === currentUser.id)
                  );
                  
                  if (isRelevantMessage) {
                    console.log('Adding support message to chat:', newMessage);
                    // Add sender name for display
                    const messageWithName = {
                      ...newMessage,
                      sender_name: newMessage.sender_id === 1 ? 'پشتیبانی' : currentUser.name
                    };
                    setMessages((prevMessages) => [...prevMessages, messageWithName]);
                  }
                } else {
                  // Regular room message
                  if (newMessage.room_id === room.id) {
                    setMessages((prevMessages) => [...prevMessages, newMessage]);
                  }
                }
              } catch (error) {
                console.error('Error processing new message:', error);
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'message_reactions' },
            (payload) => {
              try {
                console.log('New reaction received:', payload);
                const newReaction = payload.new;
                setMessages((prevMessages) => 
                  prevMessages.map(msg => 
                    msg.id === newReaction.message_id 
                      ? { ...msg, reactions: [...(msg.reactions || []), newReaction] }
                      : msg
                  )
                );
              } catch (error) {
                console.error('Error processing new reaction:', error);
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'message_reactions' },
            (payload) => {
              try {
                console.log('Reaction removed:', payload);
                const removedReaction = payload.old;
                setMessages((prevMessages) => 
                  prevMessages.map(msg => 
                    msg.id === removedReaction.message_id 
                      ? { ...msg, reactions: (msg.reactions || []).filter(r => r.id !== removedReaction.id) }
                      : msg
                  )
                );
              } catch (error) {
                console.error('Error processing removed reaction:', error);
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
                description: 'خطا در اتصال به‌روزرسانی زنده.',
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
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (messageText: string, replyToId?: number): Promise<void> => {
    if (!messageText.trim() || sendingMessage) return;
    
    setSendingMessage(true);
    try {
      const messageData = {
        room_id: (room.type === 'academy_support' || room.type === 'boundless_support') ? undefined : room.id,
        sender_id: currentUser.id,
        recipient_id: (room.type === 'academy_support' || room.type === 'boundless_support') ? 1 : undefined,
        message: messageText,
        message_type: 'text',
        reply_to_message_id: replyToId
      };

      console.log('Sending message with data:', messageData);
      
      const sentMessage = await messengerService.sendMessage(messageData);
      setMessages((prevMessages) => [...prevMessages, sentMessage as EnhancedMessage]);
      
      toast({
        title: 'پیام ارسال شد',
        description: 'پیام شما با موفقیت ارسال شد.',
      });
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage = error?.message || 'ارسال پیام با مشکل مواجه شد.';
      
      toast({
        title: 'خطا در ارسال پیام',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setSendingMessage(false);
    }
  };

  const handleReaction = async (messageId: number, reaction: string) => {
    try {
      await messengerService.addReaction(messageId, currentUser.id, reaction);
      console.log('Reaction added successfully');
    } catch (error: any) {
      console.error('Error adding reaction:', error);
      toast({
        title: 'خطا در افزودن واکنش',
        description: error.message || 'خطا در افزودن واکنش',
        variant: 'destructive',
      });
    }
  };

  const handleReply = (messageId: number) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setReplyingTo({
        messageId,
        message: message.message,
        senderName: message.sender_name || 'کاربر'
      });
    }
  };

  const handleForward = (messageId: number) => {
    console.log('Forwarding message:', messageId);
    // Implementation for forwarding messages will be added later
  };

  const handleReact = (messageId: number) => {
    console.log('React to message:', messageId);
    // This can be used for quick reactions
  };

  const getChatTitle = () => {
    if (room.type === 'academy_support') {
      return '🎓 پشتیبانی آکادمی رفیعی';
    } else if (room.type === 'boundless_support') {
      return '🟦 پشتیبانی بدون مرز';
    } else {
      return room.name;
    }
  };

  const getChatIcon = () => {
    if (room.type === 'academy_support') {
      return <GraduationCap className="w-5 h-5 text-amber-500" />;
    } else if (room.type === 'boundless_support') {
      return <HeadphonesIcon className="w-5 h-5 text-blue-500" />;
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
      {/* Chat Header */}
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
              className={`mb-4 flex ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'} group`}
            >
              <div className={`max-w-[70%] ${message.sender_id === currentUser.id ? 'order-2' : 'order-1'}`}>
                {/* Sender info for other users' messages */}
                {message.sender_id !== currentUser.id && (
                  <div className="flex items-center gap-2 mb-1">
                    <MessageAvatar 
                      name={message.sender_name || 'کاربر'} 
                      userId={message.sender_id} 
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {message.sender_name || 'کاربر'}
                    </span>
                  </div>
                )}

                {/* Reply indicator */}
                {message.reply_to_message_id && (
                  <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-t-lg mb-1 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">پاسخ به پیام</span>
                  </div>
                )}

                {/* Message bubble */}
                <div className={`rounded-2xl px-4 py-3 ${message.sender_id === currentUser.id
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

                {/* Message reactions */}
                <MessageReactions
                  messageId={message.id}
                  reactions={message.reactions || []}
                  onAddReaction={handleReaction}
                  currentUserId={currentUser.id}
                />
              </div>

              {/* Message actions */}
              <div className={`${message.sender_id === currentUser.id ? 'order-1 mr-2' : 'order-2 ml-2'} flex items-center`}>
                <MessageActions
                  messageId={message.id}
                  onReply={handleReply}
                  onForward={handleForward}
                  onReact={handleReact}
                  currentUserId={currentUser.id}
                  senderId={message.sender_id}
                />
              </div>
            </div>
          ))
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Enhanced Chat Input */}
      <EnhancedChatInput 
        onSendMessage={handleSendMessage}
        disabled={sendingMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
};

export default MessengerChatView;
