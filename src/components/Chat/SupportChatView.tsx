
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowRight, Send, Headphones, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MessengerUser } from '@/lib/messengerService';

interface SupportRoom {
  id: string;
  name: string;
  description: string;
  type: 'academy_support' | 'boundless_support';
  icon: React.ReactNode;
  isPermanent: true;
}

interface SupportMessage {
  id: number;
  message: string;
  sender_name: string;
  sender_id: number;
  created_at: string;
  is_from_support: boolean;
}

interface SupportChatViewProps {
  supportRoom: SupportRoom;
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
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      // Simulate sending message to support
      const message: SupportMessage = {
        id: Date.now(),
        message: newMessage,
        sender_name: currentUser.name,
        sender_id: currentUser.id,
        created_at: new Date().toISOString(),
        is_from_support: false
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');

      toast({
        title: 'پیام ارسال شد',
        description: 'پیام شما به تیم پشتیبانی ارسال شد',
      });

      // Simulate support auto-reply after 2 seconds
      setTimeout(() => {
        const autoReply: SupportMessage = {
          id: Date.now() + 1,
          message: 'پیام شما دریافت شد. به زودی پاسخ خواهیم داد.',
          sender_name: 'تیم پشتیبانی',
          sender_id: 1,
          created_at: new Date().toISOString(),
          is_from_support: true
        };
        setMessages(prev => [...prev, autoReply]);
      }, 2000);

    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ارسال پیام',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="md:hidden"
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            {supportRoom.type === 'academy_support' ? (
              <MessageSquare className="w-5 h-5 text-blue-500" />
            ) : (
              <Headphones className="w-5 h-5 text-purple-500" />
            )}
          </div>
          <div>
            <h3 className="font-medium">{supportRoom.name}</h3>
            <p className="text-sm text-slate-500">{supportRoom.description}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {supportRoom.icon}
              </div>
              <p className="text-slate-500 mb-2">به {supportRoom.name} خوش آمدید</p>
              <p className="text-sm text-slate-400">پیام خود را بنویسید تا تیم پشتیبانی پاسخ دهد</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.is_from_support ? '' : '!flex-row-reverse'}`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback 
                    style={{ backgroundColor: getAvatarColor(message.sender_name) }}
                    className="text-white font-medium text-sm"
                  >
                    {message.sender_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 ${message.is_from_support ? '' : 'text-right'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{message.sender_name}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(message.created_at).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div
                    className={`inline-block p-3 rounded-lg max-w-xs ${
                      message.is_from_support
                        ? 'bg-slate-100 dark:bg-slate-700'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    {message.message}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="پیام خود را بنویسید..."
            className="flex-1"
            dir="rtl"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || loading}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SupportChatView;
