
import { supabase } from '@/integrations/supabase/client';

export interface SupportRoom {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  is_active: boolean;
  is_default: boolean;
  thread_type_id: number | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
}

export interface SupportRoomPermission {
  id: number;
  support_room_id: number;
  user_role: string;
  can_access: boolean;
  created_at: string;
}

export interface SupportRoomAgent {
  agent_id: number;
  agent_name: string;
  agent_phone: string;
  is_active: boolean;
  conversation_count: number;
}

export interface UserRole {
  id: number;
  user_id: number;
  role_name: string;
  granted_at: string;
  granted_by: number | null;
  is_active: boolean;
}

class SupportRoomService {
  async getAllSupportRooms(): Promise<SupportRoom[]> {
    try {
      const { data, error } = await supabase
        .from('support_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching support rooms:', error);
      throw error;
    }
  }

  async getUserSupportRooms(userId: number): Promise<SupportRoom[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_support_rooms', {
        user_id_param: userId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user support rooms:', error);
      throw error;
    }
  }

  async createSupportRoom(roomData: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    thread_type_id?: number;
    created_by: number;
  }): Promise<SupportRoom> {
    try {
      const { data, error } = await supabase
        .from('support_rooms')
        .insert([roomData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating support room:', error);
      throw error;
    }
  }

  async updateSupportRoom(id: number, updates: Partial<SupportRoom>): Promise<SupportRoom> {
    try {
      const { data, error } = await supabase
        .from('support_rooms')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating support room:', error);
      throw error;
    }
  }

  async deleteSupportRoom(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('support_rooms')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting support room:', error);
      throw error;
    }
  }

  async getRoomPermissions(roomId: number): Promise<SupportRoomPermission[]> {
    try {
      const { data, error } = await supabase
        .from('support_room_permissions')
        .select('*')
        .eq('support_room_id', roomId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching room permissions:', error);
      throw error;
    }
  }

  async setRoomPermissions(roomId: number, permissions: { user_role: string; can_access: boolean }[]): Promise<void> {
    try {
      // Delete existing permissions
      await supabase
        .from('support_room_permissions')
        .delete()
        .eq('support_room_id', roomId);

      // Insert new permissions
      const permissionData = permissions.map(p => ({
        support_room_id: roomId,
        user_role: p.user_role,
        can_access: p.can_access
      }));

      const { error } = await supabase
        .from('support_room_permissions')
        .insert(permissionData);

      if (error) throw error;
    } catch (error) {
      console.error('Error setting room permissions:', error);
      throw error;
    }
  }

  async getRoomAgents(roomId: number): Promise<SupportRoomAgent[]> {
    try {
      const { data, error } = await supabase.rpc('get_support_room_agents', {
        room_id_param: roomId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching room agents:', error);
      throw error;
    }
  }

  async assignAgentToRoom(roomId: number, agentId: number, assignedBy: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('support_room_agents')
        .insert([{
          support_room_id: roomId,
          agent_id: agentId,
          assigned_by: assignedBy
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning agent to room:', error);
      throw error;
    }
  }

  async removeAgentFromRoom(roomId: number, agentId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('support_room_agents')
        .delete()
        .eq('support_room_id', roomId)
        .eq('agent_id', agentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing agent from room:', error);
      throw error;
    }
  }

  async getUserRoles(userId: number): Promise<UserRole[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user roles:', error);
      throw error;
    }
  }

  async assignUserRole(userId: number, roleName: string, grantedBy: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role_name: roleName,
          granted_by: grantedBy
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning user role:', error);
      throw error;
    }
  }

  async removeUserRole(userId: number, roleName: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role_name', roleName);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing user role:', error);
      throw error;
    }
  }
}

export const supportRoomService = new SupportRoomService();
