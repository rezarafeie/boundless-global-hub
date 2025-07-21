import { supabase } from '@/integrations/supabase/client';
import type { Notification, NotificationInsert } from '@/types/notifications';

export const courseNotificationService = {
  async getCourseNotifications(courseId: string): Promise<Notification[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Notification[];
  },

  async createCourseNotification(courseId: string, notification: Omit<NotificationInsert, 'course_id'>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{ ...notification, course_id: courseId }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Notification;
  },

  async updateCourseNotification(id: number, updates: Partial<NotificationInsert>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Notification;
  },

  async deleteCourseNotification(id: number): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};