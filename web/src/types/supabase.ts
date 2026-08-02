export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: string;
          real_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: string;
          real_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: string;
          real_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      creator_profiles: {
        Row: {
          id: string;
          user_id: string;
          slug: string;
          studio_name: string;
          bio: string | null;
          region: string | null;
          service_types: string[];
          style_tags: string[];
          price_min: number | null;
          price_max: number | null;
          contact_email: string | null;
          line_id: string | null;
          phone: string | null;
          show_email: boolean;
          show_line: boolean;
          show_phone: boolean;
          verification_status: string;
          subscription_tier: string;
          featured: boolean;
          is_listed: boolean;
          is_demo: boolean;
          avatar_url: string | null;
          turnaround: string | null;
          revision_policy: string | null;
          response_time: string | null;
          team_size: string | null;
          platforms: string[];
          client_types: string[];
          languages: string[];
          typical_scope: string | null;
          website_url: string | null;
          price_list: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          slug: string;
          studio_name: string;
          bio?: string | null;
          region?: string | null;
          service_types?: string[];
          style_tags?: string[];
          price_min?: number | null;
          price_max?: number | null;
          contact_email?: string | null;
          line_id?: string | null;
          phone?: string | null;
          show_email?: boolean;
          show_line?: boolean;
          show_phone?: boolean;
          verification_status?: string;
          subscription_tier?: string;
          featured?: boolean;
          is_listed?: boolean;
          is_demo?: boolean;
          avatar_url?: string | null;
          turnaround?: string | null;
          revision_policy?: string | null;
          response_time?: string | null;
          team_size?: string | null;
          platforms?: string[];
          client_types?: string[];
          languages?: string[];
          typical_scope?: string | null;
          website_url?: string | null;
          price_list?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          slug?: string;
          studio_name?: string;
          bio?: string | null;
          region?: string | null;
          service_types?: string[];
          style_tags?: string[];
          price_min?: number | null;
          price_max?: number | null;
          contact_email?: string | null;
          line_id?: string | null;
          phone?: string | null;
          show_email?: boolean;
          show_line?: boolean;
          show_phone?: boolean;
          verification_status?: string;
          subscription_tier?: string;
          featured?: boolean;
          is_listed?: boolean;
          is_demo?: boolean;
          avatar_url?: string | null;
          turnaround?: string | null;
          revision_policy?: string | null;
          response_time?: string | null;
          team_size?: string | null;
          platforms?: string[];
          client_types?: string[];
          languages?: string[];
          typical_scope?: string | null;
          website_url?: string | null;
          price_list?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      portfolio_items: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          embed_url: string;
          embed_type: string;
          thumbnail_url: string | null;
          style_tags: string[];
          sort_order: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          embed_url: string;
          embed_type: string;
          thumbnail_url?: string | null;
          style_tags?: string[];
          sort_order?: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          embed_url?: string;
          embed_type?: string;
          thumbnail_url?: string | null;
          style_tags?: string[];
          sort_order?: number;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      bug_reports: {
        Row: {
          id: string;
          message: string;
          steps: string | null;
          page_url: string | null;
          user_agent: string | null;
          viewport: string | null;
          status: string;
          admin_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          message: string;
          steps?: string | null;
          page_url?: string | null;
          user_agent?: string | null;
          viewport?: string | null;
          status?: string;
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          message?: string;
          steps?: string | null;
          page_url?: string | null;
          user_agent?: string | null;
          viewport?: string | null;
          status?: string;
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          id: string;
          message: string;
          role: string | null;
          contact_email: string | null;
          page_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          message: string;
          role?: string | null;
          contact_email?: string | null;
          page_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          message?: string;
          role?: string | null;
          contact_email?: string | null;
          page_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      knocks: {
        Row: {
          id: string;
          creator_id: string;
          visitor_key: string;
          page_url: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          visitor_key: string;
          page_url?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          visitor_key?: string;
          page_url?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      inquiries: {
        Row: {
          id: string;
          creator_id: string;
          client_name: string;
          client_email: string;
          client_phone: string | null;
          message: string;
          budget_range: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          client_name: string;
          client_email: string;
          client_phone?: string | null;
          message: string;
          budget_range?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          client_name?: string;
          client_email?: string;
          client_phone?: string | null;
          message?: string;
          budget_range?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      remove_demo_accounts: {
        Args: Record<string, never>;
        Returns: string;
      };
      seed_demo_accounts: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
