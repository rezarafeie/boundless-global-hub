import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSkeleton, ChatSkeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, Users, Loader2, Pin, MoreVertical, Hash, Crown, MessageCircle } from 'lucide-react';
import { messengerService, type ChatRoom, type MessengerUser, type MessengerMessage } from '@/lib/messengerService';
import { privateMessageService, type PrivateMessage } from '@/lib/privateMessageService';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import SuperGroupTopicSelection from './SuperGroupTopicSelection';
import PinnedMessage from './PinnedMessage';
import ModernChatInput from './ModernChatInput';
import ModernChatMessage from './ModernChatMessage';
import MediaMessage from './MediaMessage';
import UserProfile from './UserProfile';
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
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [profileUser, setProfileUser] = useState<MessengerUser | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedRoom || selectedUser) {
      loadMessages();
    }
  }, [selectedRoom?.id, selectedUser?.id, selectedTopic?.id]);

  // Enhanced real-time subscription for messages
  useEffect(() => {
    if (!selectedRoom && !selectedUser) return;
    
    console.log('🔄 Setting up real-time subscriptions for:', {
      room: selectedRoom?.id,
      user: selectedUser?.id,
      topic: selectedTopic?.id,
      currentUser: currentUser.id
    });
    
    const channels: any[] = [];
    setConnectionStatus('connecting');
    
    // Subscribe to messenger messages for room chats
    if (selectedRoom) {
      let filter = `room_id=eq.${selectedRoom.id}`;
      
      // For super groups, also filter by topic if selected
      if (selectedRoom.is_super_group && selectedTopic) {
        filter += ` AND topic_id=eq.${selectedTopic.id}`;
      }
      
      console.log('📡 Room subscription filter:', filter);
      
      const roomMessagesChannel = supabase
        .channel(`room_messages_${selectedRoom.id}_${selectedTopic?.id || 'all'}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messenger_messages',
            filter
          },
          async (payload) => {
            console.log('📨 New room message received:', payload);
            const newMessage = payload.new as any;
            
            // Fetch complete sender data
            try {
              const senderData = await supabase
                .from('chat_users')
                .select('*')
                .eq('id', newMessage.sender_id)
                .single();
              
              const completeMessage: MessengerMessage = {
                ...newMessage,
                sender: senderData.data || { 
                  id: newMessage.sender_id,
                  name: 'Unknown', 
                  phone: '',
                  is_approved: false,
                  is_messenger_admin: false,
                  is_support_agent: false,
                  bedoun_marz: false,
                  bedoun_marz_approved: false,
                  bedoun_marz_request: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  last_seen: new Date().toISOString(),
                  role: 'user' as const,
                  email: null,
                  user_id: null,
                  first_name: null,
                  last_name: null,
                  full_name: null,
                  country_code: null,
                  signup_source: null,
                  bio: null,
                  notification_enabled: true,
                  notification_token: null,
                  password_hash: null,
                  avatar_url: null,
                  username: null
                }
              };
              
              setMessages(prev => {
                // Avoid duplicates
                const exists = prev.find(msg => msg.id === completeMessage.id);
                if (!exists) {
                  console.log('✅ Adding new room message to state');
                  return [...prev, completeMessage];
                }
                console.log('⚠️ Duplicate room message ignored');
                return prev;
              });
              
              setConnectionStatus('connected');
            } catch (error) {
              console.error('❌ Error fetching sender data:', error);
            }
          }
        )
        .subscribe();
      channels.push(roomMessagesChannel);
    }

    // Subscribe to private messages for private chats
    if (selectedUser && selectedUser.id !== 1) {
      console.log('📡 Setting up private message subscription for user:', selectedUser.id);
      
      const privateMessagesChannel = supabase
        .channel(`private_messages_user_${selectedUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'private_messages'
          },
          async (payload) => {
            console.log('📨 New private message received:', payload);
            const newMessage = payload.new as any;
            
            // Check if this message belongs to current conversation
            try {
              const conversation = await privateMessageService.getConversation(newMessage.conversation_id);
              if (conversation && 
                  ((conversation.user1_id === currentUser.id && conversation.user2_id === selectedUser.id) ||
                   (conversation.user1_id === selectedUser.id && conversation.user2_id === currentUser.id))) {
                
                const completeMessage: MessengerMessage = {
                  ...newMessage,
                  room_id: undefined,
                  media_url: newMessage.media_url,
                  message_type: newMessage.message_type || 'text',
                  media_content: newMessage.media_content,
                  sender: newMessage.sender_id === currentUser.id ? currentUser : selectedUser
                };
                
                setMessages(prev => {
                  const exists = prev.find(msg => msg.id === newMessage.id);
                  if (!exists) {
                    console.log('✅ Adding new private message to state');
                    return [...prev, completeMessage];
                  }
                  console.log('⚠️ Duplicate private message ignored');
                  return prev;
                });
                
                setConnectionStatus('connected');
              }
            } catch (error) {
              console.error('❌ Error processing private message:', error);
            }
          }
        )
        .subscribe();
      channels.push(privateMessagesChannel);
    }

    // Subscribe to support messages (messenger_messages with recipient_id = 1)
    if (selectedUser && selectedUser.id === 1) {
      console.log('📡 Setting up support message subscription for user:', currentUser.id);
      
      const supportMessagesChannel = supabase
        .channel(`support_messages_${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messenger_messages',
            filter: `recipient_id=eq.1`
          },
          async (payload) => {
            console.log('📨 New support message received:', payload);
            const newMessage = payload.new as any;
            
            // Only add if it's from or to the current user
            if (newMessage.sender_id === currentUser.id || 
                (newMessage.conversation_id && newMessage.conversation_id === currentUser.id)) {
              
              try {
                const senderData = await supabase
                  .from('chat_users')
                  .select('*')
                  .eq('id', newMessage.sender_id)
                  .single();
                
                const completeMessage: MessengerMessage = {
                  ...newMessage,
                  sender: senderData.data || { 
                    id: newMessage.sender_id,
                    name: newMessage.sender_id === currentUser.id ? currentUser.name : 'پشتیبانی', 
                    phone: '',
                    is_approved: false,
                    is_messenger_admin: false,
                    is_support_agent: true,
                    bedoun_marz: false,
                    bedoun_marz_approved: false,
                    bedoun_marz_request: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    last_seen: new Date().toISOString(),
                    role: 'support' as const,
                    email: null,
                    user_id: null,
                    first_name: null,
                    last_name: null,
                    full_name: null,
                    country_code: null,
                    signup_source: null,
                    bio: null,
                    notification_enabled: true,
                    notification_token: null,
                    password_hash: null,
                    avatar_url: null,
                    username: null
                  }
                };
                
                setMessages(prev => {
                  const exists = prev.find(msg => msg.id === newMessage.id);
                  if (!exists) {
                    console.log('✅ Adding new support message to state');
                    return [...prev, completeMessage];
                  }
                  console.log('⚠️ Duplicate support message ignored');
                  return prev;
                });
                
                setConnectionStatus('connected');
              } catch (error) {
                console.error('❌ Error fetching support sender data:', error);
              }
            }
          }
        )
        .subscribe();
      channels.push(supportMessagesChannel);
    }

    // Set connection status based on subscription status
    setTimeout(() => {
      if (channels.length > 0) {
        setConnectionStatus('connected');
        console.log('✅ Real-time subscriptions established');
      }
    }, 1000);

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions');
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
      setConnectionStatus('disconnected');
    };
  }, [selectedRoom?.id, selectedUser?.id, currentUser.id, selectedTopic?.id]);

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

  const loadMessages = async () => {
    try {
      setLoading(true);
      console.log('📥 Loading messages for:', {
        room: selectedRoom?.id,
        user: selectedUser?.id,
        topic: selectedTopic?.id,
        isSuper: selectedRoom?.is_super_group
      });
      
      let roomMessages: MessengerMessage[] = [];
      
      if (selectedRoom) {
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
            media_url: msg.media_url,
            message_type: msg.message_type || 'text',
            media_content: msg.media_content,
            sender: msg.sender_id === currentUser.id ? currentUser : selectedUser,
            sender_name: msg.sender_id === currentUser.id ? currentUser.name : selectedUser.name
          })) as MessengerMessage[];
        }
      }
      
      console.log('✅ Loaded messages:', roomMessages.length);
      setMessages(roomMessages);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
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

  const sendMessage = async (messageText: string, media?: { url: string; type: string; size?: number; name?: string }, replyToId?: number) => {
    if ((!messageText.trim() && !media) || sending) return;

    // Add message optimistically to the UI first (for smoother UX)
    const optimisticMessage: MessengerMessage = {
      id: Date.now(), // temporary ID
      message: messageText || (media ? '📎 File' : ''),
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      room_id: selectedRoom?.id || 0,
      media_url: media?.url || null,
      media_content: media ? JSON.stringify({ 
        name: media.name, 
        size: media.size,
        url: media.url,
        type: media.type
      }) : null,
      message_type: media ? 'media' : 'text',
      topic_id: selectedTopic?.id,
      conversation_id: null,
      sender: currentUser,
      is_read: false,
      recipient_id: null,
      unread_by_support: false,
      reply_to_message_id: null,
      forwarded_from_message_id: null
    };

    try {
      setSending(true);
      console.log('📤 Sending message:', { text: messageText, media: !!media });
      
      setMessages(prev => [...prev, optimisticMessage]);
      
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
        await messengerService.sendMessage({
          sender_id: currentUser.id,
          message,
          room_id: selectedRoom.id,
          topic_id: selectedTopic?.id,
          media_url: mediaUrl,
          message_type: mediaType
        });
      } else if (selectedUser) {
        // Check if it's support conversation
        if (selectedUser.id === 1) {
          // Send as support message via messenger service with recipient_id
          await messengerService.sendSupportMessage({
            sender_id: currentUser.id,
            message,
            conversation_id: currentUser.id,
            media_url: mediaUrl,
            message_type: mediaType
          });
        } else {
          // For private messages, use the private message service directly with media support
          await privateMessageService.sendMessage(
            currentUser.id,
            selectedUser.id,
            message,
            mediaUrl,
            mediaType,
            mediaContent
          );
        }
      }

      setNewMessage('');
      console.log('✅ Message sent successfully');
      
      // Remove optimistic message once real-time update comes in
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      }, 2000);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      toast({
        title: 'خطا',
        description: 'خطا در ارسال پیام',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await sendMessage(newMessage);
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const chatTitle = selectedRoom ? selectedRoom.name : selectedUser?.name || '';
  const chatDescription = selectedRoom ? selectedRoom.description : '';

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
      {/* Header with Connection Status */}
      <div className="flex items-center gap-3 p-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={selectedTopic ? () => setSelectedTopic(null) : (onBack || onBackToRooms)} className="flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        
        {/* Only show avatar if not a super group with selected topic */}
        {!(selectedRoom?.is_super_group && selectedTopic) && (
          <Avatar 
            className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              if (selectedUser) {
                setProfileUser(selectedUser);
                setShowUserProfile(true);
              }
            }}
          >
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
          className={`flex-1 ${isMobile && onBack ? 'cursor-pointer' : selectedUser ? 'cursor-pointer' : ''}`}
          onClick={isMobile && onBack ? onBack : selectedUser ? () => {
            setProfileUser(selectedUser);
            setShowUserProfile(true);
          } : undefined}
        >
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {selectedTopic && (selectedTopic as any).icon && <span className="text-lg">{(selectedTopic as any).icon}</span>}
              {selectedTopic ? `${chatTitle} - ${selectedTopic.title}` : 
               selectedUser && selectedUser.id !== 1 ? selectedUser.name : chatTitle}
            </h3>
            
            {/* Connection Status Indicator */}
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`} title={`اتصال: ${connectionStatus}`} />
          </div>
          {selectedRoom && chatDescription && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{chatDescription}</p>
          )}
          {selectedTopic?.description && (
            <p className="text-xs text-slate-400">{selectedTopic.description}</p>
          )}
        </div>
      </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
             id="messages-container"
        >
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
            messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUser.id;
              return (
                <div key={message.id} id={`message-${message.id}`} className={`flex mb-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] sm:max-w-[65%] flex items-start gap-2 group ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* User Avatar - only show for other users' messages */}
                    {!isOwnMessage && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={message.sender_id ? userAvatars[message.sender_id] : undefined} alt={message.sender?.name || 'User'} />
                        <AvatarFallback 
                          className="text-white font-bold text-xs"
                          style={{ backgroundColor: getAvatarColor(message.sender?.name || 'User') }}
                        >
                          {(message.sender?.name || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className="flex flex-col">
                      <div
                        className={`rounded-2xl px-3 py-2 shadow-sm transition-all duration-200 hover:shadow-md relative ${
                          isOwnMessage
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {/* Header - show sender name only for other users */}
                        {!isOwnMessage && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-xs text-slate-700 dark:text-slate-300">
                              {message.sender?.name || 'نامشخص'}
                            </span>
                          </div>
                        )}
                        
                        {/* Media content */}
                        {message.media_url && (
                          <div className="mb-2">
                            <MediaMessage
                              url={message.media_url}
                              type={(() => {
                                try {
                                  return message.media_content ? JSON.parse(message.media_content).type : 'application/octet-stream';
                                } catch {
                                  return 'application/octet-stream';
                                }
                              })()}
                              size={(() => {
                                try {
                                  return message.media_content ? JSON.parse(message.media_content).size : undefined;
                                } catch {
                                  return undefined;
                                }
                              })()}
                              name={(() => {
                                try {
                                  return message.media_content ? JSON.parse(message.media_content).name : message.media_url.split('/').pop();
                                } catch {
                                  return message.media_url.split('/').pop();
                                }
                              })()}
                              className="max-w-[280px]"
                            />
                          </div>
                        )}
                        
                        {/* Message text content */}
                        {message.message && (
                          <p className={`text-sm leading-relaxed ${
                            isOwnMessage ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                          }`}>
                            {message.message}
                          </p>
                        )}
                        
                        {/* Timestamp */}
                        <div className={`flex items-center justify-end mt-1.5 text-xs ${
                          isOwnMessage ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          <span>
                            {new Date(message.created_at).toLocaleTimeString('fa-IR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
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
        <ModernChatInput
          onSendMessage={sendMessage}
          disabled={sending}
          currentUserId={currentUser.id}
        />

        {/* User Profile Modal */}
        <UserProfile
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          user={profileUser}
          currentUserId={currentUser.id}
          onStartChat={() => {
            // Already in chat
          }}
        />
    </div>
  );
};

export default MessengerChatView;
