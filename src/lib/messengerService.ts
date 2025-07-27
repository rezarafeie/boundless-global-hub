import { supabase } from '@/integrations/supabase/client';

export interface ChatUser {
  id: number;
  name: string;
  username: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_approved: boolean;
  is_messenger_admin: boolean;
  is_support_agent: boolean;
  bedoun_marz: boolean;
  bedoun_marz_approved: boolean;
  bedoun_marz_request: boolean;
  created_at: string;
  updated_at: string;
  last_seen: string;
  role: string;
  email: string | null;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  country_code: string | null;
  signup_source: string | null;
  bio: string | null;
  notification_enabled: boolean;
  notification_token: string | null;
  password_hash: string | null;
}

export interface MessengerUser {
  id: number;
  name: string;
  username: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_approved: boolean;
  is_messenger_admin: boolean;
  is_support_agent: boolean;
  bedoun_marz: boolean;
  bedoun_marz_approved: boolean;
  bedoun_marz_request: boolean;
  created_at: string;
  updated_at: string;
  last_seen: string;
  role: string;
  email: string | null;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  country_code: string | null;
  signup_source: string | null;
  bio: string | null;
  notification_enabled: boolean;
  notification_token: string | null;
  password_hash: string | null;
}

export interface ChatRoom {
  id: number;
  created_at: string;
  name: string;
  description: string | null;
  type: 'group' | 'supergroup';
  is_active: boolean;
  last_message: {
    id: string;
    message: string;
    created_at: string;
    sender_name: string;
  } | null;
  unread_count: number;
}

export const messengerService = {
  async getOrCreateChatUser(email: string): Promise<MessengerUser> {
    try {
      let { data: chat_users, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('email', email);

      if (error) {
        throw error;
      }

      if (chat_users && chat_users.length > 0) {
        return chat_users[0] as MessengerUser;
      } else {
        // User does not exist, create a new user
        const newUser = {
          email: email,
          name: email.split('@')[0],
          username: email.split('@')[0],
          is_approved: true,
        };

        const { data: new_chat_user, error: createError } = await supabase
          .from('chat_users')
          .insert([newUser])
          .select('*');

        if (createError) {
          throw createError;
        }

        return new_chat_user ? new_chat_user[0] as MessengerUser : ({} as MessengerUser);
      }
    } catch (error) {
      console.error("Error in getOrCreateChatUser:", error);
      throw error;
    }
  },

  async validateSession(sessionToken: string): Promise<MessengerUser | null> {
    try {
      const { data: chat_users, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('session_token', sessionToken)
        .single();

      if (error) {
        console.error("Error validating session:", error);
        return null;
      }

      return chat_users as MessengerUser;
    } catch (error) {
      console.error("Error in validateSession:", error);
      return null;
    }
  },

  async createRoom(room: { name: string; description: string | null; type: 'group' | 'supergroup' }): Promise<ChatRoom> {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert([room])
        .select('*');

      if (error) {
        throw error;
      }

      return data ? data[0] as ChatRoom : ({} as ChatRoom);
    } catch (error) {
      console.error("Error in createRoom:", error);
      throw error;
    }
  },

  async getRooms(): Promise<ChatRoom[]> {
    try {
      console.log('Fetching rooms...');
      
      // First, get all active rooms
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rooms:', error);
        throw error;
      }

      if (!rooms || rooms.length === 0) {
        console.log('No rooms found');
        return [];
      }

      console.log('Found rooms:', rooms);

      // For each room, get the last message and unread count
      const roomsWithMessages = await Promise.all(
        rooms.map(async (room) => {
          try {
            // Get the last message for this room
            const { data: lastMessage } = await supabase
              .from('messenger_messages')
              .select(`
                id,
                message,
                created_at,
                sender_id,
                chat_users!inner(name)
              `)
              .eq('room_id', room.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            // Get unread count for this room (simplified - you might want to implement per-user unread tracking)
            const { count: unreadCount } = await supabase
              .from('messenger_messages')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', room.id)
              .eq('is_read', false);

            return {
              ...room,
              last_message: lastMessage ? {
                id: lastMessage.id,
                message: lastMessage.message,
                created_at: lastMessage.created_at,
                sender_name: lastMessage.chat_users?.name || 'Unknown'
              } : null,
              unread_count: unreadCount || 0
            };
          } catch (error) {
            console.error(`Error processing room ${room.id}:`, error);
            return {
              ...room,
              last_message: null,
              unread_count: 0
            };
          }
        })
      );

      console.log('Rooms with messages:', roomsWithMessages);
      return roomsWithMessages;
    } catch (error) {
      console.error('Error in getRooms:', error);
      throw error;
    }
  },

  async updateNotificationSettings(userId: number, enabled: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_users')
        .update({ notification_enabled: enabled })
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error in updateNotificationSettings:", error);
      throw error;
    }
  },
};
