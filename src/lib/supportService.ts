
import { supabase } from '@/integrations/supabase/client';

export type SupportConversation = {
  id: number;
  user_id: number | null;
  agent_id: number | null;
  status: string | null;
  priority: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_message_at: string | null;
  user_name?: string;
  user_phone?: string;
  agent_name?: string;
  unread_count?: number;
};

export type SupportMessage = {
  id: number;
  conversation_id: number | null;
  sender_id: number | null;
  recipient_id: number | null;
  message: string;
  message_type: string | null;
  media_url: string | null;
  is_read: boolean | null;
  created_at: string | null;
  sender_name?: string;
  is_from_support?: boolean;
};

class SupportService {
  // Get all support conversations for admin view
  async getSupportConversations(): Promise<SupportConversation[]> {
    const { data, error } = await supabase
      .from('support_conversations')
      .select(`
        *,
        chat_users!support_conversations_user_id_fkey(name, phone),
        support_agent:chat_users!support_conversations_agent_id_fkey(name)
      `)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(conv => ({
      ...conv,
      user_name: conv.chat_users?.name,
      user_phone: conv.chat_users?.phone,
      agent_name: conv.support_agent?.name
    })) as SupportConversation[];
  }

  // Get conversations assigned to a specific agent
  async getAgentConversations(agentId: number): Promise<SupportConversation[]> {
    const { data, error } = await supabase
      .from('support_conversations')
      .select(`
        *,
        chat_users!support_conversations_user_id_fkey(name, phone)
      `)
      .eq('agent_id', agentId)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(conv => ({
      ...conv,
      user_name: conv.chat_users?.name,
      user_phone: conv.chat_users?.phone
    })) as SupportConversation[];
  }

  // Assign conversation to an agent
  async assignConversation(conversationId: number, agentId: number): Promise<void> {
    const { error } = await supabase
      .from('support_conversations')
      .update({ 
        agent_id: agentId, 
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) throw error;
  }

  // Update conversation status
  async updateConversationStatus(conversationId: number, status: 'open' | 'assigned' | 'closed'): Promise<void> {
    const { error } = await supabase
      .from('support_conversations')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) throw error;
  }

  // Get messages for a conversation
  async getConversationMessages(conversationId: number): Promise<SupportMessage[]> {
    const { data, error } = await supabase
      .from('messenger_messages')
      .select(`
        *,
        sender:chat_users!messenger_messages_sender_id_fkey(name, is_support_agent)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(msg => ({
      ...msg,
      sender_name: msg.sender?.name,
      is_from_support: msg.sender?.is_support_agent || false
    })) as SupportMessage[];
  }

  // Send support message
  async sendSupportMessage(conversationId: number, senderId: number, message: string, recipientId?: number): Promise<SupportMessage> {
    const { data, error } = await supabase
      .from('messenger_messages')
      .insert([{
        conversation_id: conversationId,
        sender_id: senderId,
        recipient_id: recipientId || null,
        message,
        message_type: 'text'
      }])
      .select(`
        *,
        sender:chat_users!messenger_messages_sender_id_fkey(name, is_support_agent)
      `)
      .single();

    if (error) throw error;

    // Update conversation last_message_at
    await supabase
      .from('support_conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    return {
      ...data,
      sender_name: data.sender?.name,
      is_from_support: data.sender?.is_support_agent || false
    } as SupportMessage;
  }

  // Create or get support conversation for user
  async getOrCreateUserConversation(userId: number): Promise<SupportConversation> {
    // Check if conversation already exists
    const { data: existing, error: fetchError } = await supabase
      .from('support_conversations')
      .select(`
        *,
        chat_users!support_conversations_user_id_fkey(name, phone)
      `)
      .eq('user_id', userId)
      .eq('status', 'open')
      .single();

    if (existing && !fetchError) {
      return {
        ...existing,
        user_name: existing.chat_users?.name,
        user_phone: existing.chat_users?.phone
      } as SupportConversation;
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('support_conversations')
      .insert([{ user_id: userId }])
      .select(`
        *,
        chat_users!support_conversations_user_id_fkey(name, phone)
      `)
      .single();

    if (error) throw error;

    return {
      ...data,
      user_name: data.chat_users?.name,
      user_phone: data.chat_users?.phone
    } as SupportConversation;
  }
}

export const supportService = new SupportService();
