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
      ab_tests: {
        Row: {
          campaign_id: string
          confidence_level: number
          confidence_reached: number | null
          created_at: string
          ended_at: string | null
          id: string
          min_conversions: number
          min_days: number
          name: string
          significance_at: string | null
          started_at: string | null
          status: string
          summary: Json
          tenant_id: string
          traffic_split: number
          updated_at: string
          variable_type: string
          winner_variant: string | null
        }
        Insert: {
          campaign_id: string
          confidence_level?: number
          confidence_reached?: number | null
          created_at?: string
          ended_at?: string | null
          id?: string
          min_conversions?: number
          min_days?: number
          name: string
          significance_at?: string | null
          started_at?: string | null
          status?: string
          summary?: Json
          tenant_id: string
          traffic_split?: number
          updated_at?: string
          variable_type: string
          winner_variant?: string | null
        }
        Update: {
          campaign_id?: string
          confidence_level?: number
          confidence_reached?: number | null
          created_at?: string
          ended_at?: string | null
          id?: string
          min_conversions?: number
          min_days?: number
          name?: string
          significance_at?: string | null
          started_at?: string | null
          status?: string
          summary?: Json
          tenant_id?: string
          traffic_split?: number
          updated_at?: string
          variable_type?: string
          winner_variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_tests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_tests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_campaigns: {
        Row: {
          auto_optimize: boolean
          bid_cap_amount: number | null
          bid_strategy: Database["public"]["Enums"]["bid_strategy"]
          budget_amount: number
          budget_currency: string
          budget_type: Database["public"]["Enums"]["budget_type"]
          clicks: number
          conversions: number
          cpa: number | null
          cpc: number | null
          cpm: number | null
          created_at: string
          ctr: number | null
          daily_schedule: Json
          end_date: string | null
          id: string
          impressions: number
          last_synced_at: string | null
          name: string
          objective: Database["public"]["Enums"]["campaign_objective"]
          optimize_rules: Json
          platform: Database["public"]["Enums"]["ad_platform"]
          platform_account_id: string | null
          platform_campaign_id: string | null
          platform_metadata: Json
          platform_status: string | null
          rejection_reasons: string[] | null
          revenue: number
          roas: number | null
          spent_amount: number
          start_date: string
          status: Database["public"]["Enums"]["campaign_status"]
          target_cpa: number | null
          target_roas: number | null
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auto_optimize?: boolean
          bid_cap_amount?: number | null
          bid_strategy?: Database["public"]["Enums"]["bid_strategy"]
          budget_amount: number
          budget_currency?: string
          budget_type: Database["public"]["Enums"]["budget_type"]
          clicks?: number
          conversions?: number
          cpa?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          daily_schedule?: Json
          end_date?: string | null
          id?: string
          impressions?: number
          last_synced_at?: string | null
          name: string
          objective: Database["public"]["Enums"]["campaign_objective"]
          optimize_rules?: Json
          platform: Database["public"]["Enums"]["ad_platform"]
          platform_account_id?: string | null
          platform_campaign_id?: string | null
          platform_metadata?: Json
          platform_status?: string | null
          rejection_reasons?: string[] | null
          revenue?: number
          roas?: number | null
          spent_amount?: number
          start_date: string
          status?: Database["public"]["Enums"]["campaign_status"]
          target_cpa?: number | null
          target_roas?: number | null
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auto_optimize?: boolean
          bid_cap_amount?: number | null
          bid_strategy?: Database["public"]["Enums"]["bid_strategy"]
          budget_amount?: number
          budget_currency?: string
          budget_type?: Database["public"]["Enums"]["budget_type"]
          clicks?: number
          conversions?: number
          cpa?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          daily_schedule?: Json
          end_date?: string | null
          id?: string
          impressions?: number
          last_synced_at?: string | null
          name?: string
          objective?: Database["public"]["Enums"]["campaign_objective"]
          optimize_rules?: Json
          platform?: Database["public"]["Enums"]["ad_platform"]
          platform_account_id?: string | null
          platform_campaign_id?: string | null
          platform_metadata?: Json
          platform_status?: string | null
          rejection_reasons?: string[] | null
          revenue?: number
          roas?: number | null
          spent_amount?: number
          start_date?: string
          status?: Database["public"]["Enums"]["campaign_status"]
          target_cpa?: number | null
          target_roas?: number | null
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_creatives: {
        Row: {
          ab_test_id: string | null
          ab_variant: string | null
          ad_set_id: string
          clicks: number
          content_id: string | null
          conversions: number
          created_at: string
          creative_type: string | null
          cta_button: string | null
          description: string | null
          destination_url: string | null
          headline: string | null
          hook_rate: number | null
          id: string
          impressions: number
          last_synced_at: string | null
          media_s3_key: string | null
          media_url: string | null
          name: string
          platform_ad_id: string | null
          platform_metadata: Json
          primary_text: string | null
          rejection_reason: string | null
          roas: number | null
          spent_amount: number
          status: Database["public"]["Enums"]["campaign_status"]
          tenant_id: string
          updated_at: string
          utm_params: Json
          video_completion_rate: number | null
        }
        Insert: {
          ab_test_id?: string | null
          ab_variant?: string | null
          ad_set_id: string
          clicks?: number
          content_id?: string | null
          conversions?: number
          created_at?: string
          creative_type?: string | null
          cta_button?: string | null
          description?: string | null
          destination_url?: string | null
          headline?: string | null
          hook_rate?: number | null
          id?: string
          impressions?: number
          last_synced_at?: string | null
          media_s3_key?: string | null
          media_url?: string | null
          name: string
          platform_ad_id?: string | null
          platform_metadata?: Json
          primary_text?: string | null
          rejection_reason?: string | null
          roas?: number | null
          spent_amount?: number
          status?: Database["public"]["Enums"]["campaign_status"]
          tenant_id: string
          updated_at?: string
          utm_params?: Json
          video_completion_rate?: number | null
        }
        Update: {
          ab_test_id?: string | null
          ab_variant?: string | null
          ad_set_id?: string
          clicks?: number
          content_id?: string | null
          conversions?: number
          created_at?: string
          creative_type?: string | null
          cta_button?: string | null
          description?: string | null
          destination_url?: string | null
          headline?: string | null
          hook_rate?: number | null
          id?: string
          impressions?: number
          last_synced_at?: string | null
          media_s3_key?: string | null
          media_url?: string | null
          name?: string
          platform_ad_id?: string | null
          platform_metadata?: Json
          primary_text?: string | null
          rejection_reason?: string | null
          roas?: number | null
          spent_amount?: number
          status?: Database["public"]["Enums"]["campaign_status"]
          tenant_id?: string
          updated_at?: string
          utm_params?: Json
          video_completion_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_creatives_ad_set_id_fkey"
            columns: ["ad_set_id"]
            isOneToOne: false
            referencedRelation: "ad_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_creatives_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_creatives_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_creatives_ab_test"
            columns: ["ab_test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_sets: {
        Row: {
          audience_config: Json
          audience_size_est: number | null
          campaign_id: string
          clicks: number
          conversions: number
          created_at: string
          daily_budget: number | null
          frequency: number | null
          id: string
          impressions: number
          last_synced_at: string | null
          lifetime_budget: number | null
          name: string
          placements: string[]
          platform_adset_id: string | null
          platform_metadata: Json
          roas: number | null
          spent_amount: number
          status: Database["public"]["Enums"]["campaign_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          audience_config?: Json
          audience_size_est?: number | null
          campaign_id: string
          clicks?: number
          conversions?: number
          created_at?: string
          daily_budget?: number | null
          frequency?: number | null
          id?: string
          impressions?: number
          last_synced_at?: string | null
          lifetime_budget?: number | null
          name: string
          placements?: string[]
          platform_adset_id?: string | null
          platform_metadata?: Json
          roas?: number | null
          spent_amount?: number
          status?: Database["public"]["Enums"]["campaign_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          audience_config?: Json
          audience_size_est?: number | null
          campaign_id?: string
          clicks?: number
          conversions?: number
          created_at?: string
          daily_budget?: number | null
          frequency?: number | null
          id?: string
          impressions?: number
          last_synced_at?: string | null
          lifetime_budget?: number | null
          name?: string
          placements?: string[]
          platform_adset_id?: string | null
          platform_metadata?: Json
          roas?: number | null
          spent_amount?: number
          status?: Database["public"]["Enums"]["campaign_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_sets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_sets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ads_analytics_events: {
        Row: {
          ad_set_id: string | null
          campaign_id: string
          clicks: number
          conversions: number
          cpc: number
          cpm: number
          created_at: string
          creative_id: string | null
          ctr: number
          event_date: string
          event_time: string
          id: number
          impressions: number
          platform: string
          reach: number
          revenue: number
          roas: number
          spend: number
          tenant_id: string
          video_views_3s: number
          video_views_complete: number
        }
        Insert: {
          ad_set_id?: string | null
          campaign_id: string
          clicks?: number
          conversions?: number
          cpc?: number
          cpm?: number
          created_at?: string
          creative_id?: string | null
          ctr?: number
          event_date: string
          event_time: string
          id?: number
          impressions?: number
          platform: string
          reach?: number
          revenue?: number
          roas?: number
          spend?: number
          tenant_id: string
          video_views_3s?: number
          video_views_complete?: number
        }
        Update: {
          ad_set_id?: string | null
          campaign_id?: string
          clicks?: number
          conversions?: number
          cpc?: number
          cpm?: number
          created_at?: string
          creative_id?: string | null
          ctr?: number
          event_date?: string
          event_time?: string
          id?: number
          impressions?: number
          platform?: string
          reach?: number
          revenue?: number
          roas?: number
          spend?: number
          tenant_id?: string
          video_views_3s?: number
          video_views_complete?: number
        }
        Relationships: []
      }
      ads_analytics_events_2026_q1: {
        Row: {
          ad_set_id: string | null
          campaign_id: string
          clicks: number
          conversions: number
          cpc: number
          cpm: number
          created_at: string
          creative_id: string | null
          ctr: number
          event_date: string
          event_time: string
          id: number
          impressions: number
          platform: string
          reach: number
          revenue: number
          roas: number
          spend: number
          tenant_id: string
          video_views_3s: number
          video_views_complete: number
        }
        Insert: {
          ad_set_id?: string | null
          campaign_id: string
          clicks?: number
          conversions?: number
          cpc?: number
          cpm?: number
          created_at?: string
          creative_id?: string | null
          ctr?: number
          event_date: string
          event_time: string
          id?: number
          impressions?: number
          platform: string
          reach?: number
          revenue?: number
          roas?: number
          spend?: number
          tenant_id: string
          video_views_3s?: number
          video_views_complete?: number
        }
        Update: {
          ad_set_id?: string | null
          campaign_id?: string
          clicks?: number
          conversions?: number
          cpc?: number
          cpm?: number
          created_at?: string
          creative_id?: string | null
          ctr?: number
          event_date?: string
          event_time?: string
          id?: number
          impressions?: number
          platform?: string
          reach?: number
          revenue?: number
          roas?: number
          spend?: number
          tenant_id?: string
          video_views_3s?: number
          video_views_complete?: number
        }
        Relationships: []
      }
      ads_analytics_events_2026_q2: {
        Row: {
          ad_set_id: string | null
          campaign_id: string
          clicks: number
          conversions: number
          cpc: number
          cpm: number
          created_at: string
          creative_id: string | null
          ctr: number
          event_date: string
          event_time: string
          id: number
          impressions: number
          platform: string
          reach: number
          revenue: number
          roas: number
          spend: number
          tenant_id: string
          video_views_3s: number
          video_views_complete: number
        }
        Insert: {
          ad_set_id?: string | null
          campaign_id: string
          clicks?: number
          conversions?: number
          cpc?: number
          cpm?: number
          created_at?: string
          creative_id?: string | null
          ctr?: number
          event_date: string
          event_time: string
          id?: number
          impressions?: number
          platform: string
          reach?: number
          revenue?: number
          roas?: number
          spend?: number
          tenant_id: string
          video_views_3s?: number
          video_views_complete?: number
        }
        Update: {
          ad_set_id?: string | null
          campaign_id?: string
          clicks?: number
          conversions?: number
          cpc?: number
          cpm?: number
          created_at?: string
          creative_id?: string | null
          ctr?: number
          event_date?: string
          event_time?: string
          id?: number
          impressions?: number
          platform?: string
          reach?: number
          revenue?: number
          roas?: number
          spend?: number
          tenant_id?: string
          video_views_3s?: number
          video_views_complete?: number
        }
        Relationships: []
      }
      ads_analytics_events_2026_q3: {
        Row: {
          ad_set_id: string | null
          campaign_id: string
          clicks: number
          conversions: number
          cpc: number
          cpm: number
          created_at: string
          creative_id: string | null
          ctr: number
          event_date: string
          event_time: string
          id: number
          impressions: number
          platform: string
          reach: number
          revenue: number
          roas: number
          spend: number
          tenant_id: string
          video_views_3s: number
          video_views_complete: number
        }
        Insert: {
          ad_set_id?: string | null
          campaign_id: string
          clicks?: number
          conversions?: number
          cpc?: number
          cpm?: number
          created_at?: string
          creative_id?: string | null
          ctr?: number
          event_date: string
          event_time: string
          id?: number
          impressions?: number
          platform: string
          reach?: number
          revenue?: number
          roas?: number
          spend?: number
          tenant_id: string
          video_views_3s?: number
          video_views_complete?: number
        }
        Update: {
          ad_set_id?: string | null
          campaign_id?: string
          clicks?: number
          conversions?: number
          cpc?: number
          cpm?: number
          created_at?: string
          creative_id?: string | null
          ctr?: number
          event_date?: string
          event_time?: string
          id?: number
          impressions?: number
          platform?: string
          reach?: number
          revenue?: number
          roas?: number
          spend?: number
          tenant_id?: string
          video_views_3s?: number
          video_views_complete?: number
        }
        Relationships: []
      }
      ads_analytics_events_2026_q4: {
        Row: {
          ad_set_id: string | null
          campaign_id: string
          clicks: number
          conversions: number
          cpc: number
          cpm: number
          created_at: string
          creative_id: string | null
          ctr: number
          event_date: string
          event_time: string
          id: number
          impressions: number
          platform: string
          reach: number
          revenue: number
          roas: number
          spend: number
          tenant_id: string
          video_views_3s: number
          video_views_complete: number
        }
        Insert: {
          ad_set_id?: string | null
          campaign_id: string
          clicks?: number
          conversions?: number
          cpc?: number
          cpm?: number
          created_at?: string
          creative_id?: string | null
          ctr?: number
          event_date: string
          event_time: string
          id?: number
          impressions?: number
          platform: string
          reach?: number
          revenue?: number
          roas?: number
          spend?: number
          tenant_id: string
          video_views_3s?: number
          video_views_complete?: number
        }
        Update: {
          ad_set_id?: string | null
          campaign_id?: string
          clicks?: number
          conversions?: number
          cpc?: number
          cpm?: number
          created_at?: string
          creative_id?: string | null
          ctr?: number
          event_date?: string
          event_time?: string
          id?: number
          impressions?: number
          platform?: string
          reach?: number
          revenue?: number
          roas?: number
          spend?: number
          tenant_id?: string
          video_views_3s?: number
          video_views_complete?: number
        }
        Relationships: []
      }
      affiliate_analytics_daily: {
        Row: {
          clicks: number
          commission: number
          conversions: number
          created_at: string
          id: number
          link_id: string
          platform: string
          stat_date: string
          tenant_id: string
          top_country: string | null
          top_device: string | null
          unique_clicks: number
        }
        Insert: {
          clicks?: number
          commission?: number
          conversions?: number
          created_at?: string
          id?: number
          link_id: string
          platform: string
          stat_date: string
          tenant_id: string
          top_country?: string | null
          top_device?: string | null
          unique_clicks?: number
        }
        Update: {
          clicks?: number
          commission?: number
          conversions?: number
          created_at?: string
          id?: number
          link_id?: string
          platform?: string
          stat_date?: string
          tenant_id?: string
          top_country?: string | null
          top_device?: string | null
          unique_clicks?: number
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          clicked_at: string
          commission_amt: number | null
          converted: boolean
          converted_at: string | null
          country_code: string | null
          device_type: string | null
          id: number
          ip_hash: string | null
          link_id: string
          order_id: string | null
          referrer: string | null
          tenant_id: string
          user_agent_hash: string | null
          visitor_id: string | null
        }
        Insert: {
          clicked_at?: string
          commission_amt?: number | null
          converted?: boolean
          converted_at?: string | null
          country_code?: string | null
          device_type?: string | null
          id?: number
          ip_hash?: string | null
          link_id: string
          order_id?: string | null
          referrer?: string | null
          tenant_id: string
          user_agent_hash?: string | null
          visitor_id?: string | null
        }
        Update: {
          clicked_at?: string
          commission_amt?: number | null
          converted?: boolean
          converted_at?: string | null
          country_code?: string | null
          device_type?: string | null
          id?: number
          ip_hash?: string | null
          link_id?: string
          order_id?: string | null
          referrer?: string | null
          tenant_id?: string
          user_agent_hash?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_clicks_2026_q1: {
        Row: {
          clicked_at: string
          commission_amt: number | null
          converted: boolean
          converted_at: string | null
          country_code: string | null
          device_type: string | null
          id: number
          ip_hash: string | null
          link_id: string
          order_id: string | null
          referrer: string | null
          tenant_id: string
          user_agent_hash: string | null
          visitor_id: string | null
        }
        Insert: {
          clicked_at?: string
          commission_amt?: number | null
          converted?: boolean
          converted_at?: string | null
          country_code?: string | null
          device_type?: string | null
          id?: number
          ip_hash?: string | null
          link_id: string
          order_id?: string | null
          referrer?: string | null
          tenant_id: string
          user_agent_hash?: string | null
          visitor_id?: string | null
        }
        Update: {
          clicked_at?: string
          commission_amt?: number | null
          converted?: boolean
          converted_at?: string | null
          country_code?: string | null
          device_type?: string | null
          id?: number
          ip_hash?: string | null
          link_id?: string
          order_id?: string | null
          referrer?: string | null
          tenant_id?: string
          user_agent_hash?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      affiliate_clicks_2026_q2: {
        Row: {
          clicked_at: string
          commission_amt: number | null
          converted: boolean
          converted_at: string | null
          country_code: string | null
          device_type: string | null
          id: number
          ip_hash: string | null
          link_id: string
          order_id: string | null
          referrer: string | null
          tenant_id: string
          user_agent_hash: string | null
          visitor_id: string | null
        }
        Insert: {
          clicked_at?: string
          commission_amt?: number | null
          converted?: boolean
          converted_at?: string | null
          country_code?: string | null
          device_type?: string | null
          id?: number
          ip_hash?: string | null
          link_id: string
          order_id?: string | null
          referrer?: string | null
          tenant_id: string
          user_agent_hash?: string | null
          visitor_id?: string | null
        }
        Update: {
          clicked_at?: string
          commission_amt?: number | null
          converted?: boolean
          converted_at?: string | null
          country_code?: string | null
          device_type?: string | null
          id?: number
          ip_hash?: string | null
          link_id?: string
          order_id?: string | null
          referrer?: string | null
          tenant_id?: string
          user_agent_hash?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      affiliate_clicks_2026_q3: {
        Row: {
          clicked_at: string
          commission_amt: number | null
          converted: boolean
          converted_at: string | null
          country_code: string | null
          device_type: string | null
          id: number
          ip_hash: string | null
          link_id: string
          order_id: string | null
          referrer: string | null
          tenant_id: string
          user_agent_hash: string | null
          visitor_id: string | null
        }
        Insert: {
          clicked_at?: string
          commission_amt?: number | null
          converted?: boolean
          converted_at?: string | null
          country_code?: string | null
          device_type?: string | null
          id?: number
          ip_hash?: string | null
          link_id: string
          order_id?: string | null
          referrer?: string | null
          tenant_id: string
          user_agent_hash?: string | null
          visitor_id?: string | null
        }
        Update: {
          clicked_at?: string
          commission_amt?: number | null
          converted?: boolean
          converted_at?: string | null
          country_code?: string | null
          device_type?: string | null
          id?: number
          ip_hash?: string | null
          link_id?: string
          order_id?: string | null
          referrer?: string | null
          tenant_id?: string
          user_agent_hash?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      affiliate_clicks_2026_q4: {
        Row: {
          clicked_at: string
          commission_amt: number | null
          converted: boolean
          converted_at: string | null
          country_code: string | null
          device_type: string | null
          id: number
          ip_hash: string | null
          link_id: string
          order_id: string | null
          referrer: string | null
          tenant_id: string
          user_agent_hash: string | null
          visitor_id: string | null
        }
        Insert: {
          clicked_at?: string
          commission_amt?: number | null
          converted?: boolean
          converted_at?: string | null
          country_code?: string | null
          device_type?: string | null
          id?: number
          ip_hash?: string | null
          link_id: string
          order_id?: string | null
          referrer?: string | null
          tenant_id: string
          user_agent_hash?: string | null
          visitor_id?: string | null
        }
        Update: {
          clicked_at?: string
          commission_amt?: number | null
          converted?: boolean
          converted_at?: string | null
          country_code?: string | null
          device_type?: string | null
          id?: number
          ip_hash?: string | null
          link_id?: string
          order_id?: string | null
          referrer?: string | null
          tenant_id?: string
          user_agent_hash?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      affiliate_links: {
        Row: {
          click_count: number
          commission_earned: number
          commission_pct: number | null
          conversion_count: number
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_clicked_at: string | null
          original_url: string
          platform: Database["public"]["Enums"]["affiliate_platform"]
          product_id: string | null
          product_media_url: string | null
          product_name: string | null
          qr_code_url: string | null
          short_code: string
          short_url: string
          tenant_id: string
          unique_click_count: number
          updated_at: string
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          click_count?: number
          commission_earned?: number
          commission_pct?: number | null
          conversion_count?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_clicked_at?: string | null
          original_url: string
          platform: Database["public"]["Enums"]["affiliate_platform"]
          product_id?: string | null
          product_media_url?: string | null
          product_name?: string | null
          qr_code_url?: string | null
          short_code: string
          short_url: string
          tenant_id: string
          unique_click_count?: number
          updated_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          click_count?: number
          commission_earned?: number
          commission_pct?: number | null
          conversion_count?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_clicked_at?: string | null
          original_url?: string
          platform?: Database["public"]["Enums"]["affiliate_platform"]
          product_id?: string | null
          product_media_url?: string | null
          product_name?: string | null
          qr_code_url?: string | null
          short_code?: string
          short_url?: string
          tenant_id?: string
          unique_click_count?: number
          updated_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "affiliate_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_products: {
        Row: {
          category: string | null
          commission_fixed: number | null
          commission_pct: number | null
          competitor_count: number
          created_at: string
          currency: string
          description: string | null
          discount_pct: number | null
          expires_at: string
          flag_reason: string | null
          id: string
          media_urls: string[]
          is_available: boolean
          is_flagged: boolean
          last_synced_at: string
          name: string
          original_price: number | null
          platform: Database["public"]["Enums"]["affiliate_platform"]
          platform_product_id: string
          price: number | null
          product_url: string
          rating: number | null
          return_rate_pct: number | null
          review_count: number
          shop_id: string | null
          sold_count: number
          stock_status: string | null
          sub_category: string | null
          trend_rank: number | null
          trend_score: number
        }
        Insert: {
          category?: string | null
          commission_fixed?: number | null
          commission_pct?: number | null
          competitor_count?: number
          created_at?: string
          currency?: string
          description?: string | null
          discount_pct?: number | null
          expires_at?: string
          flag_reason?: string | null
          id?: string
          media_urls?: string[]
          is_available?: boolean
          is_flagged?: boolean
          last_synced_at?: string
          name: string
          original_price?: number | null
          platform: Database["public"]["Enums"]["affiliate_platform"]
          platform_product_id: string
          price?: number | null
          product_url: string
          rating?: number | null
          return_rate_pct?: number | null
          review_count?: number
          shop_id?: string | null
          sold_count?: number
          stock_status?: string | null
          sub_category?: string | null
          trend_rank?: number | null
          trend_score?: number
        }
        Update: {
          category?: string | null
          commission_fixed?: number | null
          commission_pct?: number | null
          competitor_count?: number
          created_at?: string
          currency?: string
          description?: string | null
          discount_pct?: number | null
          expires_at?: string
          flag_reason?: string | null
          id?: string
          media_urls?: string[]
          is_available?: boolean
          is_flagged?: boolean
          last_synced_at?: string
          name?: string
          original_price?: number | null
          platform?: Database["public"]["Enums"]["affiliate_platform"]
          platform_product_id?: string
          price?: number | null
          product_url?: string
          rating?: number | null
          return_rate_pct?: number | null
          review_count?: number
          shop_id?: string | null
          sold_count?: number
          stock_status?: string | null
          sub_category?: string | null
          trend_rank?: number | null
          trend_score?: number
        }
        Relationships: []
      }
      ai_jobs: {
        Row: {
          attempt_count: number
          attempts: number
          bulk_batch_id: string | null
          bulk_row_index: number | null
          bullmq_job_id: string | null
          cached: boolean
          completed_at: string | null
          completed_items: number
          content_id: string | null
          cost_usd: number
          created_at: string
          duration_ms: number | null
          error_code: string | null
          error_data: Json
          error_message: string | null
          failed_items: number
          id: string
          input_data: Json
          input_params: Json
          job_type: Database["public"]["Enums"]["job_type"]
          max_attempts: number
          model: string | null
          output_data: Json
          prediction_id: string | null
          priority: number
          progress_pct: number
          prompt_hash: string | null
          provider: string | null
          queue_name: string | null
          queued_at: string | null
          retry_count: number
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          tenant_id: string
          tokens_used: number | null
          total_items: number | null
          updated_at: string
          user_id: string | null
          worker_id: string | null
        }
        Insert: {
          attempt_count?: number
          attempts?: number
          bulk_batch_id?: string | null
          bulk_row_index?: number | null
          bullmq_job_id?: string | null
          cached?: boolean
          completed_at?: string | null
          completed_items?: number
          content_id?: string | null
          cost_usd?: number
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_data?: Json
          error_message?: string | null
          failed_items?: number
          id?: string
          input_data?: Json
          input_params?: Json
          job_type: Database["public"]["Enums"]["job_type"]
          max_attempts?: number
          model?: string | null
          output_data?: Json
          prediction_id?: string | null
          priority?: number
          progress_pct?: number
          prompt_hash?: string | null
          provider?: string | null
          queue_name?: string | null
          queued_at?: string | null
          retry_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          tenant_id: string
          tokens_used?: number | null
          total_items?: number | null
          updated_at?: string
          user_id?: string | null
          worker_id?: string | null
        }
        Update: {
          attempt_count?: number
          attempts?: number
          bulk_batch_id?: string | null
          bulk_row_index?: number | null
          bullmq_job_id?: string | null
          cached?: boolean
          completed_at?: string | null
          completed_items?: number
          content_id?: string | null
          cost_usd?: number
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_data?: Json
          error_message?: string | null
          failed_items?: number
          id?: string
          input_data?: Json
          input_params?: Json
          job_type?: Database["public"]["Enums"]["job_type"]
          max_attempts?: number
          model?: string | null
          output_data?: Json
          prediction_id?: string | null
          priority?: number
          progress_pct?: number
          prompt_hash?: string | null
          provider?: string | null
          queue_name?: string | null
          queued_at?: string | null
          retry_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          tenant_id?: string
          tokens_used?: number | null
          total_items?: number | null
          updated_at?: string
          user_id?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_jobs_content"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_daily: {
        Row: {
          ai_model: string
          ai_provider: string
          avg_duration_ms: number
          cache_hits: number
          cost_usd: number
          created_at: string
          id: number
          job_type: string
          request_count: number
          stat_date: string
          tenant_id: string
          tokens_used: number
        }
        Insert: {
          ai_model: string
          ai_provider: string
          avg_duration_ms?: number
          cache_hits?: number
          cost_usd?: number
          created_at?: string
          id?: number
          job_type: string
          request_count?: number
          stat_date: string
          tenant_id: string
          tokens_used?: number
        }
        Update: {
          ai_model?: string
          ai_provider?: string
          avg_duration_ms?: number
          cache_hits?: number
          cost_usd?: number
          created_at?: string
          id?: number
          job_type?: string
          request_count?: number
          stat_date?: string
          tenant_id?: string
          tokens_used?: number
        }
        Relationships: []
      }
      api_logs: {
        Row: {
          created_at: string | null
          endpoint: string
          error_code: string | null
          id: string
          ip_hash: string | null
          latency_ms: number | null
          method: string | null
          provider: string | null
          request_size: number | null
          status_code: number | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          error_code?: string | null
          id?: string
          ip_hash?: string | null
          latency_ms?: number | null
          method?: string | null
          provider?: string | null
          request_size?: number | null
          status_code?: number | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          error_code?: string | null
          id?: string
          ip_hash?: string | null
          latency_ms?: number | null
          method?: string | null
          provider?: string | null
          request_size?: number | null
          status_code?: number | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs_2026_01: {
        Row: {
          action: string
          changes: Json
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_02: {
        Row: {
          action: string
          changes: Json
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_03: {
        Row: {
          action: string
          changes: Json
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_04: {
        Row: {
          action: string
          changes: Json
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_05: {
        Row: {
          action: string
          changes: Json
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_06: {
        Row: {
          action: string
          changes: Json
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_07: {
        Row: {
          action: string
          changes: Json
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_08: {
        Row: {
          action: string
          changes: Json
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_09: {
        Row: {
          action: string
          changes: Json
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_10: {
        Row: {
          action: string
          changes: Json
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_11: {
        Row: {
          action: string
          changes: Json
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_12: {
        Row: {
          action: string
          changes: Json
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          created_at: string
          event_type: string
          from_plan: string | null
          id: string
          metadata: Json
          stripe_event: string | null
          tenant_id: string
          to_plan: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          from_plan?: string | null
          id?: string
          metadata?: Json
          stripe_event?: string | null
          tenant_id: string
          to_plan?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          from_plan?: string | null
          id?: string
          metadata?: Json
          stripe_event?: string | null
          tenant_id?: string
          to_plan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_kits: {
        Row: {
          accent_color: string
          avoid_words: string | null
          bg_color: string
          brand_forbidden: string[] | null
          brand_keywords: string[] | null
          brand_voice_summary: string | null
          color_accent: string | null
          color_bg: string
          color_primary: string | null
          color_secondary: string | null
          color_text: string
          created_at: string
          default_language: string
          default_tone: string
          deleted_at: string | null
          description: string | null
          font_body: string
          font_heading: string
          id: string
          is_active: boolean
          is_default: boolean
          logo_s3_key: string | null
          logo_storage_path: string | null
          logo_url: string | null
          metadata: Json
          name: string
          primary_color: string
          primary_font: string
          secondary_color: string
          secondary_font: string
          tenant_id: string
          text_color: string
          updated_at: string
          watermark_opacity: number
          watermark_position: string
          watermark_s3_key: string | null
          watermark_url: string | null
        }
        Insert: {
          accent_color?: string
          avoid_words?: string | null
          bg_color?: string
          brand_forbidden?: string[] | null
          brand_keywords?: string[] | null
          brand_voice_summary?: string | null
          color_accent?: string | null
          color_bg?: string
          color_primary?: string | null
          color_secondary?: string | null
          color_text?: string
          created_at?: string
          default_language?: string
          default_tone?: string
          deleted_at?: string | null
          description?: string | null
          font_body?: string
          font_heading?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          logo_s3_key?: string | null
          logo_storage_path?: string | null
          logo_url?: string | null
          metadata?: Json
          name?: string
          primary_color?: string
          primary_font?: string
          secondary_color?: string
          secondary_font?: string
          tenant_id: string
          text_color?: string
          updated_at?: string
          watermark_opacity?: number
          watermark_position?: string
          watermark_s3_key?: string | null
          watermark_url?: string | null
        }
        Update: {
          accent_color?: string
          avoid_words?: string | null
          bg_color?: string
          brand_forbidden?: string[] | null
          brand_keywords?: string[] | null
          brand_voice_summary?: string | null
          color_accent?: string | null
          color_bg?: string
          color_primary?: string | null
          color_secondary?: string | null
          color_text?: string
          created_at?: string
          default_language?: string
          default_tone?: string
          deleted_at?: string | null
          description?: string | null
          font_body?: string
          font_heading?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          logo_s3_key?: string | null
          logo_storage_path?: string | null
          logo_url?: string | null
          metadata?: Json
          name?: string
          primary_color?: string
          primary_font?: string
          secondary_color?: string
          secondary_font?: string
          tenant_id?: string
          text_color?: string
          updated_at?: string
          watermark_opacity?: number
          watermark_position?: string
          watermark_s3_key?: string | null
          watermark_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_kits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          brand_name: string
          category: string | null
          contact_email: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          tenant_id: string
          verified: boolean
          website_url: string | null
        }
        Insert: {
          brand_name: string
          category?: string | null
          contact_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          tenant_id: string
          verified?: boolean
          website_url?: string | null
        }
        Update: {
          brand_name?: string
          category?: string | null
          contact_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          tenant_id?: string
          verified?: boolean
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_batches: {
        Row: {
          completed_at: string | null
          completed_items: number
          config: Json
          created_at: string
          failed_items: number
          id: string
          name: string | null
          output_folder_id: string | null
          result_zip_expires_at: string | null
          result_zip_url: string | null
          source_ref: string | null
          source_type: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          tenant_id: string
          total_cost_usd: number
          total_items: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_items?: number
          config?: Json
          created_at?: string
          failed_items?: number
          id?: string
          name?: string | null
          output_folder_id?: string | null
          result_zip_expires_at?: string | null
          result_zip_url?: string | null
          source_ref?: string | null
          source_type?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          tenant_id: string
          total_cost_usd?: number
          total_items?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_items?: number
          config?: Json
          created_at?: string
          failed_items?: number
          id?: string
          name?: string | null
          output_folder_id?: string | null
          result_zip_expires_at?: string | null
          result_zip_url?: string | null
          source_ref?: string | null
          source_type?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          tenant_id?: string
          total_cost_usd?: number
          total_items?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_batches_output_folder_id_fkey"
            columns: ["output_folder_id"]
            isOneToOne: false
            referencedRelation: "content_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_batches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_batches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          content_id: string | null
          content_type: Database["public"]["Enums"]["content_type"] | null
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          is_ai_generated: boolean
          is_completed: boolean
          remind_at: string | null
          scheduled_post_id: string | null
          tenant_id: string
          theme: string | null
          title: string | null
          tone: Database["public"]["Enums"]["content_tone"] | null
          updated_at: string
        }
        Insert: {
          content_id?: string | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          is_ai_generated?: boolean
          is_completed?: boolean
          remind_at?: string | null
          scheduled_post_id?: string | null
          tenant_id: string
          theme?: string | null
          title?: string | null
          tone?: Database["public"]["Enums"]["content_tone"] | null
          updated_at?: string
        }
        Update: {
          content_id?: string | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          is_ai_generated?: boolean
          is_completed?: boolean
          remind_at?: string | null
          scheduled_post_id?: string | null
          tenant_id?: string
          theme?: string | null
          title?: string | null
          tone?: Database["public"]["Enums"]["content_tone"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_scheduled_post_id_fkey"
            columns: ["scheduled_post_id"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_deals: {
        Row: {
          approved_content_ids: string[]
          brand_id: string
          brief_text: string | null
          compensation_amount: number | null
          compensation_notes: string | null
          compensation_type: string
          contract_url: string | null
          created_at: string
          creator_tenant_id: string
          creator_user_id: string | null
          deadline_at: string | null
          deliverables: Json
          feedback_from_brand: string | null
          id: string
          invoice_id: string | null
          invoice_sent_at: string | null
          notes: string | null
          paid_at: string | null
          product_name: string | null
          status: Database["public"]["Enums"]["deal_status"]
          submitted_content_ids: string[]
          title: string
          updated_at: string
        }
        Insert: {
          approved_content_ids?: string[]
          brand_id: string
          brief_text?: string | null
          compensation_amount?: number | null
          compensation_notes?: string | null
          compensation_type?: string
          contract_url?: string | null
          created_at?: string
          creator_tenant_id: string
          creator_user_id?: string | null
          deadline_at?: string | null
          deliverables?: Json
          feedback_from_brand?: string | null
          id?: string
          invoice_id?: string | null
          invoice_sent_at?: string | null
          notes?: string | null
          paid_at?: string | null
          product_name?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          submitted_content_ids?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          approved_content_ids?: string[]
          brand_id?: string
          brief_text?: string | null
          compensation_amount?: number | null
          compensation_notes?: string | null
          compensation_type?: string
          contract_url?: string | null
          created_at?: string
          creator_tenant_id?: string
          creator_user_id?: string | null
          deadline_at?: string | null
          deliverables?: Json
          feedback_from_brand?: string | null
          id?: string
          invoice_id?: string | null
          invoice_sent_at?: string | null
          notes?: string | null
          paid_at?: string | null
          product_name?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          submitted_content_ids?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_deals_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_deals_creator_tenant_id_fkey"
            columns: ["creator_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_deals_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_analytics_events: {
        Row: {
          content_id: string
          content_type: string
          country_code: string | null
          created_at: string
          device_type: string | null
          event_date: string
          event_id: string
          event_time: string
          event_type: string
          extra: Json
          id: number
          platform: string
          revenue: number
          scheduled_post_id: string | null
          tenant_id: string
          value: number
          visitor_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          event_date: string
          event_id?: string
          event_time: string
          event_type: string
          extra?: Json
          id?: number
          platform: string
          revenue?: number
          scheduled_post_id?: string | null
          tenant_id: string
          value?: number
          visitor_id?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          event_date?: string
          event_id?: string
          event_time?: string
          event_type?: string
          extra?: Json
          id?: number
          platform?: string
          revenue?: number
          scheduled_post_id?: string | null
          tenant_id?: string
          value?: number
          visitor_id?: string
        }
        Relationships: []
      }
      content_analytics_events_2026_q1: {
        Row: {
          content_id: string
          content_type: string
          country_code: string | null
          created_at: string
          device_type: string | null
          event_date: string
          event_id: string
          event_time: string
          event_type: string
          extra: Json
          id: number
          platform: string
          revenue: number
          scheduled_post_id: string | null
          tenant_id: string
          value: number
          visitor_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          event_date: string
          event_id?: string
          event_time: string
          event_type: string
          extra?: Json
          id?: number
          platform: string
          revenue?: number
          scheduled_post_id?: string | null
          tenant_id: string
          value?: number
          visitor_id?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          event_date?: string
          event_id?: string
          event_time?: string
          event_type?: string
          extra?: Json
          id?: number
          platform?: string
          revenue?: number
          scheduled_post_id?: string | null
          tenant_id?: string
          value?: number
          visitor_id?: string
        }
        Relationships: []
      }
      content_analytics_events_2026_q2: {
        Row: {
          content_id: string
          content_type: string
          country_code: string | null
          created_at: string
          device_type: string | null
          event_date: string
          event_id: string
          event_time: string
          event_type: string
          extra: Json
          id: number
          platform: string
          revenue: number
          scheduled_post_id: string | null
          tenant_id: string
          value: number
          visitor_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          event_date: string
          event_id?: string
          event_time: string
          event_type: string
          extra?: Json
          id?: number
          platform: string
          revenue?: number
          scheduled_post_id?: string | null
          tenant_id: string
          value?: number
          visitor_id?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          event_date?: string
          event_id?: string
          event_time?: string
          event_type?: string
          extra?: Json
          id?: number
          platform?: string
          revenue?: number
          scheduled_post_id?: string | null
          tenant_id?: string
          value?: number
          visitor_id?: string
        }
        Relationships: []
      }
      content_analytics_events_2026_q3: {
        Row: {
          content_id: string
          content_type: string
          country_code: string | null
          created_at: string
          device_type: string | null
          event_date: string
          event_id: string
          event_time: string
          event_type: string
          extra: Json
          id: number
          platform: string
          revenue: number
          scheduled_post_id: string | null
          tenant_id: string
          value: number
          visitor_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          event_date: string
          event_id?: string
          event_time: string
          event_type: string
          extra?: Json
          id?: number
          platform: string
          revenue?: number
          scheduled_post_id?: string | null
          tenant_id: string
          value?: number
          visitor_id?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          event_date?: string
          event_id?: string
          event_time?: string
          event_type?: string
          extra?: Json
          id?: number
          platform?: string
          revenue?: number
          scheduled_post_id?: string | null
          tenant_id?: string
          value?: number
          visitor_id?: string
        }
        Relationships: []
      }
      content_analytics_events_2026_q4: {
        Row: {
          content_id: string
          content_type: string
          country_code: string | null
          created_at: string
          device_type: string | null
          event_date: string
          event_id: string
          event_time: string
          event_type: string
          extra: Json
          id: number
          platform: string
          revenue: number
          scheduled_post_id: string | null
          tenant_id: string
          value: number
          visitor_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          event_date: string
          event_id?: string
          event_time: string
          event_type: string
          extra?: Json
          id?: number
          platform: string
          revenue?: number
          scheduled_post_id?: string | null
          tenant_id: string
          value?: number
          visitor_id?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          event_date?: string
          event_id?: string
          event_time?: string
          event_type?: string
          extra?: Json
          id?: number
          platform?: string
          revenue?: number
          scheduled_post_id?: string | null
          tenant_id?: string
          value?: number
          visitor_id?: string
        }
        Relationships: []
      }
      content_folders: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          sort_order: number
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_folders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "content_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_folders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_templates: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_premium: boolean
          name: string
          prompt_template: string | null
          rating_avg: number | null
          rating_count: number
          tags: string[]
          template_data: Json
          tenant_id: string | null
          thumbnail_s3_key: string | null
          thumbnail_url: string | null
          type: Database["public"]["Enums"]["content_type"]
          updated_at: string
          use_count: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          name: string
          prompt_template?: string | null
          rating_avg?: number | null
          rating_count?: number
          tags?: string[]
          template_data?: Json
          tenant_id?: string | null
          thumbnail_s3_key?: string | null
          thumbnail_url?: string | null
          type: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          use_count?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          name?: string
          prompt_template?: string | null
          rating_avg?: number | null
          rating_count?: number
          tags?: string[]
          template_data?: Json
          tenant_id?: string | null
          thumbnail_s3_key?: string | null
          thumbnail_url?: string | null
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          ai_job_id: string | null
          ai_model: string | null
          ai_prompt_hash: string | null
          ai_provider: string | null
          brand_kit_id: string | null
          bulk_job_id: string | null
          bulk_row_index: number | null
          caption_text: string | null
          caption_variants: Json
          cdn_url: string | null
          cost_usd: number | null
          created_at: string
          deleted_at: string | null
          duration_sec: number | null
          file_size_bytes: number | null
          folder_id: string | null
          generation_config: Json
          generation_cost_usd: number | null
          hashtags: string[]
          height_px: number | null
          id: string
          is_deleted: boolean
          is_starred: boolean
          last_analytics_sync: string | null
          media_s3_key: string | null
          media_url: string | null
          mime_type: string | null
          platforms: Database["public"]["Enums"]["platform_type"][]
          primary_platform: Database["public"]["Enums"]["platform_type"] | null
          product_data: Json
          product_url: string | null
          rating: number | null
          s3_key: string | null
          search_vector: unknown
          status: Database["public"]["Enums"]["content_status"]
          tags: string[]
          template_id: string | null
          tenant_id: string
          thumbnail_cdn_url: string | null
          thumbnail_s3_key: string | null
          thumbnail_url: string | null
          title: string | null
          total_clicks: number
          total_conversions: number
          total_engagement: number
          total_reach: number
          type: Database["public"]["Enums"]["content_type"]
          updated_at: string
          user_feedback: string | null
          user_id: string | null
          width_px: number | null
        }
        Insert: {
          ai_job_id?: string | null
          ai_model?: string | null
          ai_prompt_hash?: string | null
          ai_provider?: string | null
          brand_kit_id?: string | null
          bulk_job_id?: string | null
          bulk_row_index?: number | null
          caption_text?: string | null
          caption_variants?: Json
          cdn_url?: string | null
          cost_usd?: number | null
          created_at?: string
          deleted_at?: string | null
          duration_sec?: number | null
          file_size_bytes?: number | null
          folder_id?: string | null
          generation_config?: Json
          generation_cost_usd?: number | null
          hashtags?: string[]
          height_px?: number | null
          id?: string
          is_deleted?: boolean
          is_starred?: boolean
          last_analytics_sync?: string | null
          media_s3_key?: string | null
          media_url?: string | null
          mime_type?: string | null
          platforms?: Database["public"]["Enums"]["platform_type"][]
          primary_platform?: Database["public"]["Enums"]["platform_type"] | null
          product_data?: Json
          product_url?: string | null
          rating?: number | null
          s3_key?: string | null
          search_vector?: unknown
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          template_id?: string | null
          tenant_id: string
          thumbnail_cdn_url?: string | null
          thumbnail_s3_key?: string | null
          thumbnail_url?: string | null
          title?: string | null
          total_clicks?: number
          total_conversions?: number
          total_engagement?: number
          total_reach?: number
          type: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          user_feedback?: string | null
          user_id?: string | null
          width_px?: number | null
        }
        Update: {
          ai_job_id?: string | null
          ai_model?: string | null
          ai_prompt_hash?: string | null
          ai_provider?: string | null
          brand_kit_id?: string | null
          bulk_job_id?: string | null
          bulk_row_index?: number | null
          caption_text?: string | null
          caption_variants?: Json
          cdn_url?: string | null
          cost_usd?: number | null
          created_at?: string
          deleted_at?: string | null
          duration_sec?: number | null
          file_size_bytes?: number | null
          folder_id?: string | null
          generation_config?: Json
          generation_cost_usd?: number | null
          hashtags?: string[]
          height_px?: number | null
          id?: string
          is_deleted?: boolean
          is_starred?: boolean
          last_analytics_sync?: string | null
          media_s3_key?: string | null
          media_url?: string | null
          mime_type?: string | null
          platforms?: Database["public"]["Enums"]["platform_type"][]
          primary_platform?: Database["public"]["Enums"]["platform_type"] | null
          product_data?: Json
          product_url?: string | null
          rating?: number | null
          s3_key?: string | null
          search_vector?: unknown
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          template_id?: string | null
          tenant_id?: string
          thumbnail_cdn_url?: string | null
          thumbnail_s3_key?: string | null
          thumbnail_url?: string | null
          title?: string | null
          total_clicks?: number
          total_conversions?: number
          total_engagement?: number
          total_reach?: number
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          user_feedback?: string | null
          user_id?: string | null
          width_px?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contents_ai_job_id_fkey"
            columns: ["ai_job_id"]
            isOneToOne: false
            referencedRelation: "ai_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "brand_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "content_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contents_folder"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "content_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_audiences: {
        Row: {
          audience_type: string
          created_at: string
          id: string
          last_refreshed_at: string | null
          lookalike_percent: number | null
          lookalike_source_id: string | null
          name: string
          platform: Database["public"]["Enums"]["ad_platform"]
          platform_audience_id: string | null
          platform_metadata: Json
          size_estimate: number | null
          source_type: string | null
          tenant_id: string
          updated_at: string
          upload_status: string | null
        }
        Insert: {
          audience_type: string
          created_at?: string
          id?: string
          last_refreshed_at?: string | null
          lookalike_percent?: number | null
          lookalike_source_id?: string | null
          name: string
          platform: Database["public"]["Enums"]["ad_platform"]
          platform_audience_id?: string | null
          platform_metadata?: Json
          size_estimate?: number | null
          source_type?: string | null
          tenant_id: string
          updated_at?: string
          upload_status?: string | null
        }
        Update: {
          audience_type?: string
          created_at?: string
          id?: string
          last_refreshed_at?: string | null
          lookalike_percent?: number | null
          lookalike_source_id?: string | null
          name?: string
          platform?: Database["public"]["Enums"]["ad_platform"]
          platform_audience_id?: string | null
          platform_metadata?: Json
          size_estimate?: number | null
          source_type?: string | null
          tenant_id?: string
          updated_at?: string
          upload_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_audiences_lookalike_source_id_fkey"
            columns: ["lookalike_source_id"]
            isOneToOne: false
            referencedRelation: "custom_audiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_audiences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verifications: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          rating: number | null
          tenant_id: string | null
          type: string
          ua: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          rating?: number | null
          tenant_id?: string | null
          type?: string
          ua?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          rating?: number | null
          tenant_id?: string | null
          type?: string
          ua?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          parent_id: string | null
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_credits_log: {
        Row: {
          action: string
          balance_after: number
          balance_before: number
          created_at: string | null
          credits_delta: number
          generation_id: string | null
          id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          action: string
          balance_after: number
          balance_before: number
          created_at?: string | null
          credits_delta: number
          generation_id?: string | null
          id?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          action?: string
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          credits_delta?: number
          generation_id?: string | null
          id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_credits_log_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "image_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_credits_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_credits_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      image_generations: {
        Row: {
          bg_style: string | null
          camera_style: string | null
          category: string | null
          color_tone: string | null
          completed_at: string | null
          composition: string | null
          content_type: string | null
          cost_usd: number | null
          count: number | null
          created_at: string | null
          credits_used: number | null
          enhanced_prompt: string | null
          error_code: string | null
          error_message: string | null
          id: string
          lighting_style: string | null
          model_id: string | null
          mood_tone: string | null
          negative_prompt: string | null
          platform: string | null
          prediction_id: string | null
          processing_ms: number | null
          product_desc: string | null
          product_name: string
          product_type: string | null
          provider: string | null
          provider_cost: number | null
          ratio: string | null
          raw_prompt: string
          retry_count: number | null
          started_at: string | null
          status: string
          target_audience: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string
          visual_style: string | null
        }
        Insert: {
          bg_style?: string | null
          camera_style?: string | null
          category?: string | null
          color_tone?: string | null
          completed_at?: string | null
          composition?: string | null
          content_type?: string | null
          cost_usd?: number | null
          count?: number | null
          created_at?: string | null
          credits_used?: number | null
          enhanced_prompt?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          lighting_style?: string | null
          model_id?: string | null
          mood_tone?: string | null
          negative_prompt?: string | null
          platform?: string | null
          prediction_id?: string | null
          processing_ms?: number | null
          product_desc?: string | null
          product_name: string
          product_type?: string | null
          provider?: string | null
          provider_cost?: number | null
          ratio?: string | null
          raw_prompt: string
          retry_count?: number | null
          started_at?: string | null
          status?: string
          target_audience?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
          visual_style?: string | null
        }
        Update: {
          bg_style?: string | null
          camera_style?: string | null
          category?: string | null
          color_tone?: string | null
          completed_at?: string | null
          composition?: string | null
          content_type?: string | null
          cost_usd?: number | null
          count?: number | null
          created_at?: string | null
          credits_used?: number | null
          enhanced_prompt?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          lighting_style?: string | null
          model_id?: string | null
          mood_tone?: string | null
          negative_prompt?: string | null
          platform?: string | null
          prediction_id?: string | null
          processing_ms?: number | null
          product_desc?: string | null
          product_name?: string
          product_type?: string | null
          provider?: string | null
          provider_cost?: number | null
          ratio?: string | null
          raw_prompt?: string
          retry_count?: number | null
          started_at?: string | null
          status?: string
          target_audience?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
          visual_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_generations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      image_results: {
        Row: {
          cdn_url: string | null
          content_id: string | null
          created_at: string | null
          download_count: number | null
          file_size_bytes: number | null
          generation_id: string
          height_px: number | null
          id: string
          is_saved: boolean | null
          is_upscaled: boolean | null
          like_count: number | null
          mime_type: string | null
          original_url: string | null
          ratio: string | null
          storage_key: string | null
          tenant_id: string
          thumbnail_url: string | null
          upscale_factor: number | null
          upscaled_url: string | null
          width_px: number | null
        }
        Insert: {
          cdn_url?: string | null
          content_id?: string | null
          created_at?: string | null
          download_count?: number | null
          file_size_bytes?: number | null
          generation_id: string
          height_px?: number | null
          id?: string
          is_saved?: boolean | null
          is_upscaled?: boolean | null
          like_count?: number | null
          mime_type?: string | null
          original_url?: string | null
          ratio?: string | null
          storage_key?: string | null
          tenant_id: string
          thumbnail_url?: string | null
          upscale_factor?: number | null
          upscaled_url?: string | null
          width_px?: number | null
        }
        Update: {
          cdn_url?: string | null
          content_id?: string | null
          created_at?: string | null
          download_count?: number | null
          file_size_bytes?: number | null
          generation_id?: string
          height_px?: number | null
          id?: string
          is_saved?: boolean | null
          is_upscaled?: boolean | null
          like_count?: number | null
          mime_type?: string | null
          original_url?: string | null
          ratio?: string | null
          storage_key?: string | null
          tenant_id?: string
          thumbnail_url?: string | null
          upscale_factor?: number | null
          upscaled_url?: string | null
          width_px?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "image_results_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_results_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "image_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          label: string | null
          max_uses: number
          metadata: Json | null
          plan_granted: string | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_uses?: number
          metadata?: Json | null
          plan_granted?: string | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_uses?: number
          metadata?: Json | null
          plan_granted?: string | null
          used_count?: number
        }
        Relationships: []
      }
      invite_redemptions: {
        Row: {
          code_id: string
          email: string | null
          id: string
          ip: string | null
          redeemed_at: string
          tenant_id: string | null
        }
        Insert: {
          code_id: string
          email?: string | null
          id?: string
          ip?: string | null
          redeemed_at?: string
          tenant_id?: string | null
        }
        Update: {
          code_id?: string
          email?: string | null
          id?: string
          ip?: string | null
          redeemed_at?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invite_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "invite_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_redemptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          currency: string
          discount: number
          due_date: string | null
          gateway_payment_id: string | null
          gateway_url: string | null
          id: string
          invoice_number: string
          line_items: Json
          metadata: Json
          notes: string | null
          paid_at: string | null
          payment_gateway: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          pdf_s3_key: string | null
          pdf_url: string | null
          period_end: string | null
          period_start: string | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          subtotal: number
          tax: number
          tenant_id: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          discount?: number
          due_date?: string | null
          gateway_payment_id?: string | null
          gateway_url?: string | null
          id?: string
          invoice_number: string
          line_items?: Json
          metadata?: Json
          notes?: string | null
          paid_at?: string | null
          payment_gateway?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          pdf_s3_key?: string | null
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          subtotal: number
          tax?: number
          tenant_id: string
          total: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          discount?: number
          due_date?: string | null
          gateway_payment_id?: string | null
          gateway_url?: string | null
          id?: string
          invoice_number?: string
          line_items?: Json
          metadata?: Json
          notes?: string | null
          paid_at?: string | null
          payment_gateway?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          pdf_s3_key?: string | null
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          subtotal?: number
          tax?: number
          tenant_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string
          category: string | null
          channel_meta: Json
          created_at: string
          error_message: string | null
          external_id: string | null
          icon_url: string | null
          id: string
          is_read: boolean
          metadata: Json
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          retry_count: number
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          body: string
          category?: string | null
          channel_meta?: Json
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          icon_url?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          retry_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          body?: string
          category?: string | null
          channel_meta?: Json
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          icon_url?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          retry_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          tenant_id?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_2026_q1: {
        Row: {
          action_url: string | null
          body: string
          category: string | null
          channel_meta: Json
          created_at: string
          error_message: string | null
          external_id: string | null
          icon_url: string | null
          id: string
          is_read: boolean
          metadata: Json
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          retry_count: number
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          body: string
          category?: string | null
          channel_meta?: Json
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          icon_url?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          retry_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          body?: string
          category?: string | null
          channel_meta?: Json
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          icon_url?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          retry_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          tenant_id?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      notifications_2026_q2: {
        Row: {
          action_url: string | null
          body: string
          category: string | null
          channel_meta: Json
          created_at: string
          error_message: string | null
          external_id: string | null
          icon_url: string | null
          id: string
          is_read: boolean
          metadata: Json
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          retry_count: number
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          body: string
          category?: string | null
          channel_meta?: Json
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          icon_url?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          retry_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          body?: string
          category?: string | null
          channel_meta?: Json
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          icon_url?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          retry_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          tenant_id?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      notifications_2026_q3: {
        Row: {
          action_url: string | null
          body: string
          category: string | null
          channel_meta: Json
          created_at: string
          error_message: string | null
          external_id: string | null
          icon_url: string | null
          id: string
          is_read: boolean
          metadata: Json
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          retry_count: number
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          body: string
          category?: string | null
          channel_meta?: Json
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          icon_url?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          retry_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          body?: string
          category?: string | null
          channel_meta?: Json
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          icon_url?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          retry_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          tenant_id?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      notifications_2026_q4: {
        Row: {
          action_url: string | null
          body: string
          category: string | null
          channel_meta: Json
          created_at: string
          error_message: string | null
          external_id: string | null
          icon_url: string | null
          id: string
          is_read: boolean
          metadata: Json
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          retry_count: number
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          body: string
          category?: string | null
          channel_meta?: Json
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          icon_url?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          retry_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          body?: string
          category?: string | null
          channel_meta?: Json
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          icon_url?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          retry_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          tenant_id?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      nps_responses: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          score: number
          survey_day: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          score: number
          survey_day?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          score?: number
          survey_day?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nps_responses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          brand_kit_at: string | null
          completed_at: string | null
          created_at: string
          first_gen_at: string | null
          id: string
          invite_code: string | null
          library_at: string | null
          profile_at: string | null
          step_brand_kit: boolean
          step_first_gen: boolean
          step_library: boolean
          step_profile: boolean
          step_template: boolean
          template_at: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          brand_kit_at?: string | null
          completed_at?: string | null
          created_at?: string
          first_gen_at?: string | null
          id?: string
          invite_code?: string | null
          library_at?: string | null
          profile_at?: string | null
          step_brand_kit?: boolean
          step_first_gen?: boolean
          step_library?: boolean
          step_profile?: boolean
          step_template?: boolean
          template_at?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          brand_kit_at?: string | null
          completed_at?: string | null
          created_at?: string
          first_gen_at?: string | null
          id?: string
          invite_code?: string | null
          library_at?: string | null
          profile_at?: string | null
          step_brand_kit?: boolean
          step_first_gen?: boolean
          step_library?: boolean
          step_profile?: boolean
          step_template?: boolean
          template_at?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          attempted_at: string
          created_at: string
          currency: string
          fraud_score: number | null
          gateway: string
          gateway_order_id: string | null
          gateway_raw: Json
          gateway_status: string | null
          gateway_tx_id: string
          id: string
          invoice_id: string | null
          is_flagged: boolean
          payment_method: Database["public"]["Enums"]["payment_method"]
          settled_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
        }
        Insert: {
          amount: number
          attempted_at?: string
          created_at?: string
          currency?: string
          fraud_score?: number | null
          gateway: string
          gateway_order_id?: string | null
          gateway_raw?: Json
          gateway_status?: string | null
          gateway_tx_id: string
          id?: string
          invoice_id?: string | null
          is_flagged?: boolean
          payment_method: Database["public"]["Enums"]["payment_method"]
          settled_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
        }
        Update: {
          amount?: number
          attempted_at?: string
          created_at?: string
          currency?: string
          fraud_score?: number | null
          gateway?: string
          gateway_order_id?: string | null
          gateway_raw?: Json
          gateway_status?: string | null
          gateway_tx_id?: string
          id?: string
          invoice_id?: string | null
          is_flagged?: boolean
          payment_method?: Database["public"]["Enums"]["payment_method"]
          settled_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_definitions: {
        Row: {
          created_at: string
          currency: string
          display_name: string
          features: Json
          id: string
          max_active_campaigns: number
          max_platforms: number
          max_scheduled_queue: number
          max_users: number
          plan: Database["public"]["Enums"]["plan_type"]
          price_annually: number
          price_monthly: number
          quota_bulk: number
          quota_content: number
          quota_video: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          display_name: string
          features?: Json
          id?: string
          max_active_campaigns?: number
          max_platforms?: number
          max_scheduled_queue?: number
          max_users?: number
          plan: Database["public"]["Enums"]["plan_type"]
          price_annually?: number
          price_monthly?: number
          quota_bulk?: number
          quota_content?: number
          quota_video?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          display_name?: string
          features?: Json
          id?: string
          max_active_campaigns?: number
          max_platforms?: number
          max_scheduled_queue?: number
          max_users?: number
          plan?: Database["public"]["Enums"]["plan_type"]
          price_annually?: number
          price_monthly?: number
          quota_bulk?: number
          quota_content?: number
          quota_video?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_connections: {
        Row: {
          access_token: string
          account_avatar: string | null
          account_id: string | null
          account_name: string | null
          created_at: string
          deleted_at: string | null
          error_code: string | null
          error_message: string | null
          follower_count: number | null
          id: string
          is_active: boolean
          last_used_at: string | null
          last_verified_at: string | null
          metadata: Json
          platform: string | null
          platform_account_id: string
          platform_avatar_url: string | null
          platform_metadata: Json
          platform_name: string | null
          platform_type: string | null
          platform_username: string | null
          refresh_token: string | null
          scope: string | null
          status: string
          tenant_id: string
          token_expires_at: string | null
          token_scope: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          account_avatar?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          deleted_at?: string | null
          error_code?: string | null
          error_message?: string | null
          follower_count?: number | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          last_verified_at?: string | null
          metadata?: Json
          platform?: string | null
          platform_account_id: string
          platform_avatar_url?: string | null
          platform_metadata?: Json
          platform_name?: string | null
          platform_type?: string | null
          platform_username?: string | null
          refresh_token?: string | null
          scope?: string | null
          status?: string
          tenant_id: string
          token_expires_at?: string | null
          token_scope?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          account_avatar?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          deleted_at?: string | null
          error_code?: string | null
          error_message?: string | null
          follower_count?: number | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          last_verified_at?: string | null
          metadata?: Json
          platform?: string | null
          platform_account_id?: string
          platform_avatar_url?: string | null
          platform_metadata?: Json
          platform_name?: string | null
          platform_type?: string | null
          platform_username?: string | null
          refresh_token?: string | null
          scope?: string | null
          status?: string
          tenant_id?: string
          token_expires_at?: string | null
          token_scope?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_connections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_growth_snapshots: {
        Row: {
          avg_engagement_rate: number
          created_at: string
          followers: number
          following: number
          id: number
          platform: string
          platform_account_id: string
          posts_count: number
          snapshot_date: string
          tenant_id: string
        }
        Insert: {
          avg_engagement_rate?: number
          created_at?: string
          followers?: number
          following?: number
          id?: number
          platform: string
          platform_account_id: string
          posts_count?: number
          snapshot_date: string
          tenant_id: string
        }
        Update: {
          avg_engagement_rate?: number
          created_at?: string
          followers?: number
          following?: number
          id?: number
          platform?: string
          platform_account_id?: string
          posts_count?: number
          snapshot_date?: string
          tenant_id?: string
        }
        Relationships: []
      }
      posting_rules: {
        Row: {
          blackout_dates: string[]
          created_at: string
          id: string
          is_active: boolean
          max_per_day: number
          max_per_week: number
          preferred_times: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          blackout_dates?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          max_per_day?: number
          max_per_week?: number
          preferred_times?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          blackout_dates?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          max_per_day?: number
          max_per_week?: number
          preferred_times?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posting_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_histories: {
        Row: {
          avg_rating: number | null
          created_at: string | null
          generation_id: string | null
          id: string
          is_favorite: boolean | null
          prompt_text: string
          tenant_id: string
          usage_count: number | null
        }
        Insert: {
          avg_rating?: number | null
          created_at?: string | null
          generation_id?: string | null
          id?: string
          is_favorite?: boolean | null
          prompt_text: string
          tenant_id: string
          usage_count?: number | null
        }
        Update: {
          avg_rating?: number | null
          created_at?: string | null
          generation_id?: string | null
          id?: string
          is_favorite?: boolean | null
          prompt_text?: string
          tenant_id?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_histories_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "image_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_histories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      quota_overrides: {
        Row: {
          captions_per_day: number | null
          captions_per_month: number | null
          created_at: string
          expires_at: string | null
          granted_by: string | null
          id: string
          images_per_day: number | null
          images_per_month: number | null
          reason: string | null
          tenant_id: string
        }
        Insert: {
          captions_per_day?: number | null
          captions_per_month?: number | null
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          images_per_day?: number | null
          images_per_month?: number | null
          reason?: string | null
          tenant_id: string
        }
        Update: {
          captions_per_day?: number | null
          captions_per_month?: number | null
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          images_per_day?: number | null
          images_per_month?: number | null
          reason?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quota_overrides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_tokens: {
        Row: {
          created_at: string
          device_info: Json
          expires_at: string
          id: string
          revoke_reason: string | null
          revoked_at: string | null
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json
          expires_at: string
          id?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json
          expires_at?: string
          id?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          token_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_posts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          canceled_at: string | null
          caption: string | null
          content_id: string
          created_at: string
          custom_caption: string | null
          error_code: string | null
          error_message: string | null
          first_comment: string | null
          hashtags: string[] | null
          hashtags_override: string[] | null
          id: string
          media_url: string | null
          last_attempted_at: string | null
          last_performance_sync: string | null
          location_tag: Json | null
          max_retries: number
          media_type: string | null
          metadata: Json | null
          next_retry_at: string | null
          performance_snapshot: Json
          platform: string | null
          platform_account_id: string | null
          platform_permalink: string | null
          platform_post_id: string | null
          platform_post_url: string | null
          platform_user_id: string | null
          published_at: string | null
          rejection_note: string | null
          requires_approval: boolean
          retry_count: number
          scheduled_at: string
          status: Database["public"]["Enums"]["post_status"]
          tenant_id: string
          timezone: string
          updated_at: string
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          canceled_at?: string | null
          caption?: string | null
          content_id: string
          created_at?: string
          custom_caption?: string | null
          error_code?: string | null
          error_message?: string | null
          first_comment?: string | null
          hashtags?: string[] | null
          hashtags_override?: string[] | null
          id?: string
          media_url?: string | null
          last_attempted_at?: string | null
          last_performance_sync?: string | null
          location_tag?: Json | null
          max_retries?: number
          media_type?: string | null
          metadata?: Json | null
          next_retry_at?: string | null
          performance_snapshot?: Json
          platform?: string | null
          platform_account_id?: string | null
          platform_permalink?: string | null
          platform_post_id?: string | null
          platform_post_url?: string | null
          platform_user_id?: string | null
          published_at?: string | null
          rejection_note?: string | null
          requires_approval?: boolean
          retry_count?: number
          scheduled_at: string
          status?: Database["public"]["Enums"]["post_status"]
          tenant_id: string
          timezone?: string
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          canceled_at?: string | null
          caption?: string | null
          content_id?: string
          created_at?: string
          custom_caption?: string | null
          error_code?: string | null
          error_message?: string | null
          first_comment?: string | null
          hashtags?: string[] | null
          hashtags_override?: string[] | null
          id?: string
          media_url?: string | null
          last_attempted_at?: string | null
          last_performance_sync?: string | null
          location_tag?: Json | null
          max_retries?: number
          media_type?: string | null
          metadata?: Json | null
          next_retry_at?: string | null
          performance_snapshot?: Json
          platform?: string | null
          platform_account_id?: string | null
          platform_permalink?: string | null
          platform_post_id?: string | null
          platform_post_url?: string | null
          platform_user_id?: string | null
          published_at?: string | null
          rejection_note?: string | null
          requires_approval?: boolean
          retry_count?: number
          scheduled_at?: string
          status?: Database["public"]["Enums"]["post_status"]
          tenant_id?: string
          timezone?: string
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          cancel_at_period_end: boolean
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          currency: string
          current_period_end: string
          current_period_start: string
          gateway_customer_id: string | null
          gateway_subscription_id: string | null
          id: string
          metadata: Json
          payment_gateway: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          plan: Database["public"]["Enums"]["plan_type"]
          status: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          trial_end: string | null
          trial_start: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          cancel_at_period_end?: boolean
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end: string
          current_period_start?: string
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          metadata?: Json
          payment_gateway?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          plan: Database["public"]["Enums"]["plan_type"]
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          trial_end?: string | null
          trial_start?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          cancel_at_period_end?: boolean
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string
          current_period_start?: string
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          metadata?: Json
          payment_gateway?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          plan?: Database["public"]["Enums"]["plan_type"]
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id?: string
          trial_end?: string | null
          trial_start?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          ai_memory: Json
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          business_scale: string | null
          created_at: string
          deleted_at: string | null
          id: string
          image_credits_max: number | null
          image_credits_used: number | null
          is_active: boolean
          locale: string
          main_goals: string[]
          metadata: Json
          monthly_revenue: string | null
          name: string
          niche: string | null
          onboarding_completed_at: string | null
          owner_name: string | null
          plan: string
          plan_expires_at: string | null
          plan_seats: number
          primary_platform: string | null
          product_count: string | null
          quota_bulk_max: number
          quota_bulk_used: number
          quota_content_max: number
          quota_content_used: number
          quota_platform_max: number
          quota_reset_at: string
          quota_seats_max: number
          quota_video_max: number
          quota_video_used: number
          seller_type: Database["public"]["Enums"]["seller_type"] | null
          settings: Json
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          sub_niche: string | null
          timezone: string
          trial_ends_at: string | null
          updated_at: string
          upscale_credits_max: number | null
          upscale_credits_used: number | null
          whatsapp: string | null
        }
        Insert: {
          ai_memory?: Json
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          business_scale?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_credits_max?: number | null
          image_credits_used?: number | null
          is_active?: boolean
          locale?: string
          main_goals?: string[]
          metadata?: Json
          monthly_revenue?: string | null
          name: string
          niche?: string | null
          onboarding_completed_at?: string | null
          owner_name?: string | null
          plan?: string
          plan_expires_at?: string | null
          plan_seats?: number
          primary_platform?: string | null
          product_count?: string | null
          quota_bulk_max?: number
          quota_bulk_used?: number
          quota_content_max?: number
          quota_content_used?: number
          quota_platform_max?: number
          quota_reset_at?: string
          quota_seats_max?: number
          quota_video_max?: number
          quota_video_used?: number
          seller_type?: Database["public"]["Enums"]["seller_type"] | null
          settings?: Json
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          sub_niche?: string | null
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
          upscale_credits_max?: number | null
          upscale_credits_used?: number | null
          whatsapp?: string | null
        }
        Update: {
          ai_memory?: Json
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          business_scale?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_credits_max?: number | null
          image_credits_used?: number | null
          is_active?: boolean
          locale?: string
          main_goals?: string[]
          metadata?: Json
          monthly_revenue?: string | null
          name?: string
          niche?: string | null
          onboarding_completed_at?: string | null
          owner_name?: string | null
          plan?: string
          plan_expires_at?: string | null
          plan_seats?: number
          primary_platform?: string | null
          product_count?: string | null
          quota_bulk_max?: number
          quota_bulk_used?: number
          quota_content_max?: number
          quota_content_used?: number
          quota_platform_max?: number
          quota_reset_at?: string
          quota_seats_max?: number
          quota_video_max?: number
          quota_video_used?: number
          seller_type?: Database["public"]["Enums"]["seller_type"] | null
          settings?: Json
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          sub_niche?: string | null
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
          upscale_credits_max?: number | null
          upscale_credits_used?: number | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      trending_data: {
        Row: {
          data_type: string
          display_name: string | null
          expires_at: string
          fetched_at: string
          growth_rate_7d: number | null
          id: string
          is_banned: boolean
          metadata: Json
          niche: string | null
          post_count: number | null
          rank_position: number | null
          region: string
          trend_score: number | null
          value: string
        }
        Insert: {
          data_type: string
          display_name?: string | null
          expires_at?: string
          fetched_at?: string
          growth_rate_7d?: number | null
          id?: string
          is_banned?: boolean
          metadata?: Json
          niche?: string | null
          post_count?: number | null
          rank_position?: number | null
          region?: string
          trend_score?: number | null
          value: string
        }
        Update: {
          data_type?: string
          display_name?: string | null
          expires_at?: string
          fetched_at?: string
          growth_rate_7d?: number | null
          id?: string
          is_banned?: boolean
          metadata?: Json
          niche?: string | null
          post_count?: number | null
          rank_position?: number | null
          region?: string
          trend_score?: number | null
          value?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          email: string
          email_verified_at: string | null
          failed_login_count: number
          id: string
          is_active: boolean
          last_login_at: string | null
          last_login_ip: unknown
          locked_until: string | null
          login_count: number
          metadata: Json
          mfa_enabled: boolean
          mfa_secret: string | null
          name: string
          oauth_id: string | null
          oauth_provider: Database["public"]["Enums"]["oauth_provider"] | null
          oauth_token: string | null
          onboarding_done: boolean
          onboarding_step: number
          password_hash: string | null
          preferences: Json
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          email_verified_at?: string | null
          failed_login_count?: number
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_login_ip?: unknown
          locked_until?: string | null
          login_count?: number
          metadata?: Json
          mfa_enabled?: boolean
          mfa_secret?: string | null
          name?: string
          oauth_id?: string | null
          oauth_provider?: Database["public"]["Enums"]["oauth_provider"] | null
          oauth_token?: string | null
          onboarding_done?: boolean
          onboarding_step?: number
          password_hash?: string | null
          preferences?: Json
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          email_verified_at?: string | null
          failed_login_count?: number
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_login_ip?: unknown
          locked_until?: string | null
          login_count?: number
          metadata?: Json
          mfa_enabled?: boolean
          mfa_secret?: string | null
          name?: string
          oauth_id?: string | null
          oauth_provider?: Database["public"]["Enums"]["oauth_provider"] | null
          oauth_token?: string | null
          onboarding_done?: boolean
          onboarding_step?: number
          password_hash?: string | null
          preferences?: Json
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      video_jobs: {
        Row: {
          completed_at: string | null
          content_id: string | null
          cost_credits: number | null
          created_at: string
          duration: number | null
          duration_actual: number | null
          error_code: string | null
          error_message: string | null
          file_size_bytes: number | null
          id: string
          media_url: string | null
          last_polled_at: string | null
          max_polls: number
          motion_level: number | null
          poll_count: number
          prompt: string
          ratio: string | null
          runway_status: string | null
          runway_task_id: string | null
          seed: number | null
          started_at: string | null
          status: string
          tenant_id: string
          thumbnail_url: string | null
          updated_at: string
          video_raw_url: string | null
          video_url: string | null
        }
        Insert: {
          completed_at?: string | null
          content_id?: string | null
          cost_credits?: number | null
          created_at?: string
          duration?: number | null
          duration_actual?: number | null
          error_code?: string | null
          error_message?: string | null
          file_size_bytes?: number | null
          id?: string
          media_url?: string | null
          last_polled_at?: string | null
          max_polls?: number
          motion_level?: number | null
          poll_count?: number
          prompt: string
          ratio?: string | null
          runway_status?: string | null
          runway_task_id?: string | null
          seed?: number | null
          started_at?: string | null
          status?: string
          tenant_id: string
          thumbnail_url?: string | null
          updated_at?: string
          video_raw_url?: string | null
          video_url?: string | null
        }
        Update: {
          completed_at?: string | null
          content_id?: string | null
          cost_credits?: number | null
          created_at?: string
          duration?: number | null
          duration_actual?: number | null
          error_code?: string | null
          error_message?: string | null
          file_size_bytes?: number | null
          id?: string
          media_url?: string | null
          last_polled_at?: string | null
          max_polls?: number
          motion_level?: number | null
          poll_count?: number
          prompt?: string
          ratio?: string | null
          runway_status?: string | null
          runway_task_id?: string | null
          seed?: number | null
          started_at?: string | null
          status?: string
          tenant_id?: string
          thumbnail_url?: string | null
          updated_at?: string
          video_raw_url?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_jobs_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string | null
          email: string
          id: number
          ip: string | null
          name: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
          ip?: string | null
          name?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
          ip?: string | null
          name?: string | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      build_content_search_vector: {
        Args: {
          p_caption_text: string
          p_hashtags: string[]
          p_product_data: Json
          p_tags: string[]
          p_title: string
        }
        Returns: unknown
      }
      count_search_contents: {
        Args: { p_query: string; p_tenant_id: string }
        Returns: number
      }
      current_tenant_id: { Args: never; Returns: string }
      current_user_id: { Args: never; Returns: string }
      decrement_quota: {
        Args: { p_amount?: number; p_tenant_id: string; p_type?: string }
        Returns: boolean
      }
      generate_slug: { Args: { base_name: string }; Returns: string }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_my_tenant_id: { Args: never; Returns: string }
      get_tenant_usage: { Args: { p_tenant_id: string }; Returns: Json }
      is_owner_or_admin: { Args: never; Returns: boolean }
      is_tenant_member: { Args: { target_tenant_id: string }; Returns: boolean }
      reset_monthly_quota: {
        Args: never
        Returns: {
          out_content_now: number
          out_content_was: number
          out_plan: Database["public"]["Enums"]["plan_type"]
          out_tenant_id: string
          out_video_now: number
          out_video_was: number
        }[]
      }
      search_contents: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_platform?: string
          p_query: string
          p_status?: string
          p_tenant_id: string
          p_type?: string
        }
        Returns: {
          caption_text: string
          created_at: string
          folder_id: string
          hashtags: string[]
          highlight_caption: string
          id: string
          image_thumb_url: string
          media_url: string
          is_starred: boolean
          match_type: string
          primary_platform: string
          rank: number
          status: string
          tags: string[]
          title: string
          type: string
          updated_at: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      ad_platform: "meta" | "tiktok_ads" | "google_display"
      affiliate_platform:
        | "shopee_affiliate"
        | "tokopedia_affiliate"
        | "tiktokshop_affiliate"
        | "manual"
      bid_strategy:
        | "lowest_cost"
        | "cost_cap"
        | "bid_cap"
        | "target_roas"
        | "target_cpa"
      billing_cycle: "monthly" | "yearly"
      billing_interval: "monthly" | "annually"
      budget_type: "daily" | "lifetime"
      campaign_objective:
        | "awareness"
        | "traffic"
        | "engagement"
        | "leads"
        | "app_installs"
        | "video_views"
        | "conversions"
        | "sales"
      campaign_status:
        | "draft"
        | "under_review"
        | "active"
        | "paused"
        | "completed"
        | "rejected"
        | "archived"
      content_language: "id" | "id_gaul" | "jv" | "su" | "en" | "en_id_mix"
      content_status:
        | "draft"
        | "generating"
        | "ready"
        | "scheduled"
        | "published"
        | "failed"
        | "archived"
      content_tone:
        | "casual"
        | "professional"
        | "urgent"
        | "funny"
        | "inspirational"
        | "empathetic"
        | "educational"
        | "fomo"
        | "storytelling"
      content_type:
        | "caption"
        | "image"
        | "video"
        | "carousel"
        | "story"
        | "reel"
      cta_style: "soft" | "medium" | "aggressive"
      deal_status:
        | "inquiry"
        | "negotiating"
        | "contracted"
        | "content_submitted"
        | "content_approved"
        | "completed"
        | "cancelled"
        | "disputed"
      emoji_level: "heavy" | "moderate" | "minimal" | "none"
      job_status:
        | "pending"
        | "queued"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
        | "retrying"
      job_type:
        | "text_generation"
        | "image_generation"
        | "video_generation"
        | "bulk_text"
        | "bulk_image"
        | "bulk_video"
        | "background_removal"
        | "image_upscale"
        | "subtitle_generation"
        | "trend_fetch"
        | "scrape_product"
        | "competitor_analysis"
      language_type:
        | "indonesian_casual"
        | "indonesian_formal"
        | "mixed_english"
        | "full_english"
      notification_status:
        | "pending"
        | "sent"
        | "delivered"
        | "failed"
        | "bounced"
      notification_type: "push" | "email" | "whatsapp" | "in_app"
      oauth_provider: "google" | "meta" | "tiktok" | "apple"
      payment_method:
        | "gopay"
        | "ovo"
        | "dana"
        | "shopeepay"
        | "qris"
        | "va_bca"
        | "va_mandiri"
        | "va_bni"
        | "va_bri"
        | "va_permata"
        | "credit_card"
        | "debit_card"
        | "bank_transfer"
        | "stripe"
      payment_status:
        | "pending"
        | "processing"
        | "success"
        | "failed"
        | "refunded"
        | "disputed"
      plan_type: "starter" | "pro" | "business" | "enterprise"
      platform_type: "instagram" | "instagram_reels" | "tiktok"
      post_status:
        | "queued"
        | "pre_checking"
        | "publishing"
        | "published"
        | "failed"
        | "cancelled"
      seller_type:
        | "seller"
        | "affiliator"
        | "dropshipper"
        | "brand"
        | "agency"
        | "reseller"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "cancelled"
        | "expired"
        | "paused"
      tone_type:
        | "casual"
        | "friendly"
        | "professional"
        | "energetic"
        | "luxury"
        | "playful"
        | "authoritative"
      user_role: "owner" | "admin" | "editor" | "viewer"
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
    Enums: {
      ad_platform: ["meta", "tiktok_ads", "google_display"],
      affiliate_platform: [
        "shopee_affiliate",
        "tokopedia_affiliate",
        "tiktokshop_affiliate",
        "manual",
      ],
      bid_strategy: [
        "lowest_cost",
        "cost_cap",
        "bid_cap",
        "target_roas",
        "target_cpa",
      ],
      billing_cycle: ["monthly", "yearly"],
      billing_interval: ["monthly", "annually"],
      budget_type: ["daily", "lifetime"],
      campaign_objective: [
        "awareness",
        "traffic",
        "engagement",
        "leads",
        "app_installs",
        "video_views",
        "conversions",
        "sales",
      ],
      campaign_status: [
        "draft",
        "under_review",
        "active",
        "paused",
        "completed",
        "rejected",
        "archived",
      ],
      content_language: ["id", "id_gaul", "jv", "su", "en", "en_id_mix"],
      content_status: [
        "draft",
        "generating",
        "ready",
        "scheduled",
        "published",
        "failed",
        "archived",
      ],
      content_tone: [
        "casual",
        "professional",
        "urgent",
        "funny",
        "inspirational",
        "empathetic",
        "educational",
        "fomo",
        "storytelling",
      ],
      content_type: ["caption", "image", "video", "carousel", "story", "reel"],
      cta_style: ["soft", "medium", "aggressive"],
      deal_status: [
        "inquiry",
        "negotiating",
        "contracted",
        "content_submitted",
        "content_approved",
        "completed",
        "cancelled",
        "disputed",
      ],
      emoji_level: ["heavy", "moderate", "minimal", "none"],
      job_status: [
        "pending",
        "queued",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "retrying",
      ],
      job_type: [
        "text_generation",
        "image_generation",
        "video_generation",
        "bulk_text",
        "bulk_image",
        "bulk_video",
        "background_removal",
        "image_upscale",
        "subtitle_generation",
        "trend_fetch",
        "scrape_product",
        "competitor_analysis",
      ],
      language_type: [
        "indonesian_casual",
        "indonesian_formal",
        "mixed_english",
        "full_english",
      ],
      notification_status: [
        "pending",
        "sent",
        "delivered",
        "failed",
        "bounced",
      ],
      notification_type: ["push", "email", "whatsapp", "in_app"],
      oauth_provider: ["google", "meta", "tiktok", "apple"],
      payment_method: [
        "gopay",
        "ovo",
        "dana",
        "shopeepay",
        "qris",
        "va_bca",
        "va_mandiri",
        "va_bni",
        "va_bri",
        "va_permata",
        "credit_card",
        "debit_card",
        "bank_transfer",
        "stripe",
      ],
      payment_status: [
        "pending",
        "processing",
        "success",
        "failed",
        "refunded",
        "disputed",
      ],
      plan_type: ["starter", "pro", "business", "enterprise"],
      platform_type: ["instagram", "instagram_reels", "tiktok"],
      post_status: [
        "queued",
        "pre_checking",
        "publishing",
        "published",
        "failed",
        "cancelled",
      ],
      seller_type: [
        "seller",
        "affiliator",
        "dropshipper",
        "brand",
        "agency",
        "reseller",
      ],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "cancelled",
        "expired",
        "paused",
      ],
      tone_type: [
        "casual",
        "friendly",
        "professional",
        "energetic",
        "luxury",
        "playful",
        "authoritative",
      ],
      user_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const
