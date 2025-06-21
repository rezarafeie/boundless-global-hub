
export interface Announcement {
  id: number;
  title: string;
  type: 'urgent' | 'general' | 'technical' | 'educational';
  summary: string;
  full_text: string;
  media_type: 'none' | 'image' | 'audio' | 'video';
  media_content: string | null;
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
}

export interface LiveSettings {
  id: number;
  is_live: boolean;
  stream_code: string | null;
  title: string | null;
  viewers: number;
  updated_at: string;
}

export interface AnnouncementInsert {
  title: string;
  type: 'urgent' | 'general' | 'technical' | 'educational';
  summary: string;
  full_text: string;
  media_type: 'none' | 'image' | 'audio' | 'video';
  media_content?: string;
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
}
