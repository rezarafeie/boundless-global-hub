
import { supabase } from '@/integrations/supabase/client';

// Debug logging function
const debugLog = (...args: any[]) => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('debug') === 'true') {
    console.log('[PrivateMessageService]', ...args);
  }
};

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
  sender?: {
    name: string;
    phone?: string;
  };
}

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
  last_message?: MessengerMessage;
  last_message_time?: string;
  unread_count?: number;
}

export interface MessengerMessage {
  id: number;
  sender_id: number;
  sender_name?: string;
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
  sender?: {
    name: string;
    phone?: string;
  };
}

export interface ChatTopic {
  id: number;
  title: string;
  description: string | null;
  room_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const messengerService = {
  async getRooms(): Promise<ChatRoom[]> {
    try {
      console.log('Fetching rooms with enhanced data...');
      
      // Get rooms with last message info
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          name,
          type,
          description,
          avatar_url,
          is_active,
          is_super_group,
          is_boundless_only,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching rooms:', error);
        return [];
      }

      if (!rooms || rooms.length === 0) {
        console.log('No rooms found');
        return [];
      }

      // Fetch last message for each room
      const roomsWithMessages = await Promise.all(
        rooms.map(async (room) => {
          try {
            // Get last message for this room
            const { data: lastMessage, error: messageError } = await supabase
              .from('messenger_messages')
              .select(`
                id,
                sender_id,
                message,
                message_type,
                media_url,
                media_content,
                created_at,
                chat_users!messenger_messages_sender_id_fkey (name)
              `)
              .eq('room_id', room.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            // Get unread count (this is a simplified approach - in a real app you'd need user-specific read status)
            const { count: unreadCount } = await supabase
              .from('messenger_messages')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', room.id)
              .eq('is_read', false);

            const roomWithMessage: ChatRoom = {
              ...room,
              last_message: lastMessage ? {
                ...lastMessage,
                sender_name: lastMessage.chat_users?.name || 'Unknown',
                recipient_id: null,
                room_id: room.id,
                conversation_id: null,
                topic_id: null,
                is_read: false,
                unread_by_support: false,
                reply_to_message_id: null,
                forwarded_from_message_id: null
              } : undefined,
              last_message_time: lastMessage?.created_at || room.updated_at,
              unread_count: unreadCount || 0
            };

            return roomWithMessage;
          } catch (error) {
            console.error(`Error fetching data for room ${room.id}:`, error);
            return {
              ...room,
              last_message: undefined,
              last_message_time: room.updated_at,
              unread_count: 0
            };
          }
        })
      );

      console.log('Rooms with messages fetched successfully:', roomsWithMessages.length);
      return roomsWithMessages;
    } catch (error) {
      console.error('Error in getRooms:', error);
      return [];
    }
  },

  async getOrCreateChatUser(email: string): Promise<MessengerUser> {
    try {
      console.log('Getting or creating chat user for email:', email);
      
      const { data: existingUser, error: fetchError } = await supabase
        .from('chat_users')
        .select('*')
        .eq('email', email)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user:', fetchError);
        throw fetchError;
      }

      if (existingUser) {
        console.log('Found existing user:', existingUser.id);
        return existingUser;
      }

      // Create new user
      const userName = email.split('@')[0];
      const { data: newUser, error: createError } = await supabase
        .from('chat_users')
        .insert([{
          name: userName,
          email: email,
          phone: '', // Will be updated later
          is_approved: true,
          signup_source: 'email'
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        throw createError;
      }

      console.log('Created new user:', newUser.id);
      return newUser;
    } catch (error) {
      console.error('Error in getOrCreateChatUser:', error);
      throw error;
    }
  },

  async createRoom(roomData: { name: string; description?: string; type: string }): Promise<ChatRoom> {
    try {
      console.log('Creating room:', roomData.name);
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert([{
          name: roomData.name,
          description: roomData.description || '',
          type: roomData.type,
          is_active: true,
          is_super_group: false,
          is_boundless_only: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating room:', error);
        throw error;
      }

      console.log('Room created successfully:', data.id);
      return {
        ...data,
        last_message: undefined,
        last_message_time: data.created_at,
        unread_count: 0
      };
    } catch (error) {
      console.error('Error in createRoom:', error);
      throw error;
    }
  },

  async sendMessage(senderId: number, message: string, roomId?: number, recipientId?: number, conversationId?: number, topicId?: number, mediaUrl?: string, mediaType?: string, mediaContent?: string): Promise<MessengerMessage | null> {
    try {
      console.log('Sending message:', { senderId, roomId, recipientId, conversationId, topicId });
      
      const { data, error } = await supabase
        .from('messenger_messages')
        .insert([{
          sender_id: senderId,
          message,
          room_id: roomId || null,
          recipient_id: recipientId || null,
          conversation_id: conversationId || null,
          topic_id: topicId || null,
          message_type: mediaType || 'text',
          media_url: mediaUrl || null,
          media_content: mediaContent || null,
          is_read: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      console.log('Message sent successfully:', data.id);
      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  },

  async getMessages(roomId?: number, conversationId?: number, topicId?: number): Promise<MessengerMessage[]> {
    try {
      console.log('Fetching messages for:', { roomId, conversationId, topicId });
      
      let query = supabase
        .from('messenger_messages')
        .select(`
          id,
          sender_id,
          recipient_id,
          room_id,
          conversation_id,
          topic_id,
          message,
          message_type,
          media_url,
          media_content,
          is_read,
          unread_by_support,
          reply_to_message_id,
          forwarded_from_message_id,
          created_at,
          chat_users!messenger_messages_sender_id_fkey (name)
        `)
        .order('created_at', { ascending: true });

      if (roomId) {
        query = query.eq('room_id', roomId);
      } else if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      } else if (topicId) {
        query = query.eq('topic_id', topicId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      const messages = (data || []).map(msg => ({
        ...msg,
        sender_name: msg.chat_users?.name || 'Unknown'
      }));

      console.log('Messages fetched successfully:', messages.length);
      return messages;
    } catch (error) {
      console.error('Error in getMessages:', error);
      return [];
    }
  },

  async getAllMessages(): Promise<MessengerMessage[]> {
    try {
      console.log('Fetching all messages...');
      
      const { data, error } = await supabase
        .from('messenger_messages')
        .select(`
          id,
          sender_id,
          recipient_id,
          room_id,
          conversation_id,
          topic_id,
          message,
          message_type,
          media_url,
          media_content,
          is_read,
          unread_by_support,
          reply_to_message_id,
          forwarded_from_message_id,
          created_at,
          chat_users!messenger_messages_sender_id_fkey (name, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all messages:', error);
        return [];
      }

      const messages = (data || []).map(msg => ({
        ...msg,
        sender_name: msg.chat_users?.name || 'Unknown',
        sender: {
          name: msg.chat_users?.name || 'Unknown',
          phone: msg.chat_users?.phone || ''
        }
      }));

      console.log('All messages fetched successfully:', messages.length);
      return messages;
    } catch (error) {
      console.error('Error in getAllMessages:', error);
      return [];
    }
  },

  async deleteMessage(messageId: number): Promise<void> {
    try {
      console.log('Deleting message:', messageId);
      
      const { error } = await supabase
        .from('messenger_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Error deleting message:', error);
        throw error;
      }

      console.log('Message deleted successfully:', messageId);
    } catch (error) {
      console.error('Error in deleteMessage:', error);
      throw error;
    }
  },

  async validateSession(sessionToken: string): Promise<MessengerUser | null> {
    try {
      console.log('Validating session token...');
      
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          user_id,
          is_active,
          last_activity,
          chat_users!user_sessions_user_id_fkey (*)
        `)
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.error('Session validation failed:', error);
        return null;
      }

      // Check if session is still valid (within 24 hours)
      const lastActivity = new Date(data.last_activity);
      const now = new Date();
      const timeDiff = now.getTime() - lastActivity.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        console.log('Session expired');
        return null;
      }

      console.log('Session validated successfully for user:', data.user_id);
      return data.chat_users;
    } catch (error) {
      console.error('Error in validateSession:', error);
      return null;
    }
  },

  async getAllUsers(): Promise<MessengerUser[]> {
    try {
      console.log('Fetching all users...');
      
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      console.log('All users fetched successfully:', data.length);
      return data || [];
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return [];
    }
  },

  async updateUser(userId: number, updateData: Partial<MessengerUser>): Promise<void> {
    try {
      console.log('Updating user:', userId);
      
      const { error } = await supabase
        .from('chat_users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }

      console.log('User updated successfully:', userId);
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  },

  async updateUserRole(userId: number, updateData: Partial<MessengerUser>): Promise<void> {
    try {
      console.log('Updating user role:', userId);
      
      const { error } = await supabase
        .from('chat_users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        throw error;
      }

      console.log('User role updated successfully:', userId);
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      throw error;
    }
  },

  async updateRoom(roomId: number, updateData: Partial<ChatRoom>): Promise<void> {
    try {
      console.log('Updating room:', roomId);
      
      const { error } = await supabase
        .from('chat_rooms')
        .update(updateData)
        .eq('id', roomId);

      if (error) {
        console.error('Error updating room:', error);
        throw error;
      }

      console.log('Room updated successfully:', roomId);
    } catch (error) {
      console.error('Error in updateRoom:', error);
      throw error;
    }
  },

  async deleteRoom(roomId: number): Promise<void> {
    try {
      console.log('Deleting room:', roomId);
      
      const { error } = await supabase
        .from('chat_rooms')
        .update({ is_active: false })
        .eq('id', roomId);

      if (error) {
        console.error('Error deleting room:', error);
        throw error;
      }

      console.log('Room deleted successfully:', roomId);
    } catch (error) {
      console.error('Error in deleteRoom:', error);
      throw error;
    }
  },

  async getTopics(): Promise<ChatTopic[]> {
    try {
      console.log('Fetching topics...');
      
      const { data, error } = await supabase
        .from('chat_topics')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching topics:', error);
        return [];
      }

      console.log('Topics fetched successfully:', data.length);
      return data || [];
    } catch (error) {
      console.error('Error in getTopics:', error);
      return [];
    }
  },

  async createTopic(topicData: { title: string; description?: string; room_id?: number }): Promise<ChatTopic> {
    try {
      console.log('Creating topic:', topicData.title);
      
      const { data, error } = await supabase
        .from('chat_topics')
        .insert([{
          title: topicData.title,
          description: topicData.description || '',
          room_id: topicData.room_id || null,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating topic:', error);
        throw error;
      }

      console.log('Topic created successfully:', data.id);
      return data;
    } catch (error) {
      console.error('Error in createTopic:', error);
      throw error;
    }
  },

  async updateTopic(topicId: number, updateData: Partial<ChatTopic>): Promise<void> {
    try {
      console.log('Updating topic:', topicId);
      
      const { error } = await supabase
        .from('chat_topics')
        .update(updateData)
        .eq('id', topicId);

      if (error) {
        console.error('Error updating topic:', error);
        throw error;
      }

      console.log('Topic updated successfully:', topicId);
    } catch (error) {
      console.error('Error in updateTopic:', error);
      throw error;
    }
  },

  async deleteTopic(topicId: number): Promise<void> {
    try {
      console.log('Deleting topic:', topicId);
      
      const { error } = await supabase
        .from('chat_topics')
        .update({ is_active: false })
        .eq('id', topicId);

      if (error) {
        console.error('Error deleting topic:', error);
        throw error;
      }

      console.log('Topic deleted successfully:', topicId);
    } catch (error) {
      console.error('Error in deleteTopic:', error);
      throw error;
    }
  },

  async getConversations(userId: number): Promise<any[]> {
    try {
      console.log('Fetching conversations for user:', userId);
      
      const { data, error } = await supabase
        .from('messenger_messages')
        .select(`
          id,
          sender_id,
          recipient_id,
          conversation_id,
          message,
          created_at,
          chat_users!messenger_messages_sender_id_fkey (name, avatar_url)
        `)
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .not('conversation_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      // Group by conversation_id and get latest message for each
      const conversationMap = new Map();
      
      (data || []).forEach(msg => {
        const convId = msg.conversation_id;
        if (!conversationMap.has(convId) || 
            new Date(msg.created_at) > new Date(conversationMap.get(convId).created_at)) {
          conversationMap.set(convId, msg);
        }
      });

      const conversations = Array.from(conversationMap.values()).map(msg => ({
        id: msg.conversation_id,
        last_message: msg.message,
        last_message_time: msg.created_at,
        chat_users: msg.chat_users,
        unread_count: 0 // Simplified for now
      }));

      console.log('Conversations fetched successfully:', conversations.length);
      return conversations;
    } catch (error) {
      console.error('Error in getConversations:', error);
      return [];
    }
  },

  async updateNotificationSettings(userId: number, enabled: boolean): Promise<void> {
    try {
      console.log('Updating notification settings for user:', userId, 'enabled:', enabled);
      
      const { error } = await supabase
        .from('chat_users')
        .update({ notification_enabled: enabled })
        .eq('id', userId);

      if (error) {
        console.error('Error updating notification settings:', error);
        throw error;
      }

      console.log('Notification settings updated successfully');
    } catch (error) {
      console.error('Error in updateNotificationSettings:', error);
      throw error;
    }
  },

  // Additional methods needed by various components
  async getUserByPhone(phone: string): Promise<MessengerUser | null> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (error) {
        console.error('Error fetching user by phone:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserByPhone:', error);
      return null;
    }
  },

  async getUserById(userId: number): Promise<MessengerUser | null> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserById:', error);
      return null;
    }
  },

  async getRoomById(roomId: number): Promise<ChatRoom | null> {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) {
        console.error('Error fetching room by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getRoomById:', error);
      return null;
    }
  },

  async loginWithPassword(phone: string, password: string): Promise<{ user: MessengerUser; sessionToken: string } | null> {
    try {
      // This is a mock implementation - in reality you'd validate password hash
      const user = await this.getUserByPhone(phone);
      if (!user) return null;

      const sessionToken = 'mock-session-token';
      return { user, sessionToken };
    } catch (error) {
      console.error('Error in loginWithPassword:', error);
      return null;
    }
  },

  async registerWithPassword(userData: Partial<MessengerUser>, password: string): Promise<MessengerUser | null> {
    try {
      // This is a mock implementation - in reality you'd hash the password
      const { data, error } = await supabase
        .from('chat_users')
        .insert([{
          ...userData,
          password_hash: 'mock-hash', // In reality, hash the password
          is_approved: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Error registering user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in registerWithPassword:', error);
      return null;
    }
  },

  async createSession(userId: number): Promise<string> {
    try {
      const sessionToken = 'mock-session-token-' + Date.now();
      
      const { error } = await supabase
        .from('user_sessions')
        .insert([{
          user_id: userId,
          session_token: sessionToken,
          is_active: true,
          last_activity: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error creating session:', error);
        throw error;
      }

      return sessionToken;
    } catch (error) {
      console.error('Error in createSession:', error);
      throw error;
    }
  },

  async updateUserPassword(userId: number, newPassword: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_users')
        .update({ password_hash: 'mock-hash' }) // In reality, hash the password
        .eq('id', userId);

      if (error) {
        console.error('Error updating password:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateUserPassword:', error);
      throw error;
    }
  },

  async getSupportMessages(conversationId: number): Promise<MessengerMessage[]> {
    try {
      const { data, error } = await supabase
        .from('messenger_messages')
        .select(`
          id,
          sender_id,
          recipient_id,
          room_id,
          conversation_id,
          topic_id,
          message,
          message_type,
          media_url,
          media_content,
          is_read,
          unread_by_support,
          reply_to_message_id,
          forwarded_from_message_id,
          created_at,
          chat_users!messenger_messages_sender_id_fkey (name, phone)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching support messages:', error);
        return [];
      }

      return (data || []).map(msg => ({
        ...msg,
        sender: {
          name: msg.chat_users?.name || 'Unknown',
          phone: msg.chat_users?.phone || ''
        }
      }));
    } catch (error) {
      console.error('Error in getSupportMessages:', error);
      return [];
    }
  },

  async sendSupportMessage(recipientId: number, message: string, conversationId: number, mediaUrl?: string, mediaType?: string, mediaContent?: string): Promise<MessengerMessage | null> {
    try {
      const { data, error } = await supabase
        .from('messenger_messages')
        .insert([{
          sender_id: 1, // Support agent ID
          recipient_id: recipientId,
          conversation_id: conversationId,
          message,
          message_type: mediaType || 'text',
          media_url: mediaUrl || null,
          media_content: mediaContent || null,
          is_read: false,
          unread_by_support: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Error sending support message:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in sendSupportMessage:', error);
      throw error;
    }
  },

  async getUsersCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('chat_users')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error getting users count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUsersCount:', error);
      return 0;
    }
  },

  async getMessagesCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messenger_messages')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error getting messages count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getMessagesCount:', error);
      return 0;
    }
  },

  async getEnrollmentsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error getting enrollments count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getEnrollmentsCount:', error);
      return 0;
    }
  }
};
