import { supabase } from '@/integrations/supabase/client';
import { normalizePhone, generatePhoneSearchFormats } from '@/utils/phoneUtils';
import type { ChatRoom, MessengerUser, MessengerMessage, ChatTopic, AdminSettings } from '@/types/supabase';

// Export the types for external use
export type { ChatRoom, MessengerUser, MessengerMessage, ChatTopic, AdminSettings };

class MessengerService {
  async validateSession(sessionToken: string): Promise<any | null> {
    try {
      // Use user_sessions table instead
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error validating session:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Check if session is expired (24 hours)
      const lastActivity = new Date(data.last_activity);
      const now = new Date();
      const timeDiff = now.getTime() - lastActivity.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);

      if (hoursDiff > 24) {
        console.log('Session expired');
        return null;
      }

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('chat_users')
        .select('*')
        .eq('id', data.user_id)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user data:', userError);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        sessionToken: data.session_token,
        lastActivity: data.last_activity,
        user: userData
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
        return existingUser as MessengerUser;
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
        .select('*')
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
      
      // Fetch sender data separately for each unique sender
      const messages = data || [];
      const senderIds = [...new Set(messages.map(msg => msg.sender_id))];
      const senders = new Map<number, MessengerUser>();
      
      for (const senderId of senderIds) {
        const { data: senderData } = await supabase
          .from('chat_users')
          .select('*')
          .eq('id', senderId)
          .single();
          
        if (senderData) {
          senders.set(senderId, senderData as MessengerUser);
        }
      }

      return messages.map(msg => ({
        ...msg,
        sender: senders.get(msg.sender_id) || {
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
      })) as MessengerMessage[];
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
        .select('*')
        .or(`sender_id.eq.${userId},conversation_id.eq.${userId}`)
        .eq('recipient_id', 1)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching support messages:', error);
        throw error;
      }

      console.log('✅ Fetched support messages:', data?.length || 0);
      
      // Fetch sender data separately for each unique sender
      const messages = data || [];
      const senderIds = [...new Set(messages.map(msg => msg.sender_id))];
      const senders = new Map<number, MessengerUser>();
      
      for (const senderId of senderIds) {
        const { data: senderData } = await supabase
          .from('chat_users')
          .select('*')
          .eq('id', senderId)
          .single();
          
        if (senderData) {
          senders.set(senderId, senderData as MessengerUser);
        }
      }

      return messages.map(msg => ({
        ...msg,
        sender: senders.get(msg.sender_id) || {
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
      })) as MessengerMessage[];
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

      // Ensure type field is properly typed
      return (data || []).map(room => ({
        ...room,
        type: room.type as 'group' | 'channel' | 'direct',
        is_public: room.is_public ?? false
      })) as ChatRoom[];
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
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all messages:', error);
        throw error;
      }

      return (data || []) as MessengerMessage[];
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

  // Admin Settings Methods
  async getAdminSettings(): Promise<AdminSettings> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching admin settings:', error);
        throw error;
      }

