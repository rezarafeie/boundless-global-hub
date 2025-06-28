
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, Plus, Settings, MessageCircle, Users, Phone } from 'lucide-react';
import { messengerService, type ChatRoom, type MessengerUser } from '@/lib/messengerService';
import { privateMessageService } from '@/lib/privateMessageService';
import { useToast } from '@/hooks/use-toast';

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
  const [conversations, setConversations] = useState<any[]>([]);
  const [supportUsers, setSupportUsers] = useState<MessengerUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [sessionToken]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load rooms
      const roomsData = await messengerService.getRooms(sessionToken);
      setRooms(roomsData);

      // Load private conversations
      const conversationsData = await privateMessageService.getConversations(sessionToken);
      setConversations(conversationsData);

      // Load support users
      const supportData = await messengerService.getSupportUsers(currentUser);
      setSupportUsers(supportData);
    } catch (error) {
      console.error('Error loading inbox data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#0088cc', '#2ca5e0', '#8e85ee', '#ee7a00', '#fa5fa0', '#00a63f', '#e17076', '#7b9cff'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'دیروز';
    } else if (days < 7) {
      return date.toLocaleDateString('fa-IR', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      {/* Header - Telegram Style */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            پیام‌رسان
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full">
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Search Bar - Telegram Style */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="جستجو..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 rounded-full border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-600"
          />
        </div>
      </div>

      {/* Chat List - Telegram Style */}
      <div className="flex-1 overflow-y-auto">
        {/* Support Chats */}
        {supportUsers.length > 0 && (
          <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="px-4 py-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                پشتیبانی
              </p>
            </div>
            {supportUsers.map((user) => (
              <div
                key={`support-${user.id}`}
                onClick={() => onUserSelect(user)}
                className={`flex items-center gap-3 p-3 mx-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${
                  selectedUser?.id === user.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <Avatar className="w-12 h-12">
                  <AvatarFallback 
                    style={{ backgroundColor: getAvatarColor(user.name) }}
                    className="text-white font-medium"
                  >
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-slate-900 dark:text-white truncate">
                      {user.name}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      پشتیبانی
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    چت با پشتیبانی
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Group Chats */}
        {rooms.length > 0 && (
          <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="px-4 py-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                گروه‌ها
              </p>
            </div>
            {rooms.map((room) => (
              <div
                key={`room-${room.id}`}
                onClick={() => onRoomSelect(room)}
                className={`flex items-center gap-3 p-3 mx-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${
                  selectedRoom?.id === room.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <Avatar className="w-12 h-12">
                  <AvatarFallback 
                    style={{ backgroundColor: getAvatarColor(room.name) }}
                    className="text-white font-medium"
                  >
                    <Users className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-slate-900 dark:text-white truncate">
                      {room.name}
                    </h3>
                    {room.last_message_time && (
                      <span className="text-xs text-slate-400">
                        {formatTime(room.last_message_time)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {room.description || room.last_message || 'گروه'}
                  </p>
                </div>
                
                {room.unread_count && room.unread_count > 0 && (
                  <Badge className="bg-blue-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                    {room.unread_count}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Private Conversations */}
        {conversations.length > 0 && (
          <div>
            <div className="px-4 py-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                چت‌های خصوصی
              </p>
            </div>
            {conversations.map((conv) => (
              <div
                key={`conv-${conv.id}`}
                onClick={() => onUserSelect(conv.otherUser)}
                className={`flex items-center gap-3 p-3 mx-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${
                  selectedUser?.id === conv.otherUser.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <Avatar className="w-12 h-12">
                  <AvatarFallback 
                    style={{ backgroundColor: getAvatarColor(conv.otherUser.name) }}
                    className="text-white font-medium"
                  >
                    {conv.otherUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-slate-900 dark:text-white truncate">
                      {conv.otherUser.name}
                    </h3>
                    {conv.last_message_at && (
                      <span className="text-xs text-slate-400">
                        {formatTime(conv.last_message_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {conv.otherUser.phone}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {rooms.length === 0 && conversations.length === 0 && supportUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageCircle className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              پیامی وجود ندارد
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              هنوز هیچ گفتگویی شروع نکرده‌اید
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessengerInbox;
