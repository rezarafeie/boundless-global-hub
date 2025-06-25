
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle, Plus, Users, Headphones, MessageSquare } from 'lucide-react';
import { messengerService, type ChatRoom, type MessengerUser } from '@/lib/messengerService';
import { privateMessageService } from '@/lib/privateMessageService';
import StartChatModal from './StartChatModal';

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
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [sessionToken]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roomsData, conversationsData] = await Promise.all([
        messengerService.getRooms(),
        privateMessageService.getUserConversations(currentUser.id, sessionToken)
      ]);

      // Filter out support rooms from the general chat list
      const filteredRooms = roomsData.filter(room => !room.name.includes('پشتیبانی'));
      
      setRooms(filteredRooms);
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
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            پیام‌رسان
          </h2>
          <Button
            size="sm"
            onClick={handleStartChat}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            گفتگوی جدید
          </Button>
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
    </div>
  );
};

export default MessengerInbox;
