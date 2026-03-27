/**
 * Manual Supabase database type definitions.
 * Matches public.groups and public.group_members from migrations.
 * Regenerate with `npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts` when schema changes.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
          invite_code: string | null;
          max_members: number;
          category: string | null;
          trip_date: string | null;
          difficulty_level: string | null;
          meeting_point: string | null;
          destination_lat: number | null;
          destination_lng: number | null;
          country_name: string | null;
          country_code: string | null;
          image_url: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
          invite_code?: string | null;
          max_members?: number;
          category?: string | null;
          trip_date?: string | null;
          difficulty_level?: string | null;
          meeting_point?: string | null;
          destination_lat?: number | null;
          destination_lng?: number | null;
          country_name?: string | null;
          country_code?: string | null;
          image_url?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
          invite_code?: string | null;
          max_members?: number;
          category?: string | null;
          trip_date?: string | null;
          difficulty_level?: string | null;
          meeting_point?: string | null;
          destination_lat?: number | null;
          destination_lng?: number | null;
          country_name?: string | null;
          country_code?: string | null;
          image_url?: string | null;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          group_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      blocked_users: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      connection_requests: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          message_template_type: string;
          message_text: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          message_template_type: string;
          message_text: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_user_id?: string;
          to_user_id?: string;
          message_template_type?: string;
          message_text?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      safety_reports: {
        Row: {
          id: string;
          user_id: string;
          location_name: string;
          coordinates: unknown;
          safety_rating: number;
          tags: string[] | null;
          comment: string | null;
          is_anonymous: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          location_name: string;
          coordinates?: unknown;
          safety_rating: number;
          tags?: string[] | null;
          comment?: string | null;
          is_anonymous?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          location_name?: string;
          coordinates?: unknown;
          safety_rating?: number;
          tags?: string[] | null;
          comment?: string | null;
          is_anonymous?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          plan: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount?: number;
          plan?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          plan?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_id: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_id: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          reported_id?: string;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          caption: string | null;
          location_name: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          caption?: string | null;
          location_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string;
          caption?: string | null;
          location_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          bio: string | null;
          home_country: string | null;
          travel_style: string | null;
          interests: string[] | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          linked_social_media: boolean | null;
          trust_score: number | null;
          verified_traveler: boolean | null;
          show_approximate_location: boolean | null;
          allow_only_verified_to_message: boolean | null;
          budget_level: string | null;
          languages: string[] | null;
          subscription_tier: string | null;
          role: string | null;
          last_seen: string | null;
          last_lat: number | null;
          last_lng: number | null;
          is_online: boolean | null;
          email: string | null;
          is_premium: boolean;
          stripe_customer_id: string | null;
          plan_type: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          bio?: string | null;
          home_country?: string | null;
          travel_style?: string | null;
          interests?: string[] | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          linked_social_media?: boolean | null;
          trust_score?: number | null;
          verified_traveler?: boolean | null;
          show_approximate_location?: boolean | null;
          allow_only_verified_to_message?: boolean | null;
          budget_level?: string | null;
          languages?: string[] | null;
          subscription_tier?: string | null;
          role?: string | null;
          last_seen?: string | null;
          last_lat?: number | null;
          last_lng?: number | null;
          is_online?: boolean | null;
          email?: string | null;
          is_premium?: boolean;
          stripe_customer_id?: string | null;
          plan_type?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          bio?: string | null;
          home_country?: string | null;
          travel_style?: string | null;
          interests?: string[] | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          linked_social_media?: boolean | null;
          trust_score?: number | null;
          verified_traveler?: boolean | null;
          show_approximate_location?: boolean | null;
          allow_only_verified_to_message?: boolean | null;
          budget_level?: string | null;
          languages?: string[] | null;
          subscription_tier?: string | null;
          role?: string | null;
          last_seen?: string | null;
          last_lat?: number | null;
          last_lng?: number | null;
          is_online?: boolean | null;
          email?: string | null;
          is_premium?: boolean;
          stripe_customer_id?: string | null;
          plan_type?: string | null;
        };
        Relationships: [];
      };
      group_messages: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          user_name: string | null;
          user_image: string | null;
          content: string;
          created_at: string;
          is_edited: boolean;
          is_deleted: boolean;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          user_name?: string | null;
          user_image?: string | null;
          content: string;
          created_at?: string;
          is_edited?: boolean;
          is_deleted?: boolean;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          user_name?: string | null;
          user_image?: string | null;
          content?: string;
          created_at?: string;
          is_edited?: boolean;
          is_deleted?: boolean;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          created_at: string;
          is_read: boolean;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          created_at?: string;
          is_read?: boolean;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          created_at?: string;
          is_read?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
