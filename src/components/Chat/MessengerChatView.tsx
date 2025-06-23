import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageCircle, Headphones } from 'lucide-react';
import { messengerService, type ChatRoom, type MessengerUser, type MessengerMessage } from '@/lib/messengerService';

interface MessengerChatViewProps {
  selectedRoom?: ChatRoom | null;
  selectedUser?: MessengerUser | null;
  room?: ChatRoom | null;
  currentUser: MessengerUser;
  sessionToken: string;
  onBack?: () => void;
}

const MessengerChatView: React.FC<MessengerChatViewProps> = ({
  selectedRoom,
  selectedUser,
  room,
  currentUser,
  sessionToken,
  onBack
}) => {
  // Use room prop if provided, otherwise use selectedRoom
  const activeRoom = room || selectedRoom;
  
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRoom) {
      loadRoomMessages(activeRoom.id);
    } else if (selectedUser) {
      loadPrivateMessages(selectedUser.id);
    } else {
      setMessages([]);
    }
  }, [activeRoom, selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadRoomMessages = async (roomId: number) => {
    try {
      setLoading(true);
      const messagesData = await messengerService.getMessages(roomId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading room messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrivateMessages = async (userId: number) => {
    try {
      setLoading(true);
      const conversationId = await messengerService.getOrCreatePrivateConversation(currentUser.id, userId);
      const messagesData = await messengerService.getPrivateMessages(conversationId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading private messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      let sentMessage: MessengerMessage;

      if (activeRoom) {
        sentMessage = await messengerService.sendMessage(activeRoom.id, currentUser.id, newMessage.trim());
      } else if (selectedUser) {
        sentMessage = await messengerService.sendPrivateMessage(currentUser.id, selectedUser.id, newMessage.trim());
      } else {
        return;
      }

      setMessages([...messages, sentMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getChatTitle = () => {
    if (activeRoom) {
      return activeRoom.name;
    } else if (selectedUser) {
      return selectedUser.name;
    }
    return '';
  };

  const getChatDescription = () => {
    if (activeRoom) {
      return activeRoom.description;
    } else if (selectedUser) {
      if (selectedUser.phone === '1') return 'پشتیبانی آکادمی رفیعی';
      if (selectedUser.phone === '2') return 'پشتیبانی بدون مرز';
      return selectedUser.username ? `@${selectedUser.username}` : selectedUser.phone;
    }
    return '';
  };

  if (!activeRoom && !selectedUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">چت انتخاب کنید</h3>
          <p className="text-slate-500">برای شروع گفتگو، یک چت را انتخاب کنید</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback 
              style={{ 
                backgroundColor: selectedUser?.phone === '1' || selectedUser?.phone === '2' 
                  ? '#3B82F6' 
                  : getAvatarColor(getChatTitle()) 
              }}
              className="text-white font-medium"
            >
              {selectedUser?.phone === '1' || selectedUser?.phone === '2' ? (
                <Headphones className="w-5 h-5" />
              ) : (
                getChatTitle().charAt(0)
              )}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{getChatTitle()}</h2>
            <p className="text-sm text-slate-500">{getChatDescription()}</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-slate-500">در حال بارگذاری پیام‌ها...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isCurrentUser = message.sender_id === currentUser.id;
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isCurrentUser && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback 
                        style={{ backgroundColor: getAvatarColor(message.sender?.name || 'Unknown') }}
                        className="text-white text-sm"
                      >
                        {(message.sender?.name || 'U').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'order-1' : ''}`}>
                    {!isCurrentUser && (
                      <p className="text-xs text-slate-600 mb-1">{message.sender?.name}</p>
                    )}
                    <div
                      className={`rounded-lg p-3 ${
                        isCurrentUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(message.created_at).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {isCurrentUser && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback 
                        style={{ backgroundColor: getAvatarColor(currentUser.name) }}
                        className="text-white text-sm"
                      >
                        {currentUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="پیام خود را بنویسید..."
            className="flex-1 min-h-[40px] max-h-32 resize-none"
            rows={1}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!newMessage.trim() || sending}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessengerChatView;
