import { supabase } from '@/integrations/supabase/client';

export interface PrivateConversation {
  id: number;
  user1_id: number;
  user2_id: number;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  other_user: {
    id: number;
    name: string;
    username?: string;
    avatar_url?: string;
    phone: string;
  };
  last_message?: {
    id: number;
    message: string;
    sender_id: number;
    created_at: string;
    media_url?: string;
  };
  unread_count: number;
}

export interface PrivateMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  message: string;
  media_url?: string;
  message_type?: string;
  media_content?: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    id: number;
    name: string;
    phone: string;
    avatar_url?: string;
  };
}

export const privateMessageService = {
  async getUserConversations(userId: number, sessionToken: string): Promise<PrivateConversation[]> {
    try {
      // Set session context
      await supabase.rpc('set_session_context', { session_token: sessionToken });
      
      const { data, error } = await supabase
        .from('private_conversations')
        .select(`
          id,
          user1_id,
          user2_id,
          created_at,
          updated_at,
          last_message_at,
          user1:chat_users!private_conversations_user1_id_fkey (
            id,
            name,
            username,
            avatar_url,
            phone
          ),
          user2:chat_users!private_conversations_user2_id_fkey (
            id,
            name,
            username,
            avatar_url,
            phone
          )
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const conversations: PrivateConversation[] = [];
      
      for (const conv of data || []) {
        const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1;
        
        // Get last message
        const { data: lastMessage } = await supabase
          .from('private_messages')
          .select('id, message, sender_id, created_at, media_url')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('private_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('sender_id', userId);

        conversations.push({
          id: conv.id,
          user1_id: conv.user1_id,
          user2_id: conv.user2_id,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          last_message_at: conv.last_message_at,
          other_user: otherUser,
          last_message: lastMessage?.[0],
          unread_count: unreadCount || 0
        });
      }

      return conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  async getOrCreateConversation(userId1: number, userId2: number, sessionToken: string): Promise<number> {
    try {
      // Set session context
      await supabase.rpc('set_session_context', { session_token: sessionToken });
      
      const { data, error } = await supabase
        .rpc('get_or_create_private_conversation', {
          p_user1_id: userId1,
          p_user2_id: userId2
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting or creating conversation:', error);
      throw error;
    }
  },

  async sendMessage(
    senderId: number, 
    recipientId: number, 
    message: string, 
    sessionToken: string,
    mediaUrl?: string,
    mediaType?: string,
    mediaContent?: string
  ): Promise<PrivateMessage> {
    try {
      // Set session context
      await supabase.rpc('set_session_context', { session_token: sessionToken });
      
      // Get or create conversation
      const conversationId = await this.getOrCreateConversation(senderId, recipientId, sessionToken);
      
      const { data, error } = await supabase
        .from('private_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          message,
          media_url: mediaUrl,
          message_type: mediaType,
          media_content: mediaContent
        })
        .select()
        .single();

      if (error) throw error;
      
      // Webhook is now handled by database trigger automatically
      
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  async getConversationMessages(conversationId: number, sessionToken: string): Promise<PrivateMessage[]> {
    try {
      // Set session context
      await supabase.rpc('set_session_context', { session_token: sessionToken });
      
      const { data, error } = await supabase
        .from('private_messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          message,
          media_url,
          message_type,
          media_content,
          created_at,
          is_read,
          sender:chat_users!private_messages_sender_id_fkey (
            id,
            name,
            phone,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
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
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  async exactSearch(query: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .or(`username.ilike.${query},phone.ilike.${query}`)
        .eq('is_approved', true)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in exact search:', error);
      throw error;
    }
  },

  async checkUsernameAvailability(username: string, currentUserId?: number): Promise<boolean> {
    try {
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
    } catch (error) {
      console.error('Error checking username availability:', error);
      throw error;
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

  async searchUsers(searchTerm: string): Promise<any[]> {
    try {
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
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },

  async getSupportConversations(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('support_conversations')
        .select(`
          *,
          chat_users!support_conversations_user_id_fkey (
            id,
            name,
            phone,
            avatar_url
          )
        `)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching support conversations:', error);
      throw error;
    }
  }
};
