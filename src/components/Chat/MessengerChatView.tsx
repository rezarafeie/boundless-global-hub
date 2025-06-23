import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Clock, CheckCircle, Archive, AlertCircle, Tag, FileText, Smile } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messengerService, type MessengerUser, type MessengerMessage, type ChatRoom } from '@/lib/messengerService';
import EmojiPicker from './EmojiPicker';

interface MessengerChatViewProps {
  room: ChatRoom;
  currentUser: MessengerUser;
  sessionToken: string;
  onBack: () => void;
}

const MessengerChatView: React.FC<MessengerChatViewProps> = ({
  room,
  currentUser,
  sessionToken,
  onBack
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const fetchedMessages = await messengerService.getMessages(room.id);
      setMessages(fetchedMessages);
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
  }, [room.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`messenger_room_${room.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messenger_messages' },
        (payload) => {
          const newMessage = payload.new as MessengerMessage;
          if (newMessage.room_id === room.id) {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const sentMessage = await messengerService.sendMessage(
        newMessage,
        currentUser.id,
        room.id
      );
      setMessages((prevMessages) => [...prevMessages, sentMessage]);
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

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleAddReaction = async (messageId: number, emoji: string) => {
    try {
      await messengerService.addReaction(messageId, currentUser.id, emoji);
      toast({
        title: 'واکنش اضافه شد',
        description: `واکنش ${emoji} به پیام اضافه شد`,
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: 'خطا',
        description: 'خطا در اضافه کردن واکنش',
        variant: 'destructive',
      });
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
              {room.name}
            </h2>
            
            {room.description && (
              <Badge variant="outline" className="text-xs">
                {room.description}
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
                  <div className={`text-xs mt-2 flex items-center justify-between ${message.sender_id === currentUser.id 
                    ? 'text-blue-100' 
                    : 'text-slate-500 dark:text-slate-400'}`}>
                    <span>
                      {new Date(message.created_at || '').toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {message.sender_id !== currentUser.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddReaction(message.id, '👍')}
                        className="p-1 h-6 w-6"
                      >
                        <span>👍</span>
                      </Button>
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
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2"
            >
              <Smile className="w-4 h-4" />
            </Button>
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-50">
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </div>
            )}
          </div>
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

export default MessengerChatView;
