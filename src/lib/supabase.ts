
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for database operations
export const announcementsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(announcement: any) {
    const { data, error } = await supabase
      .from('announcements')
      .insert([announcement])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async togglePin(id: number, isPinned: boolean) {
    const { error } = await supabase
      .from('announcements')
      .update({ is_pinned: !isPinned })
      .eq('id', id);
    
    if (error) throw error;
  },

  async incrementViews(id: number) {
    const { error } = await supabase
      .rpc('increment_views', { announcement_id: id });
    
    if (error) throw error;
  }
};

export const chatService = {
  async getMessages() {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async sendMessage(message: any) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([message])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteMessage(id: number) {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async togglePin(id: number, isPinned: boolean) {
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_pinned: !isPinned })
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const liveService = {
  async getSettings() {
    const { data, error } = await supabase
      .from('live_settings')
      .select('*')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateSettings(settings: any) {
    const { data, error } = await supabase
      .from('live_settings')
      .upsert([{ id: 1, ...settings }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
