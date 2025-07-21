import { supabase } from '@/integrations/supabase/client';

interface MessengerUser {
  id: number;
  name: string;
  username: string | null;
  avatar_url: string | null;
  phone: string;
  is_approved: boolean;
  is_messenger_admin: boolean;
  is_support_agent: boolean;
  bedoun_marz: boolean;
  bedoun_marz_approved: boolean;
  bedoun_marz_request: boolean;
  created_at: string;
  updated_at: string;
  last_seen: string;
  role: 'user' | 'admin' | 'moderator' | 'support';
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

interface MessengerMessage {
  id: number;
  created_at: string;
  message: string;
  room_id: number;
  sender_id: number;
  sender?: MessengerUser;
  media_url: string | null;
  message_type: string | null;
  media_content: string | null;
  topic_id: number | null;
  conversation_id: number | null;
  is_read: boolean;
  recipient_id: number | null;
  unread_by_support: boolean;
  reply_to_message_id: number | null;
  forwarded_from_message_id: number | null;
}

interface ChatRoom {
  id: number;
  created_at: string;
  name: string;
  description: string;
  avatar_url: string | null;
  is_active: boolean;
  is_public: boolean;
  type: 'group' | 'channel' | 'direct';
  is_super_group: boolean;
}

class MessengerService {
  async validateSession(sessionToken: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, user_id, created_at, expires_at, chat_users(*)')
        .eq('session_token', sessionToken)
        .single();

      if (error) {
        console.error('Error validating session:', error);
        return null;
      }

      if (!data || !data.chat_users) {
        return null;
      }

      // Check if session is expired
      if (new Date(data.expires_at) < new Date()) {
        console.log('Session expired');
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
        user: data.chat_users
      };
    } catch (error) {
      console.error('Error in validateSession:', error);
      return null;
    }
  }

  async getOrCreateChatUser(email: string): Promise<MessengerUser> {
    try {
      // Check if user exists
      let { data: existingUser, error: userError } = await supabase
        .from('chat_users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError && (userError.message !== 'No rows found' && userError.message !== '查無資料')) {
        throw userError;
      }

      if (existingUser) {
        return existingUser;
      }

      // If user doesn't exist, create a new user
      const { data: newUser, error: newUserError } = await supabase
        .from('chat_users')
        .insert([
          {
            email: email,
            name: email.split('@')[0],
            username: email.split('@')[0],
            phone: '',
            is_approved: true,
            is_messenger_admin: false,
            is_support_agent: false,
            bedoun_marz: false,
            bedoun_marz_approved: false,
            bedoun_marz_request: false,
            role: 'user'
          }
        ])
        .select('*')
        .single();

      if (newUserError) {
        throw newUserError;
      }

      return newUser as MessengerUser;
    } catch (error) {
      console.error('Error in getOrCreateChatUser:', error);
      throw error;
    }
  }

