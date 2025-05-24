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
      payments: {
        Row: {
          amount: number | null
          card_brand: string | null
          card_last4: number | null
          created: number | null
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          id: number | null
          payment_method_type: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          card_brand?: string | null
          card_last4?: number | null
          created?: number | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          id?: number | null
          payment_method_type?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          card_brand?: string | null
          card_last4?: number | null
          created?: number | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          id?: number | null
          payment_method_type?: string | null
          status?: string | null
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number | null
          arrival_date: number | null
          automatic: boolean | null
          currency: string | null
          description: string | null
          destination: string | null
          id: number | null
          method: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          arrival_date?: number | null
          automatic?: boolean | null
          currency?: string | null
          description?: string | null
          destination?: string | null
          id?: number | null
          method?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          arrival_date?: number | null
          automatic?: boolean | null
          currency?: string | null
          description?: string | null
          destination?: string | null
          id?: number | null
          method?: string | null
          status?: string | null
        }
        Relationships: []
      }
      stripeaccounts: {
        Row: {
          account_id: string | null
          charges_enabled: boolean | null
          created_at: string | null
          details_submitted: boolean | null
          id: number | null
          payouts_enabled: boolean | null
          user_id: number | null
        }
        Insert: {
          account_id?: string | null
          charges_enabled?: boolean | null
          created_at?: string | null
          details_submitted?: boolean | null
          id?: number | null
          payouts_enabled?: boolean | null
          user_id?: number | null
        }
        Update: {
          account_id?: string | null
          charges_enabled?: boolean | null
          created_at?: string | null
          details_submitted?: boolean | null
          id?: number | null
          payouts_enabled?: boolean | null
          user_id?: number | null
        }
        Relationships: []
      }
      user_assistant: {
        Row: {
          activated_at: string | null
          is_enabled: boolean | null
          last_used: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          is_enabled?: boolean | null
          last_used?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          activated_at?: string | null
          is_enabled?: boolean | null
          last_used?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_courses: {
        Row: {
          activated_at: string | null
          completed_at: string | null
          course_slug: string
          course_type: string | null
          id: string
          progress: Json | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          completed_at?: string | null
          course_slug: string
          course_type?: string | null
          id?: string
          progress?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          completed_at?: string | null
          course_slug?: string
          course_type?: string | null
          id?: string
          progress?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_profile: {
        Row: {
          full_name: string | null
          last_login: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          full_name?: string | null
          last_login?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          full_name?: string | null
          last_login?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_tests: {
        Row: {
          activated_at: string | null
          completed_at: string | null
          id: string
          result: Json | null
          score: number | null
          status: string | null
          test_slug: string
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          completed_at?: string | null
          id?: string
          result?: Json | null
          score?: number | null
          status?: string | null
          test_slug: string
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          completed_at?: string | null
          id?: string
          result?: Json | null
          score?: number | null
          status?: string | null
          test_slug?: string
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          account_id: string | null
          business_category: string | null
          created_at: string | null
          email: string | null
          estimated_volume_usd: number | null
          full_name: string | null
          gateway_use_description: string | null
          is_admin: boolean | null
          nationality: string | null
          notes: string | null
          phone_number: string | null
          product_description: string | null
          status: string | null
          stripe_account_id: string | null
          stripe_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          business_category?: string | null
          created_at?: string | null
          email?: string | null
          estimated_volume_usd?: number | null
          full_name?: string | null
          gateway_use_description?: string | null
          is_admin?: boolean | null
          nationality?: string | null
          notes?: string | null
          phone_number?: string | null
          product_description?: string | null
          status?: string | null
          stripe_account_id?: string | null
          stripe_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          business_category?: string | null
          created_at?: string | null
          email?: string | null
          estimated_volume_usd?: number | null
          full_name?: string | null
          gateway_use_description?: string | null
          is_admin?: boolean | null
          nationality?: string | null
          notes?: string | null
          phone_number?: string | null
          product_description?: string | null
          status?: string | null
          stripe_account_id?: string | null
          stripe_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          attempts: number | null
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          phone: string
          used: boolean | null
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          phone: string
          used?: boolean | null
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          phone?: string
          used?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
