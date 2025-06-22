import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type MessengerUser = Tables<'chat_users'>;
export type ChatRoom = Tables<'chat_rooms'>;
export type MessengerMessage = Tables<'messenger_messages'>;
export type SupportConversation = Tables<'support_conversations'>;
export type MessageReaction = Tables<'message_reactions'>;
export type SupportThreadType = Tables<'support_thread_types'>;
export type SupportAgentAssignment = Tables<'support_agent_assignments'>;

export interface MessengerMessageWithUser extends MessengerMessage {
  sender?: MessengerUser;
  recipient?: MessengerUser;
  reactions?: MessageReaction[];
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

      return data;
    } catch (error: any) {
      console.error('Error in register:', error);
      throw error;
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

      return data;
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

      return { user: userData, session: sessionData };
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

      return data || [];
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

      return data || null;
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
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating room:', error);
        throw new Error(`Failed to create room: ${error.message}`);
      }

      return data;
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

      return data;
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

  // Message management
  async getMessages(roomId: number, sessionToken: string): Promise<MessengerMessageWithUser[]> {
    try {
      await this.setSessionContext(sessionToken);
      
      const { data: messages, error } = await supabase
        .from('messenger_messages')
        .select(`
          *,
          sender:chat_users!sender_id (*)
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
          return { ...message, reactions } as MessengerMessageWithUser;
        })
      );

      return messagesWithReactions;
    } catch (error: any) {
      console.error('Error in getMessages:', error);
      throw error;
    }
  }

  async getRoomMessages(roomId: number, sessionToken: string): Promise<MessengerMessageWithUser[]> {
    return this.getMessages(roomId, sessionToken);
  }

  async getPrivateMessages(userId: number, sessionToken: string): Promise<MessengerMessageWithUser[]> {
    try {
      await this.setSessionContext(sessionToken);
      
      const { data: messages, error } = await supabase
        .from('messenger_messages')
        .select(`
          *,
          sender:chat_users!sender_id (*)
        `)
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .is('room_id', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching private messages:', error);
        throw new Error(`Failed to fetch private messages: ${error.message}`);
      }

      const messagesWithReactions = await Promise.all(
        (messages || []).map(async (message) => {
          const reactions = await this.getMessageReactions(message.id, sessionToken);
          return { ...message, reactions } as MessengerMessageWithUser;
        })
      );

      return messagesWithReactions;
    } catch (error: any) {
      console.error('Error in getPrivateMessages:', error);
      throw error;
    }
  }

  async sendMessage(message: TablesInsert<'messenger_messages'>, sessionToken: string): Promise<MessengerMessage> {
    try {
      await this.setSessionContext(sessionToken);
      
      const { data, error } = await supabase
        .from('messenger_messages')
        .insert(message)
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw new Error(`Failed to send message: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  async updateMessage(messageId: number, updates: TablesUpdate<'messenger_messages'>, sessionToken: string): Promise<MessengerMessage> {
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

      return data;
    } catch (error: any) {
      console.error('Error in updateMessage:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: number, sessionToken: string): Promise<void> {
    try {
      await this.setSessionContext(sessionToken);
      
      const { error } = await supabase
        .from('messenger_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Error deleting message:', error);
        throw new Error(`Failed to delete message: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error in deleteMessage:', error);
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

      return data || [];
    } catch (error: any) {
      console.error('Error in getApprovedUsers:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<MessengerUser[]> {
    try {
      const { data, error } = await supabase
        .from('chat_users')
        .select('*');

      if (error) {
        console.error('Error fetching users:', error);
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in getAllUsers:', error);
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

      return data || null;
    } catch (error: any) {
      console.error('Error in getUser:', error);
      return null;
    }
  }

  async updateUser(userId: number, updates: TablesUpdate<'chat_users'>): Promise<MessengerUser> {
    try {
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

      return data;
    } catch (error: any) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  }

  async updateUserRole(userId: number, updates: { is_support_agent?: boolean; is_messenger_admin?: boolean }): Promise<MessengerUser> {
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

      return data || [];
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

      return data || [];
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

      return data;
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

      return data || [];
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
        return existingReaction;
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
        return data;
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

      return data || [];
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

      return data;
    } catch (error: any) {
      console.error('Error in getUserIdFromSession:', error);
      return null;
    }
  }
}

export const messengerService = new MessengerService();
