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
      const cleanTerm = searchTerm.trim();
      
      if (!cleanTerm) {
        return [];
      }

      let query = supabase
        .from('chat_users')
        .select('*')
        .eq('is_approved', true);

      // Enhanced search: check if it's a phone number, username, or name
      if (/^09\d{9}$/.test(cleanTerm)) {
        // Exact phone number match
        query = query.eq('phone', cleanTerm);
      } else if (cleanTerm.startsWith('@')) {
        // Username search with @ prefix
        const username = cleanTerm.substring(1);
        query = query.eq('username', username.toLowerCase());
      } else {
        // Search by name, username, or phone (partial matches)
        query = query.or(`username.ilike.%${cleanTerm.toLowerCase()}%,name.ilike.%${cleanTerm}%,phone.ilike.%${cleanTerm}%`);
      }

      const { data, error } = await query
        .order('name')
        .limit(20);

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
      else if (searchTerm.startsWith('@')) {
        query = query.eq('username', searchTerm.substring(1).toLowerCase());
      }
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
      console.log('Getting/creating conversation between:', userId, 'and', otherUserId);
      
      // Prevent creating conversation with self
      if (userId === otherUserId) {
        throw new Error('Cannot create conversation with yourself');
      }
      
      const { data, error } = await supabase.rpc('get_or_create_private_conversation', {
        p_user1_id: userId,
        p_user2_id: otherUserId
      });

      if (error) {
        console.error('Error getting/creating conversation:', error);
        throw error;
      }

      console.log('Conversation ID:', data);
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
          
          // Get other user details with avatar
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
      console.log('Fetching messages for conversation:', conversationId);
      
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

      console.log('Fetched messages:', messages?.length || 0);
      return messages || [];
    } catch (error) {
      console.error('Error in getConversationMessages:', error);
      throw error;
    }
  }

  async sendMessage(conversationId: number, senderId: number, message: string, sessionToken: string, mediaUrl?: string, mediaType?: string, mediaContent?: string): Promise<PrivateMessage> {
    try {
      // Send webhook first
      try {
        const { webhookService } = await import('@/lib/webhookService');
        const { data: sender } = await supabase
          .from('chat_users')
          .select('*')
          .eq('id', senderId)
          .single();

        if (sender) {
          // Get the conversation to find recipient
          const { data: privateConversation } = await supabase
            .from('private_conversations')
            .select('*')
            .eq('id', conversationId)
            .single();

          let chatName = 'Private Chat';
          if (privateConversation) {
            // Get recipient user
            const recipientId = privateConversation.user1_id === senderId 
              ? privateConversation.user2_id 
              : privateConversation.user1_id;
            
            const { data: recipient } = await supabase
              .from('chat_users')
              .select('name')
              .eq('id', recipientId)
              .single();

            if (recipient) {
              chatName = `chat: from ${sender.name} to ${recipient.name}`;
            }
          }
          
          await webhookService.sendMessageWebhook({
            messageContent: message,
            senderName: sender.name,
            senderPhone: sender.phone || '',
            senderEmail: sender.email || '',
            chatType: 'private',
            chatName: chatName,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error sending webhook:', error);
      }
      console.log('Sending message:', { conversationId, senderId, messageLength: message.length });
      
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

      console.log('Message sent successfully:', data.id);
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

  // New method to get support conversations for the support dashboard
  async getSupportConversations(sessionToken: string): Promise<any[]> {
    try {
      console.log('Fetching support conversations...');
      
      // Get conversations where one user is a support agent (999997 or 999998)
      const { data: conversations, error } = await supabase
        .from('private_conversations')
        .select(`
          *,
          user1:chat_users!user1_id(*),
          user2:chat_users!user2_id(*)
        `)
        .or('user1_id.eq.999997,user2_id.eq.999997,user1_id.eq.999998,user2_id.eq.999998')
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching support conversations:', error);
        throw error;
      }

      // Transform the data to match the expected format
      const supportConversations = await Promise.all(
        (conversations || []).map(async (conv) => {
          // Determine which user is the regular user (not support)
          const regularUser = conv.user1_id === 999997 || conv.user1_id === 999998 
            ? conv.user2 
            : conv.user1;

          // Get the last message
          const { data: lastMessage } = await supabase
            .from('private_messages')
            .select('message, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count (messages from regular user to support)
          const supportUserId = conv.user1_id === 999997 || conv.user1_id === 999998 
            ? conv.user1_id 
            : conv.user2_id;

          const { count: unreadCount } = await supabase
            .from('private_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', supportUserId);

          // Determine thread type based on support user ID
          const threadTypeId = supportUserId === 999997 ? 1 : 2;

          return {
            id: conv.id,
            status: 'open', // Default status
            priority: 'normal',
            last_message_at: conv.last_message_at,
            thread_type_id: threadTypeId,
            tag_list: [],
            unread_count: unreadCount || 0,
            user: {
              id: regularUser?.id,
              name: regularUser?.name,
              phone: regularUser?.phone,
            },
            thread_type: {
              id: threadTypeId,
              display_name: threadTypeId === 1 ? 'پشتیبانی عمومی' : 'پشتیبانی بدون مرز'
            }
          };
        })
      );

      console.log('Support conversations loaded:', supportConversations.length);
      return supportConversations;
    } catch (error) {
      console.error('Error in getSupportConversations:', error);
      throw error;
    }
  }
}

export const privateMessageService = new PrivateMessageService();
