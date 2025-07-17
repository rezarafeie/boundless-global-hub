
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, Send, User } from 'lucide-react';
import { privateMessageService, type PrivateMessage, type PrivateConversation } from '@/lib/privateMessageService';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import UserProfileModal from './UserProfileModal';
import ModernChatInput from './ModernChatInput';
import MediaMessage from './MediaMessage';

interface PrivateChatViewProps {
  conversation: PrivateConversation;
  currentUser: MessengerUser;
  sessionToken: string;
  onBack: () => void;
}

const PrivateChatView: React.FC<PrivateChatViewProps> = ({
  conversation,
  currentUser,
  sessionToken,
  onBack
}) => {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const otherUser = conversation.other_user;

  useEffect(() => {
    loadMessages();
    markMessagesAsRead();
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await privateMessageService.getConversationMessages(conversation.id, sessionToken);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await privateMessageService.markMessagesAsRead(conversation.id, currentUser.id, sessionToken);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (messageText: string, media?: { url: string; type: string; size?: number; name?: string }) => {
    if ((!messageText.trim() && !media) || sending) return;

    setSending(true);
    try {
      const message = messageText || '';
      const mediaUrl = media?.url;
      const mediaType = media?.type;
      const mediaContent = media ? JSON.stringify({ 
        name: media.name, 
        size: media.size,
        url: media.url,
        type: media.type
      }) : null;

      await privateMessageService.sendMessage(
        currentUser.id,
        otherUser.id,
        message,
        sessionToken,
        mediaUrl,
        mediaType,
        mediaContent
      );
      
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStartChat = (user: any) => {
    // Convert to full MessengerUser type for compatibility
    const fullUser: MessengerUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar_url: user.avatar_url,
      phone: user.phone,
      is_approved: true,
      is_messenger_admin: false,
      is_support_agent: false,
      bedoun_marz: false,
      bedoun_marz_approved: false,
      bedoun_marz_request: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      role: 'user',
      email: user.email || null,
      user_id: user.user_id || null,
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      full_name: user.full_name || user.name,
      country_code: user.country_code || null,
      signup_source: user.signup_source || null,
      bio: user.bio || null,
      notification_enabled: user.notification_enabled || true,
      notification_token: user.notification_token || null,
      password_hash: user.password_hash || null
    };
    
    // Already in chat, just close modal
    setShowUserProfile(false);
  };

  if (!otherUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">کاربر یافت نشد</p>
          <Button onClick={onBack} variant="outline" className="mt-4">
            بازگشت
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-background">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowRight className="w-4 h-4" />
        </Button>
        
        <div 
          className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-muted rounded-lg p-2 -m-2"
          onClick={() => setShowUserProfile(true)}
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={otherUser.avatar_url} alt={otherUser.name} />
            <AvatarFallback 
              style={{ backgroundColor: getAvatarColor(otherUser.name) }}
              className="text-white font-medium text-sm"
            >
              {otherUser.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">{otherUser.name}</div>
            {otherUser.username && (
              <div className="text-xs text-muted-foreground">@{otherUser.username}</div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">در حال بارگذاری...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">هنوز پیامی ارسال نشده</p>
              <p className="text-xs text-muted-foreground mt-1">اولین پیام را ارسال کنید</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender_id === currentUser.id;
              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {!isOwn && (
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarImage src={otherUser.avatar_url} alt={otherUser.name} />
                      <AvatarFallback 
                        style={{ backgroundColor: getAvatarColor(otherUser.name) }}
                        className="text-white font-medium text-xs"
                      >
                        {otherUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    }`}
                  >
                    {/* Check if message has media */}
                    {message.media_url ? (
                      <div className="space-y-2">
                        <MediaMessage
                          url={message.media_url}
                          type={message.message_type || 'application/octet-stream'}
                          size={message.media_content ? JSON.parse(message.media_content).size : undefined}
                          name={message.media_content ? JSON.parse(message.media_content).name : undefined}
                        />
                        {message.message && (
                          <p className="text-sm">{message.message}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm">{message.message}</p>
                    )}
                    
                    <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-muted-foreground'}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <ModernChatInput
        onSendMessage={sendMessage}
        disabled={sending}
        currentUserId={currentUser.id}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        user={otherUser}
        onStartChat={handleStartChat}
        currentUserId={currentUser.id}
      />
    </div>
  );
};

export default PrivateChatView;
