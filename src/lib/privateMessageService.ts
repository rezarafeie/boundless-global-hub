import { supabase } from '@/integrations/supabase/client';
import { type MessengerUser, type MessengerMessage } from './messengerService';

export interface PrivateMessage {
  id: number;
  created_at: string;
  conversation_id: number;
  sender_id: number;
  message: string;
  message_type?: string;
  media_url?: string;
  media_content?: string;
  is_read: boolean;
  reply_to_message_id?: number;
  forwarded_from_message_id?: number;
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
        .select(`
          id,
          conversation_id,
          sender_id,
          message,
          message_type,
          media_url,
          media_content,
          is_read,
          created_at,
          reply_to_message_id,
          forwarded_from_message_id
        `)
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
        .select(`
          id,
          conversation_id,
          sender_id,
          message,
          message_type,
          media_url,
          media_content,
          is_read,
          created_at,
          reply_to_message_id,
          forwarded_from_message_id
        `)
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

  async sendPrivateMessage(senderId: number, recipientId: number, message: string, mediaUrl?: string, mediaType?: string, mediaContent?: string): Promise<PrivateMessage | null> {
    try {
      // Get or create conversation first
      const conversationId = await this.getOrCreateConversation(senderId, recipientId);
      
      if (!conversationId) {
        console.error('Failed to get or create conversation');
        return null;
      }

      const { data, error } = await supabase
        .from('private_messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: senderId,
          message: message,
          message_type: mediaType || 'text',
          media_url: mediaUrl,
          media_content: mediaContent,
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

  async searchUsers(searchTerm: string, sessionToken?: string): Promise<MessengerUser[]> {
    try {
      console.log('Searching users with term:', searchTerm);
      
      // Search by name, username, and phone
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .eq('is_approved', true)
        .neq('id', 1) // Exclude support user
        .limit(50);

      if (error) {
        console.error('Error searching users:', error);
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

  async getSupportConversations(sessionToken?: string): Promise<any[]> {
    try {
      console.log('Fetching support conversations from messenger_messages...');
      
      // Get all unique conversation IDs where messages to/from support (recipient_id = 1 or sender_id = 1)
      const { data: supportMessages, error: messagesError } = await supabase
        .from('messenger_messages')
        .select('conversation_id, sender_id, recipient_id, created_at')
        .or('recipient_id.eq.1,sender_id.eq.1')
        .not('conversation_id', 'is', null)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Error fetching support messages:', messagesError);
        return [];
      }

      console.log('Support messages found:', supportMessages?.length || 0);

      if (!supportMessages || supportMessages.length === 0) {
        return [];
      }

      // Group by conversation_id and get the latest message time
      const conversationMap = new Map();
      supportMessages.forEach(msg => {
        const convId = msg.conversation_id;
        if (!conversationMap.has(convId) || new Date(msg.created_at) > new Date(conversationMap.get(convId).last_message_at)) {
          // Determine user_id (the one who's not support)
          const userId = msg.sender_id === 1 ? null : msg.sender_id; // We'll need to get this from other messages
          
          conversationMap.set(convId, {
            id: convId,
            conversation_id: convId,
            last_message_at: msg.created_at,
            status: 'open',
            priority: 'normal',
            thread_type_id: 1,
            tag_list: [],
            unread_count: 0,
            user_id: userId
          });
        }
      });

      // Get all unique user IDs from conversations (excluding support user id = 1)
      const userIds = [...new Set(
        supportMessages
          .map(msg => {
            // If sender is support (1), then user is recipient
            if (msg.sender_id === 1 && msg.recipient_id !== 1) {
              return msg.recipient_id;
            }
            // If recipient is support (1), then user is sender
            if (msg.recipient_id === 1 && msg.sender_id !== 1) {
              return msg.sender_id;
            }
            return null;
          })
          .filter(Boolean)
      )];

      console.log('Unique user IDs found:', userIds);

      // Update conversation map with correct user_ids
      supportMessages.forEach(msg => {
        const convId = msg.conversation_id;
        if (conversationMap.has(convId)) {
          const conv = conversationMap.get(convId);
          if (!conv.user_id && msg.sender_id !== 1) {
            conv.user_id = msg.sender_id;
          }
          if (!conv.user_id && msg.recipient_id !== 1) {
            conv.user_id = msg.recipient_id;
          }
        }
      });

      // Fetch user details
      let usersData: any[] = [];
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('chat_users')
          .select('id, name, username, phone, avatar_url, bedoun_marz, is_approved')
          .in('id', userIds);

        if (usersError) {
          console.error('Error fetching users:', usersError);
        } else {
          usersData = users || [];
          console.log('Users fetched:', usersData.length);
        }
      }

      // Create a map for quick user lookup
      const usersMap = new Map();
      usersData.forEach(user => {
        usersMap.set(user.id, user);
      });

      // Convert conversations and enrich with user data
      const conversations = Array.from(conversationMap.values())
        .map(conversation => ({
          ...conversation,
          user: usersMap.get(conversation.user_id) || null,
          agent: null // Support agent info could be added here
        }))
        .filter(conv => conv.user) // Only include conversations with valid users
        .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

      console.log('Final conversations:', conversations.length);
      return conversations;

    } catch (error) {
      console.error('Error in getSupportConversations:', error);
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

  async getConversationMessages(conversationId: number, sessionToken?: string): Promise<any[]> {
    try {
      console.log('Fetching messages for conversation:', conversationId);
      
      // For support conversations, get messages from messenger_messages table
      const { data, error } = await supabase
        .from('messenger_messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          recipient_id,
          room_id,
          topic_id,
          message,
          message_type,
          media_url,
          media_content,
          is_read,
          created_at,
          reply_to_message_id,
          forwarded_from_message_id
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching conversation messages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      return [];
    }
  },

  async sendMessage(conversationId: number, senderId: number, message: string, sessionToken?: string): Promise<any | null> {
    try {
      console.log('Sending message to conversation:', conversationId, 'from sender:', senderId);
      
      // Send message as support conversation (to recipient_id = 1)
      const { data, error } = await supabase
        .from('messenger_messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: senderId,
          recipient_id: 1, // Support user
          message: message,
          message_type: 'text',
          is_read: false
        }])
        .select('*')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
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
