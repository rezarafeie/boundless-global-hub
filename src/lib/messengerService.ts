import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

export interface MessengerUser {
  id: number;
  name: string;
  phone: string;
  username?: string;
  avatar_url?: string;
  is_approved: boolean;
  is_messenger_admin: boolean;
  is_support_agent: boolean;
  bedoun_marz: boolean;
  bedoun_marz_approved: boolean;
  bedoun_marz_request: boolean;
  created_at: string;
  updated_at: string;
  last_seen: string;
  role: 'user' | 'admin' | 'support';
  email?: string | null;
  user_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  country_code?: string | null;
  signup_source?: string | null;
  bio?: string | null;
  notification_enabled: boolean;
  notification_token?: string | null;
  password_hash?: string | null;
}

export interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  type: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  is_super_group?: boolean;
  is_boundless_only?: boolean;
}

export interface MessageData {
  id: number;
  sender_id: number;
  message: string;
  room_id?: number;
  recipient_id?: number;
  conversation_id?: number;
  topic_id?: number;
  created_at: string;
  media_url?: string;
  message_type?: string;
  media_content?: string;
  reply_to_message_id?: number;
  forwarded_from_message_id?: number;
  is_read?: boolean;
  sender?: MessengerUser;
}

export interface CreateRoomData {
  name: string;
  description?: string;
  type: string;
}

export interface RegistrationData {
  name: string;
  phone: string;
  countryCode: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginResult {
  user?: MessengerUser;
  session_token?: string;
  error?: any;
}

class MessengerService {
  async getUserByPhone(phone: string): Promise<MessengerUser | null> {
    try {
      console.log('Looking up user by phone:', phone);
      
      // First try to find a user with email (prioritize users with email)
      const { data: userWithEmail, error: emailError } = await supabase
        .from('chat_users')
        .select('*')
        .eq('phone', phone)
        .not('email', 'is', null)
        .single();

      if (!emailError && userWithEmail) {
        console.log('Found user with email:', userWithEmail.email);
        return this.mapUserData(userWithEmail);
      }

      // If no user with email found, look for any user with this phone
      const { data: anyUser, error: anyError } = await supabase
        .from('chat_users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (anyError && anyError.code !== 'PGRST116') {
        console.error('Error finding user by phone:', anyError);
        return null;
      }

      if (anyUser) {
        console.log('Found user without email preference');
        return this.mapUserData(anyUser);
      }

      console.log('No user found with phone:', phone);
      return null;
    } catch (error) {
      console.error('Error in getUserByPhone:', error);
      return null;
    }
  }

  async loginWithPassword(phone: string, password: string): Promise<LoginResult> {
    try {
      console.log('Attempting login for phone:', phone);
      
      const user = await this.getUserByPhone(phone);
      if (!user) {
        console.log('User not found for phone:', phone);
        return { error: { message: 'کاربری با این شماره تلفن یافت نشد' } };
      }

      if (!user.password_hash) {
        console.log('User has no password hash');
        return { error: { message: 'رمز عبور تنظیم نشده است' } };
      }

      console.log('Comparing passwords...');
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        console.log('Invalid password for user:', user.id);
        return { error: { message: 'رمز عبور اشتباه است' } };
      }

      console.log('Password valid, creating session...');
      const sessionToken = await this.createSession(user.id);
      
      return {
        user,
        session_token: sessionToken
      };
    } catch (error) {
      console.error('Error in loginWithPassword:', error);
      return { error: { message: 'خطا در ورود' } };
    }
  }

