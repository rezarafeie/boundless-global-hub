
import { supabase } from '@/integrations/supabase/client';
import type { ChatUser } from './supabase';

export const chatUserAdminService = {
  async getAllUsers(): Promise<ChatUser[]> {
    const { data, error } = await supabase
      .from('chat_users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as ChatUser[];
  },

  async getPendingUsers(): Promise<ChatUser[]> {
    const { data, error } = await supabase
      .from('chat_users')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as ChatUser[];
  },

  async approveUser(userId: number): Promise<void> {
    const { error } = await supabase
      .from('chat_users')
      .update({ is_approved: true, updated_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) throw error;
  },

  async rejectUser(userId: number): Promise<void> {
    const { error } = await supabase
      .from('chat_users')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
  },

  async deactivateUser(userId: number): Promise<void> {
    const { error } = await supabase
      .from('chat_users')
      .update({ is_approved: false, updated_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) throw error;
  },

  async getActiveSessions(): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select(`
        *,
        chat_users (
          id,
          name,
          phone
        )
      `)
      .eq('is_active', true)
      .order('last_activity', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async forceLogoutUser(sessionToken: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('session_token', sessionToken);
    
    if (error) throw error;
  }
};
