export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      announcements: {
        Row: {
          created_at: string | null
          full_text: string
          id: number
          is_pinned: boolean | null
          media_content: string | null
          media_type: string
          media_url: string | null
          summary: string
          title: string
          type: string
          views: number | null
        }
        Insert: {
          created_at?: string | null
          full_text: string
          id?: number
          is_pinned?: boolean | null
          media_content?: string | null
          media_type?: string
          media_url?: string | null
          summary: string
          title: string
          type: string
          views?: number | null
        }
        Update: {
          created_at?: string | null
          full_text?: string
          id?: number
          is_pinned?: boolean | null
          media_content?: string | null
          media_type?: string
          media_url?: string | null
          summary?: string
          title?: string
          type?: string
          views?: number | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string | null
          id: number
          is_pinned: boolean | null
          message: string
          sender_name: string | null
          sender_role: string
          topic_id: number | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_pinned?: boolean | null
          message: string
          sender_name?: string | null
          sender_role: string
          topic_id?: number | null
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_pinned?: boolean | null
          message?: string
          sender_name?: string | null
          sender_role?: string
          topic_id?: number | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "chat_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          is_boundless_only: boolean | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          is_boundless_only?: boolean | null
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          is_boundless_only?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_topics: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_users: {
        Row: {
          bedoun_marz_approved: boolean | null
          bedoun_marz_request: boolean | null
          created_at: string | null
          id: number
          is_approved: boolean | null
          is_support_agent: boolean | null
          last_seen: string | null
          name: string
          phone: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          bedoun_marz_approved?: boolean | null
          bedoun_marz_request?: boolean | null
          created_at?: string | null
          id?: number
          is_approved?: boolean | null
          is_support_agent?: boolean | null
          last_seen?: string | null
          name: string
          phone: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          bedoun_marz_approved?: boolean | null
          bedoun_marz_request?: boolean | null
          created_at?: string | null
          id?: number
          is_approved?: boolean | null
          is_support_agent?: boolean | null
          last_seen?: string | null
          name?: string
          phone?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      live_settings: {
        Row: {
          id: number
          is_live: boolean | null
          stream_code: string | null
          title: string | null
          updated_at: string | null
          viewers: number | null
        }
        Insert: {
          id?: number
          is_live?: boolean | null
          stream_code?: string | null
          title?: string | null
          updated_at?: string | null
          viewers?: number | null
        }
        Update: {
          id?: number
          is_live?: boolean | null
          stream_code?: string | null
          title?: string | null
          updated_at?: string | null
          viewers?: number | null
        }
        Relationships: []
      }
      messenger_messages: {
        Row: {
          created_at: string | null
          id: number
          is_read: boolean | null
          media_content: string | null
          media_url: string | null
          message: string
          message_type: string | null
          recipient_id: number | null
          room_id: number | null
          sender_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          media_content?: string | null
          media_url?: string | null
          message: string
          message_type?: string | null
          recipient_id?: number | null
          room_id?: number | null
          sender_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          media_content?: string | null
          media_url?: string | null
          message?: string
          message_type?: string | null
          recipient_id?: number | null
          room_id?: number | null
          sender_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messenger_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rafiei_meet_settings: {
        Row: {
          description: string | null
          id: number
          is_active: boolean
          meet_url: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: number
          is_active?: boolean
          meet_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: number
          is_active?: boolean
          meet_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      room_memberships: {
        Row: {
          id: number
          joined_at: string | null
          last_read_at: string | null
          room_id: number | null
          user_id: number | null
        }
        Insert: {
          id?: number
          joined_at?: string | null
          last_read_at?: string | null
          room_id?: number | null
          user_id?: number | null
        }
        Update: {
          id?: number
          joined_at?: string | null
          last_read_at?: string | null
          room_id?: number | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "room_memberships_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
        ]
      }
      support_agents: {
        Row: {
          created_at: string | null
          id: number
          is_active: boolean | null
          phone: string
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          phone: string
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          phone?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "support_agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          created_at: string | null
          id: number
          is_from_support: boolean | null
          message: string
          read_at: string | null
          sender_id: number | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_from_support?: boolean | null
          message: string
          read_at?: string | null
          sender_id?: number | null
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_from_support?: boolean | null
          message?: string
          read_at?: string | null
          sender_id?: number | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_support_agent: boolean | null
          last_activity: string | null
          session_token: string
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_support_agent?: boolean | null
          last_activity?: string | null
          session_token: string
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_support_agent?: boolean | null
          last_activity?: string | null
          session_token?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_inactive_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      increment_views: {
        Args: { announcement_id: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
