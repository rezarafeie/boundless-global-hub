import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSkeleton, ChatSkeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, Users, Loader2, Pin, MoreVertical, Hash, Crown, MessageCircle, RefreshCw } from 'lucide-react';
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

interface OptimisticMessage extends MessengerMessage {
  isOptimistic?: boolean;
  tempId?: string;
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
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [userAvatars, setUserAvatars] = useState<Record<number, string>>({});
  const [selectedTopic, setSelectedTopic] = useState<ChatTopic | null>(null);
  const [pinnedMessage, setPinnedMessage] = useState<any>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [profileUser, setProfileUser] = useState<MessengerUser | null>(null);
  const [messageLoadError, setMessageLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeChannelsRef = useRef<any[]>([]);
  const optimisticMessagesRef = useRef<Set<string>>(new Set());

  // Debug mode flag - can be enabled via URL param
  const debugMode = new URLSearchParams(window.location.search).get('debug') === 'true';

  const debugLog = (message: string, data?: any) => {
    if (debugMode) {
      console.log(`[MessengerChat Debug] ${message}`, data);
    }
  };

  // Enhanced conversation ID resolution with retry
  const getOrCreateConversationId = async (user1Id: number, user2Id: number, retries = 3): Promise<number> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const conversationId = await privateMessageService.getOrCreateConversation(user1Id, user2Id);
        debugLog(`Conversation ID resolved: ${conversationId} (attempt ${attempt})`);
        return conversationId;
      } catch (error) {
        debugLog(`Conversation ID resolution failed (attempt ${attempt}):`, error);
        if (attempt === retries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    throw new Error('Failed to resolve conversation ID');
  };

  useEffect(() => {
    if (selectedRoom || selectedUser) {
      loadMessages();
    }
    return () => {
      // Cleanup optimistic messages when switching chats
      setMessages(prev => prev.filter(msg => !msg.isOptimistic));
      optimisticMessagesRef.current.clear();
    };
  }, [selectedRoom?.id, selectedUser?.id, selectedTopic?.id]);

  // Enhanced real-time subscription with better message matching
  useEffect(() => {
    if (!selectedRoom && !selectedUser) return;
    
    // Cleanup previous channels
    realtimeChannelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    realtimeChannelsRef.current = [];

    debugLog('Setting up realtime subscriptions for:', { 
      roomId: selectedRoom?.id, 
      userId: selectedUser?.id,
      currentUserId: currentUser.id 
    });

    const channels: any[] = [];
    
    // Subscribe to messenger messages for room chats
    if (selectedRoom) {
      const roomMessagesChannel = supabase
        .channel(`room_messages_${selectedRoom.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messenger_messages',
            filter: `room_id=eq.${selectedRoom.id}`
          },
          (payload) => {
            debugLog('New room message received:', payload);
            const newMessage = payload.new as any;
            
            setMessages(prev => {
              // Find and remove matching optimistic message
              const messageKey = `${newMessage.sender_id}-${newMessage.message}-${selectedRoom.id}`;
              let foundOptimistic = false;
              
              const filteredMessages = prev.filter(msg => {
                if (msg.isOptimistic && msg.sender_id === newMessage.sender_id && 
                    msg.message === newMessage.message && msg.room_id === selectedRoom.id) {
                  foundOptimistic = true;
                  optimisticMessagesRef.current.delete(msg.tempId || '');
                  return false;
                }
                return true;
              });
              
              // Check if real message already exists
              const exists = filteredMessages.find(msg => msg.id === newMessage.id);
              if (!exists) {
                debugLog(`Adding real message, optimistic found: ${foundOptimistic}`);
                return [...filteredMessages, {
                  ...newMessage,
                  sender: { name: 'Unknown', phone: '' }
                }];
              }
              
              return filteredMessages;
            });
          }
        )
        .subscribe();
      channels.push(roomMessagesChannel);
    }

    // Subscribe to private messages for private chats
    if (selectedUser && selectedUser.id !== 1) {
      const privateMessagesChannel = supabase
        .channel(`private_messages_user_${selectedUser.id}_${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'private_messages'
          },
          async (payload) => {
            debugLog('New private message received:', payload);
            const newMessage = payload.new as any;
            
            try {
              // Enhanced conversation validation
              const conversation = await privateMessageService.getConversation(newMessage.conversation_id);
              if (conversation && 
                  ((conversation.user1_id === currentUser.id && conversation.user2_id === selectedUser.id) ||
                   (conversation.user1_id === selectedUser.id && conversation.user2_id === currentUser.id))) {
                
                setMessages(prev => {
                  // Find and remove matching optimistic message
                  let foundOptimistic = false;
                  
                  const filteredMessages = prev.filter(msg => {
                    if (msg.isOptimistic && msg.sender_id === newMessage.sender_id && 
                        msg.message === newMessage.message) {
                      foundOptimistic = true;
                      optimisticMessagesRef.current.delete(msg.tempId || '');
                      return false;
                    }
                    return true;
                  });
                  
                  // Check if real message already exists
                  const exists = filteredMessages.find(msg => msg.id === newMessage.id);
                  if (!exists) {
                    debugLog(`Adding real private message, optimistic found: ${foundOptimistic}`);
                    return [...filteredMessages, {
                      ...newMessage,
                      room_id: undefined,
                      media_url: newMessage.media_url,
                      message_type: newMessage.message_type || 'text',
                      media_content: newMessage.media_content,
                      sender: {
                        name: newMessage.sender_id === currentUser.id ? currentUser.name : selectedUser.name,
                        phone: ''
                      }
                    }];
                  }
                  return filteredMessages;
                });
              }
            } catch (error) {
              debugLog('Error processing private message:', error);
            }
          }
        )
        .subscribe();
      channels.push(privateMessagesChannel);
    }

    // Subscribe to support messages
    if (selectedUser && selectedUser.id === 1) {
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
          (payload) => {
            debugLog('New support message received:', payload);
            const newMessage = payload.new as any;
            
            if (newMessage.sender_id === currentUser.id || newMessage.recipient_id === currentUser.id) {
              setMessages(prev => {
                // Find and remove matching optimistic message
                let foundOptimistic = false;
                
                const filteredMessages = prev.filter(msg => {
                  if (msg.isOptimistic && msg.sender_id === newMessage.sender_id && 
                      msg.message === newMessage.message) {
                    foundOptimistic = true;
                    optimisticMessagesRef.current.delete(msg.tempId || '');
                    return false;
                  }
                  return true;
                });
                
                const exists = filteredMessages.find(msg => msg.id === newMessage.id);
                if (!exists) {
                  debugLog(`Adding real support message, optimistic found: ${foundOptimistic}`);
                  return [...filteredMessages, {
                    ...newMessage,
                    sender: { name: newMessage.sender_id === currentUser.id ? currentUser.name : 'پشتیبانی', phone: '' }
                  }];
                }
                return filteredMessages;
              });
            }
          }
        )
        .subscribe();
      channels.push(supportMessagesChannel);
    }

    realtimeChannelsRef.current = channels;

    // Cleanup function
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
      realtimeChannelsRef.current = [];
    };
  }, [selectedRoom?.id, selectedUser?.id, currentUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        debugLog('Error fetching user avatars:', error);
      }
    };

    fetchUserAvatars();
  }, [messages]);

  const loadMessages = async (retry = false) => {
    try {
      setLoading(true);
      setMessageLoadError(null);
      
      let roomMessages: MessengerMessage[] = [];
      
      if (selectedRoom) {
        debugLog('Loading messages for room:', selectedRoom.id);
        if (selectedRoom.is_super_group) {
          roomMessages = await messengerService.getMessages(selectedRoom.id, selectedTopic?.id);
        } else {
          roomMessages = await messengerService.getMessages(selectedRoom.id);
        }
      } else if (selectedUser) {
        if (selectedUser.id === 1) {
          debugLog('Loading support messages for user:', currentUser.id);
          roomMessages = await messengerService.getSupportMessages(currentUser.id);
        } else {
          debugLog('Loading private messages between users');
          const conversationId = await getOrCreateConversationId(currentUser.id, selectedUser.id);
          const privateMessages = await privateMessageService.getConversationMessages(conversationId, sessionToken);
          
          roomMessages = privateMessages.map(msg => ({
            ...msg,
            room_id: undefined,
            media_url: msg.media_url,
            message_type: msg.message_type || 'text',
            media_content: msg.media_content,
            sender: {
              name: msg.sender_id === currentUser.id ? currentUser.name : selectedUser.name,
              phone: ''
            }
          }));
        }
      }
      
      debugLog('Loaded messages:', roomMessages.length);
      setMessages(roomMessages);
      setRetryCount(0);
    } catch (error) {
      debugLog('Error loading messages:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطا در بارگذاری پیام‌ها';
      setMessageLoadError(errorMessage);
      
      if (!retry && retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => loadMessages(true), 2000 * (retryCount + 1));
      } else {
        toast({
          title: 'خطا',
          description: errorMessage,
          variant: 'destructive',
        });
        setMessages([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    debugLog('Manual refresh triggered');
    loadMessages();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  };

  const sendMessage = async (messageText: string, media?: { url: string; type: string; size?: number; name?: string }, replyToId?: number) => {
    if ((!messageText.trim() && !media) || sending) return;

    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const optimisticMessage: OptimisticMessage = {
      id: Date.now(),
      tempId,
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
      sender: { name: currentUser.name, phone: currentUser.phone },
      isOptimistic: true
    };

    try {
      setSending(true);
      
      setMessages(prev => [...prev, optimisticMessage]);
      optimisticMessagesRef.current.add(tempId);
      debugLog('Added optimistic message:', tempId);
      
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
        debugLog('Room message sent successfully');
      } else if (selectedUser) {
        if (selectedUser.id === 1) {
          await messengerService.sendSupportMessage(
            currentUser.id,
            message,
            mediaUrl,
            mediaType,
            mediaContent
          );
          debugLog('Support message sent successfully');
        } else {
          await privateMessageService.sendMessage(
            currentUser.id,
            selectedUser.id,
            message,
            mediaUrl,
            mediaType,
            mediaContent,
            sessionToken
          );
          debugLog('Private message sent successfully');
        }
      }

      setNewMessage('');
      
      setTimeout(() => {
        if (optimisticMessagesRef.current.has(tempId)) {
          setMessages(prev => prev.filter(msg => msg.tempId !== tempId));
          optimisticMessagesRef.current.delete(tempId);
          debugLog('Removed optimistic message after fallback timeout:', tempId);
        }
      }, 10000);
      
    } catch (error) {
      debugLog('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.tempId !== tempId));
      optimisticMessagesRef.current.delete(tempId);
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

  if (selectedRoom?.is_super_group && !selectedTopic) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-slate-800">
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
      <div className="flex items-center gap-3 p-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={selectedTopic ? () => setSelectedTopic(null) : (onBack || onBackToRooms)} className="flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        
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
            
            {debugMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualRefresh}
                className="ml-2"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            
          </div>
          {selectedRoom && chatDescription && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{chatDescription}</p>
          )}
          {selectedTopic?.description && (
            <p className="text-xs text-slate-400">{selectedTopic.description}</p>
          )}
        </div>
      </div>

      {messageLoadError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-700 dark:text-red-300">
              خطا در بارگذاری پیام‌ها: {messageLoadError}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={loading}
            >
              تلاش مجدد
            </Button>
          </div>
        </div>
      )}

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
              <div key={message.tempId || message.id} id={`message-${message.id}`} className={`flex mb-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] sm:max-w-[65%] flex items-start gap-2 group ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
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
                          ? `${message.isOptimistic ? 'bg-blue-400 opacity-70' : 'bg-gradient-to-r from-blue-500 to-blue-600'} text-white rounded-br-md`
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {message.isOptimistic && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                        </div>
                      )}
                      
                      {!isOwnMessage && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-xs text-slate-700 dark:text-slate-300">
                            {message.sender?.name || 'نامشخص'}
                          </span>
                        </div>
                      )}
                      
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
                      
                      {message.message && (
                        <p className={`text-sm leading-relaxed ${
                          isOwnMessage ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {message.message}
                        </p>
                      )}
                      
                      <div className={`flex items-center justify-end mt-1.5 text-xs ${
                        isOwnMessage ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        <span>
                          {new Date(message.created_at).toLocaleTimeString('fa-IR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {message.isOptimistic && (
                          <span className="ml-1 text-xs opacity-70">در حال ارسال...</span>
                        )}
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

      <ModernChatInput
        onSendMessage={sendMessage}
        disabled={sending}
        currentUserId={currentUser.id}
      />

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
