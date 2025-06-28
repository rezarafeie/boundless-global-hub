
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSkeleton, ChatSkeleton } from '@/components/ui/skeleton';
import { Send, Users, Loader2, Phone, MoreVertical } from 'lucide-react';
import { messengerService, type ChatRoom, type MessengerUser, type MessengerMessage } from '@/lib/messengerService';
import { privateMessageService } from '@/lib/privateMessageService';
import { useToast } from '@/hooks/use-toast';

interface MessengerChatViewProps {
  selectedRoom: ChatRoom | null;
  selectedUser: MessengerUser | null;
  currentUser: MessengerUser;
  sessionToken: string;
}

const MessengerChatView: React.FC<MessengerChatViewProps> = ({
  selectedRoom,
  selectedUser,
  currentUser,
  sessionToken
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedRoom || selectedUser) {
      loadMessages();
    }
  }, [selectedRoom?.id, selectedUser?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      let roomMessages: MessengerMessage[] = [];
      
      if (selectedRoom) {
        roomMessages = await messengerService.getMessages(selectedRoom.id);
      } else if (selectedUser) {
        const conversationId = await privateMessageService.getOrCreateConversation(
          currentUser.id,
          selectedUser.id,
          sessionToken
        );
        roomMessages = await privateMessageService.getConversationMessages(conversationId, sessionToken);
      }
      
      setMessages(roomMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری پیام‌ها',
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
      
      if (selectedRoom) {
        await messengerService.sendMessage(selectedRoom.id, currentUser.id, newMessage);
      } else if (selectedUser) {
        await privateMessageService.sendMessage(currentUser.id, selectedUser.id, newMessage, sessionToken);
      }

      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ارسال پیام',
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
    const colors = ['#0088cc', '#2ca5e0', '#8e85ee', '#ee7a00', '#fa5fa0', '#00a63f', '#e17076', '#7b9cff'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const chatTitle = selectedRoom ? selectedRoom.name : selectedUser?.name || '';
  const chatDescription = selectedRoom ? selectedRoom.description : selectedUser?.phone || '';

  if (!selectedRoom && !selectedUser) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Users className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
          <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
            پیام‌رسان آکادمی رفیعی
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            یک گفتگو انتخاب کنید تا شروع کنید
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      {/* Header - Telegram Style */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <Avatar className="w-10 h-10">
          <AvatarFallback 
            style={{ backgroundColor: getAvatarColor(chatTitle) }}
            className="text-white font-medium"
          >
            {selectedRoom ? <Users className="w-5 h-5" /> : chatTitle.charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-white truncate">{chatTitle}</h3>
          {chatDescription && (
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
              {selectedUser && <Phone className="w-3 h-3" />}
              {chatDescription}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant={selectedRoom ? "default" : "secondary"} 
            className={`text-xs ${selectedRoom ? 'bg-blue-500' : 'bg-green-500'}`}
          >
            {selectedRoom ? 'گروه' : 'شخصی'}
          </Badge>
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages - Telegram Style */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50 dark:bg-slate-900" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f1f5f9' fill-opacity='0.4'%3E%3Ccircle cx='10' cy='10' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <MessageSkeleton key={i} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 mb-2">
                هنوز پیامی در این گفتگو نیست
              </p>
              <p className="text-sm text-slate-400">
                اولین نفری باشید که پیام می‌فرستد!
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isMyMessage = message.sender_id === currentUser.id;
            const showAvatar = !isMyMessage && (index === 0 || messages[index - 1].sender_id !== message.sender_id);
            const showName = !isMyMessage && selectedRoom && showAvatar;
            
            return (
              <div key={message.id} className={`flex items-end gap-2 mb-1 ${isMyMessage ? 'flex-row-reverse' : ''}`}>
                {showAvatar && !isMyMessage && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback 
                      style={{ backgroundColor: getAvatarColor(message.sender?.name || 'U') }}
                      className="text-white font-medium text-xs"
                    >
                      {message.sender?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                {!showAvatar && !isMyMessage && <div className="w-8" />}
                
                <div className={`max-w-xs lg:max-w-md ${isMyMessage ? 'ml-auto' : ''}`}>
                  {showName && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 px-2">
                      {message.sender?.name || 'نامشخص'}
                    </p>
                  )}
                  
                  <div className={`rounded-2xl px-4 py-2 shadow-sm ${
                    isMyMessage 
                      ? 'bg-blue-500 text-white rounded-br-md' 
                      : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-md border'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.message}
                    </p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${
                      isMyMessage ? 'text-blue-100' : 'text-slate-400'
                    }`}>
                      <span className="text-xs">
                        {formatTime(message.created_at)}
                      </span>
                      {isMyMessage && (
                        <div className="text-xs">✓</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Telegram Style */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-end gap-3">
          <div className="flex-1 bg-slate-50 dark:bg-slate-700 rounded-2xl p-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="پیام خود را بنویسید..."
              className="border-0 bg-transparent focus:ring-0 focus:border-0 resize-none min-h-[20px] max-h-32"
              disabled={sending}
            />
          </div>
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 p-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessengerChatView;
