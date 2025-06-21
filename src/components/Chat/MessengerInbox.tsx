
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, Megaphone, HeadphonesIcon } from 'lucide-react';
import { type MessengerUser } from '@/lib/messengerService';

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
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  const cleanupChannel = () => {
    if (channelRef.current && isSubscribedRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
        console.log('Inbox channel cleaned up successfully');
      } catch (error) {
        console.error('Error cleaning up inbox channel:', error);
      }
      channelRef.current = null;
      isSubscribedRef.current = false;
    }
  };

  useEffect(() => {
    const setupRoomsAndSubscription = async () => {
      try {
        setError(null);
        await fetchRooms();
        
        // Clean up existing channel
        cleanupChannel();
        
        // Set up new real-time subscription for rooms
        const channelName = `rooms_inbox_${currentUser.id}_${Date.now()}`;
        channelRef.current = supabase.channel(channelName);
        
        channelRef.current
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'chat_rooms' },
            () => {
              console.log('Rooms updated, refetching...');
              fetchRooms();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              isSubscribedRef.current = true;
              console.log('Successfully subscribed to rooms channel:', channelName);
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Rooms channel subscription error');
              setError('Connection error. Please refresh the page.');
            }
          });

      } catch (error) {
        console.error('Error setting up rooms and subscription:', error);
        setError('Failed to load rooms');
      }
    };

    setupRoomsAndSubscription();

    return cleanupChannel;
  }, [currentUser.id]);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (error) throw error;

      // Filter rooms based on user permissions
      const accessibleRooms = (data || []).filter(room => {
        if (room.type === 'boundless_group' && !currentUser.bedoun_marz_approved) {
          return false;
        }
        return true;
      });

      // Add support chat room for all users
      const supportRoom: ChatRoom = {
        id: -1, // Special ID for support chat
        name: 'پشتیبانی',
        type: 'support_chat',
        description: 'گفتگوی خصوصی با پشتیبانی',
        is_boundless_only: false
      };

      setRooms([...accessibleRooms, supportRoom]);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
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
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
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
          {currentUser.name}
        </p>
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto">
        {rooms.map((room) => {
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
                  
                  {room.last_message && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-1">
                      {room.last_message}
                    </p>
                  )}
                </div>

                {room.unread_count && room.unread_count > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {room.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MessengerInbox;
