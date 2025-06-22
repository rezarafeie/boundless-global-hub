import { supabase } from '@/integrations/supabase/client';

export interface SupportMessage {
  id: number;
  message: string;
  message_type: string | null;
  media_url: string | null;
  sender_id: number | null;
  recipient_id: number | null;
  is_read: boolean | null;
  created_at: string | null;
  conversation_id?: number | null;
  sender_name?: string;
  is_from_support?: boolean;
  unread_by_support?: boolean;
}

export interface SupportConversation {
  id: number;
  user_id: number | null;
  agent_id: number | null;
  status: string | null;
  priority: string | null;
  thread_type_id: number | null;
  created_at: string | null;
  updated_at: string | null;
  last_message_at: string | null;
  tags?: string[];
  tag_list?: SupportTag[];
  internal_notes?: string;
  assigned_agent_name?: string;
  unread_count?: number;
}

export type SupportTag = 'technical' | 'billing' | 'general' | 'account' | 'bug_report' | 'feature_request' | 'urgent' | 'follow_up';

class SupportService {
  async getOrCreateUserConversation(userId: number, sessionToken: string, threadTypeId: number = 1): Promise<SupportConversation> {
    try {
      console.log(`Getting/creating conversation for user ${userId}, thread type ${threadTypeId}`);
      
      // Check if conversation already exists for this user and thread type
      const { data: existingConversation, error: fetchError } = await supabase
        .from('support_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('thread_type_id', threadTypeId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing conversation:', fetchError);
        throw fetchError;
      }
      
      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation.id);
        return existingConversation as SupportConversation;
      }
      
      // Create new conversation
      console.log('Creating new conversation...');
      const { data: newConversation, error: createError } = await supabase
        .from('support_conversations')
        .insert([{
          user_id: userId,
          status: 'open',
          priority: 'normal',
          thread_type_id: threadTypeId,
          last_message_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating conversation:', createError);
        throw createError;
      }
      
      console.log('Created new conversation:', newConversation.id);
      return newConversation as SupportConversation;
      
    } catch (error) {
      console.error('Error in getOrCreateUserConversation:', error);
      // Return a placeholder conversation to prevent errors
      return {
        id: -1,
        user_id: userId,
        agent_id: null,
        status: 'open',
        priority: 'normal',
        thread_type_id: threadTypeId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      };
    }
  }

  async getConversationMessages(conversationId: number): Promise<SupportMessage[]> {
    if (conversationId === -1) {
      return [];
    }
    
    try {
      console.log('Getting messages for conversation:', conversationId);
      
      // Get messages from messenger_messages table where conversation_id matches
      const { data, error } = await supabase
        .from('messenger_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching conversation messages:', error);
        throw error;
      }
      
      console.log('Raw messages data:', data);
      
      // Get sender names separately to avoid complex joins
      const senderIds = [...new Set(data?.map(msg => msg.sender_id).filter(id => id) || [])];
      let senderMap = new Map();
      
      if (senderIds.length > 0) {
        const { data: senders } = await supabase
          .from('chat_users')
          .select('id, name')
          .in('id', senderIds);
        
        senderMap = new Map(senders?.map(s => [s.id, s.name]) || []);
      }
      
      const messages = (data || []).map(msg => ({
        id: msg.id,
        message: msg.message,
        message_type: msg.message_type,
        media_url: msg.media_url,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        is_read: msg.is_read,
        created_at: msg.created_at,
        sender_name: senderMap.get(msg.sender_id) || 'کاربر',
        is_from_support: msg.sender_id === 1,
        unread_by_support: msg.unread_by_support
      }));
      
      console.log('Processed messages:', messages.length);
      return messages;
      
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      return [];
    }
  }

  async sendSupportMessage(conversationId: number, message: string, senderId: number): Promise<SupportMessage> {
    try {
      console.log('Sending support message to conversation:', conversationId, 'from sender:', senderId);
      
      // Get conversation details to identify the user
      const { data: conversation } = await supabase
        .from('support_conversations')
        .select('user_id')
        .eq('id', conversationId)
        .single();
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      console.log('Conversation user_id:', conversation.user_id);
      
      // Determine recipient based on sender
      // If support agent (sender_id = 1) is sending, recipient is the user
      // If user is sending, recipient is support (1)
      const recipientId = senderId === 1 ? conversation.user_id : 1;
      
      console.log('Message details:', {
        conversation_id: conversationId,
        sender_id: senderId,
        recipient_id: recipientId,
        is_from_support: senderId === 1
      });
      
      const { data, error } = await supabase
        .from('messenger_messages')
        .insert([{
          conversation_id: conversationId,
          message: message,
          sender_id: senderId,
          recipient_id: recipientId,
          message_type: 'text',
          is_read: false,
          unread_by_support: senderId !== 1 // Mark as unread by support if not from support
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error sending support message:', error);
        throw error;
      }
      
      console.log('Message sent successfully:', data);
      
      // Update conversation last_message_at
      await supabase
        .from('support_conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      
      // Get sender name
      const { data: sender } = await supabase
        .from('chat_users')
        .select('name')
        .eq('id', senderId)
        .maybeSingle();
      
      return {
        id: data.id,
        message: data.message,
        message_type: data.message_type,
        media_url: data.media_url,
        sender_id: data.sender_id,
        recipient_id: data.recipient_id,
        is_read: data.is_read,
        created_at: data.created_at,
        sender_name: sender?.name || (senderId === 1 ? 'پشتیبانی' : 'کاربر'),
        is_from_support: data.sender_id === 1,
        unread_by_support: data.unread_by_support
      };
      
    } catch (error) {
      console.error('Error sending support message:', error);
      throw error;
    }
  }

  async markMessagesAsRead(conversationId: number): Promise<void> {
    try {
      console.log('Marking messages as read for conversation:', conversationId);
      
      await supabase
        .from('messenger_messages')
        .update({ unread_by_support: false })
        .eq('conversation_id', conversationId)
        .eq('unread_by_support', true)
        .neq('sender_id', 1); // Don't mark support messages as read
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  async updateConversationStatus(conversationId: number, status: string): Promise<void> {
    try {
      console.log('Updating conversation status:', conversationId, status);
      
      await supabase
        .from('support_conversations')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      
    } catch (error) {
      console.error('Error updating conversation status:', error);
      throw error;
    }
  }

  async updateConversationTags(conversationId: number, tags: SupportTag[]): Promise<void> {
    try {
      console.log('Updating conversation tags:', conversationId, tags);
      
      await supabase
        .from('support_conversations')
        .update({ 
          tag_list: tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      
    } catch (error) {
      console.error('Error updating conversation tags:', error);
      throw error;
    }
  }

  async updateConversationPriority(conversationId: number, priority: string): Promise<void> {
    try {
      console.log('Updating conversation priority:', conversationId, priority);
      
      await supabase
        .from('support_conversations')
        .update({ 
          priority: priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      
    } catch (error) {
      console.error('Error updating conversation priority:', error);
      throw error;
    }
  }

  async getAllConversations(): Promise<any[]> {
    try {
      console.log('Fetching all support conversations...');
      
      // First, get all messages sent to support (recipient_id = 1) to find active conversations
      const { data: supportMessages, error: messagesError } = await supabase
        .from('messenger_messages')
        .select('*')
        .eq('recipient_id', 1)
        .not('conversation_id', 'is', null)
        .order('created_at', { ascending: false });
      
      if (messagesError) {
        console.error('Error fetching support messages:', messagesError);
        throw messagesError;
      }
      
      console.log('Found support messages:', supportMessages?.length || 0);
      
      if (!supportMessages || supportMessages.length === 0) {
        console.log('No support messages found');
        return [];
      }
      
      // Get unique conversation IDs
      const conversationIds = [...new Set(supportMessages.map(msg => msg.conversation_id))];
      console.log('Unique conversation IDs:', conversationIds);
      
      // Get conversations data with unread counts
      const { data: conversations, error: convError } = await supabase
        .from('support_conversations')
        .select(`
          *,
          get_support_unread_count(id) as unread_count
        `)
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false });
      
      if (convError) {
        console.error('Error fetching conversations:', convError);
        // If conversations table is empty, create conversations from messages
        const conversationsFromMessages = conversationIds.map(convId => {
          const firstMessage = supportMessages.find(msg => msg.conversation_id === convId);
          const unreadCount = supportMessages.filter(msg => 
            msg.conversation_id === convId && 
            msg.unread_by_support === true && 
            msg.sender_id !== 1
          ).length;
          
          return {
            id: convId,
            user_id: firstMessage?.sender_id,
            agent_id: null,
            status: 'open',
            priority: 'normal',
            thread_type_id: 1, // Default to academy support
            created_at: firstMessage?.created_at,
            updated_at: firstMessage?.created_at,
            last_message_at: firstMessage?.created_at,
            unread_count: unreadCount
          };
        });
        console.log('Created conversations from messages:', conversationsFromMessages.length);
        return await this.enrichConversationsWithUserData(conversationsFromMessages);
      }
      
      console.log('Found conversations:', conversations?.length || 0);
      
      if (!conversations || conversations.length === 0) {
        console.log('No conversations found in table, but messages exist');
        // Create conversations from messages if they don't exist in the table
        const conversationsFromMessages = conversationIds.map(convId => {
          const firstMessage = supportMessages.find(msg => msg.conversation_id === convId);
          const unreadCount = supportMessages.filter(msg => 
            msg.conversation_id === convId && 
            msg.unread_by_support === true && 
            msg.sender_id !== 1
          ).length;
          
          return {
            id: convId,
            user_id: firstMessage?.sender_id,
            agent_id: null,
            status: 'open',
            priority: 'normal',
            thread_type_id: 1, // Default to academy support
            created_at: firstMessage?.created_at,
            updated_at: firstMessage?.created_at,
            last_message_at: firstMessage?.created_at,
            unread_count: unreadCount
          };
        });
        return await this.enrichConversationsWithUserData(conversationsFromMessages);
      }
      
      return await this.enrichConversationsWithUserData(conversations);
      
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  async enrichConversationsWithUserData(conversations: any[]): Promise<any[]> {
    try {
      // Get user details separately
      const userIds = conversations.map(c => c.user_id).filter(id => id);
      let userMap = new Map();
      
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('chat_users')
          .select('id, name, phone, bedoun_marz')
          .in('id', userIds);
        
        userMap = new Map(users?.map(u => [u.id, u]) || []);
      }
      
      // Get thread types separately
      const threadTypeIds = conversations.map(c => c.thread_type_id).filter(id => id);
      let threadTypeMap = new Map();
      
      if (threadTypeIds.length > 0) {
        const { data: threadTypes } = await supabase
          .from('support_thread_types')
          .select('id, display_name')
          .in('id', threadTypeIds);
        
        threadTypeMap = new Map(threadTypes?.map(t => [t.id, t]) || []);
      }
      
      // Combine data
      const enrichedConversations = conversations.map(conv => {
        const user = userMap.get(conv.user_id);
        const threadType = threadTypeMap.get(conv.thread_type_id);
        
        return {
          ...conv,
          user: user ? {
            id: user.id,
            name: user.name,
            phone: user.phone
          } : null,
          thread_type: threadType ? {
            id: threadType.id,
            display_name: threadType.display_name
          } : {
            id: 1,
            display_name: user?.bedoun_marz ? 'پشتیبانی بدون مرز' : 'پشتیبانی آکادمی'
          }
        };
      });
      
      console.log('Enriched conversations:', enrichedConversations.length);
      return enrichedConversations;
      
    } catch (error) {
      console.error('Error enriching conversations:', error);
      return conversations;
    }
  }

  async getUserSupportMessages(userId: number): Promise<SupportMessage[]> {
    try {
      console.log('Getting support messages for user:', userId);
      
      // Get all messages where user is either sender or recipient and the other party is support (id=1)
      const { data, error } = await supabase
        .from('messenger_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},recipient_id.eq.1),and(sender_id.eq.1,recipient_id.eq.${userId})`)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching user support messages:', error);
        throw error;
      }
      
      console.log('Found support messages for user:', data?.length || 0);
      
      // Get sender names
      const senderIds = [...new Set(data?.map(msg => msg.sender_id).filter(id => id) || [])];
      let senderMap = new Map();
      
      if (senderIds.length > 0) {
        const { data: senders } = await supabase
          .from('chat_users')
          .select('id, name')
          .in('id', senderIds);
        
        senderMap = new Map(senders?.map(s => [s.id, s.name]) || []);
      }
      
      const messages = (data || []).map(msg => ({
        id: msg.id,
        message: msg.message,
        message_type: msg.message_type,
        media_url: msg.media_url,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        is_read: msg.is_read,
        created_at: msg.created_at,
        conversation_id: msg.conversation_id,
        sender_name: msg.sender_id === 1 ? 'پشتیبانی' : (senderMap.get(msg.sender_id) || 'کاربر'),
        is_from_support: msg.sender_id === 1,
        unread_by_support: msg.unread_by_support
      }));
      
      console.log('Processed user support messages:', messages.length);
      return messages;
      
    } catch (error) {
      console.error('Error fetching user support messages:', error);
      return [];
    }
  }
}

export const supportService = new SupportService();
