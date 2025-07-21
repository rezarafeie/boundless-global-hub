
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { privateMessageService } from '@/lib/privateMessageService';
import { messengerService } from '@/lib/messengerService';
import type { MessengerUser, ChatRoom } from '@/lib/messengerService';

interface UseRealtimeChatUpdatesProps {
  currentUser: MessengerUser;
  sessionToken: string;
  isOffline: boolean;
  onConversationsUpdate: (conversations: any[]) => void;
  onRoomsUpdate: (rooms: ChatRoom[]) => void;
}

export const useRealtimeChatUpdates = ({
  currentUser,
  sessionToken,
  isOffline,
  onConversationsUpdate,
  onRoomsUpdate
}: UseRealtimeChatUpdatesProps) => {
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const refreshConversations = useCallback(async () => {
    if (isOffline || !currentUser) return;
    
    try {
      console.log('🔄 Refreshing conversations for user:', currentUser.id);
      const conversationsData = await privateMessageService.getUserConversations(currentUser.id, sessionToken);
      onConversationsUpdate(conversationsData);
      
      // Update cache
      localStorage.setItem('cached_conversations', JSON.stringify(conversationsData));
      console.log('✅ Conversations refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing conversations:', error);
    }
  }, [currentUser, sessionToken, isOffline, onConversationsUpdate]);

  const refreshRooms = useCallback(async () => {
    if (isOffline || !currentUser) return;
    
    try {
      console.log('🔄 Refreshing rooms...');
      const roomsData = await messengerService.getRooms();
      const activeRooms = roomsData.filter(room => room.is_active);
      onRoomsUpdate(activeRooms);
      
      // Update cache
      localStorage.setItem('cached_rooms', JSON.stringify(activeRooms));
      console.log('✅ Rooms refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing rooms:', error);
    }
  }, [isOffline, onRoomsUpdate]);

  // Periodic refresh as backup mechanism
  useEffect(() => {
    if (isOffline || !currentUser) return;

    // Set up periodic refresh every 30 seconds as backup
    refreshIntervalRef.current = setInterval(() => {
      console.log('⏰ Periodic backup refresh triggered');
      refreshConversations();
      refreshRooms();
    }, 30000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isOffline, currentUser, refreshConversations, refreshRooms]);

  useEffect(() => {
    if (isOffline || !currentUser || !sessionToken) return;

    console.log('📡 Setting up enhanced realtime subscriptions for chat updates...');

    // Subscribe to private conversations changes with better filtering
    const conversationsChannel = supabase
      .channel('private_conversations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_conversations'
        },
        (payload) => {
          console.log('📨 Private conversation change detected:', payload.eventType);
          const conversation = payload.new || payload.old;
          if (conversation && typeof conversation === 'object' && 
              ((conversation as any).user1_id === currentUser.id || (conversation as any).user2_id === currentUser.id)) {
            console.log('🔄 Refreshing conversations due to conversation change');
            refreshConversations();
          }
        }
      )
      .subscribe();

    // Subscribe to private messages that might create new conversations or update existing ones
    const messagesChannel = supabase
      .channel('private_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages'
        },
        async (payload) => {
          console.log('📨 New private message detected for conversation updates');
          const newMessage = payload.new as any;
          if (newMessage && newMessage.conversation_id) {
            try {
              const conversation = await privateMessageService.getConversation(newMessage.conversation_id);
              if (conversation && 
                  (conversation.user1_id === currentUser.id || conversation.user2_id === currentUser.id)) {
                console.log('🔄 Refreshing conversations due to new message');
                refreshConversations();
              }
            } catch (error) {
              console.error('❌ Error checking conversation for new message:', error);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to messenger messages for group chats and support conversations
    const messengerMessagesChannel = supabase
      .channel('messenger_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messenger_messages'
        },
        (payload) => {
          console.log('📨 New messenger message detected for room updates');
          const newMessage = payload.new as any;
          
          // Refresh rooms if it's a group message
          if (newMessage && newMessage.room_id) {
            console.log('🔄 Refreshing rooms due to new group message');
            refreshRooms();
          }
          
          // Refresh conversations if it's a support message involving current user
          if (newMessage && (newMessage.sender_id === currentUser.id || 
                           newMessage.recipient_id === 1 || 
                           newMessage.conversation_id === currentUser.id)) {
            console.log('🔄 Refreshing conversations due to support message');
            refreshConversations();
          }
        }
      )
      .subscribe();

    // Subscribe to chat rooms changes
    const roomsChannel = supabase
      .channel('chat_rooms_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms'
        },
        (payload) => {
          console.log('📨 Chat room change detected:', payload.eventType);
          refreshRooms();
        }
      )
      .subscribe();

    // Subscribe to room memberships changes
    const membershipsChannel = supabase
      .channel('room_memberships_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_memberships',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('📨 Room membership change detected for current user');
          refreshRooms();
        }
      )
      .subscribe();

    console.log('✅ Enhanced realtime subscriptions established');

    return () => {
      console.log('🧹 Cleaning up enhanced realtime subscriptions');
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(messengerMessagesChannel);
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(membershipsChannel);
    };
  }, [currentUser, sessionToken, isOffline, refreshConversations, refreshRooms]);

  return {
    refreshConversations,
    refreshRooms
  };
};
