
import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, Megaphone, HeadphonesIcon, RefreshCw } from 'lucide-react';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import { Button } from '@/components/ui/button';

interface ChatRoom {
  id: number;
  name: string;
  type: string;
  description: string;
  is_boundless_only: boolean;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

interface MessengerInboxProps {
  currentUser: MessengerUser;
  onRoomSelect: (room: ChatRoom) => void;
  selectedRoom: ChatRoom | null;
}

const MessengerInbox: React.FC<MessengerInboxProps> = ({
  currentUser,
  onRoomSelect,
  selectedRoom
}) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchRooms = async () => {
    try {
      setError(null);
      const sessionToken = localStorage.getItem('messenger_session_token');
      if (!sessionToken) {
        throw new Error('No session token found');
      }

      const roomsData = await messengerService.getRooms(sessionToken);
      
      // Add support chat room for all users
      const supportRoom: ChatRoom = {
        id: -1, // Special ID for support chat
        name: 'پشتیبانی',
        type: 'support_chat',
        description: 'گفتگوی خصوصی با پشتیبانی',
        is_boundless_only: false
      };

      setRooms([...roomsData, supportRoom]);
      console.log('Loaded rooms:', roomsData.length + 1);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('خطا در بارگذاری گفتگوها. لطفاً دوباره تلاش کنید.');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [currentUser.id]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setLoading(true);
    fetchRooms();
  };

  const getRoomIcon = (type: string) => {
    switch (type) {
      case 'public_group':
        return Users;
      case 'boundless_group':
        return MessageCircle;
      case 'announcement_channel':
        return Megaphone;
      case 'support_chat':
        return HeadphonesIcon;
      default:
        return MessageCircle;
    }
  };

  const getRoomBadge = (room: ChatRoom) => {
    if (room.type === 'boundless_group') {
      return <Badge variant="secondary" className="text-xs">بدون مرز</Badge>;
    }
    if (room.type === 'announcement_channel') {
      return <Badge variant="outline" className="text-xs">کانال</Badge>;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={handleRetry} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          تلاش مجدد
        </Button>
        {retryCount > 2 && (
          <p className="text-xs text-slate-500 mt-2">
            اگر مشکل ادامه دارد، لطفاً صفحه را رفرش کنید
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          گفتگوها
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {rooms.length} گفتگو موجود
        </p>
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">
              هیچ گفتگویی موجود نیست
            </p>
            <Button onClick={handleRetry} variant="ghost" size="sm" className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              بارگذاری مجدد
            </Button>
          </div>
        ) : (
          rooms.map((room) => {
            const Icon = getRoomIcon(room.type);
            const isSelected = selectedRoom?.id === room.id;
            
            return (
              <div
                key={room.id}
                onClick={() => onRoomSelect(room)}
                className={`p-4 border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                  isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    room.type === 'boundless_group' ? 'bg-indigo-100 dark:bg-indigo-900' :
                    room.type === 'support_chat' ? 'bg-green-100 dark:bg-green-900' :
                    room.type === 'announcement_channel' ? 'bg-amber-100 dark:bg-amber-900' :
                    'bg-blue-100 dark:bg-blue-900'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      room.type === 'boundless_group' ? 'text-indigo-600 dark:text-indigo-400' :
                      room.type === 'support_chat' ? 'text-green-600 dark:text-green-400' :
                      room.type === 'announcement_channel' ? 'text-amber-600 dark:text-amber-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-slate-900 dark:text-white truncate">
                        {room.name}
                      </h3>
                      {getRoomBadge(room)}
                    </div>
                    
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">
                      {room.description}
                    </p>
                  </div>

                  {room.unread_count && room.unread_count > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {room.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MessengerInbox;
