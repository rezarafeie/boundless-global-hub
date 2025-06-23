import { supabase } from '@/integrations/supabase/client';

// Simple, clean type definitions to avoid circular references
export interface MessengerUser {
  id: number;
  name: string;
  phone: string;
  username?: string | null;
  role?: string | null;
  is_approved: boolean;
  is_support_agent: boolean;
  is_messenger_admin: boolean;
  bedoun_marz: boolean;
  bedoun_marz_approved: boolean;
  bedoun_marz_request: boolean;
  created_at: string;
  updated_at: string;
  last_seen?: string | null;
  password_hash?: string | null;
}

export interface ChatRoom {
  id: number;
  name: string;
  description: string;
  type: string;
  is_active: boolean;
  is_boundless_only: boolean;
  created_at: string;
  updated_at: string;
  last_message?: string | null;
  last_message_time?: string | null;
  unread_count?: number | null;
  thread_type_id?: number | null;
}

export interface MessengerMessage {
  id: number;
  room_id?: number | null;
  sender_id: number;
  recipient_id?: number | null;
  message: string;
  message_type: string;
  media_url?: string | null;
  media_content?: string | null;
  is_read: boolean;
  created_at: string;
  reply_to_message_id?: number | null;
  forwarded_from_message_id?: number | null;
  conversation_id?: number | null;
  unread_by_support: boolean;
}

export interface SupportConversation {
  id: number;
  user_id: number;
  agent_id?: number | null;
  status: string;
  priority: string;
  thread_type_id: number;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  internal_notes?: string | null;
  tags?: string[] | null;
  assigned_agent_name?: string | null;
}

export interface MessageReaction {
  id: string;
  message_id: number;
  user_id: number;
  reaction: string;
  created_at: string;
}

export interface SupportThreadType {
  id: number;
  name: string;
  display_name: string;
  description?: string | null;
  is_active: boolean;
  is_boundless_only: boolean;
  created_at: string;
}

export interface SupportAgentAssignment {
  id: number;
  agent_id: number;
  thread_type_id: number;
  is_active: boolean;
  assigned_at: string;
}

export interface MessengerMessageWithUser extends MessengerMessage {
  sender?: MessengerUser | null;
  recipient?: MessengerUser | null;
  reactions?: MessageReaction[] | null;
}

export interface UserSession {
  id: string;
  user_id: number;
  session_token: string;
  is_active: boolean;
  created_at: string;
  last_activity: string;
}

interface RoomMembership {
  user_id: number;
  room_id: number;
  joined_at: string;
  last_read_at: string;
}

// Simple hash function for demo purposes (in production, use proper server-side hashing)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

