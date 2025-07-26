import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  Users, 
  MessageCircle, 
  Hash, 
  Plus,
  Paperclip,
  Image,
  FileText,
  X,
  ChevronLeft,
  Settings,
  LogOut,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from 'sonner';
import { type MessengerUser, type MessengerRoom, type MessengerMessage, type ChatTopic } from '@/lib/messengerService';
import { webhookService } from '@/lib/webhookService';
import { enhancedWebhookService } from '@/lib/enhancedWebhookService';
import MessengerMessageItem from './MessengerMessageItem';
import MessengerTopicSelector from './MessengerTopicSelector';
import MessengerRoomSettings from './MessengerRoomSettings';
import MessengerUserProfile from './MessengerUserProfile';

interface MessengerChatViewProps {
  currentUser: MessengerUser;
  onUserUpdate: (user: MessengerUser) => void;
  isOffline?: boolean;
  onLogout?: () => void;
}

const MessengerChatView: React.FC<MessengerChatViewProps> = ({
  currentUser,
  onUserUpdate,
  isOffline = false,
  onLogout
}) => {
  const [rooms, setRooms] = useState<MessengerRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<MessengerRoom | null>(null);
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<MessengerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<ChatTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ChatTopic | null>(null);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showRoomList, setShowRoomList] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowRoomList(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, optimisticMessages, scrollToBottom]);

  const loadRooms = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('messenger_room_members')
        .select(`
          room:messenger_rooms(
            id,
            name,
            description,
            created_at,
            created_by,
            is_private,
            member_count
          )
        `)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      const roomsData = data?.map(item => item.room).filter(Boolean) || [];
      setRooms(roomsData);
      
      if (roomsData.length > 0 && !currentRoom) {
        setCurrentRoom(roomsData[0]);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      toast.error('Failed to load rooms');
    }
  }, [currentUser?.id, currentRoom]);

  const loadTopics = useCallback(async () => {
    if (!currentRoom?.id) return;

    try {
      const { data, error } = await supabase
        .from('chat_topics')
        .select('*')
        .eq('room_id', currentRoom.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setTopics(data || []);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  }, [currentRoom?.id]);

  const loadMessages = useCallback(async () => {
    if (!currentRoom?.id) return;

    try {
      let query = supabase
        .from('messenger_messages')
        .select(`
          id,
          created_at,
          room_id,
          sender_id,
          message,
          topic_id,
          media_url,
          message_type,
          media_content,
          conversation_id,
          sender:chat_users!messenger_messages_sender_id_fkey(name, phone)
        `)
        .eq('room_id', currentRoom.id)
        .order('created_at', { ascending: true });

      if (selectedTopic) {
        query = query.eq('topic_id', selectedTopic.id);
      } else {
        query = query.is('topic_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  }, [currentRoom?.id, selectedTopic]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (currentRoom) {
      loadTopics();
      loadMessages();
    }
  }, [currentRoom, loadTopics, loadMessages]);

  useEffect(() => {
    loadMessages();
  }, [selectedTopic, loadMessages]);

  useEffect(() => {
    if (!currentRoom?.id) return;

    const channel = supabase
      .channel(`room-${currentRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messenger_messages',
          filter: `room_id=eq.${currentRoom.id}`
        },
        (payload) => {
          const newMessage = payload.new as MessengerMessage;
          
          if (selectedTopic && newMessage.topic_id !== selectedTopic.id) return;
          if (!selectedTopic && newMessage.topic_id !== null) return;
          
          if (newMessage.sender_id !== currentUser.id) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentRoom?.id, selectedTopic, currentUser.id]);

  const sendMessage = async (content: string, mediaFile?: File) => {
    if (!content.trim() && !mediaFile) return;
    if (!currentUser?.id) return;

    console.log('📤 [MessengerChatView] Sending message:', {
      content: content.substring(0, 50) + '...',
      currentRoom: currentRoom?.id,
      selectedTopic: selectedTopic?.id,
      hasMediaFile: !!mediaFile
    });

    try {
      let mediaUrl = '';
      let mediaType = '';
      let messageType: 'text' | 'media' = 'text';

      if (mediaFile) {
        console.log('📤 [MessengerChatView] Uploading media file...');
        
        try {
          const fileExt = mediaFile.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `${currentUser.id}/${fileName}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('messenger-files')
            .upload(filePath, mediaFile);

          if (uploadError) {
            throw uploadError;
          }

          const { data: publicData } = supabase.storage
            .from('messenger-files')
            .getPublicUrl(filePath);

          mediaUrl = publicData.publicUrl;
          mediaType = mediaFile.type;
          messageType = 'media';
          
          console.log('✅ [MessengerChatView] Media uploaded:', mediaUrl);
        } catch (uploadError) {
          console.error('❌ [MessengerChatView] Media upload failed:', uploadError);
          return;
        }
      }

      const optimisticMessage = {
        id: Date.now(),
        message: content,
        sender_id: currentUser.id,
        created_at: new Date().toISOString(),
        room_id: currentRoom?.id || null,
        recipient_id: null,
        conversation_id: null,
        topic_id: selectedTopic?.id || null,
        media_url: mediaUrl || null,
        message_type: messageType,
        media_content: null,
        sender: {
          name: currentUser.name,
          phone: currentUser.phone
        }
      };

      console.log('🔄 [MessengerChatView] Adding optimistic message:', {
        id: optimisticMessage.id,
        room_id: optimisticMessage.room_id,
        topic_id: optimisticMessage.topic_id,
        message: optimisticMessage.message.substring(0, 50) + '...'
      });

      setOptimisticMessages(prev => [...prev, optimisticMessage]);

      const messageData = {
        room_id: currentRoom?.id || null,
        sender_id: currentUser.id,
        message: content,
        topic_id: selectedTopic?.id || null,
        media_url: mediaUrl || null,
        message_type: messageType,
        media_content: null
      };

      console.log('📤 [MessengerChatView] Inserting message into database:', messageData);

      const { data: newMessage, error } = await supabase
        .from('messenger_messages')
        .insert([messageData])
        .select(`
          id,
          created_at,
          room_id,
          sender_id,
          message,
          topic_id,
          media_url,
          message_type,
          media_content,
          conversation_id,
          sender:chat_users!messenger_messages_sender_id_fkey(name, phone)
        `)
        .single();

      if (error) {
        console.error('❌ [MessengerChatView] Error sending message:', error);
        setOptimisticMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        return;
      }

      console.log('✅ [MessengerChatView] Message sent successfully:', newMessage);

      // Send webhook for all message types
      try {
        console.log('🔗 [MessengerChatView] Preparing webhook data...');
        
        let chatType: 'group' | 'private' | 'support' = 'group';
        let chatName = currentRoom?.name || 'Unknown Room';
        let topicName = selectedTopic?.title;

        // Determine chat type based on context
        if (currentRoom?.id) {
          chatType = 'group'; // All room messages are group messages
        } else {
          chatType = 'private'; // Direct messages without room
        }

        const webhookData = {
          messageContent: content,
          senderName: currentUser.name || 'Unknown User',
          senderPhone: currentUser.phone || '',
          senderEmail: currentUser.email || '',
          chatType,
          chatName,
          topicName,
          topicId: selectedTopic?.id,
          timestamp: newMessage.created_at,
          mediaUrl: mediaUrl || undefined,
          mediaType: mediaType || undefined,
          messageType
        };

        console.log('🔗 [MessengerChatView] Sending webhook with data:', {
          chatType: webhookData.chatType,
          chatName: webhookData.chatName,
          topicName: webhookData.topicName,
          topicId: webhookData.topicId
        });

        await webhookService.sendMessageWebhook(webhookData);
      } catch (webhookError) {
        console.error('❌ [MessengerChatView] Webhook error (non-blocking):', webhookError);
        // Don't block message sending for webhook errors
      }

      // Remove optimistic message after successful send
      setTimeout(() => {
        setOptimisticMessages(prev => {
          const filtered = prev.filter(msg => {
            const shouldRemove = msg.id === optimisticMessage.id || 
              (msg.message === content && 
               msg.topic_id === selectedTopic?.id && 
               msg.room_id === currentRoom?.id);
            
            if (shouldRemove) {
              console.log('🗑️ [MessengerChatView] Removing optimistic message:', {
                optimisticId: msg.id,
                realMessageId: newMessage.id,
                content: msg.message.substring(0, 30) + '...'
              });
            }
            
            return !shouldRemove;
          });
          return filtered;
        });
      }, 1000);

    } catch (error) {
      console.error('❌ [MessengerChatView] Error in sendMessage:', error);
      setOptimisticMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    }
  };

  const handleSendMessage = async () => {
    if (isOffline) {
      toast.error('Cannot send messages while offline');
      return;
    }

    const content = newMessage.trim();
    if (!content && !selectedFile) return;

    await sendMessage(content, selectedFile || undefined);
    setNewMessage('');
    setSelectedFile(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRoomSelect = (room: MessengerRoom) => {
    setCurrentRoom(room);
    setSelectedTopic(null);
    if (isMobile) {
      setShowRoomList(false);
    }
  };

  const handleBackToRooms = () => {
    if (isMobile) {
      setShowRoomList(true);
    }
  };

  const allMessages = [...messages, ...optimisticMessages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading messenger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background">
      {/* Room List Sidebar */}
      <div className={`${isMobile ? (showRoomList ? 'w-full' : 'hidden') : 'w-80'} border-r bg-card flex flex-col`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.name}</p>
                <div className="flex items-center gap-1">
                  {isOffline ? (
                    <WifiOff className="h-3 w-3 text-red-500" />
                  ) : (
                    <Wifi className="h-3 w-3 text-green-500" />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {isOffline ? 'Offline' : 'Online'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserProfile(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              {onLogout && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Rooms
          </h2>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            {rooms.map((room) => (
              <Card
                key={room.id}
                className={`mb-2 cursor-pointer transition-colors hover:bg-accent ${
                  currentRoom?.id === room.id ? 'bg-accent border-primary' : ''
                }`}
                onClick={() => handleRoomSelect(room)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{room.name}</h3>
                      {room.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {room.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {room.member_count || 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={`${isMobile ? (showRoomList ? 'hidden' : 'w-full') : 'flex-1'} flex flex-col`}>
        {currentRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToRooms}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h2 className="font-semibold">{currentRoom.name}</h2>
                    {currentRoom.description && (
                      <p className="text-sm text-muted-foreground">
                        {currentRoom.description}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRoomSettings(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              
              {topics.length > 0 && (
                <div className="mt-3">
                  <MessengerTopicSelector
                    topics={topics}
                    selectedTopic={selectedTopic}
                    onTopicSelect={setSelectedTopic}
                    currentRoom={currentRoom}
                    currentUser={currentUser}
                    onTopicsUpdate={loadTopics}
                  />
                </div>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {allMessages.map((message) => (
                  <MessengerMessageItem
                    key={message.id}
                    message={message}
                    currentUser={currentUser}
                    isOptimistic={optimisticMessages.some(opt => opt.id === message.id)}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-card">
              {selectedFile && (
                <div className="mb-2 p-2 bg-accent rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedFile.type.startsWith('image/') ? (
                      <Image className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    <span className="text-sm truncate">{selectedFile.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeSelectedFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isOffline}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isOffline ? "Cannot send messages while offline" : "Type a message..."}
                    disabled={isOffline}
                    className="resize-none"
                  />
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={(!newMessage.trim() && !selectedFile) || isOffline}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a room to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Room Settings Modal */}
      {showRoomSettings && currentRoom && (
        <MessengerRoomSettings
          room={currentRoom}
          currentUser={currentUser}
          onClose={() => setShowRoomSettings(false)}
          onRoomUpdate={(updatedRoom) => {
            setCurrentRoom(updatedRoom);
            setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
          }}
        />
      )}

      {/* User Profile Modal */}
      {showUserProfile && (
        <MessengerUserProfile
          user={currentUser}
          onClose={() => setShowUserProfile(false)}
          onUserUpdate={onUserUpdate}
        />
      )}
    </div>
  );
};

export default MessengerChatView;
