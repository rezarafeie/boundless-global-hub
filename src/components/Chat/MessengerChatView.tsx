import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSkeleton, ChatSkeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, Users, Loader2, Pin, MoreVertical, Hash, Crown, MessageCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
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
import { webhookService } from '@/lib/webhookService';
import { useReply } from '@/contexts/ReplyContext';
import { Copy, Reply as ReplyIcon, Clock } from 'lucide-react';
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
  status?: 'sending' | 'sent' | 'failed';
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
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeChannelsRef = useRef<any[]>([]);
  const optimisticMessagesRef = useRef<Map<string, OptimisticMessage>>(new Map());
  const lastMessageTimestamp = useRef<string>('');
  const autoRefreshInterval = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debug mode flag - can be enabled via URL param
  const debugMode = new URLSearchParams(window.location.search).get('debug') === 'true';

  const debugLog = (message: string, data?: any) => {
    if (debugMode) {
      console.log(`[MessengerChat Debug] ${message}`, data);
    }
  };

  // Enhanced message matching function with more robust logic
  const createMessageHash = (senderId: number, message: string, timestamp?: string): string => {
    return `${senderId}-${message.substring(0, 50)}-${timestamp || Date.now()}`;
  };

  const findMatchingOptimisticMessage = (realMessage: any): string | null => {
    for (const [tempId, optimisticMsg] of optimisticMessagesRef.current.entries()) {
      // Match by sender and message content first
      const senderMatch = optimisticMsg.sender_id === realMessage.sender_id;
      const contentMatch = optimisticMsg.message.trim() === (realMessage.message || '').trim();
      
      // Time tolerance check (within 2 minutes)
      const timeMatch = Math.abs(
        new Date(realMessage.created_at).getTime() - 
        new Date(optimisticMsg.created_at).getTime()
      ) < 120000; // 2 minutes tolerance

      // For super groups, also match topic_id
      const topicMatch = !selectedRoom?.is_super_group || 
                        (optimisticMsg.topic_id === realMessage.topic_id);

      if (senderMatch && contentMatch && timeMatch && topicMatch) {
        debugLog(`Found matching optimistic message: ${tempId} for real message: ${realMessage.id}`);
        return tempId;
      }
    }
    return null;
  };

  // Enhanced conversation ID resolution with retry
  const getOrCreateConversationId = async (user1Id: number, user2Id: number): Promise<number> => {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const conversationId = await privateMessageService.getOrCreateConversation(user1Id, user2Id);
        debugLog(`Conversation ID resolved: ${conversationId} (attempt ${attempt})`);
        return conversationId;
      } catch (error) {
        debugLog(`Conversation ID resolution failed (attempt ${attempt}):`, error);
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    throw new Error('Failed to resolve conversation ID');
  };

  // Auto-refresh mechanism
  const setupAutoRefresh = () => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
    }

    autoRefreshInterval.current = setInterval(async () => {
      if (!isConnected && (selectedRoom || selectedUser)) {
        debugLog('Auto-refreshing messages due to disconnection');
        await loadMessagesAndSync();
      }
    }, 10000); // Faster auto-refresh for better responsiveness
  };

  const loadMessagesAndSync = async () => {
    try {
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
      
      // Merge with optimistic messages but preserve optimistic ones
      setMessages(prevMessages => {
        const realMessageIds = new Set(roomMessages.map(msg => msg.id));
        
        // Keep optimistic messages that haven't been replaced
        const optimisticMessages = prevMessages.filter(msg => 
          msg.isOptimistic && !realMessageIds.has(msg.id)
        );
        
        // Update last message timestamp
        if (roomMessages.length > 0) {
          lastMessageTimestamp.current = roomMessages[roomMessages.length - 1].created_at;
        }
        
        // Combine and sort
        const combinedMessages = [...roomMessages, ...optimisticMessages];
        return combinedMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
      
      debugLog('Messages synced smoothly:', roomMessages.length);
      setIsConnected(true);
    } catch (error) {
      debugLog('Error syncing messages:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    if (selectedRoom || selectedUser) {
      setMessages([]);
      optimisticMessagesRef.current.clear();
      lastMessageTimestamp.current = '';
      loadMessages();
      setupAutoRefresh();
    }
    
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
      setMessages(prev => prev.filter(msg => !msg.isOptimistic));
      optimisticMessagesRef.current.clear();
    };
  }, [selectedRoom?.id, selectedUser?.id, selectedTopic?.id]);

  // Enhanced real-time subscription with better message handling
  useEffect(() => {
    if (!selectedRoom && !selectedUser) return;
    
    // Cleanup previous channels
    realtimeChannelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    realtimeChannelsRef.current = [];

    debugLog('Setting up realtime subscriptions for fast updates');

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
            const newMessage = payload.new as any;
            
            // For super groups, check topic_id match
            const isTopicMatch = !selectedTopic || !newMessage.topic_id || newMessage.topic_id === selectedTopic.id;
            if (!isTopicMatch) return;
            
            setMessages(prev => {
              // Check for duplicates
              const existingMessage = prev.find(msg => msg.id === newMessage.id && !msg.isOptimistic);
              if (existingMessage) return prev;

              // Check if this replaces an optimistic message
              const matchingOptimistic = prev.find(msg => 
                msg.isOptimistic && 
                msg.sender_id === newMessage.sender_id && 
                msg.message.trim() === (newMessage.message || '').trim() &&
                Math.abs(new Date(newMessage.created_at).getTime() - new Date(msg.created_at).getTime()) < 30000
              );
              
              if (matchingOptimistic && matchingOptimistic.tempId) {
                // Replace optimistic with real message smoothly
                optimisticMessagesRef.current.delete(matchingOptimistic.tempId);
                return prev.map(msg => 
                  msg.tempId === matchingOptimistic.tempId 
                    ? { 
                        ...newMessage, 
                        sender: { name: 'Unknown', phone: '' },
                        isOptimistic: false,
                        status: 'sent' as const
                      }
                    : msg
                );
              } else {
                // Add new message
                return [...prev, {
                  ...newMessage,
                  sender: { name: 'Unknown', phone: '' },
                  isOptimistic: false,
                  status: 'sent' as const
                }].sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
              }
            });
            
            setIsConnected(true);
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
              const conversation = await privateMessageService.getConversation(newMessage.conversation_id);
              if (conversation && 
                  ((conversation.user1_id === currentUser.id && conversation.user2_id === selectedUser.id) ||
                   (conversation.user1_id === selectedUser.id && conversation.user2_id === currentUser.id))) {
                
                setMessages(prev => {
                  // Check for duplicates
                  const existingMessage = prev.find(msg => msg.id === newMessage.id && !msg.isOptimistic);
                  if (existingMessage) {
                    return prev;
                  }

                  const matchingTempId = findMatchingOptimisticMessage(newMessage);
                  
                  if (matchingTempId) {
                    optimisticMessagesRef.current.delete(matchingTempId);
                    debugLog(`Replacing optimistic private message: ${matchingTempId}`);
                    
                    return prev.map(msg => 
                      msg.tempId === matchingTempId 
                        ? { 
                            ...newMessage,
                            room_id: undefined,
                            media_url: newMessage.media_url,
                            message_type: newMessage.message_type || 'text',
                            media_content: newMessage.media_content,
                            sender: {
                              name: newMessage.sender_id === currentUser.id ? currentUser.name : selectedUser.name,
                              phone: ''
                            },
                            status: 'sent' as const,
                            isOptimistic: false
                          }
                        : msg
                    );
                  } else {
                    debugLog(`Adding new private message: ${newMessage.id}`);
                    return [...prev, {
                      ...newMessage,
                      room_id: undefined,
                      media_url: newMessage.media_url,
                      message_type: newMessage.message_type || 'text',
                      media_content: newMessage.media_content,
                      sender: {
                        name: newMessage.sender_id === currentUser.id ? currentUser.name : selectedUser.name,
                        phone: ''
                      },
                      status: 'sent' as const,
                      isOptimistic: false
                    }].sort((a, b) => 
                      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );
                  }
                });
                
                setIsConnected(true);
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
                const existingMessage = prev.find(msg => msg.id === newMessage.id && !msg.isOptimistic);
                if (existingMessage) {
                  return prev;
                }

                const matchingTempId = findMatchingOptimisticMessage(newMessage);
                
                if (matchingTempId) {
                  optimisticMessagesRef.current.delete(matchingTempId);
                  debugLog(`Replacing optimistic support message: ${matchingTempId}`);
                  
                  return prev.map(msg => 
                    msg.tempId === matchingTempId 
                      ? { 
                          ...newMessage, 
                          sender: { name: newMessage.sender_id === currentUser.id ? currentUser.name : 'پشتیبانی', phone: '' },
                          status: 'sent' as const,
                          isOptimistic: false
                        }
                      : msg
                  );
                } else {
                  debugLog(`Adding new support message: ${newMessage.id}`);
                  return [...prev, {
                    ...newMessage,
                    sender: { name: newMessage.sender_id === currentUser.id ? currentUser.name : 'پشتیبانی', phone: '' },
                    status: 'sent' as const,
                    isOptimistic: false
                  }].sort((a, b) => 
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  );
                }
              });
              
              setIsConnected(true);
            }
          }
        )
        .subscribe();
      channels.push(supportMessagesChannel);
    }

    realtimeChannelsRef.current = channels;

    // Connection monitoring
    channels.forEach(channel => {
      channel.on('system', {}, (payload: any) => {
        if (payload.extension === 'postgres_changes' && payload.status === 'ok') {
          setIsConnected(true);
        }
      });
    });

    // Cleanup function
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
      realtimeChannelsRef.current = [];
    };
  }, [selectedRoom?.id, selectedUser?.id, currentUser.id, selectedTopic?.id]);

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
      
      await loadMessagesAndSync();
      setRetryCount(0);
      setIsConnected(true);
    } catch (error) {
      debugLog('Error loading messages:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطا در بارگذاری پیام‌ها';
      setMessageLoadError(errorMessage);
      setIsConnected(false);
      
      if (!retry && retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => loadMessages(true), 1000 * (retryCount + 1));
      } else {
        toast({
          title: 'خطا',
          description: errorMessage,
          variant: 'destructive',
        });
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (messageText: string, media?: { url: string; type: string; size?: number; name?: string }, replyToId?: number) => {
    if ((!messageText.trim() && !media) || sending) return;

    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const now = new Date().toISOString();
    
    const optimisticMessage: OptimisticMessage = {
      id: Date.now(),
      tempId,
      message: messageText || (media ? '📎 File' : ''),
      sender_id: currentUser.id,
      created_at: now,
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
      isOptimistic: true,
      status: 'sending'
    };

    // Add optimistic message IMMEDIATELY to UI with smooth animation
    setMessages(prev => {
      const newMessages = [...prev, optimisticMessage];
      return newMessages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    // Store in ref for matching
    optimisticMessagesRef.current.set(tempId, optimisticMessage);
    
    // Scroll to bottom immediately
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    
    debugLog('Added optimistic message for instant UI:', tempId);

    // Now handle the actual sending in background
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
      
      // Determine chat type and details for webhook
      let chatType: 'group' | 'private' | 'support' = 'private';
      let chatName = '';
      let topicName = '';
      let sentMessage: any = null;

      // Mark as sent immediately after API call starts (don't wait for completion)
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.tempId === tempId 
            ? { ...msg, status: 'sent' as const }
            : msg
        ));
      }, 100); // Very short delay for instant feel

      if (selectedRoom) {
        // Group or super group message
        chatType = 'group';
        chatName = selectedRoom.name;
        
        sentMessage = await messengerService.sendMessage(
          selectedRoom.id, 
          currentUser.id, 
          message, 
          selectedTopic?.id,
          mediaUrl,
          mediaType,
          mediaContent,
          replyToId
        );
        
        if (selectedTopic) {
          topicName = selectedTopic.title;
        }
        
        debugLog('Room message sent successfully', {
          roomId: selectedRoom.id,
          topicId: selectedTopic?.id,
          tempId,
          messageId: sentMessage?.id || sentMessage
        });
        
      } else if (selectedUser) {
        if (selectedUser.id === 1) {
          // Support message
          chatType = 'support';
          chatName = 'Support';
          
          sentMessage = await messengerService.sendSupportMessage(
            currentUser.id,
            message,
            mediaUrl,
            mediaType,
            mediaContent
          );
          debugLog('Support message sent successfully', {
            messageId: sentMessage?.id || sentMessage
          });
        } else {
          // Private message
          chatType = 'private';
          chatName = selectedUser.name;
          
          const conversationId = await privateMessageService.getOrCreateConversation(currentUser.id, selectedUser.id);
          sentMessage = await privateMessageService.sendMessage(
            currentUser.id,
            selectedUser.id,
            message,
            mediaUrl,
            mediaType,
            mediaContent,
            sessionToken,
            replyToId
          );
          debugLog('Private message sent successfully', {
            messageId: sentMessage?.id || sentMessage
          });
        }
      }

      // Send webhook in background
      try {
        await webhookService.sendMessageWebhook({
          messageId: sentMessage?.id || sentMessage,
          messageContent: message,
          senderName: currentUser.name,
          senderPhone: currentUser.phone,
          senderEmail: currentUser.email || '',
          chatType,
          chatName,
          topicName,
          topicId: selectedTopic?.id,
          timestamp: now,
          mediaUrl,
          mediaType,
          messageType: media ? 'media' : 'text',
          tableName: chatType === 'support' ? 'messenger_messages' : (chatType === 'private' ? 'private_messages' : 'messenger_messages')
        });
        console.log(`✅ ${chatType} message webhook sent successfully`);
      } catch (webhookError) {
        console.error(`❌ Failed to send ${chatType} message webhook:`, webhookError);
      }

      setNewMessage('');
      
      // Keep optimistic message for longer to ensure smooth transition
      setTimeout(() => {
        if (optimisticMessagesRef.current.has(tempId)) {
          debugLog(`Keeping optimistic message ${tempId} as sent - real-time will handle replacement`);
          setMessages(prev => prev.map(msg => 
            msg.tempId === tempId 
              ? { ...msg, status: 'sent' as const, isOptimistic: false }
              : msg
          ));
          optimisticMessagesRef.current.delete(tempId);
        }
      }, 5000); // Keep for 5 seconds to ensure smooth transition
      
    } catch (error) {
      debugLog('Error sending message:', error);
      
      // Mark message as failed but keep it visible
      setMessages(prev => prev.map(msg => 
        msg.tempId === tempId 
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
      
      // Remove failed message after longer timeout
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.tempId !== tempId));
        optimisticMessagesRef.current.delete(tempId);
      }, 8000); // Keep failed messages longer for user to see
      
      toast({
        title: 'خطا',
        description: 'خطا در ارسال پیام',
        variant: 'destructive',
      });
    }
  };

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await sendMessage(newMessage);
    }
  };

  const { setReplyingTo } = useReply();
  const chatTitle = selectedRoom ? selectedRoom.name : selectedUser?.name || '';
  const chatDescription = selectedRoom ? selectedRoom.description : '';
  const dayKey = (iso: string) => new Date(iso).toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' });
  const dayLabel = (iso: string) => {
    const today = dayKey(new Date().toISOString());
    const yesterday = dayKey(new Date(Date.now() - 86400000).toISOString());
    const k = dayKey(iso);
    if (k === today) return 'امروز';
    if (k === yesterday) return 'دیروز';
    return new Date(iso).toLocaleDateString('fa-IR', { day: 'numeric', month: 'long', timeZone: 'Asia/Tehran' });
  };
  const mediaInfo = (message: any) => {
    try { return message.media_content ? JSON.parse(message.media_content) : {}; } catch { return {}; }
  };

  if (!selectedRoom && !selectedUser) {
    return (
      <div className="flex items-center justify-center h-full chat-wallpaper">
        <span className="px-4 py-1.5 rounded-full glass text-sm text-muted-foreground">یک گفتگو را انتخاب کنید</span>
      </div>
    );
  }

  const header = (subtitle: React.ReactNode, onBackClick: () => void, showAvatar = true) => (
    <div className="flex items-center gap-2 px-2 h-14 border-b border-border/60 bg-background/80 backdrop-blur-xl flex-shrink-0 z-10" dir="rtl">
      <Button variant="ghost" size="icon" onClick={onBackClick} className="h-9 w-9 rounded-full shrink-0" aria-label="بازگشت">
        <ArrowLeft className="w-5 h-5 rotate-180" />
      </Button>
      {showAvatar && (
        <Avatar className="w-10 h-10 cursor-pointer" onClick={() => { if (selectedUser) { setProfileUser(selectedUser); setShowUserProfile(true); } }}>
          <AvatarImage src={selectedUser?.avatar_url || selectedRoom?.avatar_url} alt={chatTitle} />
          <AvatarFallback className="bg-muted text-foreground font-semibold">{chatTitle.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={selectedUser ? () => { setProfileUser(selectedUser); setShowUserProfile(true); } : undefined}>
        <h3 className="font-semibold text-[15px] truncate">
          {selectedTopic && (selectedTopic as any).icon && <span className="ml-1">{(selectedTopic as any).icon}</span>}
          {selectedTopic ? `${chatTitle} · ${selectedTopic.title}` : chatTitle}
        </h3>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
    </div>
  );

  if (selectedRoom?.is_super_group && !selectedTopic) {
    return (
      <div className="h-full flex flex-col bg-background">
        {header('یک موضوع را انتخاب کنید', onBackToRooms)}
        <div className="flex-1 p-4 overflow-y-auto"><SuperGroupTopicSelection roomId={selectedRoom.id} onTopicSelect={setSelectedTopic} /></div>
      </div>
    );
  }

  const subtitle = !isConnected ? 'در حال اتصال...' : selectedRoom ? (selectedTopic?.description || chatDescription || 'گروه') : selectedUser?.id === 1 ? 'پشتیبانی آکادمی' : 'آنلاین در پیام‌رسان';

  return (
    <div className="h-full flex flex-col bg-background">
      {header(subtitle, selectedTopic ? () => setSelectedTopic(null) : (onBack || onBackToRooms))}

      {messageLoadError && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-3 py-2 flex items-center justify-between" dir="rtl">
          <p className="text-sm text-destructive">پیام‌ها بارگذاری نشد</p>
          <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={loading}>تلاش مجدد</Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0 chat-wallpaper" id="messages-container">
        {loading ? (
          <div className="space-y-4">{[...Array(5)].map((_, i) => <MessageSkeleton key={i} />)}</div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="px-4 py-2 rounded-2xl glass text-sm text-muted-foreground text-center">هنوز پیامی نیست؛ اولین پیام را بفرستید</span>
          </div>
        ) : (
          messages.map((message, idx) => {
            const isOwn = message.sender_id === currentUser.id;
            const status = message.status || 'sent';
            const prev = messages[idx - 1];
            const next = messages[idx + 1];
            const newDay = !prev || dayKey(prev.created_at) !== dayKey(message.created_at);
            const firstOfRun = newDay || !prev || prev.sender_id !== message.sender_id;
            const lastOfRun = !next || next.sender_id !== message.sender_id || dayKey(next.created_at) !== dayKey(message.created_at);
            const showName = !isOwn && firstOfRun && !!selectedRoom;
            const info = mediaInfo(message);
            return (
              <React.Fragment key={message.tempId || message.id}>
                {newDay && (
                  <div className="flex justify-center my-3 sticky top-1 z-[1]">
                    <span className="px-3 py-1 rounded-full glass text-xs text-muted-foreground">{dayLabel(message.created_at)}</span>
                  </div>
                )}
                <div id={`message-${message.id}`} className={`flex items-end gap-1.5 ${lastOfRun ? 'mb-2' : 'mb-0.5'} ${isOwn ? 'justify-start' : 'justify-end'} ${message.isOptimistic ? 'animate-fade-in' : ''}`} dir="ltr">
                  {!isOwn && selectedRoom && (
                    <div className="w-8 shrink-0 order-2">
                      {lastOfRun && (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.sender_id ? userAvatars[message.sender_id] : undefined} alt={message.sender?.name || ''} />
                          <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">{(message.sender?.name || 'U').charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}
                  <DropdownMenu modal={false} dir="rtl">
                    <DropdownMenuTrigger asChild>
                      <div
                        dir="rtl"
                        role="button"
                        tabIndex={0}
                        className={`relative max-w-[78%] sm:max-w-[60%] min-w-0 px-3 pt-1.5 pb-1 shadow-sm text-[15px] leading-relaxed cursor-pointer select-text outline-none ${
                          isOwn
                            ? `bubble-own rounded-2xl ${lastOfRun ? 'rounded-bl-md' : ''} ${status === 'failed' ? 'opacity-60' : ''}`
                            : `bubble-other rounded-2xl ${lastOfRun ? 'rounded-br-md' : ''}`
                        }`}
                      >
                        {showName && <p className="text-xs font-semibold mb-0.5 opacity-80 truncate">{message.sender?.name || 'کاربر'}</p>}
                        {message.media_url && (
                          <div className="mb-1 -mx-1" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                            <MediaMessage url={message.media_url} type={info.type || message.message_type || 'application/octet-stream'} size={info.size} name={info.name || message.media_url.split('/').pop()} className="max-w-[260px]" />
                          </div>
                        )}
                        {message.message && <span className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]" dir="auto">{message.message}</span>}
                        <span className="float-left mr-2 mt-1.5 text-[11px] leading-none select-none opacity-60">
                          {new Date(message.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran' })}
                          {isOwn && <span className="mr-1">{status === 'sending' ? '◷' : status === 'failed' ? '!' : (message as any).is_read ? '✓✓' : '✓'}</span>}
                        </span>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isOwn ? 'start' : 'end'} className="w-52 rounded-xl text-right">
                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(message.created_at).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' })}
                      </div>
                      <DropdownMenuItem className="gap-2" onSelect={() => setReplyingTo({ id: message.id, message: message.message || 'فایل', sender_name: isOwn ? 'خودتان' : (message.sender?.name || 'کاربر') })}>
                        <ReplyIcon className="w-4 h-4" /> پاسخ
                      </DropdownMenuItem>
                      {message.message && (
                        <DropdownMenuItem className="gap-2" onSelect={() => { navigator.clipboard?.writeText(message.message); toast({ title: 'کپی شد' }); }}>
                          <Copy className="w-4 h-4" /> کپی متن
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <ModernChatInput onSendMessage={sendMessage} disabled={sending} currentUserId={currentUser.id} />

      <UserProfile isOpen={showUserProfile} onClose={() => setShowUserProfile(false)} user={profileUser} currentUserId={currentUser.id} onStartChat={() => {}} />
    </div>
  );
};

export default MessengerChatView;
