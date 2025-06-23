import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Clock, CheckCircle, Archive, AlertCircle, Tag, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerUser, type SupportMessage } from '@/lib/messengerService';

interface SupportRoom {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  thread_type_id?: number;
}

interface MessengerSupportRoom {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  thread_type_id?: number;
}

interface SupportChatViewProps {
  room?: SupportRoom;
  supportRoom?: MessengerSupportRoom;
  currentUser: MessengerUser;
  sessionToken: string;
  onBack: () => void;
}

const SupportChatView: React.FC<SupportChatViewProps> = ({
  room,
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
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Use either room or supportRoom
  const activeRoom = room || supportRoom;

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      // Fetch messages to support (recipient_id = 1) for this conversation
      const { data, error } = await supabase
        .from('messenger_messages')
        .select(`
          id,
          message,
          sender_id,
          recipient_id,
          conversation_id,
          message_type,
          is_read,
          created_at,
          media_url,
          sender:chat_users!sender_id(
            id,
            name,
            phone,
            username,
            is_approved,
            bedoun_marz,
            bedoun_marz_approved,
            is_messenger_admin,
            is_support_agent,
            created_at,
            updated_at
          )
        `)
        .eq('recipient_id', 1)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match SupportMessage interface
      const supportMessages: SupportMessage[] = (data || []).map(msg => ({
        id: msg.id,
        message: msg.message,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id || 1,
        conversation_id: msg.conversation_id || 0,
        message_type: msg.message_type,
        is_read: msg.is_read,
        created_at: msg.created_at,
        media_url: msg.media_url || undefined,
        sender: msg.sender
      }));
      
      setMessages(supportMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
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
    fetchMessages();
  }, [activeRoom?.id]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('messenger_messages')
        .insert({
          sender_id: currentUser.id,
          recipient_id: 1, // Support recipient
          message: newMessage,
          message_type: 'text',
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      // Transform to SupportMessage format
      const supportMessage: SupportMessage = {
        id: data.id,
        message: data.message,
        sender_id: data.sender_id,
        recipient_id: data.recipient_id || 1,
        conversation_id: data.conversation_id || 0,
        message_type: data.message_type,
        is_read: data.is_read,
        created_at: data.created_at,
        media_url: data.media_url,
        sender: currentUser
      };

      setMessages((prevMessages) => [...prevMessages, supportMessage]);
      setNewMessage('');

      toast({
        title: 'پیام ارسال شد',
        description: 'پیام شما به تیم پشتیبانی ارسال شد.',
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
            
            <h2 className="font-semibold text-slate-900 dark:text-white text-lg">
              {activeRoom?.name}
            </h2>
            
            {activeRoom?.description && (
              <Badge variant="outline" className="text-xs">
                {activeRoom.description}
              </Badge>
            )}
          </div>
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
              <p className="text-sm">اولین پیام خود را به تیم پشتیبانی ارسال کنید!</p>
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
                  <div className={`text-xs mt-2 flex items-center justify-between ${message.sender_id === currentUser.id 
                    ? 'text-blue-100' 
                    : 'text-slate-500 dark:text-slate-400'}`}>
                    <span>
                      {new Date(message.created_at || '').toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {message.is_read && message.sender_id === currentUser.id && (
                      <CheckCircle className="w-3 h-3" />
                    )}
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
