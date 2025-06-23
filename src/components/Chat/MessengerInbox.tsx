
import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Users, Headphones, MessageSquare } from 'lucide-react';
import { messengerService, type ChatRoom } from '@/lib/messengerService';

interface MessengerInboxProps {
  sessionToken: string;
  onRoomSelect: (room: ChatRoom) => void;
  selectedRoom?: ChatRoom | null;
  currentUser: any;
}

const MessengerInbox: React.FC<MessengerInboxProps> = ({
  sessionToken,
  onRoomSelect,
  selectedRoom,
  currentUser
}) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, [sessionToken]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const roomsData = await messengerService.getRooms(sessionToken);
      
      // Add support rooms based on user access
      const supportRooms: ChatRoom[] = [
        {
          id: -1, // Use negative ID to distinguish from regular rooms
          name: '💬 پشتیبانی آکادمی رفیعی',
          description: 'پشتیبانی عمومی برای همه کاربران',
          type: 'academy_support',
          is_active: true,
          is_boundless_only: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_message: '',
          last_message_time: new Date().toISOString(),
          unread_count: 0
        }
      ];

      // Add boundless support for boundless users
      if (currentUser?.bedoun_marz) {
        supportRooms.push({
          id: -2,
          name: '🔒 پشتیبانی بدون مرز',
          description: 'پشتیبانی ویژه اعضای بدون مرز',
          type: 'boundless_support',
          is_active: true,
          is_boundless_only: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_message: '',
          last_message_time: new Date().toISOString(),
          unread_count: 0
        });
      }

      // Combine support rooms with regular rooms
      const allRooms = [...supportRooms, ...roomsData];
      setRooms(allRooms);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getRoomIcon = (room: ChatRoom) => {
    if (room.type === 'academy_support') {
      return <MessageSquare className="w-4 h-4 text-blue-500" />;
    } else if (room.type === 'boundless_support') {
      return <Headphones className="w-4 h-4 text-purple-500" />;
    } else {
      return <Users className="w-4 h-4 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-slate-500">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {rooms.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">هیچ اتاق چتی یافت نشد</p>
            </div>
          </div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
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
                  {getRoomIcon(room)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm truncate">
                    {room.name}
                  </div>
                  {room.unread_count! > 0 && (
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
                {room.last_message_time && room.id > 0 && (
                  <div className="text-xs text-slate-400">
                    {new Date(room.last_message_time).toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};

export default MessengerInbox;
