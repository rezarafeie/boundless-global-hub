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
  // Enhanced helper method to set session context with better error handling and retries
  private async setSessionContext(sessionToken: string, retries: number = 3): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Setting session context for support service - attempt ${attempt}/${retries}`);
        
        const { error } = await supabase.rpc('set_session_context', { 
          session_token: sessionToken 
        });
        
        if (error) {
          console.error(`Session context attempt ${attempt} failed:`, error);
          if (attempt === retries) {
            throw new Error(`Failed to set session context after ${retries} attempts: ${error.message}`);
          }
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
          continue;
        }
        
        console.log(`Session context set successfully on attempt ${attempt}`);
        return;
      } catch (error) {
        console.error(`Session context attempt ${attempt} error:`, error);
        if (attempt === retries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
  }

  // Enhanced method to ensure session context is set before any operation
  private async ensureSessionContext(sessionToken: string): Promise<void> {
    if (!sessionToken) {
      throw new Error('Session token is required for this operation');
    }
    
    try {
      await this.setSessionContext(sessionToken, 3);
    } catch (error) {
      console.error('Failed to ensure session context:', error);
      throw new Error('Authentication failed. Please log in again.');
    }
  }

  // Get all support conversations for admin view
  async getSupportConversations(): Promise<SupportConversation[]> {
    const sessionToken = localStorage.getItem('messenger_session_token');
    if (sessionToken) {
      await this.ensureSessionContext(sessionToken);
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
      await this.ensureSessionContext(sessionToken);
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
      await this.ensureSessionContext(sessionToken);
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
      await this.ensureSessionContext(sessionToken);
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
      await this.ensureSessionContext(sessionToken);
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
      await this.ensureSessionContext(sessionToken);
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

  // Create or get support conversation for user - ENHANCED VERSION with better session handling
  async getOrCreateUserConversation(userId: number, sessionToken: string): Promise<SupportConversation> {
    console.log('Getting or creating conversation for user:', userId);
    
    if (!sessionToken) {
      throw new Error('Session token is required');
    }
    
    // CRITICAL: ALWAYS set session context first with retry logic
    console.log('Setting session context before conversation operations...');
    await this.ensureSessionContext(sessionToken);
    console.log('Session context set successfully');
    
    try {
      // First, try to find existing conversation
      console.log('Looking for existing conversation...');
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

      if (fetchError) {
        console.error('Error fetching existing conversation:', fetchError);
        throw fetchError;
      }

      if (existing) {
        console.log('Found existing conversation:', existing.id);
        return {
          ...existing,
          user_name: existing.chat_users?.name,
          user_phone: existing.chat_users?.phone,
          status: existing.status as 'open' | 'assigned' | 'closed' | null,
          priority: existing.priority as 'low' | 'normal' | 'high' | 'urgent' | null
        } as SupportConversation;
      }

      console.log('No existing conversation found, creating new one...');
      
      // Ensure session context is still set before creating new conversation
      await this.ensureSessionContext(sessionToken);
      
      // Create new conversation - the permissive policy should allow this
      const { data: newConversation, error: createError } = await supabase
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

      if (createError) {
        console.error('Error creating support conversation:', createError);
        
        // Enhanced error handling for RLS violations
        if (createError.message.includes('row-level security policy')) {
          console.error('RLS Policy violation during conversation creation - this should not happen');
          throw new Error('Permission denied while creating conversation. Please refresh and try again.');
        }
        
        throw createError;
      }

      console.log('Successfully created conversation:', newConversation.id);

      return {
        ...newConversation,
        user_name: newConversation.chat_users?.name,
        user_phone: newConversation.chat_users?.phone,
        status: newConversation.status as 'open' | 'assigned' | 'closed' | null,
        priority: newConversation.priority as 'low' | 'normal' | 'high' | 'urgent' | null
      } as SupportConversation;

    } catch (error) {
      console.error('Error in getOrCreateUserConversation:', error);
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('authentication') || error.message.includes('session')) {
          throw new Error('Session expired. Please refresh the page and log in again.');
        }
        if (error.message.includes('permission') || error.message.includes('security')) {
          throw new Error('Access denied. Please refresh the page and try again.');
        }
      }
      
      throw error;
    }
  }
}

export const supportService = new SupportService();
