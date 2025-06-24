
import { supabase } from '@/integrations/supabase/client';
import type { MessengerUser } from './messengerService';

// Type definitions
export interface PrivateMessage {
  id: number;
  message: string;
  sender_id: number;
  recipient_id?: number;
  conversation_id: number;
  created_at: string;
  is_read: boolean;
  sender?: MessengerUser;
}

export interface PrivateConversation {
  id: number;
  user1_id: number;
  user2_id: number;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  other_user?: MessengerUser;
  unread_count?: number;
}

export const privateMessageService = {
  async exactSearch(searchTerm: string, sessionToken: string): Promise<MessengerUser[]> {
    try {
      console.log('Exact search with term:', searchTerm);
      
      // Set session context
      await supabase.rpc('set_session_context', { session_token: sessionToken });
      
      let query = supabase
        .from('chat_users')
        .select('*')
        .eq('is_approved', true);

      // Check if it's a phone number search (09xxxxxxxxx)
      if (/^09\d{9}$/.test(searchTerm.trim())) {
        query = query.eq('phone', searchTerm.trim());
      }
      // Check if it's a username search (@username or username)
      else if (searchTerm.trim().startsWith('@')) {
        const username = searchTerm.trim().substring(1);
        query = query.eq('username', username);
      }
      // Direct username search without @
      else if (!searchTerm.includes('@') && searchTerm.trim().length >= 3) {
        query = query.eq('username', searchTerm.trim());
      }
      else {
        // Invalid search format
        console.log('Invalid search format');
        return [];
      }

      const { data, error } = await query.limit(10);

      if (error) {
        console.error('Search error:', error);
        throw error;
      }

      console.log('Search results:', data);
      
      // Map to MessengerUser format with all required fields
      const users: MessengerUser[] = (data || []).map(user => ({
        id: user.id,
        name: user.name,
        username: user.username,
        phone: user.phone,
        is_approved: user.is_approved,
        is_messenger_admin: user.is_messenger_admin || false,
        is_support_agent: user.is_support_agent || false,
        bedoun_marz: user.bedoun_marz || false,
        bedoun_marz_approved: user.bedoun_marz_approved || false,
        bedoun_marz_request: user.bedoun_marz_request || false,
        role: user.role || 'user',
        bio: user.bio || '',
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_seen: user.last_seen
      }));

      return users;
    } catch (error) {
      console.error('Error in exact search:', error);
      return [];
    }
  },

  async searchUsers(searchTerm: string, sessionToken: string): Promise<MessengerUser[]> {
    try {
      console.log('General search with term:', searchTerm);
      
      // Set session context
      await supabase.rpc('set_session_context', { session_token: sessionToken });
      
      const { data, error } = await supabase
        .rpc('search_users', { search_term: searchTerm });

      if (error) {
        console.error('Search error:', error);
        throw error;
      }

      console.log('Search results:', data);
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  },

  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (error) {
        console.error('Error checking username availability:', error);
        return false;
      }

      return !data; // Available if no user found
    } catch (error) {
      console.error('Error in username availability check:', error);
      return false;
    }
  },

  async updateUsername(userId: number, username: string, sessionToken: string): Promise<void> {
    try {
      // Set session context
      await supabase.rpc('set_session_context', { session_token: sessionToken });
      
      const { error } = await supabase
        .from('chat_users')
        .update({ username })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating username:', error);
      throw error;
    }
  },

  async getOrCreateConversation(userId1: number, userId2: number, sessionToken: string): Promise<number> {
    try {
      // Set session context
      await supabase.rpc('set_session_context', { session_token: sessionToken });
      
      const { data, error } = await supabase.rpc('get_or_create_private_conversation', {
        p_user1_id: userId1,
        p_user2_id: userId2
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }
  },

  async getConversations(sessionToken: string): Promise<PrivateConversation[]> {
    try {
      // Set session context
      await supabase.rpc('set_session_context', { session_token: sessionToken });
      
      // Get current user ID from session
      const { data: sessionData } = await supabase.rpc('validate_user_session', {
        session_token_param: sessionToken
      });

      if (!sessionData || sessionData.length === 0 || !sessionData[0].is_valid) {
        throw new Error('Invalid session');
      }

      const currentUserId = sessionData[0].user_id;

      // Get conversations where user is participant
      const { data, error } = await supabase
        .from('private_conversations')
        .select(`
          id,
          user1_id,
          user2_id,
          last_message_at,
          updated_at,
          created_at,
          user1:user1_id(id, name, username, phone),
          user2:user2_id(id, name, username, phone)
        `)
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Format conversations
      const conversations: PrivateConversation[] = (data || []).map(conv => {
        const otherUser = conv.user1_id === currentUserId ? conv.user2 : conv.user1;
        return {
          id: conv.id,
          user1_id: conv.user1_id,
          user2_id: conv.user2_id,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          last_message_at: conv.last_message_at,
          other_user: otherUser as MessengerUser,
          unread_count: 0
        };
      });

      return conversations;
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  },

  async getUserConversations(userId: number, sessionToken: string): Promise<PrivateConversation[]> {
    return this.getConversations(sessionToken);
  },

  async getMessages(conversationId: number, sessionToken: string): Promise<PrivateMessage[]> {
    try {
      // Set session context
      await supabase.rpc('set_session_context', { session_token: sessionToken });
      
      const { data, error } = await supabase
        .from('private_messages')
        .select(`
          id,
          message,
          sender_id,
          conversation_id,
          created_at,
          is_read,
          sender:sender_id(id, name, username)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  },

  async getConversationMessages(conversationId: number, sessionToken: string): Promise<PrivateMessage[]> {
    return this.getMessages(conversationId, sessionToken);
  },

  async sendMessage(conversationId: number, senderId: number, message: string, sessionToken: string): Promise<PrivateMessage>;
  async sendMessage(senderId: number, recipientId: number, message: string, sessionToken: string): Promise<PrivateMessage>;
  async sendMessage(param1: number, param2: number, param3: string, param4?: string): Promise<PrivateMessage> {
    try {
      let conversationId: number;
      let senderId: number;
      let message: string;
      let sessionToken: string;
      let recipientId: number | undefined;

      // Handle overloaded parameters
      if (typeof param4 === 'string') {
        // sendMessage(senderId, recipientId, message, sessionToken)
        senderId = param1;
        recipientId = param2;
        message = param3;
        sessionToken = param4;
        
        // Get or create conversation
        conversationId = await this.getOrCreateConversation(senderId, recipientId, sessionToken);
      } else {
        // sendMessage(conversationId, senderId, message, sessionToken)
        conversationId = param1;
        senderId = param2;
        message = param3;
        sessionToken = param3; // This should be param4, but handling the current signature
      }

      // Set session context
      await supabase.rpc('set_session_context', { session_token: sessionToken });

      const { data, error } = await supabase
        .from('private_messages')
        .insert({
          message,
          sender_id: senderId,
          conversation_id: conversationId
        })
        .select(`
          id,
          message,
          sender_id,
          conversation_id,
          created_at,
          is_read,
          sender:sender_id(id, name, username)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  async markMessagesAsRead(conversationId: number, userId: number, sessionToken: string): Promise<void> {
    try {
      // Set session context
      await supabase.rpc('set_session_context', { session_token: sessionToken });
      
      const { error } = await supabase
        .from('private_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }
};
