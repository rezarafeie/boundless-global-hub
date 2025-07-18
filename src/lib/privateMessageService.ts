import { supabase } from '@/integrations/supabase/client';
import { type MessengerUser } from './messengerService';

export interface PrivateMessage {
  id: number;
  created_at: string;
  conversation_id: number;
  sender_id: number;
  message: string;
  is_read: boolean;
}

export interface PrivateConversation {
  id: number;
  created_at: string;
  user1_id: number;
  user2_id: number;
  last_message_at: string;
  other_user?: MessengerUser;
  last_message?: PrivateMessage;
  unread_count?: number;
}

export const privateMessageService = {
  async getConversation(conversationId: number): Promise<PrivateConversation | null> {
    try {
      const { data, error } = await supabase
        .from('private_conversations')
        .select(`
          *,
          other_user:chat_users!private_conversations_user2_id_fkey (*)
        `)
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error fetching conversation:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }
  },

  async getUserConversations(userId: number, sessionToken: string): Promise<PrivateConversation[]> {
    try {
      const { data, error } = await supabase
        .from('private_conversations')
        .select(`
          *,
          user1:chat_users!private_conversations_user1_id_fkey (*),
          user2:chat_users!private_conversations_user2_id_fkey (*)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      // Process conversations to get the "other user" and add message details
      const conversationsWithDetails = await Promise.all(
        data.map(async (conversation: any) => {
          // Determine the other user (not the current user)
          const otherUser = conversation.user1_id === userId ? conversation.user2 : conversation.user1;
          
          const lastMessage = await this.getLastMessage(conversation.id);
          const unreadCount = await this.getUnreadMessagesCount(conversation.id, userId);
          
          return {
            ...conversation,
            other_user: otherUser,
            last_message: lastMessage,
            unread_count: unreadCount,
          };
        })
      );

      return conversationsWithDetails;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  },

  async getUnreadMessagesCount(conversationId: number, userId: number): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('private_messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread messages count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error fetching unread messages count:', error);
      return 0;
    }
  },

  async getLastMessage(conversationId: number): Promise<PrivateMessage | null> {
    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching last message:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error fetching last message:', error);
      return null;
    }
  },

  async getMessages(conversationId: number): Promise<PrivateMessage[]> {
    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  async sendMessage(conversationId: number, senderId: number, message: string): Promise<PrivateMessage | null> {
    try {
      const { data, error } = await supabase
        .from('private_messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: senderId,
          message: message,
          is_read: false
        }])
        .select('*')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return null;
      }

      // Update last_message_at in private_conversations table
      await supabase
        .from('private_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  },

  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('private_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId);

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  },

  async createConversation(user1Id: number, user2Id: number): Promise<PrivateConversation | null> {
    try {
      // Ensure consistent ordering (smaller ID first)
      const smallerId = Math.min(user1Id, user2Id);
      const largerId = Math.max(user1Id, user2Id);
      
      const { data, error } = await supabase
        .from('private_conversations')
        .insert([{
          user1_id: smallerId,
          user2_id: largerId,
          last_message_at: new Date().toISOString()
        }])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
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

  async updateUsername(userId: number, username: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_users')
        .update({ username: username })
        .eq('id', userId);

      if (error) {
        console.error('Error updating username:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating username:', error);
      throw error;
    }
  },

  async searchUsers(searchTerm: string): Promise<MessengerUser[]> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .limit(10);

      if (error) {
        console.error('Search error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  },

  async exactSearch(searchTerm: string): Promise<MessengerUser[]> {
    try {
      console.log('Exact search for:', searchTerm);
      
      let query = supabase
        .from('chat_users')
        .select('*')
        .eq('is_approved', true);

      // Check if it's a phone number
      if (/^09\d{9}$/.test(searchTerm)) {
        query = query.eq('phone', searchTerm);
      } else {
        // Username search
        query = query.eq('username', searchTerm);
      }

      const { data, error } = await query.limit(10);

      if (error) {
        console.error('Search error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in exact search:', error);
      return [];
    }
  },

  async getSupportConversations(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .or('username.eq.support,username.eq.boundless_support');

      if (error) {
        console.error('Error fetching support users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching support users:', error);
      return [];
    }
  },

  async getOrCreateConversation(user1Id: number, user2Id: number): Promise<number> {
    try {
      // First, check if conversation already exists
      const { data: existingConversation, error } = await supabase
        .from('private_conversations')
        .select('id')
        .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
        .single();

      if (existingConversation) {
        return existingConversation.id;
      }

      // If no existing conversation, create one
      const conversation = await this.createConversation(user1Id, user2Id);
      return conversation?.id || 0;
    } catch (error) {
      console.error('Error getting or creating conversation:', error);
      // If single() fails, try to create new conversation
      const conversation = await this.createConversation(user1Id, user2Id);
      return conversation?.id || 0;
    }
  },

  async getConversationMessages(conversationId: number): Promise<PrivateMessage[]> {
    return this.getMessages(conversationId);
  },

  async markConversationAsRead(conversationId: number, userId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('private_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  }
};
