
import { supabase } from '@/integrations/supabase/client';

export interface SupportMessage {
  id: number;
  message: string;
  sender_id: number;
  recipient_id?: number;
  conversation_id?: number;
  created_at: string;
  media_url?: string;
  message_type?: string;
  media_content?: string;
  sender?: {
    name: string;
    phone: string;
  };
}

export interface SupportConversation {
  id: number;
  user_id: number;
  status: string;
  priority: string;
  thread_type_id: number;
  created_at: string;
  last_message_at: string;
}

class SupportMessageService {
  // Send a message from user to support
  async sendUserMessage(
    userId: number,
    message: string,
    mediaUrl?: string,
    mediaType?: string,
    mediaContent?: string
  ): Promise<void> {
    console.log('Sending user message to support:', { userId, message });
    
    const { error } = await supabase
      .from('messenger_messages')
      .insert({
        sender_id: userId,
        recipient_id: 1, // Support recipient ID
        message: message,
        media_url: mediaUrl,
        message_type: mediaType || 'text',
        media_content: mediaContent,
        room_id: null, // No room for support messages
        conversation_id: null // Will be set by trigger
      });

    if (error) {
      console.error('Error sending user message to support:', error);
      throw error;
    }

    // Auto-update conversation status to "open" when user sends a new message
    // This will be handled by database triggers, but we can also do it here as backup
    console.log('User message sent successfully - status should be updated to "open" by trigger');
  }

  // Send a message from support to user
  async sendSupportMessage(
    recipientUserId: number,
    message: string,
    conversationId: number,
    mediaUrl?: string,
    mediaType?: string,
    mediaContent?: string
  ): Promise<void> {
    console.log('Sending support message to user:', { recipientUserId, conversationId, message });
    
    const { data, error } = await supabase
      .from('messenger_messages')
      .insert({
        sender_id: 1, // Support sender ID
        recipient_id: recipientUserId,
        message: message,
        media_url: mediaUrl,
        message_type: mediaType || 'text',
        media_content: mediaContent,
        room_id: null,
        conversation_id: conversationId
      })
      .select();

    if (error) {
      console.error('Error sending support message:', error);
      throw error;
    }

    // Update conversation status to "assigned" when support sends a message
    try {
      await this.updateConversationStatus(conversationId, 'assigned');
      console.log('Support message sent and status updated to "assigned"');
    } catch (statusError) {
      console.warn('Could not update conversation status:', statusError);
      // Don't throw here as the message was sent successfully
    }
  }

  // Get messages for a support conversation
  async getConversationMessages(conversationId: number): Promise<SupportMessage[]> {
    console.log('Loading messages for conversation:', conversationId);
    
    const { data, error } = await supabase
      .from('messenger_messages')
      .select(`
        id,
        message,
        sender_id,
        recipient_id,
        conversation_id,
        created_at,
        media_url,
        message_type,
        media_content
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading conversation messages:', error);
      throw error;
    }

    // Add sender information
    const messagesWithSender = data?.map(msg => ({
      ...msg,
      sender: {
        name: msg.sender_id === 1 ? 'پشتیبانی' : 'کاربر',
        phone: ''
      }
    })) || [];

    console.log('Loaded conversation messages:', messagesWithSender.length);
    return messagesWithSender;
  }

  // Get or create conversation for user
  async getOrCreateUserConversation(userId: number, threadTypeId: number = 1): Promise<number> {
    console.log('Getting/creating conversation for user:', userId, 'thread type:', threadTypeId);
    
    // First try to find existing open conversation
    const { data: existingConv, error: findError } = await supabase
      .from('support_conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('thread_type_id', threadTypeId)
      .in('status', ['open', 'assigned'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (findError) {
      console.error('Error finding existing conversation:', findError);
      throw findError;
    }

    if (existingConv && existingConv.length > 0) {
      console.log('Found existing conversation:', existingConv[0].id);
      return existingConv[0].id;
    }

    // Create new conversation
    const { data: newConv, error: createError } = await supabase
      .from('support_conversations')
      .insert({
        user_id: userId,
        status: 'open',
        priority: 'normal',
        thread_type_id: threadTypeId,
        last_message_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating new conversation:', createError);
      throw createError;
    }

    console.log('Created new conversation:', newConv.id);
    return newConv.id;
  }

  // Get conversation details
  async getConversation(conversationId: number): Promise<SupportConversation | null> {
    const { data, error } = await supabase
      .from('support_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error getting conversation:', error);
      return null;
    }

    return data;
  }

  // Mark support messages as read when chat is opened
  async markMessagesAsRead(conversationId: number): Promise<void> {
    console.log('Marking messages as read for conversation:', conversationId);
    
    // Mark user messages as read by support
    const { error: supportReadError } = await supabase
      .from('messenger_messages')
      .update({ unread_by_support: false })
      .eq('conversation_id', conversationId)
      .neq('sender_id', 1); // Only mark user messages as read by support

    if (supportReadError) {
      console.error('Error marking user messages as read by support:', supportReadError);
      throw supportReadError;
    }

    // Mark support messages as read by user
    const { error: userReadError } = await supabase
      .from('messenger_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('sender_id', 1); // Only mark support messages as read by user

    if (userReadError) {
      console.error('Error marking support messages as read by user:', userReadError);
      throw userReadError;
    }

    console.log('Messages marked as read for conversation:', conversationId);
  }

  // Update conversation status
  async updateConversationStatus(conversationId: number, status: string): Promise<void> {
    console.log('Updating conversation status:', { conversationId, status });
    
    const { error } = await supabase
      .from('support_conversations')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) {
      console.error('Error updating conversation status:', error);
      throw error;
    }

    console.log('Conversation status updated successfully');
  }

  // Get all support conversations (for dashboard)
  async getAllConversations(): Promise<any[]> {
    console.log('Loading all support conversations...');
    
    const { data, error } = await supabase
      .from('support_conversations')
      .select(`
        id,
        user_id,
        status,
        priority,
        thread_type_id,
        created_at,
        last_message_at,
        tags,
        tag_list,
        chat_users!support_conversations_user_id_fkey(id, name, phone)
      `)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      throw error;
    }

    console.log('Raw conversation data:', data);

    const mappedData = data?.map(conv => {
      console.log('Processing conversation:', {
        id: conv.id,
        user_id: conv.user_id,
        chat_users: conv.chat_users
      });

      return {
        ...conv,
        user: conv.chat_users,
        unread_count: 0 // TODO: Implement unread count
      };
    }) || [];

    console.log('Mapped conversation data:', mappedData);
    return mappedData;
  }
}

export const supportMessageService = new SupportMessageService();
