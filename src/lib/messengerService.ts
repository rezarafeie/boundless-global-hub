import { supabase } from '@/integrations/supabase/client';

export interface MessengerUser {
  id: number;
  name: string;
  username?: string;
  avatar_url?: string;
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
  role: string;
  email: string | null;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  country_code: string | null;
  signup_source: string | null;
  bio: string | null;
  notification_enabled: boolean | null;
  notification_token: string | null;
  password_hash: string | null;
}

export interface ChatRoom {
  id: number;
  created_at: string;
  name: string;
  description: string;
  avatar_url: string;
  type: string;
  is_active: boolean;
  is_boundless_only: boolean;
  is_super_group: boolean;
  updated_at: string;
}

export interface MessengerMessage {
  id: number;
  created_at: string;
  room_id: number;
  sender_id: number;
  message: string;
  topic_id?: number;
  conversation_id?: number;
  media_url?: string;
  message_type?: string;
  media_content?: string;
  sender?: {
    name: string;
    phone: string;
  };
}

export interface AdminSettings {
  id: number;
  manual_approval_enabled: boolean;
  updated_at: string;
}

export const messengerService = {
  async getUsers(): Promise<MessengerUser[]> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('is_approved', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  async getOrCreateChatUser(phone: string): Promise<MessengerUser | null> {
    try {
      // Check if user exists
      let { data: existingUsers, error: selectError } = await supabase
        .from('chat_users')
        .select('*')
        .eq('phone', phone);

      if (selectError) {
        console.error('Error checking existing user:', selectError);
        return null;
      }

      if (existingUsers && existingUsers.length > 0) {
        return existingUsers[0];
      }

      // If user doesn't exist, create a new user
      const { data: newUserData, error: insertError } = await supabase
        .from('chat_users')
        .insert([{ phone: phone, name: phone, is_approved: true }])
        .select('*')
        .single();

      if (insertError) {
        console.error('Error creating new user:', insertError);
        return null;
      }

      return newUserData;
    } catch (error) {
      console.error('Error in getOrCreateChatUser:', error);
      return null;
    }
  },

  async login(phone: string): Promise<{ user: MessengerUser | null; error: any }> {
    try {
      const user = await this.getOrCreateChatUser(phone);
      if (!user) {
        return { user: null, error: 'Failed to create or retrieve user' };
      }
      return { user: user, error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { user: null, error: error };
    }
  },

  async signup(phone: string): Promise<{ user: MessengerUser | null; error: any }> {
    try {
      const user = await this.getOrCreateChatUser(phone);
      if (!user) {
        return { user: null, error: 'Failed to create or retrieve user' };
      }
      return { user: user, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { user: null, error: error };
    }
  },

  async getRooms(): Promise<ChatRoom[]> {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }
  },

  async getMessages(roomId: number, topicId?: number): Promise<MessengerMessage[]> {
    try {
      let query = supabase
        .from('messenger_messages')
        .select(`
          id,
          created_at,
          room_id,
          sender_id,
          message,
          topic_id,
          media_url,
          message_type,
          media_content,
          sender:chat_users!messenger_messages_sender_id_fkey (
            name,
            phone
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (topicId) {
        query = query.eq('topic_id', topicId);
      } else {
        query = query.is('topic_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  async sendMessage(
    roomId: number, 
    senderId: number, 
    message: string, 
    topicId?: number,
    mediaUrl?: string,
    mediaType?: string,
    mediaContent?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('messenger_messages')
        .insert({
          room_id: roomId,
          sender_id: senderId,
          message,
          topic_id: topicId,
          media_url: mediaUrl,
          message_type: mediaType,
          media_content: mediaContent
        });

      if (error) throw error;

      // Webhook is now handled by database trigger automatically
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  async sendMessageWebhook(message: any, roomId: number, topicId?: number): Promise<void> {
    try {
      // Get sender info
      const { data: senderData } = await supabase
        .from('chat_users')
        .select('name, phone, email')
        .eq('id', message.sender_id)
        .single();

      // Get room info
      const { data: roomData } = await supabase
        .from('chat_rooms')
        .select('name')
        .eq('id', roomId)
        .single();

      if (!senderData || !roomData) return;

      const webhookData = {
        messageContent: message.message || (message.media_url ? 'فایل ضمیمه شده' : ''),
        senderName: senderData.name,
        senderPhone: senderData.phone,
        senderEmail: senderData.email || '',
        chatType: 'group' as const,
        chatName: roomData.name,
        topicId: topicId,
        timestamp: message.created_at,
        mediaUrl: message.media_url,
        mediaType: message.message_type,
        messageType: message.media_url ? 'media' : 'text'
      };

      // Import webhook service
      const { webhookService } = await import('@/lib/webhookService');
      await webhookService.sendMessageWebhook(webhookData);
    } catch (error) {
      console.error('Error sending webhook:', error);
    }
  },

  async sendPrivateMessage(senderId: number, recipientId: number, message: string): Promise<void> {
    try {
      // Implementation for sending private messages
      console.log(`Sending private message from ${senderId} to ${recipientId}: ${message}`);
    } catch (error) {
      console.error('Error sending private message:', error);
      throw error;
    }
  },

  async getConversations(userId: number): Promise<any[]> {
    try {
      // Implementation for fetching conversations
      console.log(`Fetching conversations for user ID: ${userId}`);
      return [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Admin methods
  async getAdminSettings(): Promise<AdminSettings> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      throw error;
    }
  },

  async updateAdminSettings(settings: Partial<AdminSettings>): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update(settings)
        .eq('id', 1);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating admin settings:', error);
      throw error;
    }
  },

  async getAllMessages(): Promise<MessengerMessage[]> {
    try {
      const { data, error } = await supabase
        .from('messenger_messages')
        .select(`
          *,
          sender:chat_users!messenger_messages_sender_id_fkey (
            name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all messages:', error);
      return [];
    }
  },

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
  },

  async validateSession(sessionToken: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (error) return false;
      return !!data;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  },

  async updateRoom(roomId: number, updates: Partial<ChatRoom>): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update(updates)
        .eq('id', roomId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  },

  async getTopics(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('chat_topics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching topics:', error);
      return [];
    }
  },

  async createTopic(topicData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_topics')
        .insert(topicData);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  },

  async createRoom(roomData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_rooms')
        .insert(roomData);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  },

  async updateTopic(topicId: number, updates: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_topics')
        .update(updates)
        .eq('id', topicId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating topic:', error);
      throw error;
    }
  },

  async deleteTopic(topicId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_topics')
        .delete()
        .eq('id', topicId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting topic:', error);
      throw error;
    }
  },

  async deleteRoom(roomId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  },

  async updateUser(userId: number, updates: Partial<MessengerUser>): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async getAllUsers(): Promise<MessengerUser[]> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }
};
