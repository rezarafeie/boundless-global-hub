import { supabase } from '@/integrations/supabase/client';
import type { Announcement, ChatMessage, LiveSettings, AnnouncementInsert, ChatMessageInsert, ChatTopic, ChatTopicInsert } from '@/types/supabase';
import type { Notification, NotificationInsert } from '@/types/notifications';

// Define additional types for new tables
export type ChatUser = {
  id: number;
  name: string;
  phone: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  bedoun_marz_request?: boolean;
  bedoun_marz_approved?: boolean;
  role?: string;
  is_support_agent?: boolean;
  last_seen?: string;
  bedoun_marz?: boolean;
  is_messenger_admin?: boolean;
  username?: string;
  password_hash?: string;
  bio?: string;
  email?: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  country_code?: string;
  signup_source?: string;
  notification_enabled?: boolean;
  notification_token?: string;
  avatar_url?: string;
};

export type UserSession = {
  id: string;
  user_id: number;
  session_token: string;
  is_active: boolean;
  last_activity: string;
  created_at: string;
};

export type SalesAgent = {
  id: number;
  user_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LeadAssignment = {
  id: number;
  enrollment_id: string;
  sales_agent_id: number;
  assigned_by: number;
  assigned_at: string;
  status: string;
  updated_at: string;
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
    // Send webhook first  
    try {
      const { webhookService } = await import('@/lib/webhookService');
      const { data: sender } = await supabase
        .from('chat_users')
        .select('*')
        .eq('id', message.user_id)
        .single();

      const { data: topic } = await supabase
        .from('chat_topics')
        .select('title')
        .eq('id', message.topic_id)
        .single();

      if (sender) {
        await webhookService.sendMessageWebhook({
          messageContent: message.message,
          senderName: sender.name,
          senderPhone: sender.phone || '',
          senderEmail: sender.email || '',
          chatType: 'group',
          chatName: topic?.title || 'Unknown Topic',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error sending webhook:', error);
    }

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
  },

  async createTopic(topicData: { title: string; description: string; is_active: boolean }) {
    const { data, error } = await supabase
      .from('chat_topics')
      .insert([topicData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTopic(id: number, updates: Partial<{ title: string; description: string; is_active: boolean }>) {
    const { data, error } = await supabase
      .from('chat_topics')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteTopic(id: number) {
    const { error } = await supabase
      .from('chat_topics')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const salesAgentService = {
  async getLeadsForAgent(agentUserId: number) {
    const { data, error } = await supabase.rpc('get_user_courses_for_sales_agent', {
      agent_user_id: agentUserId
    });
    
    if (error) throw error;
    return data || [];
  },

  async getAssignmentsForAgent(agentUserId: number) {
    const { data, error } = await supabase.rpc('get_lead_assignments', {
      agent_user_id: agentUserId
    });
    
    if (error) throw error;
    return data || [];
  },

  async assignLead(enrollmentId: string, agentUserId: number, assignedBy: number) {
    const { data, error } = await supabase.rpc('assign_lead_to_agent', {
      p_enrollment_id: enrollmentId,
      p_agent_user_id: agentUserId,
      p_assigned_by: assignedBy
    });
    
    if (error) throw error;
    return data;
  },

  async assignCoursesToAgent(agentUserId: number, courseIds: string[]) {
    const { data, error } = await supabase.rpc('assign_courses_to_sales_agent', {
      p_agent_user_id: agentUserId,
      p_course_ids: courseIds
    });
    
    if (error) throw error;
    return data;
  },

  async getAgentCourses(agentUserId: number) {
    const { data, error } = await supabase.rpc('get_sales_agent_courses', {
      agent_user_id: agentUserId
    });
    
    if (error) throw error;
    return data || [];
  },

  async checkLeadAccess(agentUserId: number, enrollmentId: string) {
    const { data, error } = await supabase.rpc('check_sales_agent_lead_access', {
      p_agent_user_id: agentUserId,
      p_enrollment_id: enrollmentId
    });
    
    if (error) throw error;
    return data;
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

export const notificationsService = {
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
