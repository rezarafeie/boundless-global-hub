
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

    console.log('Support message sent successfully:', data);
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

  // Get all support conversations (for dashboard)
  async getAllConversations(): Promise<any[]> {
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
        chat_users!inner(id, name, phone)
      `)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      throw error;
    }

    return data?.map(conv => ({
      ...conv,
      user: conv.chat_users,
      unread_count: 0 // TODO: Implement unread count
    })) || [];
  }
}

export const supportMessageService = new SupportMessageService();
