
import { supabase } from '@/integrations/supabase/client';

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

// Helper function to set session context for RLS
const setSessionContext = async (sessionToken: string) => {
  try {
    const { error } = await supabase.rpc('set_session_context', {
      session_token: sessionToken
    });
    if (error) {
      console.warn('Could not set session context:', error);
    }
  } catch (error) {
    console.warn('Error setting session context:', error);
  }
};

export const messengerService = {
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
  },

  async getApprovedUsers(): Promise<MessengerUser[]> {
    const { data, error } = await supabase
      .from('chat_users')
      .select('*')
      .eq('is_approved', true);
    
    if (error) throw error;
    return (data || []) as MessengerUser[];
  },

  async createSession(userId: number): Promise<UserSession> {
    const sessionToken = crypto.randomUUID();
    const { data, error } = await supabase
      .from('user_sessions')
      .insert([{ user_id: userId, session_token: sessionToken }])
      .select()
      .single();
    
    if (error) throw error;
    return data as UserSession;
  },

  async validateSession(sessionToken: string): Promise<{ user: MessengerUser; session: UserSession } | null> {
    // Set session context for RLS
    await setSessionContext(sessionToken);
    
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select(`
        *,
        chat_users(*)
      `)
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();
    
    if (sessionError || !sessionData) return null;
    
    // Update last activity
    await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('session_token', sessionToken);
    
    return {
      user: sessionData.chat_users as MessengerUser,
      session: sessionData as UserSession
    };
  },

  async deactivateSession(sessionToken: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('session_token', sessionToken);
    
    if (error) throw error;
  },

  // Chat rooms management
  async getRooms(sessionToken: string): Promise<ChatRoom[]> {
    // Set session context for RLS
    await setSessionContext(sessionToken);
    
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
    return (data || []) as ChatRoom[];
  },

  async getRoomMessages(roomId: number, sessionToken: string): Promise<MessengerMessage[]> {
    // Set session context for RLS
    await setSessionContext(sessionToken);
    
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
      throw error;
    }
    return (data || []) as MessengerMessage[];
  },

  async getPrivateMessages(userId: number, sessionToken: string): Promise<MessengerMessage[]> {
    // Set session context for RLS
    await setSessionContext(sessionToken);
    
    const { data, error } = await supabase
      .from('messenger_messages')
      .select(`
        *,
        sender:chat_users!sender_id(name)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .is('room_id', null)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching private messages:', error);
      throw error;
    }
    return (data || []) as MessengerMessage[];
  },

  async sendMessage(messageData: {
    room_id?: number;
    sender_id: number;
    recipient_id?: number;
    message: string;
    message_type?: string;
  }, sessionToken: string): Promise<MessengerMessage> {
    // Set session context for RLS
    await setSessionContext(sessionToken);
    
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
      throw error;
    }
    return data as MessengerMessage;
  },

  // Support agent functions
  async getSupportConversations(supportAgentId: number, sessionToken: string): Promise<any[]> {
    // Set session context for RLS
    await setSessionContext(sessionToken);
    
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
      throw error;
    }
    return data || [];
  }
};
