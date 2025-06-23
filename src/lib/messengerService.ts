
import { supabase } from '@/integrations/supabase/client';

export interface MessengerUser {
  id: number;
  name: string;
  phone: string;
  username?: string;
  is_approved: boolean;
  bedoun_marz: boolean;
  is_messenger_admin: boolean;
  is_support_agent: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  type: 'general' | 'academy_support' | 'boundless_support';
  is_active: boolean;
  is_boundless_only: boolean;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

export interface MessengerMessage {
  id: number;
  message: string;
  sender_id: number;
  recipient_id?: number;
  room_id?: number;
  conversation_id?: number;
  message_type: string;
  is_read: boolean;
  created_at: string;
  sender?: MessengerUser;
}

class MessengerService {
  async getAllMessages(): Promise<MessengerMessage[]> {
    try {
      // Use explicit join to avoid relationship ambiguity
      const { data, error } = await supabase
        .from('messenger_messages')
        .select(`
          id,
          message,
          sender_id,
          recipient_id,
          room_id,
          conversation_id,
          message_type,
          is_read,
          created_at,
          sender:chat_users!sender_id(
            id,
            name,
            phone,
            username,
            is_approved,
            bedoun_marz,
            is_messenger_admin,
            is_support_agent,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all messages:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('messenger_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  async getRooms(sessionToken: string): Promise<ChatRoom[]> {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
  }

  async validateSession(sessionToken: string): Promise<{ user: MessengerUser } | null> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          user_id,
          is_active,
          last_activity,
          chat_users!user_id(
            id,
            name,
            phone,
            username,
            is_approved,
            bedoun_marz,
            is_messenger_admin,
            is_support_agent,
            created_at,
            updated_at
          )
        `)
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (error || !data) return null;

      // Check if session is still valid (within 24 hours)
      const lastActivity = new Date(data.last_activity);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 24) return null;

      return {
        user: data.chat_users as MessengerUser
      };
    } catch (error) {
      console.error('Error validating session:', error);
      return null;
    }
  }

  async deactivateSession(sessionToken: string): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken);
    } catch (error) {
      console.error('Error deactivating session:', error);
    }
  }
}

export const messengerService = new MessengerService();
