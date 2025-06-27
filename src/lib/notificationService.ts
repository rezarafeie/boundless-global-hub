
import { supabase } from '@/integrations/supabase/client';
import type { Notification, NotificationInsert } from '@/types/notifications';

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Notification[];
  },

  async getActive(): Promise<Notification[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Notification[];
  },

  async create(notification: NotificationInsert): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select()
      .single();
    
    if (error) throw error;
    return data as Notification;
  },

  async update(id: number, updates: Partial<NotificationInsert>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Notification;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async toggleActive(id: number, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_active: !isActive, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }
};
