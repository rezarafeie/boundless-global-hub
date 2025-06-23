import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

export interface MessengerUser {
  id: number;
  name: string;
  phone: string;
  username?: string;
  role?: string;
  is_approved: boolean;
  is_messenger_admin: boolean;
  is_support_agent: boolean;
  bedoun_marz: boolean;
  bedoun_marz_approved: boolean;
  bedoun_marz_request: boolean;
  created_at: string;
  updated_at: string;
  last_seen: string;
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

export interface AdminSettings {
  manual_approval_enabled: boolean;
  updated_at: string;
}

class MessengerService {
  private static instance: MessengerService;
  
  static getInstance(): MessengerService {
    if (!MessengerService.instance) {
      MessengerService.instance = new MessengerService();
    }
    return MessengerService.instance;
  }

  async getAdminSettings(): Promise<AdminSettings> {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data || { manual_approval_enabled: false, updated_at: new Date().toISOString() };
  }

  async updateAdminSettings(settings: Partial<AdminSettings>): Promise<void> {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({
        id: 1,
        ...settings,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
  }

  async register(userData: {
    name: string;
    phone: string;
    username?: string;
    password: string;
  }): Promise<{ token: string; user: MessengerUser }> {
    // Check admin settings for approval requirement
    const settings = await this.getAdminSettings();
    
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const { data: user, error } = await supabase
      .from('chat_users')
      .insert({
        name: userData.name,
        phone: userData.phone,
        username: userData.username,
        password_hash: hashedPassword,
        is_approved: !settings.manual_approval_enabled, // Auto-approve if manual approval is disabled
        role: 'user'
      })
      .select()
      .single();

    if (error) throw error;

    const token = this.generateToken();
    
    await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: token,
        is_active: true
      });

    return { token, user };
  }

  async login(loginData: {
    identifier: string;
    password: string;
  }): Promise<{ token: string; user: MessengerUser }> {
    const { data: user, error } = await supabase
      .from('chat_users')
      .select('*')
      .or(`phone.eq.${loginData.identifier},username.eq.${loginData.identifier}`)
      .single();

    if (error || !user) {
      throw new Error('کاربر یافت نشد');
    }

    if (!user.password_hash) {
      throw new Error('رمز عبور تنظیم نشده است');
    }

    const isValidPassword = await bcrypt.compare(loginData.password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('رمز عبور اشتباه است');
    }

    const token = this.generateToken();
    
    await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: token,
        is_active: true
      });

    return { token, user };
  }

  async validateSession(token: string): Promise<{ user: MessengerUser; valid: boolean } | null> {
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select(`
        user_id,
        is_active,
        last_activity,
        chat_users (*)
      `)
      .eq('session_token', token)
      .eq('is_active', true)
      .single();

    if (error || !session) return null;

    const user = session.chat_users as any;
    return { user, valid: true };
  }

  async deactivateSession(token: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('session_token', token);

    if (error) throw error;
  }

  async getRooms(token: string): Promise<ChatRoom[]> {
    const { data: session } = await supabase
      .from('user_sessions')
      .select('user_id')
      .eq('session_token', token)
      .single();
  
    if (!session) {
      throw new Error('Session not found');
    }
  
    const userId = session.user_id;
  
    const { data, error } = await supabase
      .from('chat_rooms')
      .select(`*,
        chat_messages(count),
        last_message:chat_messages(created_at, message, sender_id)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
  
    if (error) {
      throw error;
    }
  
    const rooms = data.map(room => {
      const lastMessage = room.last_message && room.last_message.length > 0 ? room.last_message[0] : null;
      return {
        id: room.id,
        name: room.name,
        description: room.description,
        type: room.type,
        is_active: room.is_active,
        is_boundless_only: room.is_boundless_only,
        created_at: room.created_at,
        updated_at: room.updated_at,
        last_message: lastMessage ? lastMessage.message : null,
        last_message_time: lastMessage ? lastMessage.created_at : null,
        unread_count: 0,
      };
    });
  
    return rooms;
  }

  async getRoom(roomId: number): Promise<ChatRoom | null> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) throw error;
    return data || null;
  }

  async getMessages(roomId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`*, sender:chat_users(name, phone)`)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async sendMessage(roomId: number, senderId: number, message: string): Promise<any> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_id: senderId,
        message: message
      })
      .select(`*, sender:chat_users(name, phone)`)
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserDetails(userId: number, updates: {
    name?: string;
    phone?: string;
    username?: string;
    password?: string;
  }): Promise<void> {
    const updateData: any = {};
    
    if (updates.name) updateData.name = updates.name;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.username) updateData.username = updates.username;
    if (updates.password) {
      updateData.password_hash = await bcrypt.hash(updates.password, 10);
    }

    const { error } = await supabase
      .from('chat_users')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;
  }

  async updateUserRole(userId: number, roleUpdates: {
    is_approved?: boolean;
    is_support_agent?: boolean;
    is_messenger_admin?: boolean;
    bedoun_marz_approved?: boolean;
  }): Promise<void> {
    const { error } = await supabase
      .from('chat_users')
      .update(roleUpdates)
      .eq('id', userId);

    if (error) throw error;
  }

  async getAllUsers(): Promise<MessengerUser[]> {
    const { data, error } = await supabase
      .from('chat_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getAllMessages(): Promise<any[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`*, sender:chat_users(name, phone)`)
      .order('created_at', { ascending: false })

    if (error) throw error;
    return data || [];
  }

  async deleteMessage(messageId: number): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  }

  async getTopics(): Promise<any[]> {
    const { data, error } = await supabase
      .from('chat_topics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createTopic(topicData: { title: string; description: string; is_active: boolean }): Promise<any> {
    const { data, error } = await supabase
      .from('chat_topics')
      .insert(topicData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTopic(topicId: number, updates: Partial<{ title: string; description: string; is_active: boolean }>): Promise<void> {
    const { error } = await supabase
      .from('chat_topics')
      .update(updates)
      .eq('id', topicId);

    if (error) throw error;
  }

  async deleteTopic(topicId: number): Promise<void> {
    const { error } = await supabase
      .from('chat_topics')
      .delete()
      .eq('id', topicId);

    if (error) throw error;
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

export const messengerService = MessengerService.getInstance();
