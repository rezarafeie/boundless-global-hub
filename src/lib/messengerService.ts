import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';
import { enhancedWebhookManager } from './enhancedWebhookManager';

// Helper function to get user from session
async function getUserFromSession(sessionToken: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('user_id')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data.user_id;
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}

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

  async getUserByPhone(phone: string, countryCode?: string): Promise<MessengerUser | null> {
    try {
      console.log('getUserByPhone: Starting search for phone:', phone, 'with country code:', countryCode);
      
      // Create multiple phone number formats to search for
      const phoneFormats = [
        phone, // Original format
        phone.replace(/^\+98/, ''), // Without country code
        phone.replace(/^\+98/, '0'), // With leading zero
        phone.replace(/^\+989/, '09'), // Direct conversion from +989 to 09
      ];
      
      // If countryCode is provided, also try with it
      if (countryCode && !phone.includes(countryCode)) {
        phoneFormats.push(countryCode + phone);
        phoneFormats.push(countryCode + phone.replace(/^0/, ''));
      }
      
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

  async validateSession(sessionToken: string): Promise<MessengerUser | null> {
    try {
      console.log('🔍 MessengerService: Validating session:', sessionToken.substring(0, 10) + '...');
      
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          chat_users!user_sessions_user_id_fkey (*)
        `)
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.log('❌ MessengerService: No session data found');
        return null;
      }
      
      // Check if session is still valid (24 hours)
      const sessionAge = new Date().getTime() - new Date(data.last_activity).getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const isValid = sessionAge < twentyFourHours;
      
      if (!isValid) {
        console.log('❌ MessengerService: Session expired');
        // Deactivate expired session
        await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('session_token', sessionToken);
        return null;
      }
      
      // Update last activity to keep session alive
      await supabase
        .from('user_sessions')
        .update({ 
          last_activity: new Date().toISOString() 
        })
        .eq('session_token', sessionToken);
      
      console.log('✅ MessengerService: Session valid for user:', data.chat_users?.name);
      return data.chat_users || null;
    } catch (error) {
      console.error('💥 MessengerService: Error validating session:', error);
      return null;
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

  async updateUserProfile(sessionToken: string, updates: Partial<MessengerUser>, userId?: number): Promise<MessengerUser> {
    let targetUserId = userId;
    if (!targetUserId) {
      targetUserId = await getUserFromSession(sessionToken);
      if (!targetUserId) {
        throw new Error('نشست نامعتبر است');
      }
    }

    const { data, error } = await supabase
      .from('chat_users')
      .update(updates)
      .eq('id', targetUserId)
      .select()
      .single();

    if (error) {
      throw new Error('خطا در به‌روزرسانی پروفایل');
    }

    return data;
  },

  async checkUsernameUniqueness(username: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('chat_users')
      .select('id')
      .eq('username', username)
      .limit(1);

    if (error) {
      throw new Error('خطا در بررسی نام کاربری');
    }

    return data.length === 0;
  },

  async changePassword(sessionToken: string, currentPassword: string, newPassword: string): Promise<void> {
    const userIdFromSession = await getUserFromSession(sessionToken);
    if (!userIdFromSession) {
      throw new Error('نشست نامعتبر است');
    }

    // Get current user with password hash
    const { data: userData, error: userError } = await supabase
      .from('chat_users')
      .select('password_hash')
      .eq('id', userIdFromSession)
      .single();

    if (userError || !userData) {
      throw new Error('کاربر پیدا نشد');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password_hash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const { error: updateError } = await supabase
      .from('chat_users')
      .update({ password_hash: hashedNewPassword })
      .eq('id', userIdFromSession);

    if (updateError) {
      throw new Error('خطا در تغییر رمز عبور');
    }
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
      
      // Fetch support conversations for this user
      const { data: conversations, error } = await supabase
        .from('support_conversations')
        .select(`
          id,
          user_id,
          status,
          priority,
          thread_type_id,
          created_at,
          last_message_at,
          tags,
          tag_list
        `)
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }

      // Get the latest message and unread count for each conversation
      const conversationsWithDetails = await Promise.all(
        (conversations || []).map(async (conv) => {
          // Get latest message
          const { data: latestMessage } = await supabase
            .from('messenger_messages')
            .select('message, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count (messages from support that user hasn't read)
          const { count: unreadCount } = await supabase
            .from('messenger_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('sender_id', 1) // Messages from support
            .eq('is_read', false); // Not read by user

          return {
            id: conv.id,
            type: 'support',
            name: 'پشتیبانی',
            avatar_url: null,
            last_message: latestMessage?.message || '',
            last_message_time: latestMessage?.created_at || conv.last_message_at,
            unread_count: unreadCount || 0,
            conversation_id: conv.id,
            user_id: conv.user_id,
            status: conv.status,
            priority: conv.priority
          };
        })
      );

      console.log(`Found ${conversationsWithDetails.length} conversations for user ${userId}`);
      return conversationsWithDetails;
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
  },

  // Extended registerWithPassword that takes an object with user details
  async registerWithPassword(userData: {
    name: string;
    phone: string;
    countryCode: string;
    password: string;
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    isBoundlessStudent?: boolean;
  }): Promise<AuthResult> {
    try {
      const { name, phone, countryCode, password, email, username, firstName, lastName, isBoundlessStudent } = userData;
      
      // Check if user already exists
      const existingUser = await this.getUserByPhone(phone, countryCode);
      if (existingUser) {
        return { user: null, error: { message: 'کاربر با این شماره تلفن قبلاً ثبت نام کرده است' } };
      }

      // Hash the password before storing
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      const { data: newUserData, error: insertError } = await supabase
        .from('chat_users')
        .insert([{ 
          phone: phone, 
          name: name,
          email: email,
          first_name: firstName,
          last_name: lastName,
          username: username,
          country_code: countryCode,
          password_hash: hashedPassword,
          bedoun_marz: isBoundlessStudent || false,
          is_approved: true 
        }])
        .select('*')
        .single();

      if (insertError) {
        console.error('Error creating new user:', insertError);
        return { user: null, error: insertError };
      }

      // Send user_created webhook
      try {
        console.log('📤 Sending user_created webhook for new user:', newUserData.name);
        await enhancedWebhookManager.sendUserCreated(newUserData);
        console.log('✅ User_created webhook sent successfully');
      } catch (webhookError) {
        console.error('⚠️ Failed to send user_created webhook:', webhookError);
        // Don't fail user registration due to webhook errors
      }

      const sessionToken = await this.createSession(newUserData.id);
      return { user: newUserData, error: null, session_token: sessionToken };
    } catch (error) {
      console.error('Registration error:', error);
      return { user: null, error: error };
    }
  },

};
