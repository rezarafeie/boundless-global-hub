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
  description: string;
  type: string;
  is_active: boolean;
  is_boundless_only: boolean;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  is_support_room?: boolean;
  support_room_id?: number;
}

export interface MessengerMessage {
  id: number;
  message: string;
  sender_id: number;
  recipient_id?: number;
  room_id?: number;
  conversation_id?: number;
  created_at: string;
  is_read: boolean;
  message_type?: string;
  reply_to_message_id?: number;
  sender?: {
    name: string;
    phone: string;
  };
}

export interface SupportThreadType {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  is_boundless_only: boolean;
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
  }): Promise<{ session_token: string; user: MessengerUser }> {
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

    const session_token = this.generateToken();
    
    await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: session_token,
        is_active: true
      });

    return { session_token, user };
  }

  async registerWithPassword(userData: {
    name: string;
    phone: string;
    username?: string;
    password: string;
    isBoundlessStudent?: boolean;
  }): Promise<{ session_token: string; user: MessengerUser }> {
    const settings = await this.getAdminSettings();
    
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const { data: user, error } = await supabase
      .from('chat_users')
      .insert({
        name: userData.name,
        phone: userData.phone,
        username: userData.username,
        password_hash: hashedPassword,
        is_approved: !settings.manual_approval_enabled,
        bedoun_marz: userData.isBoundlessStudent || false,
        role: 'user'
      })
      .select()
      .single();

    if (error) throw error;

    const session_token = this.generateToken();
    
    await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: session_token,
        is_active: true
      });

    return { session_token, user };
  }

  async getUserByPhone(phone: string): Promise<MessengerUser | null> {
    const { data, error } = await supabase
      .from('chat_users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async authenticateUser(phone: string, password: string): Promise<{ session_token: string; user: MessengerUser }> {
    const { data: user, error } = await supabase
      .from('chat_users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !user) {
      throw new Error('کاربر یافت نشد');
    }

    if (!user.password_hash) {
      throw new Error('رمز عبور تنظیم نشده است');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('رمز عبور اشتباه است');
    }

    const session_token = this.generateToken();
    
    await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: session_token,
        is_active: true
      });

    return { session_token, user };
  }

  async createSession(userId: number): Promise<{ session_token: string }> {
    const session_token = this.generateToken();
    
    const { error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_token: session_token,
        is_active: true
      });

    if (error) throw error;

    return { session_token };
  }

  async login(loginData: {
    identifier: string;
    password: string;
  }): Promise<{ session_token: string; user: MessengerUser }> {
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

    const session_token = this.generateToken();
    
    await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: session_token,
        is_active: true
      });

    return { session_token, user };
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

    // Get user details to check permissions
    const { data: user } = await supabase
      .from('chat_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }
  
    // Get regular chat rooms
    const { data: chatRooms, error: chatError } = await supabase
      .from('chat_rooms')
      .select(`*`)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
  
    if (chatError) {
      throw chatError;
    }

    // Get support rooms that user has access to
    const { data: supportRooms, error: supportError } = await supabase
      .rpc('get_user_support_rooms', { user_id_param: userId });

    if (supportError) {
      console.error('Error fetching support rooms:', supportError);
    }
  
    const rooms: ChatRoom[] = [];

    // Add regular chat rooms
    if (chatRooms) {
      rooms.push(...chatRooms.map(room => ({
        id: room.id,
        name: room.name,
        description: room.description || '',
        type: room.type,
        is_active: room.is_active,
        is_boundless_only: room.is_boundless_only,
        created_at: room.created_at,
        updated_at: room.updated_at,
        last_message: null,
        last_message_time: null,
        unread_count: 0,
        is_support_room: false,
      })));
    }

    // Add support rooms as chat rooms
    if (supportRooms) {
      supportRooms.forEach(supportRoom => {
        rooms.push({
          id: -supportRoom.id, // Use negative ID to distinguish from regular rooms
          name: supportRoom.name,
          description: supportRoom.description || '',
          type: 'support',
          is_active: true,
          is_boundless_only: supportRoom.thread_type_id === 2, // Boundless support
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_message: null,
          last_message_time: null,
          unread_count: 0,
          is_support_room: true,
          support_room_id: supportRoom.id,
        });
      });
    }
  
    return rooms;
  }

  async getRoom(roomId: number): Promise<ChatRoom | null> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) throw error;
    
    return data ? {
      ...data,
      description: data.description || ''
    } : null;
  }

  async getMessages(roomId: number): Promise<MessengerMessage[]> {
    const { data, error } = await supabase
      .from('messenger_messages')
      .select(`
        *,
        sender:chat_users!sender_id(name, phone)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(message => ({
      ...message,
      sender: message.sender || { name: 'Unknown', phone: '' }
    }));
  }

  async getPrivateMessages(conversationId: number): Promise<MessengerMessage[]> {
    const { data, error } = await supabase
      .from('private_messages')
      .select(`
        *,
        sender:chat_users!sender_id(name, phone)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(message => ({
      ...message,
      sender: message.sender || { name: 'Unknown', phone: '' }
    }));
  }

  async sendMessage(roomId: number, senderId: number, message: string): Promise<MessengerMessage> {
    const { data, error } = await supabase
      .from('messenger_messages')
      .insert({
        room_id: roomId,
        sender_id: senderId,
        message: message
      })
      .select(`
        *,
        sender:chat_users!sender_id(name, phone)
      `)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      sender: data.sender || { name: 'Unknown', phone: '' }
    };
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

  async getApprovedUsers(): Promise<MessengerUser[]> {
    const { data, error } = await supabase
      .from('chat_users')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getAllMessages(): Promise<MessengerMessage[]> {
    const { data, error } = await supabase
      .from('messenger_messages')
      .select(`
        *,
        sender:chat_users!sender_id(name, phone)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(message => ({
      ...message,
      sender: message.sender || { name: 'Unknown', phone: '' }
    }));
  }

  async deleteMessage(messageId: number): Promise<void> {
    const { error } = await supabase
      .from('messenger_messages')
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

  async createRoom(roomData: { name: string; description?: string; type: string; is_boundless_only?: boolean }): Promise<ChatRoom> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({
        ...roomData,
        description: roomData.description || ''
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      description: data.description || ''
    };
  }

  async updateRoom(roomId: number, updates: Partial<ChatRoom>): Promise<void> {
    const { error } = await supabase
      .from('chat_rooms')
      .update(updates)
      .eq('id', roomId);

    if (error) throw error;
  }

  async deleteRoom(roomId: number): Promise<void> {
    const { error } = await supabase
      .from('chat_rooms')
      .delete()
      .eq('id', roomId);

    if (error) throw error;
  }

  async getThreadTypes(): Promise<SupportThreadType[]> {
    const { data, error } = await supabase
      .from('support_thread_types')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  async getSupportAgentAssignments(): Promise<SupportAgentAssignment[]> {
    const { data, error } = await supabase
      .from('support_agent_assignments')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  async assignSupportAgent(agentId: number, threadTypeId: number): Promise<void> {
    const { error } = await supabase
      .from('support_agent_assignments')
      .insert({
        agent_id: agentId,
        thread_type_id: threadTypeId,
        is_active: true
      });

    if (error) throw error;
  }

  async unassignSupportAgent(agentId: number, threadTypeId: number): Promise<void> {
    const { error } = await supabase
      .from('support_agent_assignments')
      .update({ is_active: false })
      .eq('agent_id', agentId)
      .eq('thread_type_id', threadTypeId);

    if (error) throw error;
  }

  async addReaction(messageId: number, userId: number, reaction: string): Promise<void> {
    const { error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: userId,
        reaction: reaction
      });

    if (error) throw error;
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

export const messengerService = MessengerService.getInstance();
