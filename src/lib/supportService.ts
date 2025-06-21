
import { supabase } from '@/integrations/supabase/client';

export type SupportConversation = {
  id: number;
  user_id: number | null;
  agent_id: number | null;
  status: 'open' | 'assigned' | 'closed' | null;
  priority: 'low' | 'normal' | 'high' | 'urgent' | null;
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
  message_type: 'text' | 'image' | 'file' | null;
  media_url: string | null;
  is_read: boolean | null;
  created_at: string | null;
  sender_name?: string;
  is_from_support?: boolean;
};

class SupportService {
  // Helper method to set session context
  private async setSessionContext(sessionToken: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('set_session_context', { session_token: sessionToken });
      if (error) {
        console.error('Failed to set session context:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error setting session context:', error);
      throw error;
    }
  }

  // Get all support conversations for admin view
  async getSupportConversations(): Promise<SupportConversation[]> {
    const sessionToken = localStorage.getItem('messenger_session_token');
    if (sessionToken) {
      await this.setSessionContext(sessionToken);
    }

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
      agent_name: conv.support_agent?.name,
      status: conv.status as 'open' | 'assigned' | 'closed' | null,
      priority: conv.priority as 'low' | 'normal' | 'high' | 'urgent' | null
    })) as SupportConversation[];
  }

  // Get conversations assigned to a specific agent
  async getAgentConversations(agentId: number): Promise<SupportConversation[]> {
    const sessionToken = localStorage.getItem('messenger_session_token');
    if (sessionToken) {
      await this.setSessionContext(sessionToken);
    }

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
      user_phone: conv.chat_users?.phone,
      status: conv.status as 'open' | 'assigned' | 'closed' | null,
      priority: conv.priority as 'low' | 'normal' | 'high' | 'urgent' | null
    })) as SupportConversation[];
  }

  // Assign conversation to an agent
  async assignConversation(conversationId: number, agentId: number): Promise<void> {
    const sessionToken = localStorage.getItem('messenger_session_token');
    if (sessionToken) {
      await this.setSessionContext(sessionToken);
    }

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
    const sessionToken = localStorage.getItem('messenger_session_token');
    if (sessionToken) {
      await this.setSessionContext(sessionToken);
    }

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
    const sessionToken = localStorage.getItem('messenger_session_token');
    if (sessionToken) {
      await this.setSessionContext(sessionToken);
    }

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
      is_from_support: msg.sender?.is_support_agent || false,
      message_type: msg.message_type as 'text' | 'image' | 'file' | null
    })) as SupportMessage[];
  }

  // Send support message
  async sendSupportMessage(conversationId: number, senderId: number, message: string, recipientId?: number): Promise<SupportMessage> {
    const sessionToken = localStorage.getItem('messenger_session_token');
    if (sessionToken) {
      await this.setSessionContext(sessionToken);
    }

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
      is_from_support: data.sender?.is_support_agent || false,
      message_type: data.message_type as 'text' | 'image' | 'file' | null
    } as SupportMessage;
  }

  // Create or get support conversation for user
  async getOrCreateUserConversation(userId: number, sessionToken: string): Promise<SupportConversation> {
    // Set session context for RLS
    await this.setSessionContext(sessionToken);
    
    console.log('Setting session context and looking for existing conversation for user:', userId);
    
    // Check if conversation already exists
    const { data: existing, error: fetchError } = await supabase
      .from('support_conversations')
      .select(`
        *,
        chat_users!support_conversations_user_id_fkey(name, phone)
      `)
      .eq('user_id', userId)
      .in('status', ['open', 'assigned'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && !fetchError) {
      console.log('Found existing conversation:', existing.id);
      return {
        ...existing,
        user_name: existing.chat_users?.name,
        user_phone: existing.chat_users?.phone,
        status: existing.status as 'open' | 'assigned' | 'closed' | null,
        priority: existing.priority as 'low' | 'normal' | 'high' | 'urgent' | null
      } as SupportConversation;
    }

    console.log('Creating new support conversation for user:', userId);
    
    // Create new conversation
    const { data, error } = await supabase
      .from('support_conversations')
      .insert([{ 
        user_id: userId,
        status: 'open',
        priority: 'normal',
        last_message_at: new Date().toISOString()
      }])
      .select(`
        *,
        chat_users!support_conversations_user_id_fkey(name, phone)
      `)
      .single();

    if (error) {
      console.error('Error creating support conversation:', error);
      throw error;
    }

    console.log('Successfully created conversation:', data.id);

    return {
      ...data,
      user_name: data.chat_users?.name,
      user_phone: data.chat_users?.phone,
      status: data.status as 'open' | 'assigned' | 'closed' | null,
      priority: data.priority as 'low' | 'normal' | 'high' | 'urgent' | null
    } as SupportConversation;
  }
}

export const supportService = new SupportService();
