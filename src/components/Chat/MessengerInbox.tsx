// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MessageCircle, Plus, Users, Headphones, MessageSquare, Settings, User, Upload, Camera, WifiOff } from 'lucide-react';
import { messengerService, type ChatRoom, type MessengerUser } from '@/lib/messengerService';
import { privateMessageService } from '@/lib/privateMessageService';
import { useNavigate } from 'react-router-dom';
import StartChatModal from './StartChatModal';
import { useRealtimeChatUpdates } from '@/hooks/useRealtimeChatUpdates';

interface MessengerInboxProps {
  sessionToken: string;
  onRoomSelect: (room: ChatRoom) => void;
  onUserSelect: (user: MessengerUser) => void;
  selectedRoom: ChatRoom | null;
  selectedUser: MessengerUser | null;
  currentUser: MessengerUser;
  onUserUpdate: (user: MessengerUser) => void;
  isOffline?: boolean;
  onLogout?: () => void;
}

const MessengerInbox: React.FC<MessengerInboxProps> = ({
  sessionToken,
  onRoomSelect,
  onUserSelect,
  selectedRoom,
  selectedUser,
  currentUser,
  onUserUpdate,
  isOffline = false,
  onLogout
}) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showStartChatModal, setShowStartChatModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Remove duplicate notification service - handled by MessengerPage

  useEffect(() => {
    loadData();
  }, [sessionToken]);

  // Set up realtime subscriptions for chat updates
  const { refreshConversations, refreshRooms } = useRealtimeChatUpdates({
    currentUser,
    sessionToken,
    isOffline,
    onConversationsUpdate: setConversations,
    onRoomsUpdate: setRooms
  });

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading messenger data...');
      
      if (isOffline) {
        // Load cached data when offline
        const cachedRooms = JSON.parse(localStorage.getItem('cached_rooms') || '[]');
        const cachedConversations = JSON.parse(localStorage.getItem('cached_conversations') || '[]');
        
        console.log('Loading cached data (offline mode)');
        setRooms(cachedRooms);
        setConversations(cachedConversations);
      } else {
        // Load from server when online
        const [roomsData, conversationsData] = await Promise.all([
          messengerService.getRooms(),
          privateMessageService.getUserConversations(currentUser.id, sessionToken)
        ]);

        console.log('Loaded rooms:', roomsData);
        console.log('Loaded conversations:', conversationsData);

        // Show all active rooms - no filtering
        const activeRooms = roomsData.filter(room => room.is_active);
        
        // Cache the data for offline use
        localStorage.setItem('cached_rooms', JSON.stringify(activeRooms));
        localStorage.setItem('cached_conversations', JSON.stringify(conversationsData));
        
        setRooms(activeRooms);
        setConversations(conversationsData);
      }
    } catch (error) {
      console.error('Error loading messenger data:', error);
      
      // Fallback to cached data on error
      const cachedRooms = JSON.parse(localStorage.getItem('cached_rooms') || '[]');
      const cachedConversations = JSON.parse(localStorage.getItem('cached_conversations') || '[]');
      
      if (cachedRooms.length > 0 || cachedConversations.length > 0) {
        console.log('Loading cached data as fallback');
        setRooms(cachedRooms);
        setConversations(cachedConversations);
      }
    } finally {
      setLoading(false);
    }
  };

  // Smooth update without loading states
  const updateConversationsList = async () => {
    if (!sessionToken) return;
    
    try {
      const freshConversations = await privateMessageService.getUserConversations(currentUser.id, sessionToken);
      setConversations(freshConversations);
    } catch (error) {
      console.error('Error updating conversations:', error);
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConversations = conversations.filter(conv =>
    conv.other_user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.other_user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.other_user?.phone?.includes(searchTerm)
  );

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleStartChat = () => {
    setShowStartChatModal(true);
  };

  const handleUserSelectFromModal = (user: MessengerUser) => {
    onUserSelect(user);
    setShowStartChatModal(false);
    // Refresh conversations to show the new chat immediately
    setTimeout(() => {
      refreshConversations();
    }, 500);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} 
                 title={isOffline ? 'آفلاین' : 'متصل'}></div>
            <MessageCircle className={`w-5 h-5 sm:w-6 sm:h-6 ${isOffline ? 'text-red-500' : 'text-blue-500'}`} />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/profile')}
              className="h-8 w-8 p-0"
            >
              <User className="w-5 h-5" />
            </Button>
            
            <Button
              size="sm"
              onClick={handleStartChat}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder={isOffline ? "جستجو آفلاین..." : "جستجو در گفتگوها..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 text-sm"
            dir="rtl"
            disabled={isOffline && (!conversations.length && !rooms.length)}
          />
        </div>
        
        {/* Chat Tabs */}
        <div className="mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="grid w-full grid-cols-4 bg-transparent rounded-none h-auto p-0" style={{ border: 'none' }}>
              <TabsTrigger 
                value="all" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent shadow-none"
              >
                همه
              </TabsTrigger>
              <TabsTrigger 
                value="personal"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent shadow-none"
              >
                شخصی
              </TabsTrigger>
              <TabsTrigger 
                value="groups"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent shadow-none"
              >
                گروه‌ها
              </TabsTrigger>
              <TabsTrigger 
                value="support"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent bg-transparent shadow-none"
              >
                پشتیبانی
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2" dir="rtl">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">در حال بارگذاری...</div>
            </div>
          ) : (
            <>
              {/* All Chats */}
              {(activeTab === 'all' || activeTab === 'groups') && filteredRooms.length > 0 && (
                <div className="mb-4">
                  {filteredRooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => onRoomSelect(room)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedRoom?.id === room.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={room.avatar_url} alt={room.name} />
                        <AvatarFallback 
                          style={{ backgroundColor: getAvatarColor(room.name) }}
                          className="text-white font-medium"
                        >
                          {room.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate text-right">{room.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              گروه
                            </span>
                          </div>
                        </div>
                        {room.description && (
                          <p className="text-xs text-muted-foreground truncate text-right">
                            {room.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Private Conversations */}
              {(activeTab === 'all' || activeTab === 'personal') && filteredConversations.length > 0 && (
                <div className="mb-4">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => {
                        onUserSelect(conversation.other_user);
                        // Mark conversation as read when opened
                        if (conversation.unread_count && conversation.unread_count > 0) {
                          privateMessageService.markMessagesAsRead(conversation.id, currentUser.id);
                          // Update conversations to remove unread count
                          setTimeout(() => updateConversationsList(), 100);
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors relative ${
                        selectedUser?.id === conversation.other_user?.id
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage 
                          src={conversation.other_user?.avatar_url} 
                          alt={conversation.other_user?.name}
                        />
                        <AvatarFallback 
                          style={{ backgroundColor: getAvatarColor(conversation.other_user?.name || 'U') }}
                          className="text-white font-medium"
                        >
                          {conversation.other_user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate text-right">
                            {conversation.other_user?.name || "کاربر نامشخص"}
                          </p>
                          <div className="flex items-center gap-2">
                            {conversation.unread_count > 0 && (
                              <div className="bg-blue-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                                {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
                              </div>
                            )}
                            {conversation.last_message && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(conversation.last_message.created_at).toLocaleTimeString("fa-IR", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-right truncate">
                          {conversation.last_message?.message || "آخرین پیام..."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Support Conversations */}
              {(activeTab === 'all' || activeTab === 'support') && (
                <div className="mb-4">
                  <div
                    onClick={() => {
                      const supportUser = {
                        id: 1,
                        name: 'پشتیبانی',
                        username: 'support',
                        phone: '',
                        is_approved: true,
                        is_support_agent: true,
                        is_messenger_admin: false,
                        bedoun_marz: false,
                        bedoun_marz_approved: false,
                        bedoun_marz_request: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        last_seen: new Date().toISOString(),
                        role: 'support',
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
                        avatar_url: null
                      };
                      onUserSelect(supportUser);
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback 
                        style={{ backgroundColor: '#3B82F6' }}
                        className="text-white font-medium"
                      >
                        <Headphones className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-sm font-medium">پشتیبانی</p>
                      <p className="text-xs text-muted-foreground text-right">
                        راهنمایی و پشتیبانی
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* No Results */}
              {!loading && (
                (activeTab === 'all' && filteredRooms.length === 0 && filteredConversations.length === 0) ||
                (activeTab === 'groups' && filteredRooms.length === 0) ||
                (activeTab === 'personal' && filteredConversations.length === 0)
              ) && (
                <div className="flex items-center justify-center py-8 px-4">
                  <div className="text-center">
                    {isOffline ? (
                      <WifiOff className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    ) : (
                      <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground mb-2">
                      {isOffline 
                        ? (searchTerm ? 'در حالت آفلاین یافت نشد' : 'در حالت آفلاین')
                        : (searchTerm ? 'نتیجه‌ای یافت نشد' : 'گفتگویی موجود نیست')
                      }
                    </p>
                    {isOffline && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                        چت‌ها پس از اتصال مجدد به‌روزرسانی می‌شوند
                      </p>
                    )}
                    {!isOffline && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStartChat}
                        className="mt-3"
                      >
                        شروع گفتگوی جدید
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Start Chat Modal */}
      <StartChatModal
        isOpen={showStartChatModal}
        onClose={() => setShowStartChatModal(false)}
        onUserSelect={handleUserSelectFromModal}
        sessionToken={sessionToken}
        currentUser={currentUser}
      />

    </div>
  );
};

export default MessengerInbox;
