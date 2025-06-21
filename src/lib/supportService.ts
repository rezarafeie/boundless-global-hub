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
  // Enhanced robust session context setter with multiple retry strategies
  private async setSessionContext(sessionToken: string): Promise<void> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Setting session context - attempt ${attempt}/${maxRetries}`);
        
        // Use multiple approaches to ensure session context is set
        const { error: contextError } = await supabase.rpc('set_session_context', { 
          session_token: sessionToken 
        });
        
        if (contextError) {
          console.warn(`Session context attempt ${attempt} failed:`, contextError);
          lastError = new Error(`Session context failed: ${contextError.message}`);
          
          if (attempt < maxRetries) {
            // Wait with exponential backoff before retry
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
            continue;
          }
        } else {
          console.log(`Session context set successfully on attempt ${attempt}`);
          
          // Verify the context was actually set by testing session validity
          const { data: isValid } = await supabase.rpc('is_session_valid', {
            session_token_param: sessionToken
          });
          
          if (isValid) {
            console.log('Session context verified successfully');
            return;
          } else {
            console.warn(`Session context verification failed on attempt ${attempt}`);
          }
        }
      } catch (error) {
        console.error(`Session context attempt ${attempt} error:`, error);
        lastError = error as Error;
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
    
    // If all attempts failed, throw the last error
    if (lastError) {
      throw new Error(`Failed to set session context after ${maxRetries} attempts: ${lastError.message}`);
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

  // Enhanced method to get or create support conversation with multiple fallback strategies
  async getOrCreateUserConversation(userId: number, sessionToken: string): Promise<SupportConversation> {
    console.log('Getting or creating conversation for user:', userId);
    
    if (!sessionToken) {
      throw new Error('Session token is required');
    }
    
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Conversation attempt ${attempt}/${maxRetries}`);
        
        // Set session context with enhanced error handling
        await this.setSessionContext(sessionToken);
        
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
        
        // Re-ensure session context before creating
        await this.setSessionContext(sessionToken);
        
        // Create new conversation with the improved RLS policies
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
          lastError = new Error(`Conversation creation failed: ${createError.message}`);
          
          // If it's still a permission error, try next attempt
          if (createError.message.includes('row-level security') || 
              createError.message.includes('permission denied')) {
            if (attempt < maxRetries) {
              console.warn(`Permission error on attempt ${attempt}, retrying...`);
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 200));
              continue;
            }
          }
          
          throw lastError;
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
        console.error(`Conversation attempt ${attempt} error:`, error);
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 300));
        }
      }
    }

    // If all attempts failed, provide user-friendly error message
    const errorMessage = lastError?.message || 'Unknown error occurred';
    
    if (errorMessage.includes('authentication') || errorMessage.includes('session')) {
      throw new Error('Session expired. Please refresh the page and log in again.');
    }
    if (errorMessage.includes('permission') || errorMessage.includes('security')) {
      throw new Error('Access denied. Please refresh the page and try again.');
    }
    
    throw new Error(`Failed to create conversation after ${maxRetries} attempts: ${errorMessage}`);
  }
}

export const supportService = new SupportService();
