export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      action_log: {
        Row: {
          action: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          id: string
          message: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string
          id?: string
          message: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          id?: string
          message?: string
        }
        Relationships: []
      }
      app_user_connections: {
        Row: {
          account_label: string | null
          connection_key_ciphertext: string
          connector_id: string
          created_at: string
          id: string
          oauth_last_attempt_at: string | null
          oauth_last_error: string | null
          oauth_last_step: string | null
          oauth_requested_scopes: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          account_label?: string | null
          connection_key_ciphertext: string
          connector_id: string
          created_at?: string
          id?: string
          oauth_last_attempt_at?: string | null
          oauth_last_error?: string | null
          oauth_last_step?: string | null
          oauth_requested_scopes?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          account_label?: string | null
          connection_key_ciphertext?: string
          connector_id?: string
          created_at?: string
          id?: string
          oauth_last_attempt_at?: string | null
          oauth_last_error?: string | null
          oauth_last_step?: string | null
          oauth_requested_scopes?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cron_tokens: {
        Row: {
          created_at: string
          name: string
          token: string
        }
        Insert: {
          created_at?: string
          name: string
          token?: string
        }
        Update: {
          created_at?: string
          name?: string
          token?: string
        }
        Relationships: []
      }
      demo_sites: {
        Row: {
          business_name: string
          created_at: string
          html: string
          id: string
          lead_id: string | null
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name: string
          created_at?: string
          html: string
          id?: string
          lead_id?: string | null
          slug: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          business_name?: string
          created_at?: string
          html?: string
          id?: string
          lead_id?: string | null
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_sites_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_history: {
        Row: {
          body: string
          bounced_at: string | null
          created_at: string
          error_message: string | null
          gmail_message_id: string | null
          gmail_thread_id: string | null
          id: string
          lead_id: string | null
          replied: boolean
          replied_at: string | null
          sent_at: string | null
          sent_status: string
          subject: string
          to_email: string
          user_id: string
        }
        Insert: {
          body: string
          bounced_at?: string | null
          created_at?: string
          error_message?: string | null
          gmail_message_id?: string | null
          gmail_thread_id?: string | null
          id?: string
          lead_id?: string | null
          replied?: boolean
          replied_at?: string | null
          sent_at?: string | null
          sent_status?: string
          subject: string
          to_email: string
          user_id?: string
        }
        Update: {
          body?: string
          bounced_at?: string | null
          created_at?: string
          error_message?: string | null
          gmail_message_id?: string | null
          gmail_thread_id?: string | null
          id?: string
          lead_id?: string | null
          replied?: boolean
          replied_at?: string | null
          sent_at?: string | null
          sent_status?: string
          subject?: string
          to_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_replies: {
        Row: {
          created_at: string
          email_history_id: string | null
          from_email: string | null
          gmail_message_id: string
          gmail_thread_id: string
          id: string
          is_read: boolean
          lead_id: string | null
          received_at: string
          snippet: string | null
          subject: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email_history_id?: string | null
          from_email?: string | null
          gmail_message_id: string
          gmail_thread_id: string
          id?: string
          is_read?: boolean
          lead_id?: string | null
          received_at?: string
          snippet?: string | null
          subject?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email_history_id?: string | null
          from_email?: string | null
          gmail_message_id?: string
          gmail_thread_id?: string
          id?: string
          is_read?: boolean
          lead_id?: string | null
          received_at?: string
          snippet?: string | null
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_replies_email_history_id_fkey"
            columns: ["email_history_id"]
            isOneToOne: false
            referencedRelation: "email_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_replies_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      gmail_accounts: {
        Row: {
          created_at: string
          email: string | null
          last_checked_at: string | null
          last_error: string | null
          refresh_token_ciphertext: string
          scopes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          last_checked_at?: string | null
          last_error?: string | null
          refresh_token_ciphertext: string
          scopes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          last_checked_at?: string | null
          last_error?: string | null
          refresh_token_ciphertext?: string
          scopes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gmail_oauth_diagnostics: {
        Row: {
          connector_id: string
          last_attempt_at: string
          last_error: string | null
          last_step: string
          requested_scopes: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          connector_id?: string
          last_attempt_at?: string
          last_error?: string | null
          last_step?: string
          requested_scopes?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          connector_id?: string
          last_attempt_at?: string
          last_error?: string | null
          last_step?: string
          requested_scopes?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string | null
          analysis: Json | null
          business_category: string | null
          business_name: string
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          generated_email: string | null
          google_rating: number | null
          id: string
          instagram_handle: string | null
          instagram_message: string | null
          mobile_friendly: boolean | null
          notes: string | null
          owner_name: string | null
          phone: string | null
          place_id: string | null
          review_count: number | null
          seo_score: number | null
          ssl_enabled: boolean | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          user_id: string
          website: string | null
          website_speed: number | null
          website_status: string | null
        }
        Insert: {
          address?: string | null
          analysis?: Json | null
          business_category?: string | null
          business_name: string
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          generated_email?: string | null
          google_rating?: number | null
          id?: string
          instagram_handle?: string | null
          instagram_message?: string | null
          mobile_friendly?: boolean | null
          notes?: string | null
          owner_name?: string | null
          phone?: string | null
          place_id?: string | null
          review_count?: number | null
          seo_score?: number | null
          ssl_enabled?: boolean | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id?: string
          website?: string | null
          website_speed?: number | null
          website_status?: string | null
        }
        Update: {
          address?: string | null
          analysis?: Json | null
          business_category?: string | null
          business_name?: string
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          generated_email?: string | null
          google_rating?: number | null
          id?: string
          instagram_handle?: string | null
          instagram_message?: string | null
          mobile_friendly?: boolean | null
          notes?: string | null
          owner_name?: string | null
          phone?: string | null
          place_id?: string | null
          review_count?: number | null
          seo_score?: number | null
          ssl_enabled?: boolean | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id?: string
          website?: string | null
          website_speed?: number | null
          website_status?: string | null
        }
        Relationships: []
      }
      outreach: {
        Row: {
          channel: string
          created_at: string
          id: string
          lead_id: string
          notes: string | null
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          paid_at: string
          plan: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          paid_at?: string
          plan?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          paid_at?: string
          plan?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_requests: {
        Row: {
          amount_usd: number
          created_at: string
          id: string
          requested_plan: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_usd: number
          created_at?: string
          id?: string
          requested_plan: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_usd?: number
          created_at?: string
          id?: string
          requested_plan?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          monthly_email_quota: number
          monthly_lead_quota: number
          plan: string
          suspended: boolean
          updated_at: string
          website_builder_enabled: boolean
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          monthly_email_quota?: number
          monthly_lead_quota?: number
          plan?: string
          suspended?: boolean
          updated_at?: string
          website_builder_enabled?: boolean
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          monthly_email_quota?: number
          monthly_lead_quota?: number
          plan?: string
          suspended?: boolean
          updated_at?: string
          website_builder_enabled?: boolean
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          email_tone: string
          id: string
          sender_email: string | null
          sender_name: string | null
          service_description: string | null
          signature: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_tone?: string
          id?: string
          sender_email?: string | null
          sender_name?: string | null
          service_description?: string | null
          signature?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          email_tone?: string
          id?: string
          sender_email?: string | null
          sender_name?: string | null
          service_description?: string | null
          signature?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      unsubscribes: {
        Row: {
          created_at: string
          email: string
          id: string
          lead_id: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          lead_id?: string | null
          reason?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          lead_id?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unsubscribes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      review_plan_request: {
        Args: { _approve: boolean; _request_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      lead_status:
        | "new"
        | "contacted"
        | "replied"
        | "interested"
        | "closed"
        | "lost"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
      lead_status: [
        "new",
        "contacted",
        "replied",
        "interested",
        "closed",
        "lost",
      ],
    },
  },
} as const
