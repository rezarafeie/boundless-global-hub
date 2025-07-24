
import { supabase } from '@/integrations/supabase/client';
import type { ChatUser } from './supabase';

export const chatUserAdminService = {
  async getAllUsers(searchTerm?: string, limit?: number, offset?: number): Promise<{ users: ChatUser[], total: number }> {
    // First get total count (with search if applied)
    let countQuery = supabase
      .from('chat_users')
      .select('*', { count: 'exact', head: true });
    
    if (searchTerm) {
      countQuery = countQuery.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%,phone.ilike.%0${searchTerm}%`);
    }
    
    const { count } = await countQuery;
    
    // Then get the actual data for display (with pagination)
    let dataQuery = supabase
      .from('chat_users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (searchTerm) {
      dataQuery = dataQuery.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%,phone.ilike.%0${searchTerm}%`);
    }
    
    if (limit && offset !== undefined) {
      dataQuery = dataQuery.range(offset, offset + limit - 1);
    }
    
    const { data, error } = await dataQuery;
    
    if (error) throw error;
    return { users: (data || []) as ChatUser[], total: count || 0 };
  },

  async getPendingUsers(searchTerm?: string, limit?: number, offset?: number): Promise<{ users: ChatUser[], total: number }> {
    // First get total count
    let countQuery = supabase
      .from('chat_users')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', false);
    
    if (searchTerm) {
      countQuery = countQuery.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%,phone.ilike.%0${searchTerm}%`);
    }
    
    const { count } = await countQuery;
    
    // Then get data for display
    let dataQuery = supabase
      .from('chat_users')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });
    
    if (searchTerm) {
      dataQuery = dataQuery.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%,phone.ilike.%0${searchTerm}%`);
    }
    
    if (limit && offset !== undefined) {
      dataQuery = dataQuery.range(offset, offset + limit - 1);
    }
    
    const { data, error } = await dataQuery;
    
    if (error) throw error;
    return { users: (data || []) as ChatUser[], total: count || 0 };
  },

  async getApprovedUsers(searchTerm?: string, limit?: number, offset?: number): Promise<{ users: ChatUser[], total: number }> {
    // First get total count
    let countQuery = supabase
      .from('chat_users')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', true);
    
    if (searchTerm) {
      countQuery = countQuery.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%,phone.ilike.%0${searchTerm}%`);
    }
    
    const { count } = await countQuery;
    
    // Then get data for display
    let dataQuery = supabase
      .from('chat_users')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
    
    if (searchTerm) {
      dataQuery = dataQuery.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%,phone.ilike.%0${searchTerm}%`);
    }
    
    if (limit && offset !== undefined) {
      dataQuery = dataQuery.range(offset, offset + limit - 1);
    }
    
    const { data, error } = await dataQuery;
    
    if (error) throw error;
    return { users: (data || []) as ChatUser[], total: count || 0 };
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

  async getActiveSessions(searchTerm?: string, limit?: number, offset?: number): Promise<{ sessions: any[], total: number }> {
    let query = supabase
      .from('user_sessions')
      .select(`
        *,
        chat_users (
          id,
          name,
          phone
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('last_activity', { ascending: false });
    
    if (searchTerm) {
      query = query.filter('chat_users.name', 'ilike', `%${searchTerm}%`);
    }
    
    if (limit && offset !== undefined) {
      query = query.range(offset, offset + limit - 1);
    }
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    return { sessions: data || [], total: count || 0 };
  },

  async forceLogoutUser(sessionToken: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('session_token', sessionToken);
    
    if (error) throw error;
  }
};
