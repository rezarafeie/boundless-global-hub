
import { supabase } from '@/integrations/supabase/client';

export interface MessengerUser {
  id: string;
  name: string;
  phone: string;
  username?: string;
  is_approved: boolean;
  created_at: string;
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
        .from('messenger_users')
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
        .from('messenger_users')
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

      // Create new user
      const { data: userData, error: userError } = await supabase
        .from('messenger_users')
        .insert({
          name: name.trim(),
          phone: phone.trim(),
          password_hash: password, // In production, this should be hashed
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
      const { data: userData, error } = await supabase
        .from('messenger_users')
        .select('*')
        .eq('phone', phone)
        .eq('password_hash', password)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!userData) {
        return null;
      }

      if (!userData.is_approved) {
        throw new Error('حساب شما هنوز تایید نشده است');
      }

      const sessionResult = await this.createSession(userData.id);
      
      return {
        user: userData,
        session_token: sessionResult.session_token
      };
    } catch (error: any) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  async createSession(userId: string): Promise<SessionData> {
    try {
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      const { data, error } = await supabase
        .from('messenger_sessions')
        .insert({
          user_id: userId,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async validateSession(sessionToken: string): Promise<MessengerUser | null> {
    try {
      const { data, error } = await supabase
        .from('messenger_sessions')
        .select(`
          *,
          messenger_users (*)
        `)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data || !data.messenger_users) {
        return null;
      }

      return data.messenger_users as MessengerUser;
    } catch (error) {
      console.error('Error validating session:', error);
      return null;
    }
  }

  async logout(sessionToken: string): Promise<void> {
    try {
      await supabase
        .from('messenger_sessions')
        .delete()
        .eq('session_token', sessionToken);
    } catch (error) {
      console.error('Error logging out:', error);
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