  async sendMessage(messageData: {
    sender_id: number;
    message: string;
    room_id: number;
    topic_id?: number | null;
    media_url?: string | null;
    message_type?: string | null;
  }): Promise<any> {
    try {
      const { sender_id, message, room_id, topic_id, media_url, message_type } = messageData;

      const { data, error } = await supabase
        .from('messenger_messages')
        .insert([
          {
            sender_id: sender_id,
            message: message,
            room_id: room_id,
            topic_id: topic_id || null,
            media_url: media_url || null,
            message_type: message_type || 'text'
          }
        ])
        .select('*')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  async getMessages(roomId: number, topicId?: number): Promise<MessengerMessage[]> {
    try {
      console.log('📥 Fetching messages for room:', roomId, 'topic:', topicId);
      
      let query = supabase
        .from('messenger_messages')
        .select(`
          *,
          sender:sender_id(*)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      // Add topic filter for super groups
      if (topicId) {
        query = query.eq('topic_id', topicId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching messages:', error);
        throw error;
      }

      console.log('✅ Fetched messages:', data?.length || 0);
      return data?.map(msg => ({
        ...msg,
        sender: msg.sender || {
          id: msg.sender_id,
          name: 'Unknown',
          phone: '',
          is_approved: false,
          is_messenger_admin: false,
          is_support_agent: false,
          bedoun_marz: false,
          bedoun_marz_approved: false,
          bedoun_marz_request: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          role: 'user' as const,
          email: null,
          user_id: null,
          first_name: null,
          last_name: null,
          full_name: null,
          country_code: null,
          signup_source: null,
          bio: null,
          notification_enabled: true,
          notification_token: null,
          password_hash: null,
          avatar_url: null,
          username: null
        }
      })) || [];
    } catch (error) {
      console.error('❌ Error in getMessages:', error);
      throw error;
    }
  }

  async getSupportMessages(userId: number): Promise<MessengerMessage[]> {
    try {
      console.log('📥 Fetching support messages for user:', userId);
      
      const { data, error } = await supabase
        .from('messenger_messages')
        .select(`
          *,
          sender:sender_id(*)
        `)
        .or(`sender_id.eq.${userId},conversation_id.eq.${userId}`)
        .eq('recipient_id', 1)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching support messages:', error);
        throw error;
      }

      console.log('✅ Fetched support messages:', data?.length || 0);
      return data?.map(msg => ({
        ...msg,
        sender: msg.sender || {
          id: msg.sender_id,
          name: msg.sender_id === userId ? 'شما' : 'پشتیبانی',
          phone: '',
          is_approved: msg.sender_id === 1,
          is_messenger_admin: false,
          is_support_agent: msg.sender_id === 1,
          bedoun_marz: false,
          bedoun_marz_approved: false,
          bedoun_marz_request: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          role: msg.sender_id === 1 ? 'support' as const : 'user' as const,
          email: null,
          user_id: null,
          first_name: null,
          last_name: null,
          full_name: null,
          country_code: null,
          signup_source: null,
          bio: null,
          notification_enabled: true,
          notification_token: null,
          password_hash: null,
          avatar_url: null,
          username: null
        }
      })) || [];
    } catch (error) {
      console.error('❌ Error in getSupportMessages:', error);
      throw error;
    }
  }

  async createRoom(roomData: {
    name: string;
    description: string;
    type: 'group' | 'channel' | 'direct';
  }): Promise<ChatRoom> {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert([roomData])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating room:', error);
        throw error;
      }

      return data as ChatRoom;
    } catch (error) {
      console.error('Error in createRoom:', error);
      throw error;
    }
  }

  async getRooms(): Promise<ChatRoom[]> {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rooms:', error);
        throw error;
      }

      return data as ChatRoom[];
    } catch (error) {
      console.error('Error in getRooms:', error);
      throw error;
    }
  }

  async updateNotificationSettings(userId: number, enabled: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_users')
        .update({ notification_enabled: enabled })
        .eq('id', userId);

      if (error) {
        console.error('Error updating notification settings:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateNotificationSettings:', error);
      throw error;
    }
  }

  async sendSupportMessage(messageData: {
    sender_id: number;
    message: string;
    conversation_id: number;
    media_url?: string | null;
    message_type?: string | null;
  }): Promise<any> {
    try {
      const { sender_id, message, conversation_id, media_url, message_type } = messageData;

      const { data, error } = await supabase
        .from('messenger_messages')
        .insert([
          {
            sender_id: sender_id,
            message: message,
            conversation_id: conversation_id,
            recipient_id: 1, // Support recipient ID
            media_url: media_url || null,
            message_type: message_type || 'text'
          }
        ])
        .select('*')
        .single();

      if (error) {
        console.error('Error sending support message:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in sendSupportMessage:', error);
      throw error;
    }
  }

  async getAllMessages(): Promise<MessengerMessage[]> {
    try {
      const { data, error } = await supabase
        .from('messenger_messages')
        .select(`
          *,
          sender:sender_id(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all messages:', error);
        throw error;
      }

      return data as MessengerMessage[];
    } catch (error) {
      console.error('Error in getAllMessages:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('messenger_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Error deleting message:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteMessage:', error);
      throw error;
    }
  }
}

export const messengerService = new MessengerService();
export type { MessengerUser, MessengerMessage, ChatRoom };
