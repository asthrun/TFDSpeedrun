export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      user_settings: {
        Row: {
          user_id: string;
          chroma_hex: string;
          transparent_background: boolean;
          font_scale: number;
          font_family: string;
          show_best_of: boolean;
          show_sum_of_best: boolean;
          show_pb_delta: boolean;
          show_section_delta: boolean;
          compare_mode: "pb" | "target";
          shortcut_start: string | null;
          shortcut_stop: string | null;
          shortcut_reset: string | null;
          shortcut_split: string | null;
          shortcut_undo: string | null;
          shortcut_next_section: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          chroma_hex?: string;
          transparent_background?: boolean;
          font_scale?: number;
          font_family?: string;
          show_best_of?: boolean;
          show_sum_of_best?: boolean;
          show_pb_delta?: boolean;
          show_section_delta?: boolean;
          compare_mode?: "pb" | "target";
          shortcut_start?: string | null;
          shortcut_stop?: string | null;
          shortcut_reset?: string | null;
          shortcut_split?: string | null;
          shortcut_undo?: string | null;
          shortcut_next_section?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_settings"]["Insert"]>;
        Relationships: [];
      };
      game_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["game_profiles"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          game_profile_id: string;
          user_id: string;
          name: string;
          target_time_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_profile_id: string;
          user_id: string;
          name: string;
          target_time_ms?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      sections: {
        Row: {
          id: string;
          category_id: string;
          user_id: string;
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          user_id: string;
          name: string;
          sort_order: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sections"]["Insert"]>;
        Relationships: [];
      };
      runs: {
        Row: {
          id: string;
          category_id: string;
          user_id: string;
          started_at: string;
          completed_at: string | null;
          is_valid: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          user_id: string;
          started_at: string;
          completed_at?: string | null;
          is_valid?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["runs"]["Insert"]>;
        Relationships: [];
      };
      run_splits: {
        Row: {
          run_id: string;
          section_id: string;
          user_id: string;
          time_ms: number;
        };
        Insert: {
          run_id: string;
          section_id: string;
          user_id: string;
          time_ms: number;
        };
        Update: Partial<Database["public"]["Tables"]["run_splits"]["Insert"]>;
        Relationships: [];
      };
      share_sessions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          token: string;
          referee_user_id: string | null;
          created_at: string;
          last_split_at: string | null;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          token: string;
          referee_user_id?: string | null;
          created_at?: string;
          last_split_at?: string | null;
          closed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["share_sessions"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];
export type GameProfile = Database["public"]["Tables"]["game_profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Section = Database["public"]["Tables"]["sections"]["Row"];
export type Run = Database["public"]["Tables"]["runs"]["Row"];
export type RunSplit = Database["public"]["Tables"]["run_splits"]["Row"];
