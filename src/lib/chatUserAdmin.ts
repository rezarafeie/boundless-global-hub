
import { supabase } from '@/integrations/supabase/client';
import type { ChatUser } from './supabase';

export const chatUserAdminService = {
  async getAllUsers(searchTerm?: string, limit: number = 100, offset: number = 0): Promise<{ users: ChatUser[], total: number }> {
    console.log('getAllUsers called with:', { searchTerm, limit, offset });
    
    // Use same search pattern as working support search
    const searchConditions = searchTerm ? `name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%` : '';
    
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
    
    // Get data
    let dataQuery = supabase
      .from('chat_users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (searchTerm && searchConditions) {
      dataQuery = dataQuery.or(searchConditions);
      // When searching, return all matching results (up to 500 for performance)
      dataQuery = dataQuery.limit(500);
    } else {
      // Default pagination: 100 records per page
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

  async getPendingUsers(searchTerm?: string, limit: number = 100, offset: number = 0): Promise<{ users: ChatUser[], total: number }> {
    console.log('getPendingUsers called with:', { searchTerm, limit, offset });
    
    // Use same search pattern as working support search
    const searchConditions = searchTerm ? `name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%` : '';
    
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
      // When searching, return all matching results (up to 500 for performance)
      dataQuery = dataQuery.limit(500);
    } else {
      // Default pagination: 100 records per page
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

  async getApprovedUsers(searchTerm?: string, limit: number = 100, offset: number = 0): Promise<{ users: ChatUser[], total: number }> {
    console.log('getApprovedUsers called with:', { searchTerm, limit, offset });
    
    // Use same search pattern as working support search
    const searchConditions = searchTerm ? `name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%` : '';
    
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
      // When searching, return all matching results (up to 500 for performance)
      dataQuery = dataQuery.limit(500);
    } else {
      // Default pagination: 100 records per page
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

  async getActiveSessions(searchTerm?: string, limit: number = 100, offset: number = 0): Promise<{ sessions: any[], total: number }> {
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
      // Search in related chat_users table
      query = query.or(`chat_users.name.ilike.%${searchTerm}%,chat_users.phone.ilike.%${searchTerm}%,chat_users.email.ilike.%${searchTerm}%`);
      // When searching, return all matching results (up to 500 for performance)
      query = query.limit(500);
    } else {
      // Default pagination: 100 records per page
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