const DEFAULT_AVATAR_COLORS = [
  '#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51',
  '#d62828', '#457b9d', '#1d3557', '#f72585', '#b5179e',
  '#7209b7', '#560bad', '#480ca8', '#3a0ca3', '#f77f00'
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function getColorForUsername(username: string): string {
  const index = Math.abs(hashCode(username)) % DEFAULT_AVATAR_COLORS.length;
  return DEFAULT_AVATAR_COLORS[index];
}

class MessengerService {
  // User registration and session management
  async register(name: string, phone: string, isBoundlessStudent: boolean = false): Promise<MessengerUser> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .insert({
          name: name.trim(),
          phone: phone.trim(),
          bedoun_marz_request: isBoundlessStudent,
          is_approved: true // Auto-approve for now
        })
        .select()
        .single();

      if (error) {
        console.error('Error registering user:', error);
        throw new Error(`Failed to register user: ${error.message}`);
      }

      return data as MessengerUser;
    } catch (error: any) {
      console.error('Error in register:', error);
      throw error;
    }
  }

  async registerWithPassword(
    name: string, 
    phone: string, 
    username: string, 
    password: string, 
    isBoundlessStudent: boolean = false
  ): Promise<MessengerUser> {
    try {
      // Hash the password before storing
      const hashedPassword = simpleHash(password);
      
      const { data, error } = await supabase
        .from('chat_users')
        .insert([{
          name: name.trim(),
          phone: phone.trim(),
          username: username.toLowerCase().trim(),
          password_hash: hashedPassword,
          bedoun_marz: isBoundlessStudent,
          bedoun_marz_request: isBoundlessStudent,
          is_approved: false // All users start as pending
        }])
        .select()
        .single();

      if (error) {
        console.error('Error registering user with password:', error);
        if (error.code === '23505') {
          if (error.message.includes('phone')) {
            throw new Error('این شماره تلفن قبلاً ثبت شده است');
          } else if (error.message.includes('username')) {
            throw new Error('این نام کاربری قبلاً انتخاب شده است');
          }
        }
        throw error;
      }

      return data as MessengerUser;
    } catch (error) {
      console.error('Error in registerWithPassword:', error);
      throw error;
    }
  }

  async authenticateUser(phone: string, password: string): Promise<{ session_token: string } | null> {
    try {
      // Hash the password to compare with stored hash
      const hashedPassword = simpleHash(password);
      
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('phone', phone)
        .eq('password_hash', hashedPassword)
        .single();

      if (error || !data) {
        return null;
      }

      // Create session for authenticated user
      const session = await this.createSession(data.id);
      return session;
    } catch (error) {
      console.error('Error in authenticateUser:', error);
      return null;
    }
  }

  async createSession(userId: number): Promise<UserSession> {
    try {
      const sessionToken = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_token: sessionToken,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        throw new Error(`Failed to create session: ${error.message}`);
      }

      return data as UserSession;
    } catch (error: any) {
      console.error('Error in createSession:', error);
      throw error;
    }
  }

  async validateSession(sessionToken: string): Promise<{ user: MessengerUser; session: UserSession } | null> {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (sessionError || !sessionData) {
        return null;
      }

      const { data: userData, error: userError } = await supabase
        .from('chat_users')
        .select('*')
        .eq('id', sessionData.user_id)
        .single();

      if (userError || !userData) {
        return null;
      }

      return { 
        user: userData as MessengerUser, 
        session: sessionData as UserSession 
      };
    } catch (error: any) {
      console.error('Error in validateSession:', error);
      return null;
    }
  }

  async deactivateSession(sessionToken: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken);

      if (error) {
        console.error('Error deactivating session:', error);
        throw new Error(`Failed to deactivate session: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error in deactivateSession:', error);
      throw error;
    }
  }

  // Room management
  async getRooms(sessionToken: string): Promise<ChatRoom[]> {
    try {
      await this.setSessionContext(sessionToken);
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rooms:', error);
        throw new Error(`Failed to fetch rooms: ${error.message}`);
      }

      const rooms = (data || []).map(room => ({
        ...room,
        description: room.description || ''
      }));

      return rooms as ChatRoom[];
    } catch (error: any) {
      console.error('Error in getRooms:', error);
      throw error;
    }
  }

  async getRoom(roomId: number, sessionToken: string): Promise<ChatRoom | null> {
    try {
      await this.setSessionContext(sessionToken);
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) {
        console.error('Error fetching room:', error);
        return null;
      }

      return data ? { ...data, description: data.description || '' } as ChatRoom : null;
    } catch (error: any) {
      console.error('Error in getRoom:', error);
      return null;
    }
  }

  async createRoom(room: Omit<ChatRoom, 'id' | 'created_at' | 'updated_at'>, sessionToken: string): Promise<ChatRoom> {
    try {
      await this.setSessionContext(sessionToken);
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          ...room,
          is_active: true,
          description: room.description || ''
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating room:', error);
        throw new Error(`Failed to create room: ${error.message}`);
      }

      return { ...data, description: data.description || '' } as ChatRoom;
    } catch (error: any) {
      console.error('Error in createRoom:', error);
      throw error;
    }
  }

  async updateRoom(roomId: number, updates: Partial<ChatRoom>, sessionToken: string): Promise<ChatRoom> {
    try {
      await this.setSessionContext(sessionToken);
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .update(updates)
        .eq('id', roomId)
        .select()
        .single();

      if (error) {
        console.error('Error updating room:', error);
        throw new Error(`Failed to update room: ${error.message}`);
      }

      return { ...data, description: data.description || '' } as ChatRoom;
    } catch (error: any) {
      console.error('Error in updateRoom:', error);
      throw error;
    }
  }

  async deleteRoom(roomId: number, sessionToken: string): Promise<void> {
    try {
      await this.setSessionContext(sessionToken);
      
      const { error } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId);

      if (error) {
        console.error('Error deleting room:', error);
        throw new Error(`Failed to delete room: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error in deleteRoom:', error);
      throw error;
    }
  }

  // Message management - Fixed ambiguous relationship issue
  async getMessages(roomId: number, sessionToken: string): Promise<MessengerMessageWithUser[]> {
    try {
      await this.setSessionContext(sessionToken);
      
      // Use explicit foreign key syntax to avoid ambiguous relationship error and include username
      const { data: messages, error } = await supabase
        .from('messenger_messages')
        .select(`
          *,
          sender:chat_users!messenger_messages_sender_id_fkey (
            id,
            name,
            phone,
            username,
            role,
            is_approved,
            is_support_agent,
            is_messenger_admin,
            bedoun_marz,
            bedoun_marz_approved,
            bedoun_marz_request,
            created_at,
            updated_at,
            last_seen
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw new Error(`Failed to fetch messages: ${error.message}`);
      }

      const messagesWithReactions = await Promise.all(
        (messages || []).map(async (message) => {
          const reactions = await this.getMessageReactions(message.id, sessionToken);
          return { 
            ...message, 
            reactions,
            sender_name: message.sender?.name || 'کاربر'
          };
        })
      );

      return messagesWithReactions as MessengerMessageWithUser[];
    } catch (error: any) {
      console.error('Error in getMessages:', error);
      throw error;
    }
  }

  async getPrivateMessages(userId: number, sessionToken: string): Promise<MessengerMessage[]> {
    try {
      console.log('Getting private messages for user:', userId);
      
      const isValid = await this.validateSession(sessionToken);
      if (!isValid) {
        throw new Error('Invalid session');
      }

      const { data, error } = await supabase
        .from('messenger_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},recipient_id.eq.1),and(sender_id.eq.1,recipient_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching private messages:', error);
        throw error;
      }

      console.log('Found private messages:', data?.length || 0);

      return (data || []).map(msg => ({
        id: msg.id,
        room_id: msg.room_id,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        message: msg.message,
        message_type: msg.message_type || 'text',
        media_url: msg.media_url,
        media_content: msg.media_content,
        is_read: msg.is_read || false,
        created_at: msg.created_at,
        reply_to_message_id: msg.reply_to_message_id,
        forwarded_from_message_id: msg.forwarded_from_message_id,
        conversation_id: msg.conversation_id,
        unread_by_support: msg.unread_by_support || false
      })) as MessengerMessage[];
    } catch (error) {
      console.error('Error in getPrivateMessages:', error);
      throw error;
    }
  }

  async sendMessage(messageData: {
    room_id?: number;
    sender_id: number;
    recipient_id?: number;
    message: string;
    message_type?: string;
    reply_to_message_id?: number;
    media_url?: string;
    media_content?: string;
  }, sessionToken: string): Promise<MessengerMessage> {
    try {
      console.log('Sending message:', messageData);
      
      const isValid = await this.validateSession(sessionToken);
      if (!isValid) {
        throw new Error('Invalid session');
      }

      let conversationId = null;
      if (messageData.recipient_id === 1) {
        console.log('This is a support message, checking for existing conversation...');
        
        const { data: existingConv } = await supabase
          .from('support_conversations')
          .select('id')
          .eq('user_id', messageData.sender_id)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (existingConv) {
          conversationId = existingConv.id;
          console.log('Found existing conversation:', conversationId);
        } else {
          const { data: newConv, error: convError } = await supabase
            .from('support_conversations')
            .insert([{
              user_id: messageData.sender_id,
              status: 'open',
              priority: 'normal',
              thread_type_id: 1, // Default to academy support
              last_message_at: new Date().toISOString()
            }])
            .select('id')
            .single();
          
          if (convError) {
            console.error('Error creating conversation:', convError);
          } else {
            conversationId = newConv.id;
            console.log('Created new conversation:', conversationId);
          }
        }
      }

      const { data, error } = await supabase
        .from('messenger_messages')
        .insert([{
          ...messageData,
          conversation_id: conversationId,
          unread_by_support: messageData.recipient_id === 1
        }])
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      console.log('Message sent successfully:', data);

      if (conversationId) {
        await supabase
          .from('support_conversations')
          .update({ 
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);
      }

      return {
        id: data.id,
        room_id: data.room_id,
        sender_id: data.sender_id,
        recipient_id: data.recipient_id,
        message: data.message,
        message_type: data.message_type || 'text',
        media_url: data.media_url,
        media_content: data.media_content,
        is_read: data.is_read || false,
        created_at: data.created_at,
        reply_to_message_id: data.reply_to_message_id,
        forwarded_from_message_id: data.forwarded_from_message_id,
        conversation_id: data.conversation_id,
        unread_by_support: data.unread_by_support || false
      } as MessengerMessage;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  async updateMessage(messageId: number, updates: Partial<MessengerMessage>, sessionToken: string): Promise<MessengerMessage> {
    try {
      await this.setSessionContext(sessionToken);
      
      const { data, error } = await supabase
        .from('messenger_messages')
        .update(updates)
        .eq('id', messageId)
        .select()
        .single();

      if (error) {
        console.error('Error updating message:', error);
        throw new Error(`Failed to update message: ${error.message}`);
      }

      return data as MessengerMessage;
    } catch (error: any) {
      console.error('Error in updateMessage:', error);
      throw error;
    }
  }

  // User management
  async getApprovedUsers(): Promise<MessengerUser[]> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('is_approved', true);

      if (error) {
        console.error('Error fetching users:', error);
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      return (data || []) as MessengerUser[];
    } catch (error: any) {
      console.error('Error in getApprovedUsers:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<MessengerUser[]> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as MessengerUser[];
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  async getUser(userId: number): Promise<MessengerUser | null> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }

      return data as MessengerUser;
    } catch (error: any) {
      console.error('Error in getUser:', error);
      return null;
    }
  }

  async getUserByPhone(phone: string): Promise<MessengerUser[]> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*')
        .eq('phone', phone);

      if (error) {
        console.error('Error getting user by phone:', error);
        throw error;
      }

      return (data || []) as MessengerUser[];
    } catch (error) {
      console.error('Error in getUserByPhone:', error);
      throw error;
    }
  }

  async updateUser(userId: number, updates: Partial<MessengerUser>): Promise<MessengerUser> {
    try {
      // If password is being updated, hash it
      if (updates.password_hash) {
        updates.password_hash = simpleHash(updates.password_hash);
      }

      const { data, error } = await supabase
        .from('chat_users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        throw new Error(`Failed to update user: ${error.message}`);
      }

      return data as MessengerUser;
    } catch (error: any) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  }

  async updateUserDetails(userId: number, details: {
    name?: string;
    phone?: string;
    username?: string;
    password?: string;
  }): Promise<MessengerUser> {
    try {
      const updates: any = {};
      
      if (details.name) updates.name = details.name.trim();
      if (details.phone) updates.phone = details.phone.trim();
      if (details.username) updates.username = details.username.toLowerCase().trim();
      if (details.password) updates.password_hash = simpleHash(details.password);

      const { data, error } = await supabase
        .from('chat_users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user details:', error);
        if (error.code === '23505') {
          if (error.message.includes('phone')) {
            throw new Error('این شماره تلفن قبلاً ثبت شده است');
          } else if (error.message.includes('username')) {
            throw new Error('این نام کاربری قبلاً انتخاب شده است');
          }
        }
        throw error;
      }

      return data as MessengerUser;
    } catch (error: any) {
      console.error('Error in updateUserDetails:', error);
      throw error;
    }
  }

  async updateUserRole(userId: number, updates: { 
    is_support_agent?: boolean; 
    is_messenger_admin?: boolean;
    is_approved?: boolean;
    bedoun_marz_approved?: boolean;
  }): Promise<MessengerUser> {
    return this.updateUser(userId, updates);
  }

  // Support thread types and agent assignments
  async getThreadTypes(): Promise<SupportThreadType[]> {
    try {
      const { data, error } = await supabase
        .from('support_thread_types')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching thread types:', error);
        throw new Error(`Failed to fetch thread types: ${error.message}`);
      }

      return (data || []) as SupportThreadType[];
    } catch (error: any) {
      console.error('Error in getThreadTypes:', error);
      throw error;
    }
  }

  async getSupportAgentAssignments(): Promise<SupportAgentAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('support_agent_assignments')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching agent assignments:', error);
        throw new Error(`Failed to fetch agent assignments: ${error.message}`);
      }

      return (data || []) as SupportAgentAssignment[];
    } catch (error: any) {
      console.error('Error in getSupportAgentAssignments:', error);
      throw error;
    }
  }

  async assignSupportAgent(agentId: number, threadTypeId: number): Promise<SupportAgentAssignment> {
    try {
      const { data, error } = await supabase
        .from('support_agent_assignments')
        .insert({
          agent_id: agentId,
          thread_type_id: threadTypeId,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error assigning support agent:', error);
        throw new Error(`Failed to assign support agent: ${error.message}`);
      }

      return data as SupportAgentAssignment;
    } catch (error: any) {
      console.error('Error in assignSupportAgent:', error);
      throw error;
    }
  }

  async unassignSupportAgent(agentId: number, threadTypeId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('support_agent_assignments')
        .delete()
        .eq('agent_id', agentId)
        .eq('thread_type_id', threadTypeId);

      if (error) {
        console.error('Error unassigning support agent:', error);
        throw new Error(`Failed to unassign support agent: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error in unassignSupportAgent:', error);
      throw error;
    }
  }

  // Room memberships
  async getRoomMemberships(roomId: number, sessionToken: string): Promise<RoomMembership[]> {
    try {
      await this.setSessionContext(sessionToken);
      
      const { data, error } = await supabase
        .from('room_memberships')
        .select('*')
        .eq('room_id', roomId);

      if (error) {
        console.error('Error fetching room memberships:', error);
        throw new Error(`Failed to fetch room memberships: ${error.message}`);
      }

      return (data || []) as RoomMembership[];
    } catch (error: any) {
      console.error('Error in getRoomMemberships:', error);
      throw error;
    }
  }

  // Message reactions
  async addMessageReaction(messageId: number, reaction: string, sessionToken: string): Promise<MessageReaction> {
    try {
      console.log('Adding reaction:', { messageId, reaction });
      
      await this.setSessionContext(sessionToken);
      
      const userId = await this.getUserIdFromSession(sessionToken);
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data: existingReaction } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('reaction', reaction)
        .single();

      if (existingReaction) {
        const { error: deleteError } = await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (deleteError) {
          console.error('Error removing reaction:', deleteError);
          throw new Error(`Failed to remove reaction: ${deleteError.message}`);
        }

        console.log('Reaction removed successfully');
        return existingReaction as MessageReaction;
      } else {
        const { data, error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: userId,
            reaction: reaction
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding reaction:', error);
          throw new Error(`Failed to add reaction: ${error.message}`);
        }

        console.log('Reaction added successfully:', data);
        return data as MessageReaction;
      }
    } catch (error: any) {
      console.error('Error in addMessageReaction:', error);
      throw error;
    }
  }

  async addReaction(messageId: number, reaction: string, sessionToken: string): Promise<MessageReaction> {
    return this.addMessageReaction(messageId, reaction, sessionToken);
  }

  async getMessageReactions(messageId: number, sessionToken: string): Promise<MessageReaction[]> {
    try {
      await this.setSessionContext(sessionToken);
      
      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId);

      if (error) {
        console.error('Error fetching reactions:', error);
        throw new Error(`Failed to fetch reactions: ${error.message}`);
      }

      return (data || []) as MessageReaction[];
    } catch (error: any) {
      console.error('Error in getMessageReactions:', error);
      throw error;
    }
  }

  // Session context management
  private async setSessionContext(sessionToken: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('set_session_context', {
        session_token: sessionToken
      });

      if (error) {
        console.error('Error setting session context:', error);
        throw new Error(`Failed to set session context: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error in setSessionContext:', error);
      throw error;
    }
  }

  private async getUserIdFromSession(sessionToken: string): Promise<number | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_from_session', {
        session_token_param: sessionToken
      });

      if (error) {
        console.error('Error getting user from session:', error);
        return null;
      }

      return data as number;
    } catch (error: any) {
      console.error('Error in getUserIdFromSession:', error);
      return null;
    }
  }

  async getAllMessages(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('messenger_messages')
        .select(`
          *,
          sender:chat_users!fk_messenger_messages_sender(name, phone)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all messages:', error);
      throw error;
    }
  }

  async getTopics(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('chat_topics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching topics:', error);
      throw error;
    }
  }

  async createTopic(topic: { title: string; description: string; is_active: boolean }): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('chat_topics')
        .insert([topic])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  }

  async updateTopic(topicId: number, updates: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_topics')
        .update(updates)
        .eq('id', topicId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating topic:', error);
      throw error;
    }
  }

  async deleteTopic(topicId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_topics')
        .delete()
        .eq('id', topicId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting topic:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('messenger_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }
}

export const messengerService = new MessengerService();
