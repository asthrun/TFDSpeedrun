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
      categories: {
        Row: {
          attempt_count: number
          compare_mode: string
          created_at: string
          game_profile_id: string
          id: string
          name: string
          target_time_ms: number | null
          user_id: string
        }
        Insert: {
          attempt_count?: number
          compare_mode?: string
          created_at?: string
          game_profile_id: string
          id?: string
          name: string
          target_time_ms?: number | null
          user_id: string
        }
        Update: {
          attempt_count?: number
          compare_mode?: string
          created_at?: string
          game_profile_id?: string
          id?: string
          name?: string
          target_time_ms?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_game_profile_id_fkey"
            columns: ["game_profile_id"]
            isOneToOne: false
            referencedRelation: "game_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_profile_user_fkey"
            columns: ["game_profile_id", "user_id"]
            isOneToOne: false
            referencedRelation: "game_profiles"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      custom_target_splits: {
        Row: {
          category_id: string
          created_at: string
          section_id: string
          time_ms: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          section_id: string
          time_ms: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          section_id?: string
          time_ms?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_target_splits_category_user_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "custom_target_splits_section_category_user_fkey"
            columns: ["section_id", "category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id", "category_id", "user_id"]
          },
        ]
      }
      game_profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      legal_acceptances: {
        Row: {
          age_confirmed_at: string
          terms_accepted_at: string
          terms_version: string
          user_id: string
        }
        Insert: {
          age_confirmed_at: string
          terms_accepted_at: string
          terms_version: string
          user_id: string
        }
        Update: {
          age_confirmed_at?: string
          terms_accepted_at?: string
          terms_version?: string
          user_id?: string
        }
        Relationships: []
      }
      run_splits: {
        Row: {
          run_id: string
          section_id: string
          time_ms: number
          user_id: string
        }
        Insert: {
          run_id: string
          section_id: string
          time_ms: number
          user_id: string
        }
        Update: {
          run_id?: string
          section_id?: string
          time_ms?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "run_splits_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_splits_run_user_fkey"
            columns: ["run_id", "user_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "run_splits_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_splits_section_user_fkey"
            columns: ["section_id", "user_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      runs: {
        Row: {
          category_id: string
          completed_at: string | null
          created_at: string
          id: string
          is_valid: boolean
          started_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_valid?: boolean
          started_at: string
          user_id: string
        }
        Update: {
          category_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_valid?: boolean
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "runs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runs_category_user_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      sections: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          sort_order: number
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_category_user_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          
          show_compare_delta: boolean

          font_family: string
          font_scale: number

          shortcut_reset: string | null
          shortcut_undo: string | null
          shortcut_start_split: string | null
          shortcut_pause: string | null
          shortcut_skip: string | null

          double_tap_delay_ms: number
          save_incomplete_runs: boolean
          visible_split_count: number | null

          updated_at: string
          user_id: string
          text_shadow: boolean

          primary_text_color: string
          secondary_text_color: string
          ahead_gaining_color: string
          ahead_losing_color: string
          behind_gaining_color: string
          behind_losing_color: string
          best_segment_color: string
          paused_color: string

          timer_background_mode: string
          timer_background_color: string
          timer_background_opacity: number

          splits_background_mode: string
          splits_background_color_1: string
          splits_background_color_2: string
          splits_background_opacity: number

          chroma_key_enabled: boolean
          chroma_key_color: string

          show_game_profile: boolean
          show_category: boolean
          show_compare_to: boolean
          privacy_mode: boolean
        }
        Insert: {          
          font_family?: string
          font_scale?: number          
          shortcut_reset?: string | null          
          shortcut_undo?: string | null                   
          updated_at?: string
          user_id: string
          visible_split_count?: number | null
          shortcut_start_split?: string | null
          shortcut_pause?: string | null
          shortcut_skip?: string | null
          double_tap_delay_ms?: number
          save_incomplete_runs?: boolean
         
          
          show_compare_delta?: boolean
          text_shadow?: boolean

          primary_text_color?: string
          secondary_text_color?: string
          ahead_gaining_color?: string
          ahead_losing_color?: string
          behind_gaining_color?: string
          behind_losing_color?: string
          best_segment_color?: string
          paused_color?: string

          timer_background_mode?: string
          timer_background_color?: string
          timer_background_opacity?: number

          splits_background_mode?: string
          splits_background_color_1?: string
          splits_background_color_2?: string
          splits_background_opacity?: number

          chroma_key_enabled?: boolean
          chroma_key_color?: string

          show_game_profile?: boolean
          show_category?: boolean
          show_compare_to?: boolean
          privacy_mode?: boolean
        }
        Update: {          
          font_family?: string
          font_scale?: number          
          shortcut_reset?: string | null        
          shortcut_undo?: string | null          
          updated_at?: string
          user_id?: string
          visible_split_count?: number | null
          shortcut_start_split?: string | null
          shortcut_pause?: string | null
          shortcut_skip?: string | null
          double_tap_delay_ms?: number
          save_incomplete_runs?: boolean
          
          
          show_compare_delta?: boolean
          text_shadow?: boolean

          primary_text_color?: string
          secondary_text_color?: string
          ahead_gaining_color?: string
          ahead_losing_color?: string
          behind_gaining_color?: string
          behind_losing_color?: string
          best_segment_color?: string
          paused_color?: string

          timer_background_mode?: string
          timer_background_color?: string
          timer_background_opacity?: number

          splits_background_mode?: string
          splits_background_color_1?: string
          splits_background_color_2?: string
          splits_background_opacity?: number

          chroma_key_enabled?: boolean
          chroma_key_color?: string
          show_game_profile?: boolean
          show_category?: boolean
          show_compare_to?: boolean
          privacy_mode?: boolean

        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_category_attempt_count: {
        Args: { p_category_id: string }
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
    Enums: {},
  },
} as const

export type UserSettings =
  Database["public"]["Tables"]["user_settings"]["Row"];

export type GameProfile =
  Database["public"]["Tables"]["game_profiles"]["Row"];

export type Category =
  Database["public"]["Tables"]["categories"]["Row"];

export type Section =
  Database["public"]["Tables"]["sections"]["Row"];

export type Run =
  Database["public"]["Tables"]["runs"]["Row"];

export type RunSplit =
  Database["public"]["Tables"]["run_splits"]["Row"];