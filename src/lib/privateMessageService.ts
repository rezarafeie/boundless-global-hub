import { supabase } from '@/integrations/supabase/client';
import type { MessengerUser } from '@/lib/messengerService';

export interface PrivateConversation {
  id: number;
  user1_id: number;
  user2_id: number;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  other_user?: MessengerUser;
  last_message?: string;
  unread_count?: number;
}

export interface PrivateMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  message: string;
  message_type: string;
  media_url?: string;
  media_content?: string;
  is_read: boolean;
  created_at: string;
  reply_to_message_id?: number;
  forwarded_from_message_id?: number;
  sender?: MessengerUser;
}

class PrivateMessageService {
  async searchUsers(searchTerm: string, sessionToken: string): Promise<MessengerUser[]> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('is_approved', true)
        .or(`username.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .order('name');

      if (error) {
        console.error('Error searching users:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchUsers:', error);
      throw error;
    }
  }

  async exactSearch(searchTerm: string, sessionToken: string): Promise<MessengerUser[]> {
    try {
      let query = supabase
        .from('chat_users')
        .select('*')
        .eq('is_approved', true);

      // Check if it's a phone number (exact match)
      if (/^09\d{9}$/.test(searchTerm)) {
        query = query.eq('phone', searchTerm);
      } 
      // Check if it's a username (exact match)
      else {
        query = query.eq('username', searchTerm.toLowerCase());
      }

      const { data, error } = await query.limit(1);

      if (error) {
        console.error('Error in exact search:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in exactSearch:', error);
      throw error;
    }
  }

  async getOrCreateConversation(userId: number, otherUserId: number, sessionToken: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_or_create_private_conversation', {
        p_user1_id: userId,
        p_user2_id: otherUserId
      });

      if (error) {
        console.error('Error getting/creating conversation:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      throw error;
    }
  }

  async getUserConversations(userId: number, sessionToken: string): Promise<PrivateConversation[]> {
    try {
      const { data: conversations, error } = await supabase
        .from('private_conversations')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }

      // Enrich with other user data and last message
      const enrichedConversations = await Promise.all(
        (conversations || []).map(async (conv) => {
          const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
          
          // Get other user details
          const { data: otherUser } = await supabase
            .from('chat_users')
            .select('*')
            .eq('id', otherUserId)
            .single();

          // Get last message
          const { data: lastMessage } = await supabase
            .from('private_messages')
            .select('message, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('private_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', userId);

          return {
            ...conv,
            other_user: otherUser,
            last_message: lastMessage?.message,
            unread_count: unreadCount || 0
          };
        })
      );

      return enrichedConversations;
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      throw error;
    }
  }

  async getConversationMessages(conversationId: number, sessionToken: string): Promise<PrivateMessage[]> {
    try {
      const { data: messages, error } = await supabase
        .from('private_messages')
        .select(`
          *,
          sender:chat_users!private_messages_sender_id_fkey(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching conversation messages:', error);
        throw error;
      }

      return messages || [];
    } catch (error) {
      console.error('Error in getConversationMessages:', error);
      throw error;
    }
  }

  async sendMessage(conversationId: number, senderId: number, message: string, sessionToken: string): Promise<PrivateMessage> {
    try {
      const { data, error } = await supabase
        .from('private_messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: senderId,
          message: message,
          message_type: 'text'
        }])
        .select(`
          *,
          sender:chat_users!private_messages_sender_id_fkey(*)
        `)
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  async markMessagesAsRead(conversationId: number, userId: number, sessionToken: string): Promise<void> {
    try {
      await supabase
        .from('private_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('is_read', false)
        .neq('sender_id', userId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  async updateUsername(userId: number, username: string, sessionToken: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_users')
        .update({ username: username.toLowerCase() })
        .eq('id', userId);

      if (error) {
        console.error('Error updating username:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateUsername:', error);
      throw error;
    }
  }

  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('id')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      if (error) {
        console.error('Error checking username:', error);
        return false;
      }

      return !data; // Available if no user found
    } catch (error) {
      console.error('Error in checkUsernameAvailability:', error);
      return false;
    }
  }
}

export const privateMessageService = new PrivateMessageService();
