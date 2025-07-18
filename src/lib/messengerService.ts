
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

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
  description: string | null;
  avatar_url: string | null;
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

interface ValidationResult {
  valid: boolean;
  user?: MessengerUser;
}

interface AuthResult {
  user: MessengerUser | null;
  error: any;
  session_token?: string;
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
  },

  async getUserById(userId: number): Promise<MessengerUser | null> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  },

  async getUserByPhone(phone: string): Promise<MessengerUser | null> {
    try {
      console.log('getUserByPhone: Starting search for phone:', phone);
      
      // Create multiple phone number formats to search for
      const phoneFormats = [
        phone, // Original format (e.g., +989120784457)
        phone.replace(/^\+98/, ''), // Without country code (e.g., 9120784457)
        phone.replace(/^\+98/, '0'), // With leading zero (e.g., 09120784457)
        phone.replace(/^\+989/, '09'), // Direct conversion from +989 to 09
      ];
      
      // Remove duplicates
      const uniqueFormats = [...new Set(phoneFormats)];
      console.log('getUserByPhone: Trying these phone formats:', uniqueFormats);
      
      // Try each format until we find a user
      for (const format of uniqueFormats) {
        console.log('getUserByPhone: Checking format:', format);
        const { data, error } = await supabase
          .from('chat_users')
          .select('*')
          .eq('phone', format)
          .maybeSingle();

        if (error) {
          console.error('Database error for format', format, ':', error);
          continue; // Try next format
        }
        
        if (data) {
          console.log('getUserByPhone: SUCCESS! Found user with format:', format, 'User:', data.name);
          return data;
        } else {
          console.log('getUserByPhone: No user found with format:', format);
        }
      }
      
      console.log('getUserByPhone: FINAL RESULT - No user found with any format');
      return null;
    } catch (error) {
      console.error('Error fetching user by phone:', error);
      return null;
    }
  },

  async getOrCreateChatUser(phone: string): Promise<MessengerUser | null> {
    try {
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

  async login(phone: string): Promise<AuthResult> {
    try {
      const user = await this.getOrCreateChatUser(phone);
      if (!user) {
        return { user: null, error: 'Failed to create or retrieve user' };
      }
      const sessionToken = await this.createSession(user.id);
      return { user: user, error: null, session_token: sessionToken };
    } catch (error) {
      console.error('Login error:', error);
      return { user: null, error: error };
    }
  },

  async signup(phone: string): Promise<AuthResult> {
    try {
      const user = await this.getOrCreateChatUser(phone);
      if (!user) {
        return { user: null, error: 'Failed to create or retrieve user' };
      }
      const sessionToken = await this.createSession(user.id);
      return { user: user, error: null, session_token: sessionToken };
    } catch (error) {
      console.error('Signup error:', error);
      return { user: null, error: error };
    }
  },

  async authenticateUser(phone: string, password: string): Promise<AuthResult> {
    try {
      const user = await this.getUserByPhone(phone);
      if (!user) {
        return { user: null, error: 'User not found' };
      }
      const sessionToken = await this.createSession(user.id);
      return { user: user, error: null, session_token: sessionToken };
    } catch (error) {
      console.error('Authentication error:', error);
      return { user: null, error: error };
    }
  },

  async loginWithPassword(phone: string, password: string): Promise<AuthResult> {
    try {
      // First get user by phone (without password comparison)
      const user = await this.getUserByPhone(phone);
      
      if (!user || !user.password_hash) {
        console.error('User not found or no password set');
        return { user: null, error: { message: 'کاربر یافت نشد یا رمز عبور تنظیم نشده است' } };
      }

      // Compare the password with the stored hash
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        console.error('Invalid password for user:', user.phone);
        return { user: null, error: { message: 'رمز عبور اشتباه است' } };
      }

      // Password is correct, create session
      const sessionToken = await this.createSession(user.id);
      return { user: user, error: null, session_token: sessionToken };
    } catch (error) {
      console.error('Login error:', error);
      return { user: null, error: error };
    }
  },

  async registerWithPassword(phone: string, password: string, name: string): Promise<AuthResult> {
    try {
      // Hash the password before storing
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      const { data: newUserData, error: insertError } = await supabase
        .from('chat_users')
        .insert([{ 
          phone: phone, 
          name: name, 
          password_hash: hashedPassword,
          is_approved: true 
        }])
        .select('*')
        .single();

      if (insertError) {
        console.error('Error creating new user:', insertError);
        return { user: null, error: insertError };
      }

      const sessionToken = await this.createSession(newUserData.id);
      return { user: newUserData, error: null, session_token: sessionToken };
    } catch (error) {
      console.error('Registration error:', error);
      return { user: null, error: error };
    }
  },

  async createSession(userId: number): Promise<string> {
    try {
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_token: sessionToken,
          is_active: true,
          last_activity: new Date().toISOString()
        });

      if (error) throw error;
      return sessionToken;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  async getRooms(): Promise<ChatRoom[]> {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const rooms = data || [];
      
      return rooms;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }
  },

  async getRoomById(roomId: number): Promise<ChatRoom | null> {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching room by ID:', error);
      return null;
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
          conversation_id,
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
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  async sendSupportMessage(
    senderId: number,
    message: string,
    mediaUrl?: string,
    mediaType?: string,
    mediaContent?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('messenger_messages')
        .insert({
          sender_id: senderId,
          recipient_id: 1, // Support user ID
          message: message,
          media_url: mediaUrl,
          message_type: mediaType,
          media_content: mediaContent
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending support message:', error);
      throw error;
    }
  },

  async getSupportMessages(userId: number): Promise<MessengerMessage[]> {
    try {
      const { data, error } = await supabase
        .from('messenger_messages')
        .select(`
          *,
          sender:chat_users!messenger_messages_sender_id_fkey(name, phone)
        `)
        .or(`and(sender_id.eq.${userId},recipient_id.eq.1),and(sender_id.eq.1,recipient_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching support messages:', error);
      return [];
    }
  },

  async sendPrivateMessageWithMedia(
    senderId: number,
    recipientId: number,
    message: string,
    mediaUrl?: string,
    mediaType?: string,
    mediaContent?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('messenger_messages')
        .insert({
          sender_id: senderId,
          recipient_id: recipientId,
          message: message,
          media_url: mediaUrl,
          message_type: mediaType,
          media_content: mediaContent
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending private message with media:', error);
      throw error;
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

  async validateSession(sessionToken: string): Promise<ValidationResult> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          chat_users!user_sessions_user_id_fkey (*)
        `)
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (error || !data) return { valid: false };
      
      const isValid = data.last_activity && 
        new Date(data.last_activity) > new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      return { 
        valid: isValid, 
        user: isValid ? data.chat_users : undefined 
      };
    } catch (error) {
      console.error('Error validating session:', error);
      return { valid: false };
    }
  },

  async updateUser(userId: number, updates: { is_support_agent?: boolean; is_messenger_admin?: boolean; is_approved?: boolean; }): Promise<void> {
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

  async updateUserRole(userId: number, updates: { is_support_agent?: boolean; is_messenger_admin?: boolean; is_approved?: boolean; }): Promise<void> {
    return this.updateUser(userId, updates);
  },

  async updateUserProfile(userId: number, name: string, bio: string): Promise<MessengerUser> {
    const { data, error } = await supabase
      .from('chat_users')
      .update({ name, bio })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserDetails(userId: number, updates: { name?: string; bio?: string; [key: string]: any }): Promise<MessengerUser> {
    const { data, error } = await supabase
      .from('chat_users')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
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

  async getTopics(roomId?: number): Promise<any[]> {
    try {
      let query = supabase
        .from('chat_topics')
        .select('*')
        .order('created_at', { ascending: false });

      if (roomId) {
        query = query.eq('room_id', roomId);
      }

      const { data, error } = await query;

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

  async checkUsernameAvailability(username: string, currentUserId?: number): Promise<boolean> {
    try {
      let query = supabase
        .from('chat_users')
        .select('id')
        .eq('username', username);

      if (currentUserId) {
        query = query.neq('id', currentUserId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return !data || data.length === 0;
    } catch (error) {
      console.error('Error checking username availability:', error);
      throw error;
    }
  },

  async searchUsersByUsername(username: string): Promise<MessengerUser[]> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .ilike('username', `%${username}%`)
        .eq('is_approved', true)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users by username:', error);
      return [];
    }
  },

  async sendPrivateMessage(senderId: number, recipientId: number, message: string): Promise<void> {
    try {
      console.log(`Sending private message from ${senderId} to ${recipientId}: ${message}`);
    } catch (error) {
      console.error('Error sending private message:', error);
      throw error;
    }
  },

  async getConversations(userId: number): Promise<any[]> {
    try {
      console.log(`Fetching conversations for user ID: ${userId}`);
      return [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  async updateNotificationSettings(userId: number, enabled: boolean, token?: string): Promise<void> {
    try {
      const updates: any = { notification_enabled: enabled };
      if (token) {
        updates.notification_token = token;
      }
      
      const { error } = await supabase
        .from('chat_users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  async updateUserPassword(userId: number, newPassword: string): Promise<{ error: any }> {
    try {
      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      const { error } = await supabase
        .from('chat_users')
        .update({ password_hash: hashedPassword })
        .eq('id', userId);

      if (error) {
        console.error('Error updating password:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error updating user password:', error);
      return { error };
    }
  },

  async deactivateSession(sessionToken: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken);

      if (error) throw error;
    } catch (error) {
      console.error('Error deactivating session:', error);
      throw error;
    }
  }
};
