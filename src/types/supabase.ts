
export interface Announcement {
  id: number;
  title: string;
  type: 'urgent' | 'general' | 'technical' | 'educational';
  summary: string;
  full_text: string;
  media_type: 'none' | 'image' | 'audio' | 'video' | 'iframe';
  media_content: string | null;
  media_url: string | null;
  is_pinned: boolean;
  created_at: string;
  views: number;
}

export interface ChatMessage {
  id: number;
  sender_name: string;
  sender_role: 'admin' | 'moderator' | 'member';
  message: string;
  is_pinned: boolean;
  created_at: string;
  user_id?: number;
  topic_id?: number;
}

export interface ChatTopic {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_bedoun_marz_only?: boolean;
}

export interface LiveSettings {
  id: number;
  is_live: boolean;
  stream_code: string | null;
  title: string | null;
  viewers: number;
  updated_at: string;
}

export interface SupportMessage {
  id: number;
  user_id: number;
  sender_id: number;
  message: string;
  is_from_support: boolean;
  created_at: string;
  read_at: string | null;
}

export interface SupportAgent {
  id: number;
  user_id: number;
  phone: string;
  is_active: boolean;
  created_at: string;
}

export interface ChatUser {
  id: number;
  name: string;
  phone: string;
  is_approved: boolean;
  bedoun_marz_request: boolean;
  bedoun_marz_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementInsert {
  title: string;
  type: 'urgent' | 'general' | 'technical' | 'educational';
  summary: string;
  full_text: string;
  media_type: 'none' | 'image' | 'audio' | 'video' | 'iframe';
  media_content?: string;
  media_url?: string;
  is_pinned?: boolean;
}

export interface ChatMessageInsert {
  sender_name: string;
  sender_role: 'admin' | 'moderator' | 'member';
  message: string;
  is_pinned?: boolean;
  user_id?: number;
  topic_id?: number;
}

export interface ChatTopicInsert {
  title: string;
  description?: string;
  is_active?: boolean;
  is_bedoun_marz_only?: boolean;
}

export interface SupportMessageInsert {
  user_id: number;
  sender_id: number;
  message: string;
  is_from_support: boolean;
}
