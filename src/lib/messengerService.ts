
import { supabase } from '@/integrations/supabase/client';
import { supportService } from './supportService';

export type MessengerUser = {
  id: number;
  name: string;
  phone: string;
  is_approved: boolean;
  bedoun_marz_approved: boolean;
  bedoun_marz_request: boolean;
  bedoun_marz: boolean;
  is_support_agent: boolean;
  role: string;
  created_at: string;
  updated_at: string;
  last_seen: string;
};

export type ChatRoom = {
  id: number;
  name: string;
  type: string;
  description: string;
  is_boundless_only: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MessengerMessage = {
  id: number;
  room_id: number | null;
  sender_id: number;
  recipient_id: number | null;
  message: string;
  message_type: string;
  media_url: string | null;
  media_content: string | null;
  is_read: boolean;
  created_at: string;
  reply_to_message_id?: number | null;
  forwarded_from_message_id?: number | null;
};

export type UserSession = {
  id: string;
  user_id: number;
  session_token: string;
  is_active: boolean;
  last_activity: string;
  created_at: string;
};

// Enhanced session validation function
const validateSessionToken = async (sessionToken: string): Promise<boolean> => {
  try {
    console.log('Validating session token:', sessionToken.substring(0, 8) + '...');
    
    const { data, error } = await supabase.rpc('is_session_valid', {
      session_token_param: sessionToken
    });
    
    if (error) {
      console.error('Session validation error:', error);
      return false;
    }
    
    console.log('Session validation result:', data);
    return data === true;
  } catch (error) {
    console.error('Failed to validate session:', error);
    return false;
  }
};

// Simplified session context function - no longer critical
const setSessionContextOptional = async (sessionToken: string): Promise<void> => {
  try {
    console.log('Setting optional session context');
    
    const { error } = await supabase.rpc('set_session_context', { 
      session_token: sessionToken 
    });
    
    if (error) {
      console.warn('Optional session context failed (non-critical):', error);
    } else {
      console.log('Optional session context set successfully');
    }
  } catch (error) {
    console.warn('Optional session context error (non-critical):', error);
  }
};

class MessengerService {
  // User authentication and session management
  async register(name: string, phone: string, isBoundlessStudent: boolean = false): Promise<MessengerUser> {
    const { data, error } = await supabase
      .from('chat_users')
      .insert([{ 
        name, 
        phone, 
        bedoun_marz_request: isBoundlessStudent,
        bedoun_marz: isBoundlessStudent,
        is_approved: false,
        bedoun_marz_approved: false
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as MessengerUser;
  }

  async getApprovedUsers(): Promise<MessengerUser[]> {
    const { data, error } = await supabase
      .from('chat_users')
      .select('*')
      .eq('is_approved', true);
    
    if (error) throw error;
    return (data || []) as MessengerUser[];
  }

  async createSession(userId: number): Promise<UserSession> {
    const sessionToken = crypto.randomUUID();
    const { data, error } = await supabase
      .from('user_sessions')
      .insert([{ user_id: userId, session_token: sessionToken }])
      .select()
      .single();
    
    if (error) throw error;
    return data as UserSession;
  }

  async validateSession(sessionToken: string): Promise<{ user: MessengerUser; session: UserSession } | null> {
    const isValid = await validateSessionToken(sessionToken);
    if (!isValid) {
      console.error('Session validation failed');
      return null;
    }
    
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select(`
        *,
        chat_users(*)
      `)
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();
    
    if (sessionError || !sessionData) {
      console.error('Session data fetch failed:', sessionError);
      return null;
    }
    
    // Update last activity
    await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('session_token', sessionToken);
    
    return {
      user: sessionData.chat_users as MessengerUser,
      session: sessionData as UserSession
    };
  }

  async deactivateSession(sessionToken: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('session_token', sessionToken);
    
    if (error) throw error;
  }

  // Chat rooms management - simplified without session context
  async getRooms(sessionToken: string): Promise<ChatRoom[]> {
    console.log('Fetching rooms with session token:', sessionToken.substring(0, 8) + '...');
    
    const isValid = await validateSessionToken(sessionToken);
    if (!isValid) {
      throw new Error('Invalid session. Please log in again.');
    }
    
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error fetching rooms:', error);
      throw new Error(`Failed to fetch rooms: ${error.message}`);
    }
    
    console.log('Successfully fetched rooms:', data?.length || 0);
    return (data || []) as ChatRoom[];
  }

  async createRoom(roomData: {
    name: string;
    type: string;
    description: string;
    is_boundless_only?: boolean;
  }, sessionToken: string): Promise<ChatRoom> {
    console.log('Creating room:', roomData);
    
    const isValid = await validateSessionToken(sessionToken);
    if (!isValid) {
      throw new Error('Invalid session. Please log in again.');
    }
    
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert([{
        name: roomData.name,
        type: roomData.type,
        description: roomData.description,
        is_boundless_only: roomData.is_boundless_only || false,
        is_active: true
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating room:', error);
      throw new Error(`Failed to create room: ${error.message}`);
    }
    
    console.log('Room created successfully:', data);
    return data as ChatRoom;
  }

  async updateRoom(roomId: number, updates: Partial<ChatRoom>, sessionToken: string): Promise<ChatRoom> {
    console.log('Updating room:', roomId, updates);
    
    const isValid = await validateSessionToken(sessionToken);
    if (!isValid) {
      throw new Error('Invalid session. Please log in again.');
    }
    
    const { data, error } = await supabase
      .from('chat_rooms')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating room:', error);
      throw new Error(`Failed to update room: ${error.message}`);
    }
    
    console.log('Room updated successfully:', data);
    return data as ChatRoom;
  }

  async deleteRoom(roomId: number, sessionToken: string): Promise<void> {
    console.log('Deleting room:', roomId);
    
    const isValid = await validateSessionToken(sessionToken);
    if (!isValid) {
      throw new Error('Invalid session. Please log in again.');
    }
    
    const { error } = await supabase
      .from('chat_rooms')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', roomId);
    
    if (error) {
      console.error('Error deleting room:', error);
      throw new Error(`Failed to delete room: ${error.message}`);
    }
    
    console.log('Room deleted successfully');
  }

  async getRoomMessages(roomId: number, sessionToken: string): Promise<MessengerMessage[]> {
    console.log('Fetching messages for room:', roomId);
    
    const isValid = await validateSessionToken(sessionToken);
    if (!isValid) {
      throw new Error('Invalid session. Please log in again.');
    }
    
    const { data, error } = await supabase
      .from('messenger_messages')
      .select(`
        *,
        sender:chat_users!fk_messenger_messages_sender(name),
        reactions:message_reactions(*)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching room messages:', error);
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }
    
    console.log('Successfully fetched messages:', data?.length || 0);
    return (data || []).map(msg => ({
      ...msg,
      sender_name: msg.sender?.name || 'کاربر',
      reactions: msg.reactions || []
    })) as MessengerMessage[];
  }

  async getPrivateMessages(userId: number, sessionToken: string): Promise<MessengerMessage[]> {
    try {
      console.log('Getting private messages for user:', userId);
      
      const conversation = await supportService.getOrCreateUserConversation(userId, sessionToken);
      console.log('Got conversation:', conversation.id);
      
      if (conversation.id === -1) {
        console.log('Placeholder conversation, returning empty messages');
        return [];
      }
      
      const messages = await supportService.getConversationMessages(conversation.id);
      console.log('Got messages:', messages.length);
      
      return messages.map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id || 0,
        recipient_id: msg.recipient_id || null,
        room_id: null,
        message: msg.message,
        message_type: (msg.message_type as 'text' | 'image' | 'file') || 'text',
        media_url: msg.media_url,
        media_content: null,
        is_read: msg.is_read || false,
        created_at: msg.created_at || new Date().toISOString(),
        sender_name: msg.sender_name,
        is_from_support: msg.is_from_support || false,
        reply_to_message_id: null,
        forwarded_from_message_id: null,
        reactions: []
      }));
    } catch (error) {
      console.error('Error fetching private messages:', error);
      if (error instanceof Error && error.message.includes('authentication')) {
        throw new Error('Session expired. Please log in again.');
      }
      throw error;
    }
  }

  // Enhanced sendMessage method with reply and forward support
  async sendMessage(messageData: {
    room_id?: number;
    sender_id: number;
    recipient_id?: number;
    message: string;
    message_type?: string;
    reply_to_message_id?: number;
    forwarded_from_message_id?: number;
  }, sessionToken: string): Promise<MessengerMessage> {
    console.log('Sending message:', messageData);
    
    // Validate session first
    const isValid = await validateSessionToken(sessionToken);
    if (!isValid) {
      throw new Error('Invalid session. Please log in again.');
    }
    
    try {
      // For support messages, set optional session context
      if (messageData.recipient_id === 1 && !messageData.room_id) {
        console.log('Support message detected - setting optional session context');
        await setSessionContextOptional(sessionToken);
      }
      
      const { data, error } = await supabase
        .from('messenger_messages')
        .insert([{
          room_id: messageData.room_id || null,
          sender_id: messageData.sender_id,
          recipient_id: messageData.recipient_id || null,
          message: messageData.message,
          message_type: messageData.message_type || 'text',
          reply_to_message_id: messageData.reply_to_message_id || null,
          forwarded_from_message_id: messageData.forwarded_from_message_id || null
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Message send error:', error);
        throw new Error(`Failed to send message: ${error.message}`);
      }
      
      console.log('Message sent successfully:', data);
      return data as MessengerMessage;
      
    } catch (error) {
      console.error('Message send error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('permission denied') || errorMessage.includes('row-level security')) {
        throw new Error('Permission denied. Please refresh the page and try again.');
      }
      if (errorMessage.includes('violates foreign key constraint')) {
        throw new Error('Invalid recipient or room. Please refresh the page.');
      }
      
      throw new Error(`Failed to send message: ${errorMessage}`);
    }
  }

  // Add reaction to message
  async addReaction(messageId: number, reaction: string, sessionToken: string): Promise<void> {
    console.log('Adding reaction:', reaction, 'to message:', messageId);
    
    const isValid = await validateSessionToken(sessionToken);
    if (!isValid) {
      throw new Error('Invalid session. Please log in again.');
    }

    // Get user ID from session
    const { data: sessionData } = await supabase
      .from('user_sessions')
      .select('user_id')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();

    if (!sessionData?.user_id) {
      throw new Error('User not found in session');
    }

    // Set session context for RLS
    await setSessionContextOptional(sessionToken);

    const { error } = await supabase
      .from('message_reactions')
      .insert([{
        message_id: messageId,
        user_id: sessionData.user_id,
        reaction: reaction
      }]);

    if (error) {
      // If it's a duplicate, try to remove it instead
      if (error.code === '23505') {
        await this.removeReaction(messageId, reaction, sessionToken);
      } else {
        console.error('Error adding reaction:', error);
        throw new Error(`Failed to add reaction: ${error.message}`);
      }
    }
  }

  // Remove reaction from message
  async removeReaction(messageId: number, reaction: string, sessionToken: string): Promise<void> {
    console.log('Removing reaction:', reaction, 'from message:', messageId);
    
    const isValid = await validateSessionToken(sessionToken);
    if (!isValid) {
      throw new Error('Invalid session. Please log in again.');
    }

    // Get user ID from session
    const { data: sessionData } = await supabase
      .from('user_sessions')
      .select('user_id')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();

    if (!sessionData?.user_id) {
      throw new Error('User not found in session');
    }

    // Set session context for RLS
    await setSessionContextOptional(sessionToken);

    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', sessionData.user_id)
      .eq('reaction', reaction);

    if (error) {
      console.error('Error removing reaction:', error);
      throw new Error(`Failed to remove reaction: ${error.message}`);
    }
  }

  // Add method for updating user boundless status
  async updateUserBoundlessStatus(userId: number, isBoundless: boolean): Promise<MessengerUser> {
    const { data, error } = await supabase
      .from('chat_users')
      .update({
        bedoun_marz: isBoundless,
        bedoun_marz_approved: isBoundless,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as MessengerUser;
  }

  // Support agent functions
  async getSupportConversations(supportAgentId: number, sessionToken: string): Promise<any[]> {
    console.log('Fetching support conversations for agent:', supportAgentId);
    
    const isValid = await validateSessionToken(sessionToken);
    if (!isValid) {
      throw new Error('Invalid session. Please log in again.');
    }
    
    const { data, error } = await supabase
      .from('messenger_messages')
      .select(`
        *,
        sender:chat_users!fk_messenger_messages_sender(name),
        recipient:chat_users!fk_messenger_messages_recipient(name)
      `)
      .or(`sender_id.eq.${supportAgentId},recipient_id.eq.${supportAgentId}`)
      .is('room_id', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching support conversations:', error);
      throw new Error(`Failed to fetch support conversations: ${error.message}`);
    }
    
    return data || [];
  }

  // Update user role (support agent status)
  async updateUserRole(userId: number, updates: { is_support_agent: boolean }): Promise<MessengerUser> {
    const { data, error } = await supabase
      .from('chat_users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as MessengerUser;
  }

  // Get support agents
  async getSupportAgents(): Promise<MessengerUser[]> {
    const { data, error } = await supabase
      .from('chat_users')
      .select('*')
      .eq('is_support_agent', true)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as MessengerUser[];
  }
}

export const messengerService = new MessengerService();
