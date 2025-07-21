
import { supabase } from '@/integrations/supabase/client';
import { type MessengerUser } from './messengerService';

// Debug logging function
const debugLog = (...args: any[]) => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('debug') === 'true') {
    console.log('[PrivateMessageService]', ...args);
  }
};

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
      console.log('Fetching conversation:', conversationId);
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

      console.log('Conversation fetched successfully:', data?.id);
      return data || null;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }
  },

  async getUserConversations(userId: number, sessionToken: string): Promise<PrivateConversation[]> {
    try {
      console.log('Fetching conversations for user:', userId);
      
      // Single optimized query with all required data
      const { data, error } = await supabase
        .from('private_conversations')
        .select(`
          *,
          user1:chat_users!private_conversations_user1_id_fkey (id, name, username, phone, avatar_url),
          user2:chat_users!private_conversations_user2_id_fkey (id, name, username, phone, avatar_url),
          last_message:private_messages!private_messages_conversation_id_fkey (
            id,
            message,
            created_at,
            sender_id,
            message_type,
            media_url,
            is_read
          )
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      console.log('Fetched conversations:', data?.length || 0);

      // Process conversations efficiently without additional queries
      const conversationsWithDetails = data.map((conversation: any) => {
        // Determine the other user (not the current user)
        const otherUser = conversation.user1_id === userId ? conversation.user2 : conversation.user1;
        
        // Get the most recent message from the last_message array
        const lastMessage = conversation.last_message?.length > 0 
          ? conversation.last_message.sort((a: any, b: any) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]
          : null;

        // Calculate unread count efficiently (messages not sent by current user and not read)
        const unreadCount = conversation.last_message?.filter((msg: any) => 
          msg.sender_id !== userId && !msg.is_read
        ).length || 0;
        
        return {
          ...conversation,
          other_user: otherUser,
          last_message: lastMessage,
          unread_count: unreadCount,
        };
      });

      console.log('Processed conversations with details:', conversationsWithDetails.length);
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

  async getConversationMessages(conversationId: number, sessionToken?: string): Promise<PrivateMessage[]> {
    try {
      debugLog('Fetching messages for conversation:', conversationId, 'with session:', sessionToken ? 'provided' : 'none');
      
      // Set session context if provided (for RLS)
      if (sessionToken) {
        try {
          await supabase.rpc('set_session_context', { session_token: sessionToken });
          debugLog('Session context set successfully');
        } catch (sessionError) {
          console.error('Failed to set session context:', sessionError);
        }
      }
      
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
        debugLog('SQL Error details:', error);
        return [];
      }

      debugLog('Successfully fetched messages:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      debugLog('Fetch error details:', error);
      return [];
    }
  },

  async sendMessage(senderId: number, recipientId: number, message: string, mediaUrl?: string, mediaType?: string, mediaContent?: string, sessionToken?: string): Promise<PrivateMessage | null> {
    try {
      debugLog('Sending private message from', senderId, 'to', recipientId, 'with session:', sessionToken ? 'provided' : 'none');
      
      // Set session context if provided
      if (sessionToken) {
        try {
          await supabase.rpc('set_session_context', { session_token: sessionToken });
          debugLog('Session context set for message sending');
        } catch (sessionError) {
          console.error('Failed to set session context for sending:', sessionError);
        }
      }
      
      // Get or create conversation first with enhanced error handling
      const conversationId = await this.getOrCreateConversation(senderId, recipientId);
      
      if (!conversationId) {
        console.error('Failed to get or create conversation');
        throw new Error('Failed to create conversation');
      }

      debugLog('Using conversation ID:', conversationId);

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
        debugLog('Message insert error details:', error);
        throw error;
      }

      debugLog('Message sent successfully:', data.id);

      // Update last_message_at in private_conversations table
      const { error: updateError } = await supabase
        .from('private_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (updateError) {
        console.error('Error updating conversation timestamp:', updateError);
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
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
      
      console.log('Creating conversation between', smallerId, 'and', largerId);
      
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
        throw error;
      }

      console.log('Conversation created successfully:', data.id);
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
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

  async getSupportConversations(sessionToken?: string): Promise<any[]> {
    try {
      console.log('Fetching support conversations...');
      
      // First, get all support conversations
      const { data: conversations, error: convError } = await supabase
        .from('support_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (convError) {
        console.error('Error fetching support conversations:', convError);
        return [];
      }

      console.log('Raw conversations fetched:', conversations?.length || 0);

      if (!conversations || conversations.length === 0) {
        return [];
      }

      // Get all unique user IDs and agent IDs
      const userIds = [...new Set(conversations.map(conv => conv.user_id).filter(Boolean))];
      const agentIds = [...new Set(conversations.map(conv => conv.agent_id).filter(Boolean))];
      const allUserIds = [...new Set([...userIds, ...agentIds])];

      console.log('User IDs to fetch:', userIds);
      console.log('Agent IDs to fetch:', agentIds);

      // Fetch user details for all users
      let usersData: any[] = [];
      if (allUserIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('chat_users')
          .select('id, name, username, phone, avatar_url, bedoun_marz')
          .in('id', allUserIds);

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

      // Enrich conversations with user and agent data
      const enrichedConversations = conversations.map(conversation => {
        const user = usersMap.get(conversation.user_id);
        const agent = usersMap.get(conversation.agent_id);

        return {
          ...conversation,
          user: user || null,
          agent: agent || null
        };
      });

      console.log('Enriched conversations:', enrichedConversations.length);
      return enrichedConversations;

    } catch (error) {
      console.error('Error in getSupportConversations:', error);
      return [];
    }
  },

  async getOrCreateConversation(user1Id: number, user2Id: number): Promise<number> {
    try {
      console.log('Getting or creating conversation between', user1Id, 'and', user2Id);
      
      // First, check if conversation already exists with proper ordering
      const { data: existingConversation, error } = await supabase
        .from('private_conversations')
        .select('id')
        .or(`and(user1_id.eq.${Math.min(user1Id, user2Id)},user2_id.eq.${Math.max(user1Id, user2Id)})`)
        .single();

      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation.id);
        return existingConversation.id;
      }

      // If no existing conversation, create one
      console.log('Creating new conversation...');
      const conversation = await this.createConversation(user1Id, user2Id);
      if (!conversation) {
        throw new Error('Failed to create conversation');
      }
      
      console.log('Created new conversation:', conversation.id);
      return conversation.id;
    } catch (error) {
      console.error('Error getting or creating conversation:', error);
      
      // Enhanced retry logic with exponential backoff
      if (error?.message?.includes('single() expects exactly one row')) {
        console.log('Retrying conversation creation due to race condition...');
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        
        try {
          const conversation = await this.createConversation(user1Id, user2Id);
          return conversation?.id || 0;
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          throw retryError;
        }
      }
      
      throw error;
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
