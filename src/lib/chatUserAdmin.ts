
import { supabase } from '@/integrations/supabase/client';
import type { ChatUser } from './supabase';

export const chatUserAdminService = {
  async getAllUsers(searchTerm?: string, limit?: number, offset?: number): Promise<{ users: ChatUser[], total: number }> {
    console.log('getAllUsers called with:', { searchTerm, limit, offset });
    
    // Enhanced phone search - handle various formats
    const phoneSearch = searchTerm && /^\d+$/.test(searchTerm) 
      ? [
          `phone.ilike.%${searchTerm}%`,
          `phone.ilike.%0${searchTerm}%`, 
          `phone.eq.${searchTerm}`,
          `phone.eq.0${searchTerm}`,
          // Handle cases where stored phone has +98 prefix
          `phone.ilike.%98${searchTerm}%`,
          `phone.eq.98${searchTerm}`,
          `phone.eq.+98${searchTerm}`
        ]
      : [];
    
    // Build search conditions
    const searchConditions = searchTerm ? [
      `name.ilike.%${searchTerm}%`,
      `email.ilike.%${searchTerm}%`,
      `user_id.ilike.%${searchTerm}%`,
      `id.eq.${searchTerm}`, // Add ID search
      ...phoneSearch
    ].join(',') : '';
    
    // Get total count (with search if applied)
    let countQuery = supabase
      .from('chat_users')
      .select('*', { count: 'exact', head: true });
    
    if (searchTerm && searchConditions) {
      countQuery = countQuery.or(searchConditions);
    }
    
    const { count, error: countError } = await countQuery;
    if (countError) {
      console.error('Count query error:', countError);
      throw countError;
    }
    
    console.log('getAllUsers - Total count result:', count, 'for search:', searchTerm);
    
    // Get data with pagination
    let dataQuery = supabase
      .from('chat_users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (searchTerm && searchConditions) {
      dataQuery = dataQuery.or(searchConditions);
    }
    
    if (limit && offset !== undefined) {
      dataQuery = dataQuery.range(offset, offset + limit - 1);
    }
    
    const { data, error } = await dataQuery;
    
    if (error) {
      console.error('Data query error:', error);
      throw error;
    }
    
    console.log('getAllUsers - Data result:', { found: data?.length, total: count, searchTerm });
    return { users: (data || []) as ChatUser[], total: count || 0 };
  },

  async getPendingUsers(searchTerm?: string, limit?: number, offset?: number): Promise<{ users: ChatUser[], total: number }> {
    console.log('getPendingUsers called with:', { searchTerm, limit, offset });
    
    // Normalize phone search - handle both formats (with and without leading 0)
    const phoneSearch = searchTerm && /^\d+$/.test(searchTerm) 
      ? [`phone.ilike.%${searchTerm}%`, `phone.ilike.%0${searchTerm}%`, `phone.eq.${searchTerm}`, `phone.eq.0${searchTerm}`]
      : [];
    
    // Build search conditions
    const searchConditions = searchTerm ? [
      `name.ilike.%${searchTerm}%`,
      `email.ilike.%${searchTerm}%`,
      `user_id.ilike.%${searchTerm}%`,
      ...phoneSearch
    ].join(',') : '';
    
    // Get total count
    let countQuery = supabase
      .from('chat_users')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', false);
    
    if (searchTerm && searchConditions) {
      countQuery = countQuery.or(searchConditions);
    }
    
    const { count, error: countError } = await countQuery;
    if (countError) {
      console.error('Pending count query error:', countError);
      throw countError;
    }
    
    console.log('Pending users count result:', count);
    
    // Get data for display
    let dataQuery = supabase
      .from('chat_users')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });
    
    if (searchTerm && searchConditions) {
      dataQuery = dataQuery.or(searchConditions);
    }
    
    if (limit && offset !== undefined) {
      dataQuery = dataQuery.range(offset, offset + limit - 1);
    }
    
    const { data, error } = await dataQuery;
    
    if (error) {
      console.error('Pending data query error:', error);
      throw error;
    }
    
    console.log('Pending users data result:', { count: data?.length, total: count });
    return { users: (data || []) as ChatUser[], total: count || 0 };
  },

  async getApprovedUsers(searchTerm?: string, limit?: number, offset?: number): Promise<{ users: ChatUser[], total: number }> {
    console.log('getApprovedUsers called with:', { searchTerm, limit, offset });
    
    // Enhanced phone search - handle various formats
    const phoneSearch = searchTerm && /^\d+$/.test(searchTerm) 
      ? [
          `phone.ilike.%${searchTerm}%`,
          `phone.ilike.%0${searchTerm}%`, 
          `phone.eq.${searchTerm}`,
          `phone.eq.0${searchTerm}`,
          // Handle cases where stored phone has +98 prefix
          `phone.ilike.%98${searchTerm}%`,
          `phone.eq.98${searchTerm}`,
          `phone.eq.+98${searchTerm}`
        ]
      : [];
    
    // Build search conditions
    const searchConditions = searchTerm ? [
      `name.ilike.%${searchTerm}%`,
      `email.ilike.%${searchTerm}%`,
      `user_id.ilike.%${searchTerm}%`,
      `id.eq.${searchTerm}`, // Add ID search
      ...phoneSearch
    ].join(',') : '';
    
    // Get total count with search filter
    let countQuery = supabase
      .from('chat_users')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', true);
    
    if (searchTerm && searchConditions) {
      countQuery = countQuery.or(searchConditions);
    }
    
    const { count, error: countError } = await countQuery;
    if (countError) {
      console.error('Approved count query error:', countError);
      throw countError;
    }
    
    console.log('getApprovedUsers - Count result:', count, 'for search:', searchTerm);
    
    // Get data for display with same filter
    let dataQuery = supabase
      .from('chat_users')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
    
    if (searchTerm && searchConditions) {
      dataQuery = dataQuery.or(searchConditions);
    }
    
    if (limit && offset !== undefined) {
      dataQuery = dataQuery.range(offset, offset + limit - 1);
    }
    
    const { data, error } = await dataQuery;
    
    if (error) {
      console.error('Approved data query error:', error);
      throw error;
    }
    
    console.log('getApprovedUsers - Data result:', { found: data?.length, total: count, searchTerm });
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
