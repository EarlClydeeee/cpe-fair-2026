// ACCESS CPE Fair 2026 schema types. Regenerate after schema changes if desired.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamps = { created_at: string; updated_at: string };

export type Database = {
  __InternalSupabase: { PostgrestVersion: "13" };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          role: Database["public"]["Enums"]["admin_role"] | null;
        } & Timestamps;
        Insert: {
          id: string;
          full_name?: string;
          email?: string | null;
          role?: Database["public"]["Enums"]["admin_role"] | null;
        };
        Update: {
          full_name?: string;
          email?: string | null;
          role?: Database["public"]["Enums"]["admin_role"] | null;
        };
        Relationships: [];
      };
      seasons: {
        Row: {
          id: string;
          slug: string;
          name: string;
          year: number;
          is_active: boolean;
        } & Timestamps;
        Insert: {
          id?: string;
          slug: string;
          name: string;
          year: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["seasons"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          season_id: string;
          slug: string;
          name: string;
          sort_order: number;
        } & Timestamps;
        Insert: {
          id?: string;
          season_id: string;
          slug: string;
          name: string;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      competition_teams: {
        Row: {
          id: string;
          season_id: string;
          name: string;
          slug: string;
          affiliation: string;
          color_hex: string;
          artwork_url: string | null;
          visibility: Database["public"]["Enums"]["team_visibility"];
          sort_order: number;
        } & Timestamps;
        Insert: {
          id?: string;
          season_id: string;
          name: string;
          slug: string;
          affiliation?: string;
          color_hex?: string;
          artwork_url?: string | null;
          visibility?: Database["public"]["Enums"]["team_visibility"];
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["competition_teams"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          season_id: string;
          category_id: string;
          name: string;
          match_type: Database["public"]["Enums"]["event_match_type"];
          team_a_id: string | null;
          team_b_id: string | null;
          start_at: string;
          end_at: string;
          venue: string;
          match_format: string;
          winner_team_id: string | null;
          result_note: string;
          is_highlighted: boolean;
          status_override: Database["public"]["Enums"]["event_status_override"];
          is_archived: boolean;
        } & Timestamps;
        Insert: {
          id?: string;
          season_id: string;
          category_id: string;
          name: string;
          match_type?: Database["public"]["Enums"]["event_match_type"];
          team_a_id?: string | null;
          team_b_id?: string | null;
          start_at: string;
          end_at: string;
          venue?: string;
          match_format?: string;
          winner_team_id?: string | null;
          result_note?: string;
          is_highlighted?: boolean;
          status_override?: Database["public"]["Enums"]["event_status_override"];
          is_archived?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      published_scores: {
        Row: {
          id: string;
          team_id: string;
          category_id: string;
          points: number;
          published_at: string;
          published_by: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          team_id: string;
          category_id: string;
          points?: number;
          published_at?: string;
          published_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["published_scores"]["Insert"]>;
        Relationships: [];
      };
      score_drafts: {
        Row: {
          id: string;
          team_id: string;
          category_id: string;
          draft_points: number;
          reason: string;
          saved_by: string | null;
          saved_at: string;
        } & Timestamps;
        Insert: {
          id?: string;
          team_id: string;
          category_id: string;
          draft_points: number;
          reason?: string;
          saved_by?: string | null;
          saved_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["score_drafts"]["Insert"]>;
        Relationships: [];
      };
      admin_invitations: {
        Row: {
          id: string;
          email: string;
          role: Database["public"]["Enums"]["admin_role"];
          invited_by: string | null;
          status: Database["public"]["Enums"]["invitation_status"];
        } & Timestamps;
        Insert: {
          id?: string;
          email: string;
          role: Database["public"]["Enums"]["admin_role"];
          invited_by?: string | null;
          status?: Database["public"]["Enums"]["invitation_status"];
        };
        Update: Partial<Database["public"]["Tables"]["admin_invitations"]["Insert"]>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          season_id: string | null;
          actor_id: string | null;
          action: Database["public"]["Enums"]["audit_action"];
          entity_type: string;
          entity_id: string | null;
          summary: string;
          before_json: Json | null;
          after_json: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          season_id?: string | null;
          actor_id?: string | null;
          action: Database["public"]["Enums"]["audit_action"];
          entity_type: string;
          entity_id?: string | null;
          summary?: string;
          before_json?: Json | null;
          after_json?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_role: {
        Args: Record<string, never>;
        Returns: Database["public"]["Enums"]["admin_role"] | null;
      };
      is_staff: { Args: Record<string, never>; Returns: boolean };
      is_owner: { Args: Record<string, never>; Returns: boolean };
      can_manage_content: { Args: Record<string, never>; Returns: boolean };
      can_manage_events: { Args: Record<string, never>; Returns: boolean };
      can_score: { Args: Record<string, never>; Returns: boolean };
      save_score_draft: {
        Args: {
          p_team_id: string;
          p_category_id: string;
          p_draft_points: number;
          p_reason: string;
        };
        Returns: Database["public"]["Tables"]["score_drafts"]["Row"];
      };
      publish_score_drafts: {
        Args: { p_draft_ids: string[] };
        Returns: number;
      };
    };
    Enums: {
      admin_role: "owner" | "site_admin" | "scoring_admin" | "events_editor";
      event_match_type: "head_to_head" | "all_teams";
      event_status_override: "auto" | "upcoming" | "ongoing" | "ended";
      team_visibility: "active" | "archived";
      invitation_status: "pending" | "accepted" | "revoked";
      audit_action:
        | "draft_saved"
        | "published"
        | "event_updated"
        | "team_updated"
        | "admin_invited"
        | "role_changed"
        | "invitation_revoked";
    };
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
