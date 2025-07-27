
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
}

// Database schema types - matching actual database structure
export interface ChatRoom {
  id: number;
  name: string;
  type: string;
  description: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_super_group: boolean;
  is_boundless_only: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessengerUser {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_approved: boolean;
  is_messenger_admin: boolean;
  is_support_agent: boolean;
  bedoun_marz: boolean;
  bedoun_marz_approved: boolean;
  bedoun_marz_request: boolean;
  role: string | null;
  created_at: string;
  updated_at: string;
  last_seen: string | null;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  country_code: string | null;
  password_hash: string | null;
  signup_source: string | null;
  notification_enabled: boolean;
  notification_token: string | null;
}

export interface MessengerMessage {
  id: number;
  sender_id: number;
  recipient_id: number | null;
  room_id: number | null;
  conversation_id: number | null;
  topic_id: number | null;
  message: string;
  message_type: string;
  media_url: string | null;
  media_content: string | null;
  is_read: boolean;
  unread_by_support: boolean;
  reply_to_message_id: number | null;
  forwarded_from_message_id: number | null;
  created_at: string;
}

export interface PrivateMessage {
  id: number;
  sender_id: number;
  conversation_id: number;
  message: string;
  message_type: string | null;
  media_url: string | null;
  media_content: string | null;
  is_read: boolean | null;
  reply_to_message_id: number | null;
  forwarded_from_message_id: number | null;
  created_at: string;
}

export interface PrivateConversation {
  id: number;
  user1_id: number;
  user2_id: number;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

export interface AdminSettings {
  id: number;
  manual_approval_enabled: boolean;
  updated_at: string;
}

export interface ShortLink {
  id: string;
  slug: string;
  original_url: string;
  clicks: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ShortLinkInsert {
  slug?: string;
  original_url: string;
  created_by?: string;
}