  async registerWithPassword(data: RegistrationData): Promise<LoginResult> {
    try {
      console.log('Attempting registration for phone:', data.phone);
      
      // Check if user already exists
      const existingUser = await this.getUserByPhone(data.phone);
      if (existingUser) {
        return { error: { message: 'کاربری با این شماره تلفن قبلاً ثبت‌نام کرده است' } };
      }

      // Check if email is already used (if provided)
      if (data.email) {
        const emailExists = await this.isEmailUsed(data.email);
        if (emailExists) {
          return { error: { message: 'ایمیل قبلاً استفاده شده است' } };
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Create user with email set to NULL if not provided
      const { data: newUser, error } = await supabase
        .from('chat_users')
        .insert({
          name: data.name,
          phone: data.phone,
          country_code: data.countryCode,
          password_hash: passwordHash,
          email: data.email || null,
          first_name: data.firstName || null,
          last_name: data.lastName || null,
          full_name: data.name,
          is_approved: true,
          role: 'user',
          signup_source: 'messenger'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return { error };
      }

      const user = this.mapUserData(newUser);
      const sessionToken = await this.createSession(user.id);

      return {
        user,
        session_token: sessionToken
      };
    } catch (error) {
      console.error('Error in registerWithPassword:', error);
      return { error: { message: 'خطا در ثبت‌نام' } };
    }
  }

  async isEmailUsed(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('id')
        .eq('email', email)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Error checking email usage:', error);
      return false;
    }
  }

  async updateUserDetails(userId: number, updates: Partial<{ email: string; username: string; name: string }>): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_users')
        .update(updates)
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

  private mapUserData(userData: any): MessengerUser {
    return {
      id: userData.id,
      name: userData.name,
      phone: userData.phone,
      username: userData.username,
      avatar_url: userData.avatar_url,
      is_approved: userData.is_approved || false,
      is_messenger_admin: userData.is_messenger_admin || false,
      is_support_agent: userData.is_support_agent || false,
      bedoun_marz: userData.bedoun_marz || false,
      bedoun_marz_approved: userData.bedoun_marz_approved || false,
      bedoun_marz_request: userData.bedoun_marz_request || false,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
      last_seen: userData.last_seen,
      role: userData.role || 'user',
      email: userData.email || null,
      user_id: userData.user_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      full_name: userData.full_name,
      country_code: userData.country_code,
      signup_source: userData.signup_source,
      bio: userData.bio,
      notification_enabled: userData.notification_enabled !== false,
      notification_token: userData.notification_token,
      password_hash: userData.password_hash
    };
  }

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

      if (error) {
        console.error('Error creating session:', error);
        throw error;
      }

      return sessionToken;
    } catch (error) {
      console.error('Error in createSession:', error);
      throw error;
    }
  }

  async validateSession(sessionToken: string): Promise<MessengerUser | null> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          user_id,
          is_active,
          last_activity,
          chat_users (*)
        `)
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (error || !data || !data.chat_users) {
        return null;
      }

      // Check if session is still valid (within 24 hours)
      const lastActivity = new Date(data.last_activity);
      const now = new Date();
      const timeDiff = now.getTime() - lastActivity.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);

      if (hoursDiff > 24) {
        // Session expired
        await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('session_token', sessionToken);
        return null;
      }

      // Update last activity
      await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('session_token', sessionToken);

      return this.mapUserData(data.chat_users);
    } catch (error) {
      console.error('Error validating session:', error);
      return null;
    }
  }

  async getRooms(): Promise<ChatRoom[]> {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rooms:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRooms:', error);
      return [];
    }
  }

  async createRoom(roomData: CreateRoomData): Promise<ChatRoom> {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: roomData.name,
          description: roomData.description,
          type: roomData.type,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating room:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createRoom:', error);
      throw error;
    }
  }

  async sendMessage(messageData: {
    sender_id: number;
    message: string;
    room_id?: number;
    recipient_id?: number;
    conversation_id?: number;
    topic_id?: number;
    media_url?: string;
    message_type?: string;
    reply_to_message_id?: number;
  }): Promise<MessageData> {
    try {
      const { data, error } = await supabase
        .from('messenger_messages')
        .insert({
          sender_id: messageData.sender_id,
          message: messageData.message,
          room_id: messageData.room_id,
          recipient_id: messageData.recipient_id,
          conversation_id: messageData.conversation_id,
          topic_id: messageData.topic_id,
          media_url: messageData.media_url,
          message_type: messageData.message_type || 'text',
          reply_to_message_id: messageData.reply_to_message_id
        })
        .select()
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

  async getMessages(roomId?: number, topicId?: number, limit: number = 50): Promise<MessageData[]> {
    try {
      let query = supabase
        .from('messenger_messages')
        .select(`
          *,
          sender:chat_users!messenger_messages_sender_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (roomId) {
        query = query.eq('room_id', roomId);
      }

      if (topicId) {
        query = query.eq('topic_id', topicId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return (data || []).reverse();
    } catch (error) {
      console.error('Error in getMessages:', error);
      return [];
    }
  }

  async getOrCreateChatUser(email: string): Promise<MessengerUser> {
    try {
      // First check if user exists by email
      const { data: existingUser, error: fetchError } = await supabase
        .from('chat_users')
        .select('*')
        .eq('email', email)
        .single();

      if (existingUser && !fetchError) {
        return this.mapUserData(existingUser);
      }

      // Create new user if not found
      const { data: newUser, error: createError } = await supabase
        .from('chat_users')
        .insert({
          name: email.split('@')[0],
          email: email,
          phone: '',
          is_approved: true,
          role: 'user',
          signup_source: 'unified_auth'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating chat user:', createError);
        throw createError;
      }

      return this.mapUserData(newUser);
    } catch (error) {
      console.error('Error in getOrCreateChatUser:', error);
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
}

export const messengerService = new MessengerService();
