
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
  sender_name?: string;
  is_from_support?: boolean;
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
}

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
      
      const { data, error } = await supabase
        .from('messenger_messages')
        .select(`
          *,
          sender:chat_users!fk_messenger_messages_sender(name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching conversation messages:', error);
        throw error;
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
        sender_name: msg.sender?.name || 'کاربر',
        is_from_support: msg.sender_id === 1 || (msg.sender_id !== null && msg.sender_id !== msg.recipient_id)
      }));
      
      console.log('Fetched messages:', messages.length);
      return messages;
      
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      return [];
    }
  }

  async sendSupportMessage(conversationId: number, message: string, senderId: number): Promise<SupportMessage> {
    try {
      console.log('Sending support message to conversation:', conversationId);
      
      const { data, error } = await supabase
        .from('messenger_messages')
        .insert([{
          conversation_id: conversationId,
          message: message,
          sender_id: senderId,
          message_type: 'text',
          is_read: false
        }])
        .select(`
          *,
          sender:chat_users!fk_messenger_messages_sender(name)
        `)
        .single();
      
      if (error) {
        console.error('Error sending support message:', error);
        throw error;
      }
      
      // Update conversation last_message_at
      await supabase
        .from('support_conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      
      return {
        id: data.id,
        message: data.message,
        message_type: data.message_type,
        media_url: data.media_url,
        sender_id: data.sender_id,
        recipient_id: data.recipient_id,
        is_read: data.is_read,
        created_at: data.created_at,
        sender_name: data.sender?.name || 'کاربر',
        is_from_support: data.sender_id === 1
      };
      
    } catch (error) {
      console.error('Error sending support message:', error);
      throw error;
    }
  }

  async getAllConversations(): Promise<SupportConversation[]> {
    try {
      const { data, error } = await supabase
        .from('support_conversations')
        .select(`
          *,
          user:chat_users!support_conversations_user_id_fkey(name, phone),
          thread_type:support_thread_types!support_conversations_thread_type_id_fkey(display_name)
        `)
        .order('last_message_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching all conversations:', error);
        throw error;
      }
      
      return (data || []) as SupportConversation[];
      
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }
}

export const supportService = new SupportService();
