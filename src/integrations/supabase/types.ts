export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
          avatar_url: string | null
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          is_boundless_only: boolean | null
          is_super_group: boolean | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          is_boundless_only?: boolean | null
          is_super_group?: boolean | null
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          is_boundless_only?: boolean | null
          is_super_group?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_sections: {
        Row: {
          created_at: string | null
          icon: string | null
          id: number
          is_active: boolean
          order_index: number
          room_id: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean
          order_index?: number
          room_id?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean
          order_index?: number
          room_id?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sections_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_topics: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: number
          is_active: boolean
          order_index: number | null
          room_id: number | null
          section_id: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean
          order_index?: number | null
          room_id?: number | null
          section_id?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean
          order_index?: number | null
          room_id?: number | null
          section_id?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_topics_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_topics_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "chat_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_users: {
        Row: {
          age: number | null
          avatar_url: string | null
          bedoun_marz: boolean | null
          bedoun_marz_approved: boolean | null
          bedoun_marz_request: boolean | null
          bio: string | null
          birth_year: number | null
          country: string | null
          country_code: string | null
          created_at: string | null
          education: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: number
          is_approved: boolean | null
          is_messenger_admin: boolean | null
          is_support_agent: boolean | null
          job: string | null
          last_name: string | null
          last_seen: string | null
          name: string
          notification_enabled: boolean | null
          notification_token: string | null
          password_hash: string | null
          phone: string
          province: Database["public"]["Enums"]["iran_province_type"] | null
          role: string | null
          sex: string | null
          signup_source: string | null
          specialized_program:
            | Database["public"]["Enums"]["specialized_program_type"]
            | null
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bedoun_marz?: boolean | null
          bedoun_marz_approved?: boolean | null
          bedoun_marz_request?: boolean | null
          bio?: string | null
          birth_year?: number | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: number
          is_approved?: boolean | null
          is_messenger_admin?: boolean | null
          is_support_agent?: boolean | null
          job?: string | null
          last_name?: string | null
          last_seen?: string | null
          name: string
          notification_enabled?: boolean | null
          notification_token?: string | null
          password_hash?: string | null
          phone: string
          province?: Database["public"]["Enums"]["iran_province_type"] | null
          role?: string | null
          sex?: string | null
          signup_source?: string | null
          specialized_program?:
            | Database["public"]["Enums"]["specialized_program_type"]
            | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bedoun_marz?: boolean | null
          bedoun_marz_approved?: boolean | null
          bedoun_marz_request?: boolean | null
          bio?: string | null
          birth_year?: number | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: number
          is_approved?: boolean | null
          is_messenger_admin?: boolean | null
          is_support_agent?: boolean | null
          job?: string | null
          last_name?: string | null
          last_seen?: string | null
          name?: string
          notification_enabled?: boolean | null
          notification_token?: string | null
          password_hash?: string | null
          phone?: string
          province?: Database["public"]["Enums"]["iran_province_type"] | null
          role?: string | null
          sex?: string | null
          signup_source?: string | null
          specialized_program?:
            | Database["public"]["Enums"]["specialized_program_type"]
            | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      course_click_logs: {
        Row: {
          action_type: string
          clicked_at: string
          course_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          clicked_at?: string
          course_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          clicked_at?: string
          course_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_click_logs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          content: string
          course_id: string
          created_at: string
          duration: number | null
          file_url: string | null
          id: string
          lesson_number: number | null
          order_index: number
          section_id: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string
          course_id: string
          created_at?: string
          duration?: number | null
          file_url?: string | null
          id?: string
          lesson_number?: number | null
          order_index: number
          section_id: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          duration?: number | null
          file_url?: string | null
          id?: string
          lesson_number?: number | null
          order_index?: number
          section_id?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      course_licenses: {
        Row: {
          activated_at: string | null
          course_id: string
          created_at: string
          expires_at: string | null
          id: string
          license_data: Json | null
          license_key: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          course_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          license_data?: Json | null
          license_key?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          course_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          license_data?: Json | null
          license_key?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_licenses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sections: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_open: boolean
          order_index: number
          title: string
          title_group_id: string | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_open?: boolean
          order_index: number
          title: string
          title_group_id?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_open?: boolean
          order_index?: number
          title?: string
          title_group_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sections_title_group_id_fkey"
            columns: ["title_group_id"]
            isOneToOne: false
            referencedRelation: "course_title_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      course_title_groups: {
        Row: {
          course_id: string
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_open: boolean
          order_index: number
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_open?: boolean
          order_index?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_open?: boolean
          order_index?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_title_groups_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          create_test_license: boolean | null
          created_at: string
          description: string | null
          enable_course_access: boolean | null
          gifts_link: string | null
          id: string
          is_active: boolean
          is_free_access: boolean | null
          is_pre_launch_enabled: boolean
          is_sale_enabled: boolean | null
          is_spotplayer_enabled: boolean | null
          launch_date: string | null
          lead_start_date: string | null
          pre_launch_ends_at: string | null
          pre_launch_price: number | null
          price: number
          redirect_url: string | null
          sale_expires_at: string | null
          sale_price: number | null
          slug: string
          smart_activation_enabled: boolean
          smart_activation_telegram_link: string | null
          spotplayer_course_id: string | null
          support_activation_required: boolean | null
          support_link: string | null
          telegram_activation_required: boolean | null
          telegram_channel_link: string | null
          telegram_only_access: boolean
          title: string
          updated_at: string
          usd_price: number | null
          use_dollar_price: boolean
          use_enrollments_as_leads: boolean
          use_landing_page_merge: boolean
          woocommerce_create_access: boolean | null
          woocommerce_product_id: number | null
        }
        Insert: {
          create_test_license?: boolean | null
          created_at?: string
          description?: string | null
          enable_course_access?: boolean | null
          gifts_link?: string | null
          id?: string
          is_active?: boolean
          is_free_access?: boolean | null
          is_pre_launch_enabled?: boolean
          is_sale_enabled?: boolean | null
          is_spotplayer_enabled?: boolean | null
          launch_date?: string | null
          lead_start_date?: string | null
          pre_launch_ends_at?: string | null
          pre_launch_price?: number | null
          price?: number
          redirect_url?: string | null
          sale_expires_at?: string | null
          sale_price?: number | null
          slug: string
          smart_activation_enabled?: boolean
          smart_activation_telegram_link?: string | null
          spotplayer_course_id?: string | null
          support_activation_required?: boolean | null
          support_link?: string | null
          telegram_activation_required?: boolean | null
          telegram_channel_link?: string | null
          telegram_only_access?: boolean
          title: string
          updated_at?: string
          usd_price?: number | null
          use_dollar_price?: boolean
          use_enrollments_as_leads?: boolean
          use_landing_page_merge?: boolean
          woocommerce_create_access?: boolean | null
          woocommerce_product_id?: number | null
        }
        Update: {
          create_test_license?: boolean | null
          created_at?: string
          description?: string | null
          enable_course_access?: boolean | null
          gifts_link?: string | null
          id?: string
          is_active?: boolean
          is_free_access?: boolean | null
          is_pre_launch_enabled?: boolean
          is_sale_enabled?: boolean | null
          is_spotplayer_enabled?: boolean | null
          launch_date?: string | null
          lead_start_date?: string | null
          pre_launch_ends_at?: string | null
          pre_launch_price?: number | null
          price?: number
          redirect_url?: string | null
          sale_expires_at?: string | null
          sale_price?: number | null
          slug?: string
          smart_activation_enabled?: boolean
          smart_activation_telegram_link?: string | null
          spotplayer_course_id?: string | null
          support_activation_required?: boolean | null
          support_link?: string | null
          telegram_activation_required?: boolean | null
          telegram_channel_link?: string | null
          telegram_only_access?: boolean
          title?: string
          updated_at?: string
          usd_price?: number | null
          use_dollar_price?: boolean
          use_enrollments_as_leads?: boolean
          use_landing_page_merge?: boolean
          woocommerce_create_access?: boolean | null
          woocommerce_product_id?: number | null
        }
        Relationships: []
      }
      crm_followups: {
        Row: {
          assigned_to: number
          completed_at: string | null
          created_at: string
          crm_activity_id: string
          deal_id: string | null
          due_at: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: number
        }
        Insert: {
          assigned_to: number
          completed_at?: string | null
          created_at?: string
          crm_activity_id: string
          deal_id?: string | null
          due_at: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: number
        }
        Update: {
          assigned_to?: number
          completed_at?: string | null
          created_at?: string
          crm_activity_id?: string
          deal_id?: string | null
          due_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_followups_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_followups_crm_activity_id_fkey"
            columns: ["crm_activity_id"]
            isOneToOne: false
            referencedRelation: "crm_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_followups_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_followups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notes: {
        Row: {
          content: string
          course_id: string | null
          created_at: string
          created_by: string
          id: string
          status: string | null
          type: string
          updated_at: string
          user_id: number
        }
        Insert: {
          content: string
          course_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          status?: string | null
          type: string
          updated_at?: string
          user_id: number
        }
        Update: {
          content?: string
          course_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          status?: string | null
          type?: string
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_activities: {
        Row: {
          admin_id: number
          created_at: string
          deal_id: string
          description: string
          id: string
          result: string | null
          type: string
          updated_at: string
        }
        Insert: {
          admin_id: number
          created_at?: string
          deal_id: string
          description: string
          id?: string
          result?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          admin_id?: number
          created_at?: string
          deal_id?: string
          description?: string
          id?: string
          result?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_activities_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          assigned_by_id: number
          assigned_salesperson_id: number
          closed_at: string | null
          course_id: string
          created_at: string
          enrollment_id: string
          id: string
          price: number
          status: string
          updated_at: string
        }
        Insert: {
          assigned_by_id: number
          assigned_salesperson_id: number
          closed_at?: string | null
          course_id: string
          created_at?: string
          enrollment_id: string
          id?: string
          price?: number
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_by_id?: number
          assigned_salesperson_id?: number
          closed_at?: string | null
          course_id?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          price?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_assigned_by_id_fkey"
            columns: ["assigned_by_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_assigned_salesperson_id_fkey"
            columns: ["assigned_salesperson_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          code: string
          course_id: string | null
          created_at: string
          created_by: string | null
          current_uses: number
          id: string
          is_active: boolean
          max_uses: number | null
          percentage: number
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          current_uses?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          percentage: number
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          current_uses?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          percentage?: number
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          course_id: string | null
          created_at: string
          error_message: string | null
          id: string
          recipient: string
          status: string
          subject: string
          user_id: number | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          recipient: string
          status: string
          subject: string
          user_id?: number | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          recipient?: string
          status?: string
          subject?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          course_id: string | null
          created_at: string
          html_content: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          sender_email: string
          sender_name: string
          subject: string
          text_content: string | null
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          html_content: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          sender_email?: string
          sender_name?: string
          subject: string
          text_content?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          html_content?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          sender_email?: string
          sender_name?: string
          subject?: string
          text_content?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          chat_user_id: number | null
          country_code: string | null
          course_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          manual_payment_status:
            | Database["public"]["Enums"]["manual_payment_status"]
            | null
          payment_amount: number
          payment_method: string | null
          payment_status: string
          phone: string
          receipt_url: string | null
          spotplayer_license_id: string | null
          spotplayer_license_key: string | null
          spotplayer_license_url: string | null
          updated_at: string
          woocommerce_order_id: number | null
          zarinpal_authority: string | null
          zarinpal_ref_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          chat_user_id?: number | null
          country_code?: string | null
          course_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          manual_payment_status?:
            | Database["public"]["Enums"]["manual_payment_status"]
            | null
          payment_amount: number
          payment_method?: string | null
          payment_status?: string
          phone: string
          receipt_url?: string | null
          spotplayer_license_id?: string | null
          spotplayer_license_key?: string | null
          spotplayer_license_url?: string | null
          updated_at?: string
          woocommerce_order_id?: number | null
          zarinpal_authority?: string | null
          zarinpal_ref_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          chat_user_id?: number | null
          country_code?: string | null
          course_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          manual_payment_status?:
            | Database["public"]["Enums"]["manual_payment_status"]
            | null
          payment_amount?: number
          payment_method?: string | null
          payment_status?: string
          phone?: string
          receipt_url?: string | null
          spotplayer_license_id?: string | null
          spotplayer_license_key?: string | null
          spotplayer_license_url?: string | null
          updated_at?: string
          woocommerce_order_id?: number | null
          zarinpal_authority?: string | null
          zarinpal_ref_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_chat_user_id_fkey"
            columns: ["chat_user_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      gmail_credentials: {
        Row: {
          access_token: string
          created_at: string
          email_address: string
          id: string
          refresh_token: string
          token_expires_at: string
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          email_address: string
          id?: string
          refresh_token: string
          token_expires_at: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          email_address?: string
          id?: string
          refresh_token?: string
          token_expires_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      google_auth_settings: {
        Row: {
          id: number
          is_enabled: boolean
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          id?: number
          is_enabled?: boolean
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          id?: number
          is_enabled?: boolean
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "google_auth_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          course_id: string
          created_at: string
          existing_users_updated: number
          id: string
          new_users_created: number
          total_rows: number
          uploaded_by: string
        }
        Insert: {
          course_id: string
          created_at?: string
          existing_users_updated?: number
          id?: string
          new_users_created?: number
          total_rows?: number
          uploaded_by: string
        }
        Update: {
          course_id?: string
          created_at?: string
          existing_users_updated?: number
          id?: string
          new_users_created?: number
          total_rows?: number
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: number | null
          assignment_type: string | null
          created_at: string | null
          enrollment_id: string | null
          id: number
          sales_agent_id: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: number | null
          assignment_type?: string | null
          created_at?: string | null
          enrollment_id?: string | null
          id?: number
          sales_agent_id?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: number | null
          assignment_type?: string | null
          created_at?: string | null
          enrollment_id?: string | null
          id?: number
          sales_agent_id?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_sales_agent_id_fkey"
            columns: ["sales_agent_id"]
            isOneToOne: false
            referencedRelation: "sales_agent_performance"
            referencedColumns: ["sales_agent_id"]
          },
          {
            foreignKeyName: "lead_assignments_sales_agent_id_fkey"
            columns: ["sales_agent_id"]
            isOneToOne: false
            referencedRelation: "sales_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_distribution_logs: {
        Row: {
          admin_id: number
          count: number
          course_id: string
          created_at: string
          id: string
          method: string
          note: string | null
          sales_agent_id: number
        }
        Insert: {
          admin_id: number
          count?: number
          course_id: string
          created_at?: string
          id?: string
          method: string
          note?: string | null
          sales_agent_id: number
        }
        Update: {
          admin_id?: number
          count?: number
          course_id?: string
          created_at?: string
          id?: string
          method?: string
          note?: string | null
          sales_agent_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_admin_id"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_course_id"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sales_agent_id"
            columns: ["sales_agent_id"]
            isOneToOne: false
            referencedRelation: "sales_agent_performance"
            referencedColumns: ["sales_agent_id"]
          },
          {
            foreignKeyName: "fk_sales_agent_id"
            columns: ["sales_agent_id"]
            isOneToOne: false
            referencedRelation: "sales_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_sections: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: string
          section_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id: string
          section_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: string
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_sections_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_sections_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      license_errors: {
        Row: {
          api_response: string | null
          course_id: string | null
          created_at: string | null
          enrollment_id: string | null
          error_message: string
          id: string
          user_id: string | null
        }
        Insert: {
          api_response?: string | null
          course_id?: string | null
          created_at?: string | null
          enrollment_id?: string | null
          error_message: string
          id?: string
          user_id?: string | null
        }
        Update: {
          api_response?: string | null
          course_id?: string | null
          created_at?: string | null
          enrollment_id?: string | null
          error_message?: string
          id?: string
          user_id?: string | null
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
          topic_id: number | null
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
          topic_id?: number | null
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
          topic_id?: number | null
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
            foreignKeyName: "fk_messenger_messages_topic_id"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "chat_topics"
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
          course_id: string | null
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
          course_id?: string | null
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
          course_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "notifications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_verifications: {
        Row: {
          created_at: string | null
          expires_at: string
          id: number
          otp_code: string
          phone: string
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: number
          otp_code: string
          phone: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: number
          otp_code?: string
          phone?: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      payment_verification_logs: {
        Row: {
          created_at: string | null
          enrollment_id: string | null
          error_message: string
          id: string
          resolved_at: string | null
          zarinpal_response: Json | null
        }
        Insert: {
          created_at?: string | null
          enrollment_id?: string | null
          error_message: string
          id?: string
          resolved_at?: string | null
          zarinpal_response?: Json | null
        }
        Update: {
          created_at?: string | null
          enrollment_id?: string | null
          error_message?: string
          id?: string
          resolved_at?: string | null
          zarinpal_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_verification_logs_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_messages: {
        Row: {
          created_at: string | null
          id: string
          message_id: number
          pinned_at: string | null
          pinned_by: number
          room_id: number | null
          summary: string
          topic_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: number
          pinned_at?: string | null
          pinned_by: number
          room_id?: number | null
          summary: string
          topic_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: number
          pinned_at?: string | null
          pinned_by?: number
          room_id?: number | null
          summary?: string
          topic_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pinned_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messenger_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_messages_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_messages_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "chat_topics"
            referencedColumns: ["id"]
          },
        ]
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
      sales_agent_courses: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: number
          sales_agent_id: number | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: number
          sales_agent_id?: number | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: number
          sales_agent_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_agent_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_agent_courses_sales_agent_id_fkey"
            columns: ["sales_agent_id"]
            isOneToOne: false
            referencedRelation: "sales_agent_performance"
            referencedColumns: ["sales_agent_id"]
          },
          {
            foreignKeyName: "sales_agent_courses_sales_agent_id_fkey"
            columns: ["sales_agent_id"]
            isOneToOne: false
            referencedRelation: "sales_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_agents: {
        Row: {
          created_at: string | null
          id: number
          is_active: boolean | null
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
        ]
      }
      short_links: {
        Row: {
          clicks: number
          created_at: string
          created_by: string | null
          id: string
          original_url: string
          slug: string
          title: string | null
          updated_at: string
        }
        Insert: {
          clicks?: number
          created_at?: string
          created_by?: string | null
          id?: string
          original_url: string
          slug: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          clicks?: number
          created_at?: string
          created_by?: string | null
          id?: string
          original_url?: string
          slug?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sso_tokens: {
        Row: {
          course_slug: string
          created_at: string
          enrollment_id: string | null
          expires_at: string
          id: string
          token: string
          type: string
          used: boolean
          used_at: string | null
          user_email: string
        }
        Insert: {
          course_slug: string
          created_at?: string
          enrollment_id?: string | null
          expires_at?: string
          id?: string
          token: string
          type: string
          used?: boolean
          used_at?: string | null
          user_email: string
        }
        Update: {
          course_slug?: string
          created_at?: string
          enrollment_id?: string | null
          expires_at?: string
          id?: string
          token?: string
          type?: string
          used?: boolean
          used_at?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_tokens_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
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
      test_enrollments: {
        Row: {
          birth_year: number | null
          created_at: string
          email: string | null
          enrollment_status: string
          esanj_employee_id: number | null
          esanj_uuid: string | null
          full_name: string
          id: string
          payment_amount: number | null
          payment_method: string | null
          payment_status: string
          phone: string
          result_data: Json | null
          sex: string | null
          test_completed_at: string | null
          test_id: string
          test_started_at: string | null
          updated_at: string
          user_id: number
          zarinpal_authority: string | null
          zarinpal_ref_id: string | null
        }
        Insert: {
          birth_year?: number | null
          created_at?: string
          email?: string | null
          enrollment_status?: string
          esanj_employee_id?: number | null
          esanj_uuid?: string | null
          full_name: string
          id?: string
          payment_amount?: number | null
          payment_method?: string | null
          payment_status?: string
          phone: string
          result_data?: Json | null
          sex?: string | null
          test_completed_at?: string | null
          test_id: string
          test_started_at?: string | null
          updated_at?: string
          user_id: number
          zarinpal_authority?: string | null
          zarinpal_ref_id?: string | null
        }
        Update: {
          birth_year?: number | null
          created_at?: string
          email?: string | null
          enrollment_status?: string
          esanj_employee_id?: number | null
          esanj_uuid?: string | null
          full_name?: string
          id?: string
          payment_amount?: number | null
          payment_method?: string | null
          payment_status?: string
          phone?: string
          result_data?: Json | null
          sex?: string | null
          test_completed_at?: string | null
          test_id?: string
          test_started_at?: string | null
          updated_at?: string
          user_id?: number
          zarinpal_authority?: string | null
          zarinpal_ref_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_enrollments_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          count_ready: number | null
          count_used: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          price: number | null
          slug: string
          test_id: number
          title: string
          updated_at: string
        }
        Insert: {
          count_ready?: number | null
          count_used?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          price?: number | null
          slug: string
          test_id: number
          title: string
          updated_at?: string
        }
        Update: {
          count_ready?: number | null
          count_used?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          price?: number | null
          slug?: string
          test_id?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          reference: string | null
          user_id: number
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          reference?: string | null
          user_id: number
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          reference?: string | null
          user_id?: number
        }
        Relationships: []
      }
      user_course_progress: {
        Row: {
          completed_lessons: number | null
          course_id: string
          course_page_visited: boolean | null
          created_at: string | null
          id: string
          last_activity_at: string | null
          progress_percentage: number | null
          support_activated: boolean | null
          telegram_joined: boolean | null
          total_lessons: number | null
          total_time_spent: number | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          completed_lessons?: number | null
          course_id: string
          course_page_visited?: boolean | null
          created_at?: string | null
          id?: string
          last_activity_at?: string | null
          progress_percentage?: number | null
          support_activated?: boolean | null
          telegram_joined?: boolean | null
          total_lessons?: number | null
          total_time_spent?: number | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          completed_lessons?: number | null
          course_id?: string
          course_page_visited?: boolean | null
          created_at?: string | null
          id?: string
          last_activity_at?: string | null
          progress_percentage?: number | null
          support_activated?: boolean | null
          telegram_joined?: boolean | null
          total_lessons?: number | null
          total_time_spent?: number | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: []
      }
      user_lesson_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string | null
          first_opened_at: string | null
          id: string
          is_completed: boolean | null
          is_opened: boolean | null
          last_accessed_at: string | null
          lesson_id: string
          total_time_spent: number | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          first_opened_at?: string | null
          id?: string
          is_completed?: boolean | null
          is_opened?: boolean | null
          last_accessed_at?: string | null
          lesson_id: string
          total_time_spent?: number | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          first_opened_at?: string | null
          id?: string
          is_completed?: boolean | null
          is_opened?: boolean | null
          last_accessed_at?: string | null
          lesson_id?: string
          total_time_spent?: number | null
          updated_at?: string | null
          user_id?: number
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
      webhook_configurations: {
        Row: {
          body_template: Json | null
          course_id: string | null
          created_at: string
          created_by: number | null
          event_type: string
          headers: Json | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          url: string
        }
        Insert: {
          body_template?: Json | null
          course_id?: string | null
          created_at?: string
          created_by?: number | null
          event_type: string
          headers?: Json | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          url: string
        }
        Update: {
          body_template?: Json | null
          course_id?: string | null
          created_at?: string
          created_by?: number | null
          event_type?: string
          headers?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_configurations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_configurations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          sent_at: string
          success: boolean
          webhook_config_id: string
        }
        Insert: {
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          sent_at?: string
          success?: boolean
          webhook_config_id: string
        }
        Update: {
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          sent_at?: string
          success?: boolean
          webhook_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_config_id_fkey"
            columns: ["webhook_config_id"]
            isOneToOne: false
            referencedRelation: "webhook_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      sales_agent_performance: {
        Row: {
          agent_name: string | null
          agent_phone: string | null
          agent_user_id: number | null
          claimed_leads: number | null
          conversion_rate_percentage: number | null
          crm_activities_count: number | null
          sales_agent_id: number | null
          successful_conversions: number | null
          total_amount_sold: number | null
          total_assigned_leads: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_agents_user_id_fkey"
            columns: ["agent_user_id"]
            isOneToOne: false
            referencedRelation: "chat_users"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_dashboard_stats: {
        Row: {
          enrollments_month: number | null
          enrollments_today: number | null
          enrollments_week: number | null
          enrollments_yesterday: number | null
          leads_assigned_today: number | null
          revenue_month: number | null
          revenue_today: number | null
          revenue_week: number | null
          revenue_yesterday: number | null
          unassigned_leads_total: number | null
          untouched_leads_total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_courses_to_sales_agent: {
        Args: { p_agent_user_id: number; p_course_ids: string[] }
        Returns: boolean
      }
      assign_lead_to_agent: {
        Args: {
          p_enrollment_id: string
          p_agent_user_id: number
          p_assigned_by: number
        }
        Returns: boolean
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      check_sales_agent_lead_access: {
        Args: { p_agent_user_id: number; p_enrollment_id: string }
        Returns: boolean
      }
      cleanup_expired_sso_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_inactive_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      detect_country_code_from_phone: {
        Args: { phone_number: string }
        Returns: string
      }
      distribute_lead_and_create_deal: {
        Args: {
          p_enrollment_id: string
          p_agent_user_id: number
          p_assigned_by: number
          p_deal_course_id: string
          p_deal_price: number
        }
        Returns: boolean
      }
      distribute_lead_to_agent: {
        Args: {
          p_enrollment_id: string
          p_agent_user_id: number
          p_assigned_by: number
        }
        Returns: boolean
      }
      fix_payment_status_inconsistencies: {
        Args: Record<PropertyKey, never>
        Returns: {
          enrollment_id: string
          full_name: string
          old_status: string
          new_status: string
          ref_id: string
        }[]
      }
      generate_lesson_numbers: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_unique_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_academy_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["academy_user_role"]
      }
      get_lead_assignments: {
        Args: { agent_user_id: number }
        Returns: {
          assignment_id: number
          enrollment_id: string
          full_name: string
          email: string
          phone: string
          course_title: string
          payment_amount: number
          assigned_at: string
          status: string
        }[]
      }
      get_lesson_by_number: {
        Args: { course_slug_param: string; lesson_num: number }
        Returns: {
          id: string
          title: string
          content: string
          video_url: string
          file_url: string
          duration: number
          order_index: number
          section_id: string
          course_id: string
          lesson_number: number
          created_at: string
          updated_at: string
        }[]
      }
      get_or_create_private_conversation: {
        Args: { p_user1_id: number; p_user2_id: number }
        Returns: number
      }
      get_sales_agent_courses: {
        Args: { agent_user_id: number }
        Returns: {
          course_id: string
          course_title: string
          course_slug: string
        }[]
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
      get_user_courses_by_phone: {
        Args: { user_phone: string }
        Returns: {
          enrollment_id: string
          course_id: string
          course_title: string
          course_description: string
          course_price: number
          course_redirect_url: string
          enrollment_date: string
          payment_status: string
          payment_amount: number
          spotplayer_license_key: string
          spotplayer_license_url: string
          spotplayer_license_id: string
        }[]
      }
      get_user_courses_for_sales_agent: {
        Args: { agent_user_id: number }
        Returns: {
          enrollment_id: string
          full_name: string
          email: string
          phone: string
          course_title: string
          payment_status: string
          payment_amount: number
          created_at: string
          is_assigned: boolean
          assigned_to_agent: string
        }[]
      }
      get_user_from_session: {
        Args: { session_token_param: string }
        Returns: number
      }
      get_user_licenses_by_phone: {
        Args: { user_phone: string }
        Returns: {
          license_id: string
          course_id: string
          course_title: string
          license_key: string
          license_data: Json
          license_status: string
          created_at: string
          expires_at: string
          activated_at: string
          enrollment_id: string
        }[]
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
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      increment_short_link_clicks: {
        Args: { link_slug: string }
        Returns: undefined
      }
      increment_views: {
        Args: { announcement_id: number }
        Returns: undefined
      }
      is_academy_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_academy_admin_safe: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_iranian_phone: {
        Args: { phone_number: string }
        Returns: boolean
      }
      is_sales_manager: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_session_valid: {
        Args: { session_token_param: string }
        Returns: boolean
      }
      log_payment_verification_issue: {
        Args: {
          p_enrollment_id: string
          p_error_message: string
          p_zarinpal_response?: Json
        }
        Returns: string
      }
      log_user_activity: {
        Args: {
          p_user_id: number
          p_event_type: string
          p_reference?: string
          p_metadata?: Json
        }
        Returns: string
      }
      remove_course_from_sales_agent: {
        Args: { p_agent_user_id: number; p_course_id: string }
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
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      update_user_presence: {
        Args: { p_user_id: number; p_is_online?: boolean }
        Returns: undefined
      }
      url_encode: {
        Args: { input: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
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
      academy_user_role: "student" | "admin" | "sales_manager"
      course_status: "active" | "closed" | "full"
      course_type: "free" | "paid"
      enrollment_status: "enrolled" | "completed"
      gender_type: "male" | "female"
      iran_province_type:
        | "آذربایجان شرقی"
        | "آذربایجان غربی"
        | "اردبیل"
        | "اصفهان"
        | "البرز"
        | "ایلام"
        | "بوشهر"
        | "تهران"
        | "چهارمحال و بختیاری"
        | "خراسان جنوبی"
        | "خراسان رضوی"
        | "خراسان شمالی"
        | "خوزستان"
        | "زنجان"
        | "سمنان"
        | "سیستان و بلوچستان"
        | "فارس"
        | "قزوین"
        | "قم"
        | "کردستان"
        | "کرمان"
        | "کرمانشاه"
        | "کهگیلویه و بویراحمد"
        | "گلستان"
        | "گیلان"
        | "لرستان"
        | "مازندران"
        | "مرکزی"
        | "هرمزگان"
        | "همدان"
        | "یزد"
      manual_payment_status: "pending" | "approved" | "rejected"
      specialized_program_type:
        | "drop_shipping"
        | "drop_servicing"
        | "digital_goods"
        | "ai"
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
      webhook_event_type:
        | "enrollment_created"
        | "enrollment_paid_successful"
        | "enrollment_manual_payment_submitted"
        | "enrollment_manual_payment_approved"
        | "enrollment_manual_payment_rejected"
        | "user_created"
        | "email_linked_existing_account"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      academy_user_role: ["student", "admin", "sales_manager"],
      course_status: ["active", "closed", "full"],
      course_type: ["free", "paid"],
      enrollment_status: ["enrolled", "completed"],
      gender_type: ["male", "female"],
      iran_province_type: [
        "آذربایجان شرقی",
        "آذربایجان غربی",
        "اردبیل",
        "اصفهان",
        "البرز",
        "ایلام",
        "بوشهر",
        "تهران",
        "چهارمحال و بختیاری",
        "خراسان جنوبی",
        "خراسان رضوی",
        "خراسان شمالی",
        "خوزستان",
        "زنجان",
        "سمنان",
        "سیستان و بلوچستان",
        "فارس",
        "قزوین",
        "قم",
        "کردستان",
        "کرمان",
        "کرمانشاه",
        "کهگیلویه و بویراحمد",
        "گلستان",
        "گیلان",
        "لرستان",
        "مازندران",
        "مرکزی",
        "هرمزگان",
        "همدان",
        "یزد",
      ],
      manual_payment_status: ["pending", "approved", "rejected"],
      specialized_program_type: [
        "drop_shipping",
        "drop_servicing",
        "digital_goods",
        "ai",
      ],
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
      webhook_event_type: [
        "enrollment_created",
        "enrollment_paid_successful",
        "enrollment_manual_payment_submitted",
        "enrollment_manual_payment_approved",
        "enrollment_manual_payment_rejected",
        "user_created",
        "email_linked_existing_account",
      ],
    },
  },
} as const
