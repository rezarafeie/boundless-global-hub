import { supabase } from '@/integrations/supabase/client';

export interface MessengerUser {
  id: number;
  name: string;
  phone: string;
  username?: string;
  role?: string;
  is_approved: boolean;
  is_support_agent?: boolean;
  is_messenger_admin?: boolean;
  bedoun_marz_approved?: boolean;
  bedoun_marz?: boolean;
  password_hash?: string;
  created_at: string;
  updated_at: string;
  last_seen?: string;
  user?: MessengerUser; // For nested user references
}

export interface MessengerMessage {
  id: number;
  message: string;
  sender_id: number;
  recipient_id?: number;
  room_id?: number;
  conversation_id?: number;
  message_type?: string;
  is_read: boolean;
  created_at: string;
  sender?: MessengerUser;
}

export interface SupportMessage {
  id: number;
  message: string;
  sender_id: number;
  recipient_id?: number;
  user_id?: number;
  conversation_id?: number;
  message_type?: string;
  is_read?: boolean;
  is_from_support?: boolean;
  created_at: string;
  read_at?: string;
  media_url?: string;
  sender?: MessengerUser;
}

export interface ChatTopic {
  id: number;
  title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  type: string;
  is_active: boolean;
  is_boundless_only: boolean;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
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

export interface AdminSettings {
  manual_approval_enabled: boolean;
  updated_at: string;
}

export interface AuthResult {
  user: MessengerUser;
  session_token: string;
}

export interface SessionData {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
}

class MessengerService {
  async getUserByPhone(phone: string): Promise<MessengerUser | null> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting user by phone:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<MessengerUser | null> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  async registerWithPassword(
    name: string,
    phone: string,
    password: string,
    username?: string
  ): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByPhone(phone);
      if (existingUser) {
        throw new Error('کاربری با این شماره تلفن قبلاً ثبت نام کرده است');
      }

      // Check username availability if provided
      if (username) {
        const existingUsername = await this.getUserByUsername(username);
        if (existingUsername) {
          throw new Error('این نام کاربری قبلاً انتخاب شده است');
        }
      }

      // Create new user - store password as plain text for now (in production should be hashed)
      const { data: userData, error: userError } = await supabase
        .from('chat_users')
        .insert({
          name: name.trim(),
          phone: phone.trim(),
          password_hash: password, // Store as plain text for now
          username: username?.toLowerCase().trim(),
          is_approved: true // Auto-approve for now
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create session
      const sessionResult = await this.createSession(userData.id);
      
      return {
        user: userData,
        session_token: sessionResult.session_token
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'خطا در ثبت نام');
    }
  }

  async authenticateUser(phone: string, password: string): Promise<AuthResult | null> {
    try {
      console.log('Authenticating user with phone:', phone);
      
      // First get the user
      const user = await this.getUserByPhone(phone);
      if (!user) {
        console.log('User not found');
        return null;
      }

      console.log('User found:', user.name);
      console.log('Stored password hash:', user.password_hash);
      console.log('Provided password:', password);

      // Check password (plain text comparison for now)
      if (user.password_hash !== password) {
        console.log('Password mismatch');
        return null;
      }

      if (!user.is_approved) {
        throw new Error('حساب شما هنوز تایید نشده است');
      }

      console.log('Authentication successful');
      const sessionResult = await this.createSession(user.id);
      
      return {
        user: user,
        session_token: sessionResult.session_token
      };
    } catch (error: any) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  async createSession(userId: number): Promise<SessionData> {
    try {
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_token: sessionToken,
          last_activity: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        user_id: data.user_id.toString(),
        session_token: data.session_token,
        expires_at: expiresAt.toISOString(),
        created_at: data.created_at
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async validateSession(sessionToken: string): Promise<MessengerUser | null> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          chat_users (*)
        `)
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data || !data.chat_users) {
        return null;
      }

      return data.chat_users as MessengerUser;
    } catch (error) {
      console.error('Error validating session:', error);
      return null;
    }
  }

  async logout(sessionToken: string): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  async deactivateSession(sessionToken: string): Promise<void> {
    return this.logout(sessionToken);
  }

  // Admin Methods
  async getAllUsers(): Promise<MessengerUser[]> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all users:', error);
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
      console.error('Error getting approved users:', error);
      throw error;
    }
  }

  async getAllMessages(): Promise<MessengerMessage[]> {
    try {
      const { data, error } = await supabase
        .from('messenger_messages')
        .select(`
          *,
          sender:chat_users!messenger_messages_sender_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all messages:', error);
      throw error;
    }
  }

  async getMessages(roomId?: number): Promise<MessengerMessage[]> {
    try {
      let query = supabase
        .from('messenger_messages')
        .select(`
          *,
          sender:chat_users!messenger_messages_sender_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (roomId) {
        query = query.eq('room_id', roomId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  async sendMessage(message: string, senderId: number, roomId?: number, recipientId?: number): Promise<MessengerMessage> {
    try {
      const { data, error } = await supabase
        .from('messenger_messages')
        .insert({
          message,
          sender_id: senderId,
          room_id: roomId,
          recipient_id: recipientId,
          message_type: 'text'
        })
        .select(`
          *,
          sender:chat_users!messenger_messages_sender_id_fkey(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async addReaction(messageId: number, userId: number, reaction: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: userId,
          reaction: reaction
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

  async getAdminSettings(): Promise<AdminSettings> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // Create default settings
        const defaultSettings = {
          id: 1,
          manual_approval_enabled: false
        };

        const { data: newData, error: insertError } = await supabase
          .from('admin_settings')
          .upsert(defaultSettings, { onConflict: 'id' })
          .select()
          .single();

        if (insertError) throw insertError;
        return newData;
      }

      return data;
    } catch (error) {
      console.error('Error getting admin settings:', error);
      throw error;
    }
  }

  async updateAdminSettings(updates: Partial<AdminSettings>): Promise<AdminSettings> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .upsert({ id: 1, ...updates }, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating admin settings:', error);
      throw error;
    }
  }

  async updateUserRole(userId: number, updates: { 
    is_support_agent?: boolean; 
    is_messenger_admin?: boolean;
    is_approved?: boolean;
    bedoun_marz_approved?: boolean;
  }): Promise<void> {
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

  async updateUserDetails(userId: number, updates: any): Promise<void> {
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

  async getThreadTypes(): Promise<SupportThreadType[]> {
    try {
      const { data, error } = await supabase
        .from('support_thread_types')
        .select('*')
        .eq('is_active', true)
        .order('id');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting thread types:', error);
      throw error;
    }
  }

  async getSupportAgentAssignments(): Promise<SupportAgentAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('support_agent_assignments')
        .select('*')
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting support agent assignments:', error);
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
      console.error('Error getting topics:', error);
      throw error;
    }
  }

  async getRooms(sessionToken?: string): Promise<ChatRoom[]> {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting rooms:', error);
      throw error;
    }
  }

  async createTopic(topic: { title: string; description?: string; is_active?: boolean }): Promise<ChatTopic> {
    try {
      const { data, error } = await supabase
        .from('chat_topics')
        .insert(topic)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  }

  async createRoom(room: { name: string; description?: string; type: string; is_boundless_only?: boolean }): Promise<ChatRoom> {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert(room)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  async updateTopic(topicId: number, updates: Partial<ChatTopic>): Promise<void> {
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
  }

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

  private generateSessionToken(): string {
    return Math.random().toString(36).substring(2) + 
           Math.random().toString(36).substring(2) + 
           Date.now().toString(36);
  }
}

export const messengerService = new MessengerService();
