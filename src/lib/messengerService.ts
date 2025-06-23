import { supabase } from '@/integrations/supabase/client';

export interface MessengerUser {
  id: number;
  name: string;
  phone: string;
  username?: string;
  is_approved: boolean;
  bedoun_marz: boolean;
  bedoun_marz_approved: boolean;
  is_messenger_admin: boolean;
  is_support_agent: boolean;
  role?: string;
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
  media_url?: string;
  sender?: MessengerUser;
}

export interface SupportMessage {
  id: number;
  message: string;
  sender_id: number;
  recipient_id: number;
  conversation_id: number;
  message_type: string;
  is_read: boolean;
  created_at: string;
  media_url?: string;
  sender?: MessengerUser;
}

export interface AdminSettings {
  manual_approval_enabled: boolean;
  updated_at: string;
}

export interface SupportThreadType {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  is_boundless_only: boolean;
  is_active: boolean;
  created_at: string;
}

export interface SupportAgentAssignment {
  id: number;
  agent_id: number;
  thread_type_id: number;
  is_active: boolean;
  assigned_at: string;
}

export interface ChatTopic {
  id: number;
  title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResult {
  user: MessengerUser;
  session_token: string;
}

class MessengerService {
  async getAllMessages(): Promise<MessengerMessage[]> {
    try {
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
          media_url,
          sender:chat_users!sender_id(
            id,
            name,
            phone,
            username,
            is_approved,
            bedoun_marz,
            bedoun_marz_approved,
            is_messenger_admin,
            is_support_agent,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return (data || []) as MessengerMessage[];
    } catch (error) {
      console.error('Error fetching all messages:', error);
      throw error;
    }
  }

  async getMessages(roomId: number): Promise<MessengerMessage[]> {
    try {
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
          media_url,
          sender:chat_users!sender_id(
            id,
            name,
            phone,
            username,
            is_approved,
            bedoun_marz,
            bedoun_marz_approved,
            is_messenger_admin,
            is_support_agent,
            created_at,
            updated_at
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as MessengerMessage[];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async sendMessage(roomId: number, senderId: number, message: string): Promise<MessengerMessage> {
    try {
      const { data, error } = await supabase
        .from('messenger_messages')
        .insert({
          room_id: roomId,
          sender_id: senderId,
          message: message,
          message_type: 'text',
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async addReaction(messageId: number, userId: number, emoji: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: userId,
          reaction: emoji
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding reaction:', error);
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

  async getAllUsers(): Promise<MessengerUser[]> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getApprovedUsers(): Promise<MessengerUser[]> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching approved users:', error);
      throw error;
    }
  }

  async getUserByPhone(phone: string): Promise<MessengerUser | null> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching user by phone:', error);
      throw error;
    }
  }

  async updateUserRole(userId: number, updates: Partial<MessengerUser>): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async updateUserDetails(userId: number, updates: Partial<MessengerUser>): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user details:', error);
      throw error;
    }
  }

  async registerWithPassword(name: string, phone: string, password: string, username?: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .insert({
          name,
          phone,
          username,
          password_hash: password, // In production, this should be hashed
          is_approved: false
        })
        .select()
        .single();

      if (error) throw error;

      // Create session
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          user_id: data.id,
          session_token: sessionToken,
          is_active: true
        });

      if (sessionError) throw sessionError;

      return {
        user: data,
        session_token: sessionToken
      };
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  async authenticateUser(phone: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('phone', phone)
        .eq('password_hash', password)
        .single();

      if (error) throw error;

      // Create session
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          user_id: data.id,
          session_token: sessionToken,
          is_active: true
        });

      if (sessionError) throw sessionError;

      return {
        user: data,
        session_token: sessionToken
      };
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    }
  }

  async createSession(userId: number): Promise<{ session_token: string }> {
    try {
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_token: sessionToken,
          is_active: true
        });

      if (error) throw error;

      return { session_token: sessionToken };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getAdminSettings(): Promise<AdminSettings> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .single();

      if (error) throw error;
      return data || { manual_approval_enabled: false, updated_at: new Date().toISOString() };
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      return { manual_approval_enabled: false, updated_at: new Date().toISOString() };
    }
  }

  async updateAdminSettings(updates: Partial<AdminSettings>): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          id: 1,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating admin settings:', error);
      throw error;
    }
  }

  async getThreadTypes(): Promise<SupportThreadType[]> {
    try {
      const { data, error } = await supabase
        .from('support_thread_types')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching thread types:', error);
      throw error;
    }
  }

  async getSupportAgentAssignments(): Promise<SupportAgentAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('support_agent_assignments')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching support agent assignments:', error);
      throw error;
    }
  }

  async assignSupportAgent(agentId: number, threadTypeId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('support_agent_assignments')
        .insert({
          agent_id: agentId,
          thread_type_id: threadTypeId,
          is_active: true
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning support agent:', error);
      throw error;
    }
  }

  async unassignSupportAgent(agentId: number, threadTypeId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('support_agent_assignments')
        .delete()
        .eq('agent_id', agentId)
        .eq('thread_type_id', threadTypeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error unassigning support agent:', error);
      throw error;
    }
  }

  async getTopics(): Promise<ChatTopic[]> {
    try {
      const { data, error } = await supabase
        .from('chat_topics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching topics:', error);
      throw error;
    }
  }

  async createTopic(topic: { title: string; description?: string; is_active?: boolean }): Promise<ChatTopic> {
    try {
      const { data, error } = await supabase
        .from('chat_topics')
        .insert({
          title: topic.title,
          description: topic.description || '',
          is_active: topic.is_active ?? true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  }

  async updateTopic(topicId: number, updates: Partial<ChatTopic>): Promise<void> {
    try {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      
      const { error } = await supabase
        .from('chat_topics')
        .update(updateData)
        .eq('id', topicId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating topic:', error);
      throw error;
    }
  }

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
  }

  async createRoom(room: { name: string; description?: string; type?: string; is_active?: boolean; is_boundless_only?: boolean }): Promise<ChatRoom> {
    try {
      const roomType = (room.type as 'general' | 'academy_support' | 'boundless_support') || 'general';
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: room.name,
          description: room.description || '',
          type: roomType,
          is_active: room.is_active ?? true,
          is_boundless_only: room.is_boundless_only ?? false
        })
        .select()
        .single();

      if (error) throw error;
      return data as ChatRoom;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  async updateRoom(roomId: number, updates: Partial<ChatRoom>): Promise<void> {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.is_boundless_only !== undefined) updateData.is_boundless_only = updates.is_boundless_only;
      
      const { error } = await supabase
        .from('chat_rooms')
        .update(updateData)
        .eq('id', roomId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  }

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
  }

  async getRooms(sessionToken: string): Promise<ChatRoom[]> {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(room => ({
        ...room,
        type: room.type as 'general' | 'academy_support' | 'boundless_support'
      })) as ChatRoom[];
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
            bedoun_marz_approved,
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
