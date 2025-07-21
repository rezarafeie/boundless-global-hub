
import { useEffect, useCallback } from 'react';
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

  const refreshConversations = useCallback(async () => {
    if (isOffline || !currentUser) return;
    
    try {
      const conversationsData = await privateMessageService.getUserConversations(currentUser.id, sessionToken);
      onConversationsUpdate(conversationsData);
      
      // Update cache
      localStorage.setItem('cached_conversations', JSON.stringify(conversationsData));
      console.log('Conversations refreshed:', conversationsData.length);
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    }
  }, [currentUser, sessionToken, isOffline, onConversationsUpdate]);

  const refreshRooms = useCallback(async () => {
    if (isOffline || !currentUser) return;
    
    try {
      const roomsData = await messengerService.getRooms();
      const activeRooms = roomsData.filter(room => room.is_active);
      onRoomsUpdate(activeRooms);
      
      // Update cache
      localStorage.setItem('cached_rooms', JSON.stringify(activeRooms));
      console.log('Rooms refreshed:', activeRooms.length);
    } catch (error) {
      console.error('Error refreshing rooms:', error);
    }
  }, [isOffline, onRoomsUpdate]);

  useEffect(() => {
    if (isOffline || !currentUser || !sessionToken) return;

    console.log('Setting up enhanced realtime subscriptions for chat updates...');

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
          const newConv = payload.new || payload.old;
          if (newConv && typeof newConv === 'object' && 
              ((newConv as any).user1_id === currentUser.id || (newConv as any).user2_id === currentUser.id)) {
            console.log('Conversation change detected, refreshing...');
            refreshConversations();
          }
        }
      )
      .subscribe();

    // Subscribe to private messages with enhanced handling
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
          const newMessage = payload.new as any;
          if (newMessage && newMessage.conversation_id) {
            try {
              const conversation = await privateMessageService.getConversation(newMessage.conversation_id);
              if (conversation && 
                  (conversation.user1_id === currentUser.id || conversation.user2_id === currentUser.id)) {
                console.log('Private message affecting current user, refreshing conversations...');
                refreshConversations();
              }
            } catch (error) {
              console.error('Error checking conversation for message update:', error);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to messenger messages for group chats and support
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
          const newMessage = payload.new as any;
          // Check if this affects the current user (sender, recipient, or in a room they're part of)
          if (newMessage.sender_id === currentUser.id || 
              newMessage.recipient_id === currentUser.id ||
              newMessage.room_id) {
            console.log('Messenger message detected, refreshing rooms...');
            refreshRooms();
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
          console.log('Room change detected, refreshing rooms...');
          refreshRooms();
        }
      )
      .subscribe();

    // Subscribe to support conversations changes
    const supportConversationsChannel = supabase
      .channel('support_conversations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_conversations'
        },
        (payload) => {
          const conversation = payload.new || payload.old;
          if (conversation && (conversation as any).user_id === currentUser.id) {
            console.log('Support conversation change detected, refreshing conversations...');
            refreshConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(messengerMessagesChannel);
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(supportConversationsChannel);
    };
  }, [currentUser, sessionToken, isOffline, refreshConversations, refreshRooms]);

  return {
    refreshConversations,
    refreshRooms
  };
};
