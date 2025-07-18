
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSkeleton, ChatSkeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, Users, Loader2, Pin, MoreVertical, Hash, Crown } from 'lucide-react';
import { messengerService, type ChatRoom, type MessengerUser, type MessengerMessage } from '@/lib/messengerService';
import { privateMessageService } from '@/lib/privateMessageService';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import SuperGroupTopicSelection from './SuperGroupTopicSelection';
import PinnedMessage from './PinnedMessage';
import ModernChatInput from './ModernChatInput';
import MediaMessage from './MediaMessage';
import type { ChatTopic } from '@/types/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MessengerChatViewProps {
  selectedRoom: ChatRoom | null;
  selectedUser: MessengerUser | null;
  currentUser: MessengerUser;
  sessionToken: string;
  onBack?: () => void;
  onBackToRooms?: () => void;
}

const MessengerChatView: React.FC<MessengerChatViewProps> = ({
  selectedRoom,
  selectedUser,
  currentUser,
  sessionToken,
  onBack,
  onBackToRooms
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [userAvatars, setUserAvatars] = useState<Record<number, string>>({});
  const [selectedTopic, setSelectedTopic] = useState<ChatTopic | null>(null);
  const [pinnedMessage, setPinnedMessage] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedRoom || selectedUser) {
      loadMessages();
      if (selectedRoom) {
        loadPinnedMessage();
      }
    }
  }, [selectedRoom?.id, selectedUser?.id, selectedTopic?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch user avatars when messages change
  useEffect(() => {
    const fetchUserAvatars = async () => {
      const userIds = [...new Set(messages.map(msg => msg.sender_id).filter(Boolean))];
      if (userIds.length === 0) return;

      try {
        const { data, error } = await supabase
          .from('chat_users')
          .select('id, avatar_url')
          .in('id', userIds);

        if (error) throw error;

        const avatarMap: Record<number, string> = {};
        data?.forEach(user => {
          if (user.avatar_url) {
            avatarMap[user.id] = user.avatar_url;
          }
        });
        
        setUserAvatars(avatarMap);
      } catch (error) {
        console.error('Error fetching user avatars:', error);
      }
    };

    fetchUserAvatars();
  }, [messages]);

  const loadPinnedMessage = async () => {
    if (!selectedRoom) return;

    try {
      const { data, error } = await supabase
        .from('pinned_messages')
        .select(`
          *,
          messenger_messages:message_id (
            id,
            message,
            sender_id,
            created_at
          )
        `)
        .or(
          selectedTopic 
            ? `topic_id.eq.${selectedTopic.id}`
            : `room_id.eq.${selectedRoom.id}`
        )
        .order('pinned_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setPinnedMessage(data);
    } catch (error) {
      console.error('Error loading pinned message:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      let roomMessages: MessengerMessage[] = [];
      
      if (selectedRoom) {
        console.log('Loading messages for room:', selectedRoom.id, 'topic:', selectedTopic?.id);
        console.log('Is super group:', selectedRoom.is_super_group);
        // For super groups, topic is required
        if (selectedRoom.is_super_group) {
          roomMessages = await messengerService.getMessages(selectedRoom.id, selectedTopic?.id);
        } else {
          roomMessages = await messengerService.getMessages(selectedRoom.id);
        }
      } else if (selectedUser) {
        if (selectedUser.id === 1) {
          // Support conversation - get messages from messenger_messages where recipient_id = 1
          roomMessages = await messengerService.getSupportMessages(currentUser.id);
        } else {
          const conversationId = await privateMessageService.getOrCreateConversation(
            currentUser.id,
            selectedUser.id
          );
          const privateMessages = await privateMessageService.getConversationMessages(conversationId);
          // Convert private messages to messenger message format
          roomMessages = privateMessages.map(msg => ({
            ...msg,
            room_id: undefined,
            sender: {
              name: msg.sender_id === currentUser.id ? currentUser.name : selectedUser.name,
              phone: ''
            }
          }));
        }
      }
      
      console.log('Loaded messages:', roomMessages);
      setMessages(roomMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری پیام‌ها',
        variant: 'destructive',
      });
      setMessages([]); // Set empty array on error to prevent blank page
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (messageText: string, media?: { url: string; type: string; size?: number; name?: string }) => {
    if ((!messageText.trim() && !media) || sending) return;

    try {
      setSending(true);
      
      // If it's a media message, set message text to empty if no text provided
      const message = messageText || '';
      const mediaUrl = media?.url;
      const mediaType = media?.type;
      const mediaContent = media ? JSON.stringify({ 
        name: media.name, 
        size: media.size,
        url: media.url,
        type: media.type
      }) : null;
      
      if (selectedRoom) {
        await messengerService.sendMessage(
          selectedRoom.id, 
          currentUser.id, 
          message, 
          selectedTopic?.id,
          mediaUrl,
          mediaType,
          mediaContent
        );
      } else if (selectedUser) {
        // Check if it's support conversation
        if (selectedUser.id === 1) {
          // Send as support message via messenger service with recipient_id
          await messengerService.sendSupportMessage(
            currentUser.id,
            message,
            mediaUrl,
            mediaType,
            mediaContent
          );
        } else {
          // Send private message with media support
          if (media) {
            // For private messages with media, we need to use messenger service
            await messengerService.sendPrivateMessageWithMedia(
              currentUser.id,
              selectedUser.id,
              message,
              mediaUrl,
              mediaType,
              mediaContent
            );
          } else {
            await privateMessageService.sendMessage(
              currentUser.id, 
              selectedUser.id, 
              message
            );
          }
        }
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
      sendMessage(newMessage);
    }
  };

  const handlePinMessage = async (message: MessengerMessage) => {
    if (!currentUser?.is_messenger_admin) return;

    try {
      const summary = message.message.length > 100 
        ? message.message.substring(0, 100) + '...'
        : message.message;

      const { error } = await supabase
        .from('pinned_messages')
        .insert({
          message_id: message.id,
          room_id: selectedTopic ? null : selectedRoom?.id,
          topic_id: selectedTopic?.id || null,
          pinned_by: currentUser.id,
          summary
        });

      if (error) throw error;

      toast({
        title: 'موفق',
        description: 'پیام سنجاق شد',
      });

      loadPinnedMessage();
    } catch (error) {
      console.error('Error pinning message:', error);
      toast({
        title: 'خطا',
        description: 'خطا در سنجاق کردن پیام',
        variant: 'destructive',
      });
    }
  };

  const handleUnpinMessage = async () => {
    if (!currentUser?.is_messenger_admin || !pinnedMessage) return;

    try {
      const { error } = await supabase
        .from('pinned_messages')
        .delete()
        .eq('id', pinnedMessage.id);

      if (error) throw error;

      toast({
        title: 'موفق',
        description: 'سنجاق پیام برداشته شد',
      });

      setPinnedMessage(null);
    } catch (error) {
      console.error('Error unpinning message:', error);
      toast({
        title: 'خطا',
        description: 'خطا در برداشتن سنجاق پیام',
        variant: 'destructive',
      });
    }
  };

  const scrollToMessage = (messageId: number) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('highlight-message');
      setTimeout(() => {
        messageElement.classList.remove('highlight-message');
      }, 2000);
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const chatTitle = selectedRoom ? selectedRoom.name : selectedUser?.name || '';
  const chatDescription = selectedRoom ? selectedRoom.description : selectedUser?.phone || '';

  if (!selectedRoom && !selectedUser) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 mb-2">
            یک گفتگو انتخاب کنید
          </p>
          <p className="text-sm text-slate-400">
            از لیست سمت چپ یک گفتگو یا گروه انتخاب کنید
          </p>
        </div>
      </div>
    );
  }

  // If super group is selected but no topic, show topic selection interface
  if (selectedRoom?.is_super_group && !selectedTopic) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-slate-800">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onBackToRooms} className="flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <Avatar className="w-10 h-10">
            <AvatarImage src={selectedRoom.avatar_url} alt={selectedRoom.name} />
            <AvatarFallback 
              style={{ backgroundColor: getAvatarColor(selectedRoom.name) }}
              className="text-white font-medium"
            >
              {selectedRoom.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-600" />
              {selectedRoom.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              موضوعی را برای شروع گفتگو انتخاب کنید
            </p>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="flex-1 p-6">
          <SuperGroupTopicSelection 
            roomId={selectedRoom.id}
            onTopicSelect={setSelectedTopic}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={selectedTopic ? () => setSelectedTopic(null) : (onBack || onBackToRooms)} className="flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        
        {/* Only show avatar if not a super group with selected topic */}
        {!(selectedRoom?.is_super_group && selectedTopic) && (
          <Avatar className="w-10 h-10">
            <AvatarImage src={selectedUser?.avatar_url || selectedRoom?.avatar_url} alt={chatTitle} />
            <AvatarFallback 
              style={{ backgroundColor: getAvatarColor(chatTitle) }}
              className="text-white font-medium"
            >
              {chatTitle.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}
          
        <div 
          className={`flex-1 ${isMobile && onBack ? 'cursor-pointer' : ''}`}
          onClick={isMobile && onBack ? onBack : undefined}
        >
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            {selectedTopic && (selectedTopic as any).icon && <span className="text-lg">{(selectedTopic as any).icon}</span>}
            {selectedTopic ? `${chatTitle} - ${selectedTopic.title}` : chatTitle}
          </h3>
          {chatDescription && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{chatDescription}</p>
          )}
          {selectedTopic?.description && (
            <p className="text-xs text-slate-400">{selectedTopic.description}</p>
          )}
          {isMobile && onBack && (
            <p className="text-xs text-slate-400">ضربه بزنید برای بازگشت</p>
          )}
        </div>
      </div>

        {/* Pinned Message */}
        {pinnedMessage && (
          <PinnedMessage
            summary={pinnedMessage.summary}
            onUnpin={currentUser?.is_messenger_admin ? handleUnpinMessage : undefined}
            onClick={() => scrollToMessage(pinnedMessage.message_id)}
            canUnpin={currentUser?.is_messenger_admin || false}
          />
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
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
                  هنوز پیامی در این {selectedTopic ? 'موضوع' : 'گفتگو'} نیست
                </p>
                <p className="text-sm text-slate-400">
                  اولین نفری باشید که پیام می‌فرستد!
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} id={`message-${message.id}`} className="flex items-start gap-3 group">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={message.sender_id ? userAvatars[message.sender_id] : undefined} alt={message.sender?.name || 'User'} />
                  <AvatarFallback 
                    style={{ backgroundColor: getAvatarColor(message.sender?.name || 'U') }}
                    className="text-white font-medium text-xs"
                  >
                    {message.sender?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-slate-900 dark:text-white">
                      {message.sender?.name || 'نامشخص'}
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
                  
                  <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg relative">
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
                          <p className="text-slate-900 dark:text-white whitespace-pre-wrap">
                            {message.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-900 dark:text-white whitespace-pre-wrap">
                        {message.message}
                      </p>
                    )}
                    
                    {currentUser?.is_messenger_admin && selectedRoom && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePinMessage(message)}>
                              <Pin className="w-4 h-4 mr-2" />
                              سنجاق کردن
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <ModernChatInput
          onSendMessage={sendMessage}
          disabled={sending}
          currentUserId={currentUser.id}
        />
    </div>
  );
};

export default MessengerChatView;
