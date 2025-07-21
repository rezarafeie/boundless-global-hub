
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { privateMessageService } from '@/lib/privateMessageService';
import { messengerService } from '@/lib/messengerService';
import type { MessengerUser, ChatRoom } from '@/lib/messengerService';

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface UseRealtimeChatUpdatesProps {
  currentUser: MessengerUser;
  sessionToken: string;
  isOffline: boolean;
  onConversationsUpdate: (conversations: any[]) => void;
  onRoomsUpdate: (rooms: ChatRoom[]) => void;
  onSupportConversationsUpdate?: (conversations: any[]) => void;
}

export const useRealtimeChatUpdates = ({
  currentUser,
  sessionToken,
  isOffline,
  onConversationsUpdate,
  onRoomsUpdate,
  onSupportConversationsUpdate
}: UseRealtimeChatUpdatesProps) => {

  // Debounced refresh functions to prevent excessive API calls
  const debouncedConversationsRefresh = useCallback(
    debounce(async () => {
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
    }, 300), // 300ms debounce
    [currentUser, sessionToken, isOffline, onConversationsUpdate]
  );

  const debouncedRoomsRefresh = useCallback(
    debounce(async () => {
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
    }, 300), // 300ms debounce
    [isOffline, onRoomsUpdate]
  );

  const debouncedSupportConversationsRefresh = useCallback(
    debounce(async () => {
      if (isOffline || !currentUser || !onSupportConversationsUpdate) return;
      
      try {
        const supportConversationsData = await messengerService.getConversations(currentUser.id);
        onSupportConversationsUpdate(supportConversationsData);
        
        // Update cache
        localStorage.setItem('cached_support_conversations', JSON.stringify(supportConversationsData));
        console.log('Support conversations refreshed:', supportConversationsData.length);
      } catch (error) {
        console.error('Error refreshing support conversations:', error);
      }
    }, 300), // 300ms debounce
    [currentUser, isOffline, onSupportConversationsUpdate]
  );

  // Legacy functions for backward compatibility
  const refreshConversations = debouncedConversationsRefresh;
  const refreshRooms = debouncedRoomsRefresh;
  const refreshSupportConversations = debouncedSupportConversationsRefresh;

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
            debouncedConversationsRefresh();
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
                debouncedConversationsRefresh();
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
            debouncedRoomsRefresh();
          }
          
          // Check if this is a support message affecting current user
          if (newMessage.conversation_id) {
            console.log('Support message detected, refreshing support conversations...');
            debouncedSupportConversationsRefresh();
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
          debouncedRoomsRefresh();
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
            console.log('Support conversation change detected, refreshing support conversations...');
            debouncedSupportConversationsRefresh();
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
  }, [currentUser, sessionToken, isOffline, debouncedConversationsRefresh, debouncedRoomsRefresh, debouncedSupportConversationsRefresh]);

  return {
    refreshConversations,
    refreshRooms,
    refreshSupportConversations
  };
};
