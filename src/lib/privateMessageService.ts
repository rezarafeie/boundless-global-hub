import { supabase } from '@/integrations/supabase/client';
import type { MessengerUser } from './messengerService';

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
      return data || [];
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

  async getConversations(sessionToken: string): Promise<any[]> {
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
          user1:user1_id(id, name, username, phone),
          user2:user2_id(id, name, username, phone),
          last_message:private_messages(content, created_at, sender_id)
        `)
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Format conversations
      const conversations = (data || []).map(conv => {
        const otherUser = conv.user1_id === currentUserId ? conv.user2 : conv.user1;
        return {
          id: conv.id,
          otherUser,
          lastMessage: conv.last_message?.[0],
          lastMessageAt: conv.last_message_at,
          updatedAt: conv.updated_at
        };
      });

      return conversations;
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  },

  async getMessages(conversationId: number, sessionToken: string): Promise<any[]> {
    try {
      // Set session context
      await supabase.rpc('set_session_context', { session_token: sessionToken });
      
      const { data, error } = await supabase
        .from('private_messages')
        .select(`
          id,
          content,
          sender_id,
          recipient_id,
          conversation_id,
          created_at,
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

  async sendMessage(content: string, recipientId: number, conversationId: number, sessionToken: string): Promise<any> {
    try {
      // Set session context
      await supabase.rpc('set_session_context', { session_token: sessionToken });
      
      // Get current user from session
      const { data: sessionData } = await supabase.rpc('validate_user_session', {
        session_token_param: sessionToken
      });

      if (!sessionData || sessionData.length === 0 || !sessionData[0].is_valid) {
        throw new Error('Invalid session');
      }

      const senderId = sessionData[0].user_id;

      const { data, error } = await supabase
        .from('private_messages')
        .insert({
          content,
          sender_id: senderId,
          recipient_id: recipientId,
          conversation_id: conversationId
        })
        .select(`
          id,
          content,
          sender_id,
          recipient_id,
          conversation_id,
          created_at,
          sender:sender_id(id, name, username)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
};
