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
    } catch (error) {
      console.error('Error refreshing rooms:', error);
    }
  }, [isOffline, onRoomsUpdate]);

  useEffect(() => {
    if (isOffline || !currentUser || !sessionToken) return;

    console.log('Setting up realtime subscriptions for chat updates...');

    // Subscribe to private conversations changes
    const conversationsChannel = supabase
      .channel('private_conversations_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'private_conversations'
          // Note: We'll filter client-side since OR filters are complex in realtime
        },
        (payload) => {
          // Filter to only refresh if this conversation involves the current user
          const newConv = payload.new || payload.old;
          if (newConv && typeof newConv === 'object' && 
              ((newConv as any).user1_id === currentUser.id || (newConv as any).user2_id === currentUser.id)) {
            refreshConversations();
          }
        }
      )
      .subscribe();

    // Subscribe to private messages that might create new conversations
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
          // Check if this message involves the current user
          const newMessage = payload.new as any;
          if (newMessage && newMessage.conversation_id) {
            const conversation = await privateMessageService.getConversation(newMessage.conversation_id);
            if (conversation && 
                (conversation.user1_id === currentUser.id || conversation.user2_id === currentUser.id)) {
              refreshConversations();
            }
          }
        }
      )
      .subscribe();

    // Subscribe to messenger messages for group chats
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
          // This could indicate new activity in group chats
          // We might want to refresh rooms to update last message info
          refreshRooms();
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
          refreshRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(messengerMessagesChannel);
      supabase.removeChannel(roomsChannel);
    };
  }, [currentUser, sessionToken, isOffline, refreshConversations, refreshRooms]);

  return {
    refreshConversations,
    refreshRooms
  };
};