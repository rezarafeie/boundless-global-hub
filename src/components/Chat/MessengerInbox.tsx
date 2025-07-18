import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle, Plus, Users, Headphones, MessageSquare, Settings, User } from 'lucide-react';
import { messengerService, type ChatRoom, type MessengerUser } from '@/lib/messengerService';
import { privateMessageService } from '@/lib/privateMessageService';
import { useNotificationService } from '@/hooks/useNotificationService';
import StartChatModal from './StartChatModal';
import NotificationPermissionBanner from './NotificationPermissionBanner';
import NotificationToggle from './NotificationToggle';
import UserSettingsModal from './UserSettingsModal';

interface MessengerInboxProps {
  sessionToken: string;
  onRoomSelect: (room: ChatRoom) => void;
  onUserSelect: (user: MessengerUser) => void;
  selectedRoom: ChatRoom | null;
  selectedUser: MessengerUser | null;
  currentUser: MessengerUser;
  onUserUpdate: (user: MessengerUser) => void;
}

const MessengerInbox: React.FC<MessengerInboxProps> = ({
  sessionToken,
  onRoomSelect,
  onUserSelect,
  selectedRoom,
  selectedUser,
  currentUser,
  onUserUpdate
}) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showStartChatModal, setShowStartChatModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize notification service
  const {
    permissionState,
    notificationEnabled,
    showPermissionBanner,
    requestNotificationPermission,
    updateNotificationPreference,
    dismissPermissionBanner
  } = useNotificationService({
    currentUser,
    sessionToken
  });

  useEffect(() => {
    loadData();
  }, [sessionToken]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading messenger data...');
      const [roomsData, conversationsData] = await Promise.all([
        messengerService.getRooms(),
        privateMessageService.getUserConversations(currentUser.id, sessionToken)
      ]);

      console.log('Loaded rooms:', roomsData);
      console.log('Loaded conversations:', conversationsData);

      // Show all active rooms - no filtering
      const activeRooms = roomsData.filter(room => room.is_active);
      
      setRooms(activeRooms);
      setConversations(conversationsData);
    } catch (error) {
      console.error('Error loading messenger data:', error);
    } finally {
      setLoading(false);
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
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      {/* Notification Permission Banner */}
      {showPermissionBanner && (
        <NotificationPermissionBanner
          onRequestPermission={requestNotificationPermission}
          onDismiss={dismissPermissionBanner}
        />
      )}

      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        {/* User Profile Section */}
        <div 
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors mb-4"
          onClick={() => setShowUserSettings(true)}
        >
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={currentUser.avatar_url} 
              alt={currentUser.name}
              onLoad={() => console.log('✅ Current user avatar loaded:', currentUser.avatar_url)}
              onError={(e) => console.log('❌ Current user avatar failed to load:', currentUser.avatar_url, e)}
            />
            <AvatarFallback 
              style={{ backgroundColor: getAvatarColor(currentUser.name || 'U') }}
              className="text-white font-medium"
            >
              {currentUser.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            {currentUser.username && (
              <p className="text-xs text-muted-foreground">@{currentUser.username}</p>
            )}
          </div>
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            پیام‌رسان
          </h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={loadData}
              className="flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              به‌روزرسانی
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNotificationSettings(!showNotificationSettings)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              تنظیمات
            </Button>
            
            <Button
              size="sm"
              onClick={handleStartChat}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              گفتگوی جدید
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="جستجو در گفتگوها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
            dir="rtl"
          />
        </div>
        
        {/* Notification Settings */}
        {showNotificationSettings && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-3">تنظیمات نوتیفیکیشن</h4>
            <NotificationToggle
              enabled={notificationEnabled && permissionState.granted}
              onToggle={updateNotificationPreference}
              disabled={!permissionState.supported || permissionState.permission === 'denied'}
            />
            
            {permissionState.permission === 'denied' && (
              <p className="text-xs text-destructive mt-2">
                نوتیفیکیشن‌ها در مرورگر شما مسدود شده‌اند. از تنظیمات مرورگر آن‌ها را فعال کنید.
              </p>
            )}
            
            {!permissionState.supported && (
              <p className="text-xs text-muted-foreground mt-2">
                مرورگر شما از نوتیفیکیشن پشتیبانی نمی‌کند.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">در حال بارگذاری...</div>
            </div>
          ) : (
            <>
              {/* Group Chats */}
              {filteredRooms.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground px-2 mb-2">
                    گروه‌ها
                  </h3>
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
                        <AvatarFallback 
                          style={{ backgroundColor: getAvatarColor(room.name) }}
                          className="text-white font-medium"
                        >
                          {room.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{room.name}</p>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            📌 ثابت
                          </Badge>
                        </div>
                        {room.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {room.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          گروه
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Private Conversations */}
              {filteredConversations.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground px-2 mb-2">
                    گفتگوهای شخصی
                  </h3>
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => onUserSelect(conversation.other_user)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedUser?.id === conversation.other_user?.id
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage 
                          src={conversation.other_user?.avatar_url} 
                          alt={conversation.other_user?.name}
                          onLoad={() => console.log('✅ Avatar loaded:', conversation.other_user?.avatar_url)}
                          onError={(e) => console.log('❌ Avatar failed to load:', conversation.other_user?.avatar_url, e)}
                        />
                        <AvatarFallback 
                          style={{ backgroundColor: getAvatarColor(conversation.other_user?.name || 'U') }}
                          className="text-white font-medium"
                        >
                          {conversation.other_user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {conversation.other_user?.name || 'کاربر نامشخص'}
                          </p>
                          {conversation.last_message_at && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(conversation.last_message_at).toLocaleDateString('fa-IR')}
                            </span>
                          )}
                        </div>
                        {conversation.other_user?.username && (
                          <p className="text-xs text-muted-foreground">
                            @{conversation.other_user.username}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          شخصی
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!loading && filteredRooms.length === 0 && filteredConversations.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? 'نتیجه‌ای یافت نشد' : 'گفتگویی موجود نیست'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartChat}
                      className="mt-3"
                    >
                      شروع گفتگوی جدید
                    </Button>
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

      {/* User Settings Modal */}
      <UserSettingsModal
        isOpen={showUserSettings}
        onClose={() => setShowUserSettings(false)}
        currentUser={currentUser}
        sessionToken={sessionToken}
        onUserUpdate={onUserUpdate}
      />
    </div>
  );
};

export default MessengerInbox;
