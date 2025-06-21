import { supabase } from '@/integrations/supabase/client';
import type { Announcement, ChatMessage, LiveSettings, AnnouncementInsert, ChatMessageInsert, ChatTopic, ChatTopicInsert } from '@/types/supabase';

// Define additional types for new tables
export type ChatUser = {
  id: number;
  name: string;
  phone: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
};

export type UserSession = {
  id: string;
  user_id: number;
  session_token: string;
  is_active: boolean;
  last_activity: string;
  created_at: string;
};

// Helper functions for database operations
export const announcementsService = {
  async getAll(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Announcement[];
  },

  async create(announcement: AnnouncementInsert): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .insert([announcement])
      .select()
      .single();
    
    if (error) throw error;
    return data as Announcement;
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
    return (data || []) as ChatMessage[];
  },

  async getMessagesByTopic(topicId: number): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return (data || []) as ChatMessage[];
  },

  async sendMessage(message: ChatMessageInsert): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([message])
      .select()
      .single();
    
    if (error) throw error;
    return data as ChatMessage;
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

export const chatTopicsService = {
  async getAll(): Promise<ChatTopic[]> {
    const { data, error } = await supabase
      .from('chat_topics')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as ChatTopic[];
  },

  async create(topic: ChatTopicInsert): Promise<ChatTopic> {
    const { data, error } = await supabase
      .from('chat_topics')
      .insert([topic])
      .select()
      .single();
    
    if (error) throw error;
    return data as ChatTopic;
  },

  async update(id: number, updates: Partial<ChatTopicInsert>): Promise<ChatTopic> {
    const { data, error } = await supabase
      .from('chat_topics')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as ChatTopic;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('chat_topics')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async toggleActive(id: number, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('chat_topics')
      .update({ is_active: !isActive, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const chatUserService = {
  async register(name: string, phone: string): Promise<ChatUser> {
    const { data, error } = await supabase
      .from('chat_users')
      .insert([{ name, phone }])
      .select()
      .single();
    
    if (error) throw error;
    return data as ChatUser;
  },

  async getApprovedUsers(): Promise<ChatUser[]> {
    const { data, error } = await supabase
      .from('chat_users')
      .select('*')
      .eq('is_approved', true);
    
    if (error) throw error;
    return (data || []) as ChatUser[];
  },

  async createSession(userId: number): Promise<UserSession> {
    const sessionToken = crypto.randomUUID();
    const { data, error } = await supabase
      .from('user_sessions')
      .insert([{ user_id: userId, session_token: sessionToken }])
      .select()
      .single();
    
    if (error) throw error;
    return data as UserSession;
  },

  async validateSession(sessionToken: string): Promise<{ user: ChatUser; session: UserSession } | null> {
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*, chat_users(*)')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();
    
    if (sessionError || !sessionData) return null;
    
    // Update last activity
    await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('session_token', sessionToken);
    
    return {
      user: sessionData.chat_users as ChatUser,
      session: sessionData as UserSession
    };
  },

  async deactivateSession(sessionToken: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('session_token', sessionToken);
    
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
    return data as LiveSettings | null;
  },

  async updateSettings(settings: Partial<LiveSettings>): Promise<LiveSettings> {
    const { data, error } = await supabase
      .from('live_settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();
    
    if (error) throw error;
    return data as LiveSettings;
  }
};
