
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChatSkeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Plus, 
  Users, 
  MessageCircle, 
  User,
  Settings
} from 'lucide-react';
import { messengerService, type ChatRoom, type MessengerUser } from '@/lib/messengerService';
import { privateMessageService, type PrivateConversation } from '@/lib/privateMessageService';
import { useToast } from '@/hooks/use-toast';
import ExactSearchModal from './ExactSearchModal';
import UserProfileModal from './UserProfileModal';

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
  const { toast } = useToast();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [privateConversations, setPrivateConversations] = useState<PrivateConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExactSearchModal, setShowExactSearchModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [sessionToken, currentUser.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roomsData, conversationsData] = await Promise.all([
        messengerService.getRooms(sessionToken),
        privateMessageService.getUserConversations(currentUser.id, sessionToken)
      ]);
      
      setRooms(roomsData);
      setPrivateConversations(conversationsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری داده‌ها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleStartChatWithUser = async (user: MessengerUser) => {
    try {
      const conversationId = await privateMessageService.getOrCreateConversation(
        currentUser.id,
        user.id,
        sessionToken
      );
      
      const conversation: PrivateConversation = {
        id: conversationId,
        user1_id: Math.min(currentUser.id, user.id),
        user2_id: Math.max(currentUser.id, user.id),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
        other_user: user
      };
      
      onUserSelect(user);
      await loadData();
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: 'خطا',
        description: 'امکان شروع گفتگو وجود ندارد',
        variant: 'destructive'
      });
    }
  };

  const handleChatSelect = async (conversation: PrivateConversation) => {
    // Clear unread count immediately for better UX
    const updatedConversations = privateConversations.map(conv => 
      conv.id === conversation.id ? { ...conv, unread_count: 0 } : conv
    );
    setPrivateConversations(updatedConversations);
    
    // Mark messages as read in background
    try {
      await privateMessageService.markMessagesAsRead(conversation.id, currentUser.id, sessionToken);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
    
    onUserSelect(conversation.other_user!);
  };

  // Filter items based on search
  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredConversations = privateConversations.filter(conv => 
    conv.other_user?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full bg-white dark:bg-slate-800 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">پیام‌ها</h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                disabled
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                disabled
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="جستجو..." 
              className="pl-10"
              disabled
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {[...Array(6)].map((_, i) => (
              <ChatSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">پیام‌ها</h2>
          <div className="flex items-center gap-2">
            {/* Profile Button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowProfileModal(true)}
              className="relative hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all"
              title="ویرایش پروفایل"
            >
              <Avatar className="w-6 h-6">
                <AvatarFallback 
                  style={{ backgroundColor: getAvatarColor(currentUser.name) }}
                  className="text-white font-medium text-xs"
                >
                  {currentUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Settings className="w-3 h-3 ml-1" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowExactSearchModal(true)}
              className="hover:bg-green-50 dark:hover:bg-green-900/20"
              title="شروع گفتگوی جدید"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="جستجو در گفتگوها..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 p-2">
          {/* Private Conversations */}
          {filteredConversations.map((conversation) => (
            <div
              key={`private-${conversation.id}`}
              onClick={() => handleChatSelect(conversation)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${
                selectedUser?.id === conversation.other_user?.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarFallback 
                    style={{ backgroundColor: getAvatarColor(conversation.other_user?.name || '') }}
                    className="text-white font-medium"
                  >
                    {conversation.other_user?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1">
                  <User className="w-3 h-3 text-blue-500" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm truncate">
                    {conversation.other_user?.name}
                  </div>
                  {conversation.unread_count && conversation.unread_count > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {conversation.unread_count}
                    </Badge>
                  )}
                </div>
                {conversation.last_message && (
                  <div className="text-xs text-slate-500 truncate">
                    {conversation.last_message}
                  </div>
                )}
                {conversation.last_message_at && (
                  <div className="text-xs text-slate-400">
                    {new Date(conversation.last_message_at).toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Regular Rooms */}
          {filteredRooms.map((room) => (
            <div
              key={`room-${room.id}`}
              onClick={() => onRoomSelect(room)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${
                selectedRoom?.id === room.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarFallback 
                    style={{ backgroundColor: getAvatarColor(room.name) }}
                    className="text-white font-medium"
                  >
                    {room.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1">
                  <Users className="w-3 h-3 text-green-500" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm truncate">
                    {room.name}
                  </div>
                  {room.unread_count && room.unread_count > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {room.unread_count}
                    </Badge>
                  )}
                </div>
                {room.description && (
                  <div className="text-xs text-slate-500 truncate">
                    {room.description}
                  </div>
                )}
                {room.last_message && (
                  <div className="text-xs text-slate-500 truncate">
                    {room.last_message}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {!loading && filteredConversations.length === 0 && filteredRooms.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 mb-2">نتیجه‌ای یافت نشد</p>
              <p className="text-xs text-slate-400">
                عبارت جستجوی خود را تغییر دهید
              </p>
            </div>
          )}

          {!loading && filteredConversations.length === 0 && filteredRooms.length === 0 && !searchTerm && (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 mb-2">هنوز گفتگویی ندارید</p>
              <p className="text-xs text-slate-400">
                از دکمه + برای شروع گفتگو استفاده کنید
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ExactSearchModal
        isOpen={showExactSearchModal}
        onClose={() => setShowExactSearchModal(false)}
        onUserSelect={handleStartChatWithUser}
        sessionToken={sessionToken}
        currentUser={currentUser}
      />

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={currentUser}
        onStartChat={handleStartChatWithUser}
        currentUserId={currentUser.id}
        sessionToken={sessionToken}
        onUserUpdate={onUserUpdate}
      />
    </div>
  );
};

export default MessengerInbox;
