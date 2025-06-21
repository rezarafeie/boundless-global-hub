
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Send, Users, Megaphone, HeadphonesIcon, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EmojiPicker from './EmojiPicker';

interface ChatUser {
  id: number;
  name: string;
  phone: string;
  is_approved: boolean;
  bedoun_marz_approved: boolean;
  is_support_agent: boolean;
  role: string;
}

interface ChatRoom {
  id: number;
  name: string;
  type: string;
  description: string;
  is_boundless_only: boolean;
}

interface Message {
  id: number;
  message: string;
  sender_id: number;
  sender_name?: string;
  created_at: string;
  message_type: string;
}

interface MessengerChatViewProps {
  room: ChatRoom;
  currentUser: ChatUser;
  onBack: () => void;
}

const MessengerChatView: React.FC<MessengerChatViewProps> = ({
  room,
  currentUser,
  onBack
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Set up real-time subscription for messages
    const channel = supabase
      .channel(`room_${room.id}_messages`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messenger_messages',
          filter: room.id > 0 ? `room_id=eq.${room.id}` : `sender_id=eq.${currentUser.id},recipient_id=eq.${currentUser.id}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, currentUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      if (room.id === -1) {
        // Support chat - fetch private messages
        const { data, error } = await supabase
          .from('messenger_messages')
          .select(`
            *,
            sender:chat_users!sender_id(name)
          `)
          .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
          .is('room_id', null)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        const messagesWithNames = (data || []).map(msg => ({
          ...msg,
          sender_name: msg.sender?.name || 'ناشناس'
        }));
        
        setMessages(messagesWithNames);
      } else {
        // Group chat - fetch room messages
        const { data, error } = await supabase
          .from('messenger_messages')
          .select(`
            *,
            sender:chat_users!sender_id(name)
          `)
          .eq('room_id', room.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        const messagesWithNames = (data || []).map(msg => ({
          ...msg,
          sender_name: msg.sender?.name || 'ناشناس'
        }));
        
        setMessages(messagesWithNames);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'خطا',
        description: 'مشکلی در بارگذاری پیام‌ها پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const messageData = {
        message: newMessage.trim(),
        sender_id: currentUser.id,
        message_type: 'text',
        ...(room.id === -1 ? {
          // Support chat - private message
          recipient_id: null, // This would be set to support agent ID in real implementation
          room_id: null
        } : {
          // Group chat
          room_id: room.id,
          recipient_id: null
        })
      };

      const { error } = await supabase
        .from('messenger_messages')
        .insert([messageData]);

      if (error) throw error;

      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'خطا',
        description: 'مشکلی در ارسال پیام پیش آمد',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = newMessage.slice(0, start) + emoji + newMessage.slice(end);
      setNewMessage(newText);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setNewMessage(prev => prev + emoji);
    }
  };

  const getRoomIcon = (type: string) => {
    switch (type) {
      case 'public_group':
        return Users;
      case 'boundless_group':
        return MessageCircle;
      case 'announcement_channel':
        return Megaphone;
      case 'support_chat':
        return HeadphonesIcon;
      default:
        return MessageCircle;
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const isOwnMessage = (senderId: number) => senderId === currentUser.id;

  const Icon = getRoomIcon(room.type);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="md:hidden"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            room.type === 'boundless_group' ? 'bg-indigo-100 dark:bg-indigo-900' :
            room.type === 'support_chat' ? 'bg-green-100 dark:bg-green-900' :
            room.type === 'announcement_channel' ? 'bg-amber-100 dark:bg-amber-900' :
            'bg-blue-100 dark:bg-blue-900'
          }`}>
            <Icon className={`w-5 h-5 ${
              room.type === 'boundless_group' ? 'text-indigo-600 dark:text-indigo-400' :
              room.type === 'support_chat' ? 'text-green-600 dark:text-green-400' :
              room.type === 'announcement_channel' ? 'text-amber-600 dark:text-amber-400' :
              'text-blue-600 dark:text-blue-400'
            }`} />
          </div>
          
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              {room.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {room.description}
            </p>
          </div>

          {room.type === 'boundless_group' && (
            <Badge variant="secondary" className="text-xs">بدون مرز</Badge>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-slate-500 dark:text-slate-400">
              در حال بارگذاری پیام‌ها...
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <Icon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">
              هنوز پیامی ارسال نشده است
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = isOwnMessage(message.sender_id);
            
            return (
              <div
                key={message.id}
                className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] sm:max-w-[60%] flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isOwn && (
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
                      style={{ backgroundColor: getAvatarColor(message.sender_name || 'User') }}
                    >
                      {getInitial(message.sender_name || 'U')}
                    </div>
                  )}
                  
                  <div className="flex flex-col">
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm ${
                        isOwn
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-md'
                      }`}
                    >
                      {!isOwn && (
                        <div className="text-xs font-medium mb-1 opacity-70">
                          {message.sender_name}
                        </div>
                      )}
                      
                      <p className="text-sm leading-relaxed">
                        {message.message}
                      </p>
                      
                      <div className={`text-xs mt-1 ${
                        isOwn ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString('fa-IR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {room.type !== 'announcement_channel' && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <form onSubmit={handleSendMessage} className="flex items-end gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="پیامت رو بنویس..."
                className="resize-none border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 rounded-2xl px-4 py-3 pr-12 min-h-[48px] max-h-32 text-right focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200"
                disabled={sending}
                rows={1}
              />
              <div className="absolute left-3 bottom-3">
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl h-12 w-12 flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default MessengerChatView;
