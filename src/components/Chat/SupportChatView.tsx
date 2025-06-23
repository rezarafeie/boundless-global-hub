
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, FileText, Crown, Headphones, Phone, MessageCircle, Shield, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supportService, type SupportConversation, type SupportMessage } from '@/lib/supportService';
import { supportRoomService, type SupportRoom } from '@/lib/supportRoomService';
import { type MessengerUser } from '@/lib/messengerService';

interface MessengerSupportRoom {
  id: string;
  name: string;
  description: string;
  type: 'academy_support' | 'boundless_support';
  icon: React.ReactNode;
  isPermanent: true;
}

interface SupportChatViewProps {
  supportRoom?: SupportRoom | MessengerSupportRoom;
  currentUser: MessengerUser;
  sessionToken: string;
  onBack: () => void;
}

const SupportChatView: React.FC<SupportChatViewProps> = ({
  supportRoom,
  currentUser,
  sessionToken,
  onBack
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchConversationAndMessages = async () => {
    try {
      setLoading(true);
      
      // Get thread type ID based on support room or user type
      let threadTypeId = 1; // Default to academy support
      if (supportRoom) {
        // Handle both SupportRoom and MessengerSupportRoom types
        if ('thread_type_id' in supportRoom) {
          threadTypeId = supportRoom.thread_type_id || 1;
        } else if ('type' in supportRoom) {
          threadTypeId = supportRoom.type === 'boundless_support' ? 2 : 1;
        }
      } else {
        threadTypeId = currentUser.bedoun_marz ? 2 : 1;
      }
      
      // Get or create conversation
      const conv = await supportService.getOrCreateUserConversation(
        currentUser.id, 
        sessionToken, 
        threadTypeId
      );
      
      // Update conversation with support room if provided
      if (supportRoom && conv.id > 0 && 'thread_type_id' in supportRoom) {
        await supabase
          .from('support_conversations')
          .update({ support_room_id: (supportRoom as SupportRoom).id })
          .eq('id', conv.id);
      }
      
      setConversation(conv);
      
      // Get messages for this conversation
      const { data: fetchedMessages, error } = await supabase
        .from('messenger_messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      setMessages(fetchedMessages || []);
      
    } catch (error) {
      console.error('Error fetching conversation and messages:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری گفتگو',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversationAndMessages();
  }, [supportRoom?.id, currentUser.id]);

  useEffect(() => {
    if (!conversation) return;

    const channel = supabase
      .channel(`support_conversation_${conversation.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messenger_messages' },
        (payload) => {
          const newMessage = payload.new as SupportMessage;
          if (newMessage.conversation_id === conversation.id) {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !conversation) return;

    setSending(true);
    try {
      const { data: sentMessage, error } = await supabase
        .from('messenger_messages')
        .insert([{
          message: newMessage,
          sender_id: currentUser.id,
          recipient_id: 1,
          conversation_id: conversation.id,
          message_type: 'text',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      if (sentMessage) {
        setMessages((prevMessages) => [...prevMessages, sentMessage]);
      }
      
      setNewMessage('');

      toast({
        title: 'پیام ارسال شد',
        description: 'پیام شما با موفقیت ارسال شد.',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'خطا در ارسال پیام',
        description: 'خطا در ارسال پیام',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const getIconComponent = (iconName: string | React.ReactNode) => {
    if (React.isValidElement(iconName)) {
      return iconName;
    }
    
    const iconStr = iconName as string;
    switch (iconStr) {
      case 'crown': return <Crown className="w-5 h-5" />;
      case 'phone': return <Phone className="w-5 h-5" />;
      case 'message-circle': return <MessageCircle className="w-5 h-5" />;
      case 'shield': return <Shield className="w-5 h-5" />;
      case 'users': return <Users className="w-5 h-5" />;
      default: return <Headphones className="w-5 h-5" />;
    }
  };

  const getRoomColor = (room: SupportRoom | MessengerSupportRoom) => {
    if ('color' in room) {
      return room.color;
    }
    // Default colors for messenger support rooms
    return room.type === 'boundless_support' ? '#8B5CF6' : '#3B82F6';
  };

  const getRoomIcon = (room: SupportRoom | MessengerSupportRoom) => {
    if ('icon' in room && typeof room.icon === 'string') {
      return getIconComponent(room.icon);
    } else if ('icon' in room) {
      return room.icon;
    }
    return <Headphones className="w-5 h-5" />;
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
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
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
              {supportRoom && (
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${getRoomColor(supportRoom)}20` }}
                >
                  {getRoomIcon(supportRoom)}
                </div>
              )}
              <h2 className="font-semibold text-slate-900 dark:text-white text-lg">
                {supportRoom?.name || 'پشتیبانی'}
              </h2>
            </div>
          </div>
          
          {supportRoom && (
            <Badge 
              variant="outline"
              style={{ 
                borderColor: getRoomColor(supportRoom),
                color: getRoomColor(supportRoom)
              }}
            >
              {supportRoom.description}
            </Badge>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-500">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-lg font-medium mb-2">هنوز پیامی ارسال نشده</p>
              <p className="text-sm">اولین پیام را ارسال کنید!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${message.sender_id === currentUser.id ? 'order-2' : 'order-1'}`}>
                <div className={`rounded-2xl px-4 py-3 ${message.sender_id === currentUser.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-600'}`}>
                  <p className="text-sm leading-relaxed">{message.message}</p>
                  <div className={`text-xs mt-2 ${message.sender_id === currentUser.id 
                    ? 'text-blue-100' 
                    : 'text-slate-500 dark:text-slate-400'}`}>
                    {new Date(message.created_at || '').toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Chat Input */}
      <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-3">
          <Textarea
            placeholder="پیام خود را وارد کنید..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            rows={1}
            className="resize-none flex-1"
          />
          <Button onClick={handleSendMessage} disabled={sending}>
            <Send className="w-4 h-4" />
            ارسال
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SupportChatView;
