import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

export interface MessengerUser {
  id: number;
  name: string;
  phone: string;
  email?: string;
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
  bio?: string;
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
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const { data: user, error } = await supabase
      .from('chat_users')
      .insert({
        name: userData.name,
        phone: userData.phone,
        username: userData.username,
        password_hash: hashedPassword,
        is_approved: true, // Always auto-approve
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
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const { data: user, error } = await supabase
      .from('chat_users')
      .insert({
        name: userData.name,
        phone: userData.phone,
        username: userData.username,
        password_hash: hashedPassword,
        is_approved: true, // Always auto-approve
        bedoun_marz: userData.isBoundlessStudent || false,
        role: 'user',
        country_code: userData.phone.substring(0, userData.phone.length - 10) // Extract country code
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
      // User exists but no password set, update with new password
      const hashedPassword = await bcrypt.hash(password, 10);
      const { error: updateError } = await supabase
        .from('chat_users')
        .update({ password_hash: hashedPassword })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      // Update user object
      user.password_hash = hashedPassword;
    } else {
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('رمز عبور اشتباه است');
      }
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

  async getRooms(sessionToken: string): Promise<ChatRoom[]> {
    const { data: session } = await supabase
      .from('user_sessions')
      .select('user_id')
      .eq('session_token', sessionToken)
      .single();
  
    if (!session) {
      throw new Error('Session not found');
    }

    // Get user details to check permissions
    const { data: user } = await supabase
      .from('chat_users')
      .select('*')
      .eq('id', session.user_id)
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
      })));
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
        chat_users!messenger_messages_sender_id_fkey(name, phone)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(message => ({
      ...message,
      sender: message.chat_users || { name: 'Unknown', phone: '' }
    }));
  }

  async getPrivateMessages(conversationId: number): Promise<MessengerMessage[]> {
    const { data, error } = await supabase
      .from('private_messages')
      .select(`
        *,
        chat_users!private_messages_sender_id_fkey(name, phone)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(message => ({
      ...message,
      sender: message.chat_users || { name: 'Unknown', phone: '' }
    }));
  }

  async sendMessage(roomId: number, senderId: number, message: string): Promise<MessengerMessage> {
    // Send webhook first
    try {
      const { webhookService } = await import('@/lib/webhookService');
      const sender = await this.getUserById(senderId);
      const room = await this.getRoomById(roomId);
      
      if (sender) {
        await webhookService.sendMessageWebhook({
          messageContent: message,
          senderName: sender.name,
          senderPhone: sender.phone || '',
          senderEmail: sender.email || '',
          chatType: 'group',
          chatName: room?.name || 'Unknown Room',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error sending webhook:', error);
    }

    const { data, error } = await supabase
      .from('messenger_messages')
      .insert({
        room_id: roomId,
        sender_id: senderId,
        message: message
      })
      .select(`
        *,
        chat_users!messenger_messages_sender_id_fkey(name, phone)
      `)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      sender: data.chat_users || { name: 'Unknown', phone: '' }
    };
  }

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
      console.error('Error getting user by ID:', error);
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

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting room by ID:', error);
      return null;
    }
  }

  async sendPrivateMessage(senderId: number, recipientId: number, message: string): Promise<MessengerMessage> {
    const conversationId = await this.getOrCreatePrivateConversation(senderId, recipientId);
    
    const { data, error } = await supabase
      .from('private_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        message: message
      })
      .select(`
        *,
        chat_users!private_messages_sender_id_fkey(name, phone)
      `)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      sender: data.chat_users || { name: 'Unknown', phone: '' }
    };
  }

  async getOrCreatePrivateConversation(user1Id: number, user2Id: number): Promise<number> {
    const { data } = await supabase
      .rpc('get_or_create_private_conversation', {
        p_user1_id: user1Id,
        p_user2_id: user2Id
      });

    return data;
  }

  async getPrivateConversations(userId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('private_conversations')
      .select(`
        *,
        user1:chat_users!user1_id(id, name, phone, username),
        user2:chat_users!user2_id(id, name, phone, username)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(conv => ({
      ...conv,
      otherUser: conv.user1_id === userId ? conv.user2 : conv.user1
    }));
  }

  async updateUserDetails(userId: number, updates: {
    name?: string;
    phone?: string;
    username?: string;
    password?: string;
    bio?: string;
  }): Promise<void> {
    const updateData: any = {};
    
    if (updates.name) updateData.name = updates.name;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.username) updateData.username = updates.username;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.password) {
      updateData.password_hash = await bcrypt.hash(updates.password, 10);
    }

    const { error } = await supabase
      .from('chat_users')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;
  }

  async checkUsernameAvailability(username: string, currentUserId?: number): Promise<boolean> {
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
        id,
        message,
        sender_id,
        recipient_id,
        room_id,
        conversation_id,
        created_at,
        is_read,
        message_type,
        reply_to_message_id,
        chat_users!messenger_messages_sender_id_fkey(name, phone)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(message => ({
      ...message,
      sender: message.chat_users || { name: 'Unknown', phone: '' }
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

  async createRoom(roomData: {
    name: string;
    type: string;
    description?: string;
    is_boundless_only?: boolean;
    is_active?: boolean;
  }): Promise<ChatRoom> {
    try {
      // Ensure rooms are active by default
      const roomToCreate = {
        ...roomData,
        is_active: roomData.is_active !== false // Default to true unless explicitly set to false
      };
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert([roomToCreate])
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

  async searchUsers(searchTerm: string): Promise<MessengerUser[]> {
    const cleanTerm = searchTerm.trim();
    
    if (!cleanTerm) {
      return [];
    }

    let query = supabase
      .from('chat_users')
      .select('*')
      .eq('is_approved', true);

    if (/^09\d{9}$/.test(cleanTerm)) {
      query = query.eq('phone', cleanTerm);
    } 
    else if (cleanTerm.startsWith('@')) {
      const username = cleanTerm.substring(1);
      query = query.eq('username', username);
    }
    else {
      query = query.eq('username', cleanTerm.toLowerCase());
    }

    const { data, error } = await query.limit(10);

    if (error) throw error;
    return data || [];
  }

  async getSupportUsers(currentUser: MessengerUser): Promise<MessengerUser[]> {
    console.log('Getting support users for:', currentUser);
    
    const supportUsers: MessengerUser[] = [];
    
    try {
      const { data: academySupport, error: academyError } = await supabase
        .from('chat_users')
        .select('*')
        .eq('id', 999997)
        .maybeSingle();
      
      if (academyError) {
        console.error('Error fetching academy support:', academyError);
      } else if (academySupport) {
        console.log('Found academy support:', academySupport);
        supportUsers.push(academySupport);
      }

      if (currentUser.bedoun_marz || currentUser.bedoun_marz_approved) {
        const { data: boundlessSupport, error: boundlessError } = await supabase
          .from('chat_users')
          .select('*')
          .eq('id', 999998)
          .maybeSingle();
        
        if (boundlessError) {
          console.error('Error fetching boundless support:', boundlessError);
        } else if (boundlessSupport) {
          console.log('Found boundless support:', boundlessSupport);
          supportUsers.push(boundlessSupport);
        }
      }
    } catch (error) {
      console.error('Error in getSupportUsers:', error);
    }

    console.log('Returning support users:', supportUsers);
    return supportUsers;
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

  async updateUserProfile(userId: number, profileData: {
    name?: string;
    username?: string | null;
    bio?: string | null;
  }, sessionToken: string): Promise<MessengerUser> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  }

  async searchUsersByUsername(username: string): Promise<MessengerUser[]> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('username', username.toLowerCase())
        .eq('is_approved', true);

      if (error) {
        console.error('Error searching users by username:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchUsersByUsername:', error);
      throw error;
    }
  }

  async updateUser(userId: number, userData: any): Promise<MessengerUser> {
    try {
      const updateData: any = { ...userData };
      
      if (userData.password && userData.password.trim()) {
        updateData.password_hash = await bcrypt.hash(userData.password, 10);
        delete updateData.password;
      }

      const { data, error } = await supabase
        .from('chat_users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

export const messengerService = new MessengerService();