      return data as AdminSettings;
    } catch (error) {
      console.error('Error in getAdminSettings:', error);
      throw error;
    }
  }

  async updateAdminSettings(settings: Partial<AdminSettings>): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update(settings)
        .eq('id', 1);

      if (error) {
        console.error('Error updating admin settings:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateAdminSettings:', error);
      throw error;
    }
  }

  // Room Management Methods
  async updateRoom(roomId: number, updates: Partial<ChatRoom>): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update(updates)
        .eq('id', roomId);

      if (error) {
        console.error('Error updating room:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateRoom:', error);
      throw error;
    }
  }

  async deleteRoom(roomId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId);

      if (error) {
        console.error('Error deleting room:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteRoom:', error);
      throw error;
    }
  }

  // Topic Management Methods
  async getTopics(roomId?: number): Promise<ChatTopic[]> {
    try {
      let query = supabase
        .from('chat_topics')
        .select('*')
        .order('order_index', { ascending: true });

      if (roomId) {
        query = query.eq('room_id', roomId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching topics:', error);
        throw error;
      }

      return data as ChatTopic[];
    } catch (error) {
      console.error('Error in getTopics:', error);
      throw error;
    }
  }

  async createTopic(topicData: Omit<ChatTopic, 'id' | 'created_at' | 'updated_at'>): Promise<ChatTopic> {
    try {
      const { data, error } = await supabase
        .from('chat_topics')
        .insert([topicData])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating topic:', error);
        throw error;
      }

      return data as ChatTopic;
    } catch (error) {
      console.error('Error in createTopic:', error);
      throw error;
    }
  }

  async updateTopic(topicId: number, updates: Partial<ChatTopic>): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_topics')
        .update(updates)
        .eq('id', topicId);

      if (error) {
        console.error('Error updating topic:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateTopic:', error);
      throw error;
    }
  }

  async deleteTopic(topicId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_topics')
        .delete()
        .eq('id', topicId);

      if (error) {
        console.error('Error deleting topic:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteTopic:', error);
      throw error;
    }
  }

  // User Management Methods
  async getAllUsers(): Promise<MessengerUser[]> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all users:', error);
        throw error;
      }

      return data as MessengerUser[];
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  }

  async updateUser(userId: number, updates: Partial<MessengerUser>): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_users')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  }

  async updateUserRole(userId: number, updates: Partial<MessengerUser>): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_users')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      throw error;
    }
  }

  async getUserById(userId: number): Promise<MessengerUser | null> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user by ID:', error);
        return null;
      }

      return data as MessengerUser;
    } catch (error) {
      console.error('Error in getUserById:', error);
      return null;
    }
  }

  async getRoomById(roomId: number): Promise<ChatRoom | null> {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) {
        console.error('Error fetching room by ID:', error);
        return null;
      }

      return data as ChatRoom;
    } catch (error) {
      console.error('Error in getRoomById:', error);
      return null;
    }
  }

  // Enhanced phone-based authentication methods
  async getUserByPhone(phone: string): Promise<MessengerUser | null> {
    try {
      console.log('🔍 Searching for user with phone:', phone);
      
      // Generate all possible phone formats to search
      const searchFormats = generatePhoneSearchFormats(phone);
      console.log('📱 Searching phone formats:', searchFormats);

      // Try to find user with any of the phone formats
      for (const format of searchFormats) {
        const { data, error } = await supabase
          .from('chat_users')
          .select('*')
          .eq('phone', format)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error searching for phone format:', format, error);
          continue;
        }

        if (data) {
          console.log('✅ Found user with phone format:', format, 'User:', data.name);
          return data as MessengerUser;
        }
      }

      console.log('❌ No user found for any phone format');
      return null;
    } catch (error) {
      console.error('Error in getUserByPhone:', error);
      return null;
    }
  }

  async loginWithPassword(phone: string, password: string): Promise<{ success: boolean; user?: MessengerUser; error?: string; session_token?: string }> {
    try {
      console.log('🔐 Attempting login for phone:', phone);
      
      // Find user by phone using all possible formats
      const user = await this.getUserByPhone(phone);
      
      if (!user) {
        console.log('❌ User not found for phone:', phone);
        return { success: false, error: 'کاربر یافت نشد' };
      }

      console.log('✅ User found:', user.name, 'ID:', user.id);

      // In a real implementation, verify password hash here
      // For now, we'll just check if password is provided
      if (!password) {
        return { success: false, error: 'رمز عبور را وارد کنید' };
      }

      // Create session in database and get token
      const sessionToken = await this.createSession(user.id);
      
      // Store session in localStorage and cookies for persistence
      localStorage.setItem('messenger_session_token', sessionToken);
      localStorage.setItem('messenger_user', JSON.stringify(user));
      
      // Also set in cookies for cross-tab compatibility
      document.cookie = `messenger_session_token=${sessionToken}; path=/; max-age=${30 * 24 * 60 * 60}`; // 30 days
      document.cookie = `messenger_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${30 * 24 * 60 * 60}`;
      
      console.log('✅ Login successful, session saved to localStorage and cookies');
      return { success: true, user: user, session_token: sessionToken };
    } catch (error) {
      console.error('Error in loginWithPassword:', error);
      return { success: false, error: 'خطا در ورود' };
    }
  }

  async registerWithPassword(userData: Partial<MessengerUser> & { password: string }): Promise<{ success: boolean; user?: MessengerUser; error?: string; session_token?: string }> {
    try {
      console.log('📝 Registering user with data:', { ...userData, password: '[HIDDEN]' });
      
      const { password, ...userDataWithoutPassword } = userData;

      // Normalize phone number
      const normalized = normalizePhone(userDataWithoutPassword.phone || '', userDataWithoutPassword.country_code || '+98');
      
      // Check if user already exists
      const existingUser = await this.getUserByPhone(normalized.phone);
      if (existingUser) {
        return { success: false, error: 'این شماره قبلاً ثبت شده است' };
      }

      // Generate unique user ID
      const uniqueUserId = Math.random().toString(36).substring(2) + Date.now().toString(36);

      const { data, error } = await supabase
        .from('chat_users')
        .insert({
          name: userDataWithoutPassword.name || '',
          phone: normalized.phone,
          country_code: normalized.countryCode,
          password_hash: password,
          user_id: uniqueUserId,
          is_approved: true,
          email: userDataWithoutPassword.email,
          first_name: userDataWithoutPassword.first_name,
          last_name: userDataWithoutPassword.last_name,
          full_name: userDataWithoutPassword.full_name,
          role: 'user',
          is_messenger_admin: false,
          is_support_agent: false,
          bedoun_marz: false,
          bedoun_marz_approved: false,
          bedoun_marz_request: false,
          notification_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error registering user:', error);
        throw error;
      }

      // Create session
      const sessionToken = await this.createSession(data.id);
      
      // Store session in localStorage and cookies for persistence
      localStorage.setItem('messenger_session_token', sessionToken);
      localStorage.setItem('messenger_user', JSON.stringify(data));
      
      // Also set in cookies for cross-tab compatibility
      document.cookie = `messenger_session_token=${sessionToken}; path=/; max-age=${30 * 24 * 60 * 60}`; // 30 days
      document.cookie = `messenger_user=${encodeURIComponent(JSON.stringify(data))}; path=/; max-age=${30 * 24 * 60 * 60}`;

      console.log('✅ User registered successfully:', data.name, 'ID:', data.id);
      return { success: true, user: data as MessengerUser, session_token: sessionToken };
    } catch (error: any) {
      console.error('Error in registerWithPassword:', error);
      return { success: false, error: error.message || 'خطا در ثبت نام' };
    }
  }

  async createSession(userId: number): Promise<string> {
    try {
      // Generate session token
      const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      // Store session in user_sessions table for persistence
      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_token: sessionToken,
          is_active: true,
          last_activity: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing session in database:', error);
        // Continue anyway, session will be temporary
      } else {
        console.log('✅ Session stored in database successfully');
      }
      
      return sessionToken;
    } catch (error) {
      console.error('Error in createSession:', error);
      // Still return a token even if database storage fails
      return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
  }

  async isEmailUsed(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      return !error && !!data;
    } catch (error) {
      console.error('Error in isEmailUsed:', error);
      return false;
    }
  }

  async updateUserDetails(userId: number, details: Partial<MessengerUser>): Promise<void> {
    try {
      // If phone is being updated, normalize it
      if (details.phone) {
        const normalized = normalizePhone(details.phone, details.country_code || '+98');
        details.phone = normalized.phone;
        details.country_code = normalized.countryCode;
      }

      const { error } = await supabase
        .from('chat_users')
        .update(details)
        .eq('id', userId);

      if (error) {
        console.error('Error updating user details:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateUserDetails:', error);
      throw error;
    }
  }

  async logout(sessionToken: string): Promise<void> {
    try {
      // Implementation would depend on your session management
      console.log('Logging out session:', sessionToken);
    } catch (error) {
      console.error('Error in logout:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: number, updates: Partial<MessengerUser>): Promise<MessengerUser> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .update(updates)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }

      return data as MessengerUser;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  }

  async changePassword(userId: number, newPassword: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_users')
        .update({ password_hash: newPassword }) // In real implementation, hash this
        .eq('id', userId);

      if (error) {
        console.error('Error changing password:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in changePassword:', error);
      throw error;
    }
  }

  // Additional missing methods
  async mapUserData(userData: any): Promise<MessengerUser> {
    return userData as MessengerUser;
  }

  async deactivateSession(sessionToken: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken);

      if (error) {
        console.error('Error deactivating session:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deactivateSession:', error);
      throw error;
    }
  }

  async checkUsernameUniqueness(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      return error && error.message.includes('No rows found');
    } catch (error) {
      console.error('Error checking username uniqueness:', error);
      return false;
    }
  }
}

export const messengerService = new MessengerService();
export type { MessengerUser, MessengerMessage, ChatRoom, AdminSettings, ChatTopic };
