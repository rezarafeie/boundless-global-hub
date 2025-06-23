
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Loader2, Headphones, MessageSquare } from 'lucide-react';
import { MessengerUser, MessengerMessage } from '@/lib/messengerService';
import { privateMessageService } from '@/lib/privateMessageService';
import { useToast } from '@/hooks/use-toast';

interface MessengerSupportRoom {
  id: string;
  name: string;
  description: string;
  type: 'academy_support' | 'boundless_support';
  icon: React.ReactNode;
  isPermanent: true;
}

interface SupportChatViewProps {
  supportRoom: MessengerSupportRoom;
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
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get support user ID based on room type
  const getSupportUserId = () => {
    return supportRoom.type === 'academy_support' ? 999997 : 999998;
  };

  useEffect(() => {
    loadMessages();
  }, [supportRoom.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const supportUserId = getSupportUserId();
      
      // Get or create conversation with support user
      const conversationId = await privateMessageService.getOrCreateConversation(
        currentUser.id,
        supportUserId,
        sessionToken
      );
      
      // Load messages from the conversation
      const conversationMessages = await privateMessageService.getConversationMessages(conversationId, sessionToken);
      setMessages(conversationMessages);
    } catch (error) {
      console.error('Error loading support messages:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری پیام‌های پشتیبانی',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const supportUserId = getSupportUserId();
      
      await privateMessageService.sendMessage(
        currentUser.id,
        supportUserId,
        newMessage.trim(),
        sessionToken
      );

      setNewMessage('');
      await loadMessages();
      
      toast({
        title: 'پیام ارسال شد',
        description: 'پیام شما به تیم پشتیبانی ارسال شد',
      });
    } catch (error) {
      console.error('Error sending support message:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ارسال پیام به پشتیبانی',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <button
          onClick={onBack}
          className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <Avatar className="w-10 h-10">
          <AvatarFallback 
            style={{ backgroundColor: getAvatarColor(supportRoom.name) }}
            className="text-white font-medium"
          >
            {supportRoom.type === 'academy_support' ? '🎓' : '🌐'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white">{supportRoom.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{supportRoom.description}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            {supportRoom.type === 'academy_support' ? (
              <MessageSquare className="w-3 h-3" />
            ) : (
              <Headphones className="w-3 h-3" />
            )}
            پشتیبانی
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-slate-500 dark:text-slate-400">در حال بارگذاری پیام‌ها...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {supportRoom.type === 'academy_support' ? '🎓' : '🌐'}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                خوش آمدید به {supportRoom.name}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {supportRoom.description}
              </p>
              <p className="text-sm text-slate-400">
                سوال یا مشکل خود را مطرح کنید، تیم پشتیبانی در اسرع وقت پاسخ خواهد داد.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex items-start gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback 
                  style={{ backgroundColor: getAvatarColor(message.sender?.name || 'U') }}
                  className="text-white font-medium text-xs"
                >
                  {message.sender_id === currentUser.id ? (
                    currentUser.name.charAt(0)
                  ) : (
                    supportRoom.type === 'academy_support' ? '🎓' : '🌐'
                  )}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-slate-900 dark:text-white">
                    {message.sender_id === currentUser.id ? 'شما' : supportRoom.name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(message.created_at).toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {message.sender_id === currentUser.id && (
                    <Badge variant="outline" className="text-xs">شما</Badge>
                  )}
                </div>
                
                <div className={`p-3 rounded-lg ${
                  message.sender_id === currentUser.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                    : 'bg-slate-50 dark:bg-slate-700'
                }`}>
                  <p className="text-slate-900 dark:text-white whitespace-pre-wrap">
                    {message.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="پیام خود را برای پشتیبانی بنویسید..."
            className="flex-1"
            disabled={sending}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          تیم پشتیبانی معمولاً در کمتر از ۲۴ ساعت پاسخ می‌دهند
        </p>
      </div>
    </div>
  );
};

export default SupportChatView;
