
import { supabase } from '@/integrations/supabase/client';
import { supportService } from './supportService';

export type MessengerUser = {
  id: number;
  name: string;
  phone: string;
  is_approved: boolean;
  bedoun_marz_approved: boolean;
  bedoun_marz_request: boolean;
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
};

export type UserSession = {
  id: string;
  user_id: number;
  session_token: string;
  is_active: boolean;
  last_activity: string;
  created_at: string;
};

// Helper function to validate session using the new database function
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

class MessengerService {
  // User authentication and session management
  async register(name: string, phone: string, isBoundlessStudent: boolean = false): Promise<MessengerUser> {
    const { data, error } = await supabase
      .from('chat_users')
      .insert([{ 
        name, 
        phone, 
        bedoun_marz_request: isBoundlessStudent,
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
    // Use the new validation function
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
    
    // Validate session first
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
    
    // Validate session first
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
    
    // Validate session first
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
    
    // Validate session first
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
    
    // Validate session first
    const isValid = await validateSessionToken(sessionToken);
    if (!isValid) {
      throw new Error('Invalid session. Please log in again.');
    }
    
    const { data, error } = await supabase
      .from('messenger_messages')
      .select(`
        *,
        sender:chat_users!sender_id(name)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching room messages:', error);
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }
    
    console.log('Successfully fetched messages:', data?.length || 0);
    return (data || []) as MessengerMessage[];
  }

  async getPrivateMessages(userId: number, sessionToken: string): Promise<MessengerMessage[]> {
    try {
      console.log('Getting private messages for user:', userId);
      
      // Get or create support conversation first with enhanced error handling
      const conversation = await supportService.getOrCreateUserConversation(userId, sessionToken);
      console.log('Got conversation:', conversation.id);
      
      // Get messages for this conversation
      const messages = await supportService.getConversationMessages(conversation.id);
      console.log('Got messages:', messages.length);
      
      // Convert to MessengerMessage format
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
        is_from_support: msg.is_from_support || false
      }));
    } catch (error) {
      console.error('Error fetching private messages:', error);
      // Provide a more user-friendly error message
      if (error instanceof Error && error.message.includes('authentication')) {
        throw new Error('Session expired. Please log in again.');
      }
      throw error;
    }
  }

  async sendMessage(messageData: {
    room_id?: number;
    sender_id: number;
    recipient_id?: number;
    message: string;
    message_type?: string;
  }, sessionToken: string): Promise<MessengerMessage> {
    console.log('Sending message:', messageData);
    
    // Validate session first
    const isValid = await validateSessionToken(sessionToken);
    if (!isValid) {
      throw new Error('Invalid session. Please log in again.');
    }
    
    // Enhanced session context setup for support messages
    if (messageData.recipient_id === 1 && !messageData.room_id) {
      console.log('Setting up session context for support message');
      try {
        const { error } = await supabase.rpc('set_session_context', { 
          session_token: sessionToken 
        });
        if (error) {
          console.error('Failed to set session context:', error);
        }
      } catch (error) {
        console.error('Error setting session context:', error);
      }
    }
    
    const { data, error } = await supabase
      .from('messenger_messages')
      .insert([{
        room_id: messageData.room_id || null,
        sender_id: messageData.sender_id,
        recipient_id: messageData.recipient_id || null,
        message: messageData.message,
        message_type: messageData.message_type || 'text'
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error sending message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
    
    console.log('Message sent successfully:', data);
    return data as MessengerMessage;
  }

  // Support agent functions
  async getSupportConversations(supportAgentId: number, sessionToken: string): Promise<any[]> {
    console.log('Fetching support conversations for agent:', supportAgentId);
    
    // Validate session first
    const isValid = await validateSessionToken(sessionToken);
    if (!isValid) {
      throw new Error('Invalid session. Please log in again.');
    }
    
    const { data, error } = await supabase
      .from('messenger_messages')
      .select(`
        *,
        sender:chat_users!sender_id(name),
        recipient:chat_users!recipient_id(name)
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
