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
      academy_courses: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          price: number | null
          redirect_after_enroll: string | null
          slug: string
          status: Database["public"]["Enums"]["course_status"]
          title: string
          type: Database["public"]["Enums"]["course_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          price?: number | null
          redirect_after_enroll?: string | null
          slug: string
          status?: Database["public"]["Enums"]["course_status"]
          title: string
          type?: Database["public"]["Enums"]["course_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          price?: number | null
          redirect_after_enroll?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["course_status"]
          title?: string
          type?: Database["public"]["Enums"]["course_type"]
          updated_at?: string
        }
        Relationships: []
      }
      academy_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          status: Database["public"]["Enums"]["enrollment_status"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "academy_users"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_settings: {
        Row: {
          enrollment_enabled: boolean
          id: number
          updated_at: string
          use_old_auth_system: boolean
        }
        Insert: {
          enrollment_enabled?: boolean
          id?: number
          updated_at?: string
          use_old_auth_system?: boolean
        }
        Update: {
          enrollment_enabled?: boolean
          id?: number
          updated_at?: string
          use_old_auth_system?: boolean
        }
        Relationships: []
      }
      academy_transactions: {
        Row: {
          amount: number
          course_id: string
          created_at: string
          gateway: string
          gateway_transaction_id: string | null
          id: string
          status: Database["public"]["Enums"]["transaction_status"]
          user_id: string
        }
        Insert: {
          amount: number
          course_id: string
          created_at?: string
          gateway?: string
          gateway_transaction_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          user_id: string
        }
        Update: {
          amount?: number
          course_id?: string
          created_at?: string
          gateway?: string
          gateway_transaction_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_transactions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "academy_users"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_users: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
          role: Database["public"]["Enums"]["academy_user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone: string
          role?: Database["public"]["Enums"]["academy_user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
          role?: Database["public"]["Enums"]["academy_user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          id: number
          manual_approval_enabled: boolean
          updated_at: string
        }
        Insert: {
          id?: number
          manual_approval_enabled?: boolean
          updated_at?: string
        }
        Update: {
          id?: number
          manual_approval_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
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
          bedoun_marz: boolean | null
          bedoun_marz_approved: boolean | null
          bedoun_marz_request: boolean | null
          bio: string | null
          country_code: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: number
          is_approved: boolean | null
          is_messenger_admin: boolean | null
          is_support_agent: boolean | null
          last_name: string | null
          last_seen: string | null
          name: string
          password_hash: string | null
          phone: string
          role: string | null
          signup_source: string | null
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          bedoun_marz?: boolean | null
          bedoun_marz_approved?: boolean | null
          bedoun_marz_request?: boolean | null
          bio?: string | null
          country_code?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: number
          is_approved?: boolean | null
          is_messenger_admin?: boolean | null
          is_support_agent?: boolean | null
          last_name?: string | null
          last_seen?: string | null
          name: string
          password_hash?: string | null
          phone: string
          role?: string | null
          signup_source?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          bedoun_marz?: boolean | null
          bedoun_marz_approved?: boolean | null
          bedoun_marz_request?: boolean | null
          bio?: string | null
          country_code?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: number
          is_approved?: boolean | null
          is_messenger_admin?: boolean | null
          is_support_agent?: boolean | null
          last_name?: string | null
          last_seen?: string | null
          name?: string
          password_hash?: string | null
          phone?: string
          role?: string | null
          signup_source?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
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
      message_reactions: {
        Row: {
          created_at: string | null
          id: string
          message_id: number
          reaction: string
          user_id: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: number
          reaction: string
          user_id: number
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: number
          reaction?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messenger_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
        ]
      }
      messenger_messages: {
        Row: {
          conversation_id: number | null
          created_at: string | null
          forwarded_from_message_id: number | null
          id: number
          is_read: boolean | null
          media_content: string | null
          media_url: string | null
          message: string
          message_type: string | null
          recipient_id: number | null
          reply_to_message_id: number | null
          room_id: number | null
          sender_id: number | null
          unread_by_support: boolean | null
        }
        Insert: {
          conversation_id?: number | null
          created_at?: string | null
          forwarded_from_message_id?: number | null
          id?: number
          is_read?: boolean | null
          media_content?: string | null
          media_url?: string | null
          message: string
          message_type?: string | null
          recipient_id?: number | null
          reply_to_message_id?: number | null
          room_id?: number | null
          sender_id?: number | null
          unread_by_support?: boolean | null
        }
        Update: {
          conversation_id?: number | null
          created_at?: string | null
          forwarded_from_message_id?: number | null
          id?: number
          is_read?: boolean | null
          media_content?: string | null
          media_url?: string | null
          message?: string
          message_type?: string | null
          recipient_id?: number | null
          reply_to_message_id?: number | null
          room_id?: number | null
          sender_id?: number | null
          unread_by_support?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_messenger_messages_conversation"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_messenger_messages_recipient"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_messenger_messages_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_messenger_messages_sender"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_messages_forwarded_from_message_id_fkey"
            columns: ["forwarded_from_message_id"]
            isOneToOne: false
            referencedRelation: "messenger_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "messenger_messages"
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
      notifications: {
        Row: {
          color: string
          created_at: string
          end_date: string | null
          id: number
          is_active: boolean
          link: string | null
          message: string
          notification_type: string
          priority: number
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          end_date?: string | null
          id?: number
          is_active?: boolean
          link?: string | null
          message: string
          notification_type?: string
          priority?: number
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          end_date?: string | null
          id?: number
          is_active?: boolean
          link?: string | null
          message?: string
          notification_type?: string
          priority?: number
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      private_conversations: {
        Row: {
          created_at: string | null
          id: number
          last_message_at: string | null
          updated_at: string | null
          user1_id: number
          user2_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          last_message_at?: string | null
          updated_at?: string | null
          user1_id: number
          user2_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          last_message_at?: string | null
          updated_at?: string | null
          user1_id?: number
          user2_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "private_conversations_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_conversations_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
        ]
      }
      private_messages: {
        Row: {
          conversation_id: number
          created_at: string | null
          forwarded_from_message_id: number | null
          id: number
          is_read: boolean | null
          media_content: string | null
          media_url: string | null
          message: string
          message_type: string | null
          reply_to_message_id: number | null
          sender_id: number
        }
        Insert: {
          conversation_id: number
          created_at?: string | null
          forwarded_from_message_id?: number | null
          id?: number
          is_read?: boolean | null
          media_content?: string | null
          media_url?: string | null
          message: string
          message_type?: string | null
          reply_to_message_id?: number | null
          sender_id: number
        }
        Update: {
          conversation_id?: number
          created_at?: string | null
          forwarded_from_message_id?: number | null
          id?: number
          is_read?: boolean | null
          media_content?: string | null
          media_url?: string | null
          message?: string
          message_type?: string | null
          reply_to_message_id?: number | null
          sender_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "private_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "private_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_forwarded_from_message_id_fkey"
            columns: ["forwarded_from_message_id"]
            isOneToOne: false
            referencedRelation: "private_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "private_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_sender_id_fkey"
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
      support_agent_assignments: {
        Row: {
          agent_id: number | null
          assigned_at: string | null
          id: number
          is_active: boolean | null
          thread_type_id: number | null
        }
        Insert: {
          agent_id?: number | null
          assigned_at?: string | null
          id?: number
          is_active?: boolean | null
          thread_type_id?: number | null
        }
        Update: {
          agent_id?: number | null
          assigned_at?: string | null
          id?: number
          is_active?: boolean | null
          thread_type_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "support_agent_assignments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_agent_assignments_thread_type_id_fkey"
            columns: ["thread_type_id"]
            isOneToOne: false
            referencedRelation: "support_thread_types"
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
      support_conversations: {
        Row: {
          agent_id: number | null
          assigned_agent_name: string | null
          created_at: string | null
          id: number
          internal_notes: string | null
          last_message_at: string | null
          priority: string | null
          status: string | null
          support_room_id: number | null
          tag_list: Database["public"]["Enums"]["support_tag"][] | null
          tags: string[] | null
          thread_type_id: number | null
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          agent_id?: number | null
          assigned_agent_name?: string | null
          created_at?: string | null
          id?: number
          internal_notes?: string | null
          last_message_at?: string | null
          priority?: string | null
          status?: string | null
          support_room_id?: number | null
          tag_list?: Database["public"]["Enums"]["support_tag"][] | null
          tags?: string[] | null
          thread_type_id?: number | null
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          agent_id?: number | null
          assigned_agent_name?: string | null
          created_at?: string | null
          id?: number
          internal_notes?: string | null
          last_message_at?: string | null
          priority?: string | null
          status?: string | null
          support_room_id?: number | null
          tag_list?: Database["public"]["Enums"]["support_tag"][] | null
          tags?: string[] | null
          thread_type_id?: number | null
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "support_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_conversations_support_room_id_fkey"
            columns: ["support_room_id"]
            isOneToOne: false
            referencedRelation: "support_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_conversations_thread_type_id_fkey"
            columns: ["thread_type_id"]
            isOneToOne: false
            referencedRelation: "support_thread_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
      support_room_agents: {
        Row: {
          agent_id: number | null
          assigned_at: string | null
          assigned_by: number | null
          id: number
          is_active: boolean | null
          support_room_id: number | null
        }
        Insert: {
          agent_id?: number | null
          assigned_at?: string | null
          assigned_by?: number | null
          id?: number
          is_active?: boolean | null
          support_room_id?: number | null
        }
        Update: {
          agent_id?: number | null
          assigned_at?: string | null
          assigned_by?: number | null
          id?: number
          is_active?: boolean | null
          support_room_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "support_room_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_room_agents_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_room_agents_support_room_id_fkey"
            columns: ["support_room_id"]
            isOneToOne: false
            referencedRelation: "support_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      support_room_permissions: {
        Row: {
          can_access: boolean | null
          created_at: string | null
          id: number
          support_room_id: number | null
          user_role: string
        }
        Insert: {
          can_access?: boolean | null
          created_at?: string | null
          id?: number
          support_room_id?: number | null
          user_role: string
        }
        Update: {
          can_access?: boolean | null
          created_at?: string | null
          id?: number
          support_room_id?: number | null
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_room_permissions_support_room_id_fkey"
            columns: ["support_room_id"]
            isOneToOne: false
            referencedRelation: "support_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      support_rooms: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: number | null
          description: string | null
          icon: string | null
          id: number
          is_active: boolean | null
          is_default: boolean | null
          name: string
          thread_type_id: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: number | null
          description?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          thread_type_id?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: number | null
          description?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          thread_type_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_rooms_thread_type_id_fkey"
            columns: ["thread_type_id"]
            isOneToOne: false
            referencedRelation: "support_thread_types"
            referencedColumns: ["id"]
          },
        ]
      }
      support_thread_types: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: number
          is_active: boolean | null
          is_boundless_only: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id: number
          is_active?: boolean | null
          is_boundless_only?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: number
          is_active?: boolean | null
          is_boundless_only?: boolean | null
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: number | null
          id: number
          is_active: boolean | null
          role_name: string
          user_id: number | null
        }
        Insert: {
          granted_at?: string | null
          granted_by?: number | null
          id?: number
          is_active?: boolean | null
          role_name: string
          user_id?: number | null
        }
        Update: {
          granted_at?: string | null
          granted_by?: number | null
          id?: number
          is_active?: boolean | null
          role_name?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
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
      detect_country_code_from_phone: {
        Args: { phone_number: string }
        Returns: string
      }
      generate_unique_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_academy_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["academy_user_role"]
      }
      get_or_create_private_conversation: {
        Args: { p_user1_id: number; p_user2_id: number }
        Returns: number
      }
      get_support_room_agents: {
        Args: { room_id_param: number }
        Returns: {
          agent_id: number
          agent_name: string
          agent_phone: string
          is_active: boolean
          conversation_count: number
        }[]
      }
      get_support_unread_count: {
        Args: { conv_id: number }
        Returns: number
      }
      get_user_avatar_color: {
        Args: { user_name: string }
        Returns: string
      }
      get_user_from_session: {
        Args: { session_token_param: string }
        Returns: number
      }
      get_user_support_rooms: {
        Args: { user_id_param: number }
        Returns: {
          id: number
          name: string
          description: string
          icon: string
          color: string
          thread_type_id: number
        }[]
      }
      increment_views: {
        Args: { announcement_id: number }
        Returns: undefined
      }
      is_academy_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_iranian_phone: {
        Args: { phone_number: string }
        Returns: boolean
      }
      is_session_valid: {
        Args: { session_token_param: string }
        Returns: boolean
      }
      search_users: {
        Args: { search_term: string }
        Returns: {
          id: number
          name: string
          username: string
          phone: string
          is_approved: boolean
        }[]
      }
      set_session_context: {
        Args: { session_token: string }
        Returns: undefined
      }
      validate_user_session: {
        Args: { session_token_param: string }
        Returns: {
          user_id: number
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      academy_user_role: "student" | "admin"
      course_status: "active" | "closed" | "full"
      course_type: "free" | "paid"
      enrollment_status: "enrolled" | "completed"
      support_tag:
        | "technical"
        | "billing"
        | "general"
        | "account"
        | "bug_report"
        | "feature_request"
        | "urgent"
        | "follow_up"
      transaction_status: "success" | "pending" | "failed"
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
    Enums: {
      academy_user_role: ["student", "admin"],
      course_status: ["active", "closed", "full"],
      course_type: ["free", "paid"],
      enrollment_status: ["enrolled", "completed"],
      support_tag: [
        "technical",
        "billing",
        "general",
        "account",
        "bug_report",
        "feature_request",
        "urgent",
        "follow_up",
      ],
      transaction_status: ["success", "pending", "failed"],
    },
  },
} as const
