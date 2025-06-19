
import { supabase } from '@/integrations/supabase/client';
import type { Announcement, ChatMessage, LiveSettings, AnnouncementInsert, ChatMessageInsert } from '@/types/supabase';

// Helper functions for database operations
export const announcementsService = {
  async getAll(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(announcement: AnnouncementInsert): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .insert([announcement])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async togglePin(id: number, isPinned: boolean): Promise<void> {
    const { error } = await supabase
      .from('announcements')
      .update({ is_pinned: !isPinned })
      .eq('id', id);
    
    if (error) throw error;
  },

  async incrementViews(id: number): Promise<void> {
    const { error } = await supabase
      .rpc('increment_views', { announcement_id: id });
    
    if (error) throw error;
  }
};

export const chatService = {
  async getMessages(): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async sendMessage(message: ChatMessageInsert): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([message])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteMessage(id: number): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async togglePin(id: number, isPinned: boolean): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_pinned: !isPinned })
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const liveService = {
  async getSettings(): Promise<LiveSettings | null> {
    const { data, error } = await supabase
      .from('live_settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateSettings(settings: Partial<LiveSettings>): Promise<LiveSettings> {
    const { data, error } = await supabase
      .from('live_settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
