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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_content_brands: {
        Row: {
          brands_list: string | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          brands_list?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          brands_list?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_content_carousel: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          link: string
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          link: string
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          link?: string
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_content_featured: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      app_content_featured_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          link: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          link: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          link?: string
        }
        Relationships: []
      }
      app_content_grid: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      app_content_grid_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          link: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          link: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          link?: string
        }
        Relationships: []
      }
      app_content_links: {
        Row: {
          created_at: string
          display_order: number
          id: string
          link: string
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          link: string
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          link?: string
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      attribute_categories: {
        Row: {
          attribute_id: string
          category_id: string
          created_at: string
          id: string
        }
        Insert: {
          attribute_id: string
          category_id: string
          created_at?: string
          id?: string
        }
        Update: {
          attribute_id?: string
          category_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attribute_categories_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribute_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      attribute_groups: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      attribute_options: {
        Row: {
          attribute_id: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean | null
          updated_at: string
          value: string
        }
        Insert: {
          attribute_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          updated_at?: string
          value: string
        }
        Update: {
          attribute_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "attribute_options_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      attribute_sub_subcategories: {
        Row: {
          attribute_id: string
          created_at: string
          id: string
          sub_subcategory_id: string
        }
        Insert: {
          attribute_id: string
          created_at?: string
          id?: string
          sub_subcategory_id: string
        }
        Update: {
          attribute_id?: string
          created_at?: string
          id?: string
          sub_subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attribute_sub_subcategories_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribute_sub_subcategories_sub_subcategory_id_fkey"
            columns: ["sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      attribute_subcategories: {
        Row: {
          attribute_id: string
          created_at: string
          id: string
          subcategory_id: string
        }
        Insert: {
          attribute_id: string
          created_at?: string
          id?: string
          subcategory_id: string
        }
        Update: {
          attribute_id?: string
          created_at?: string
          id?: string
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attribute_subcategories_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribute_subcategories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      attributes: {
        Row: {
          category_id: string
          created_at: string
          data_type: string
          display_label: string | null
          display_order: number | null
          group_id: string | null
          id: string
          is_required: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          data_type: string
          display_label?: string | null
          display_order?: number | null
          group_id?: string | null
          id?: string
          is_required?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          data_type?: string
          display_label?: string | null
          display_order?: number | null
          group_id?: string | null
          id?: string
          is_required?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attributes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attributes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "attribute_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          auction_duration: number
          bid_count: number | null
          created_at: string
          current_bid: number | null
          end_time: string
          id: string
          listing_id: string
          reserve_met: boolean | null
          reserve_price: number
          start_time: string
          starting_bid: number | null
          status: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          auction_duration: number
          bid_count?: number | null
          created_at?: string
          current_bid?: number | null
          end_time: string
          id?: string
          listing_id: string
          reserve_met?: boolean | null
          reserve_price: number
          start_time?: string
          starting_bid?: number | null
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          auction_duration?: number
          bid_count?: number | null
          created_at?: string
          current_bid?: number | null
          end_time?: string
          id?: string
          listing_id?: string
          reserve_met?: boolean | null
          reserve_price?: number
          start_time?: string
          starting_bid?: number | null
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auctions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auctions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "product_sales_status"
            referencedColumns: ["product_id"]
          },
        ]
      }
      audit_product_attributes: {
        Row: {
          attribute_id: string | null
          changed_at: string
          changed_by: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          operation: string
          product_id: string
          source_info: string | null
        }
        Insert: {
          attribute_id?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          product_id: string
          source_info?: string | null
        }
        Update: {
          attribute_id?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          product_id?: string
          source_info?: string | null
        }
        Relationships: []
      }
      audit_product_images: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          listing_id: string
          new_images: Json | null
          old_images: Json | null
          operation: string
          source_info: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          listing_id: string
          new_images?: Json | null
          old_images?: Json | null
          operation: string
          source_info?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          listing_id?: string
          new_images?: Json | null
          old_images?: Json | null
          operation?: string
          source_info?: string | null
        }
        Relationships: []
      }
      audit_product_tags: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          operation: string
          product_id: string
          source_info: string | null
          tag_id: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          operation: string
          product_id: string
          source_info?: string | null
          tag_id?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          operation?: string
          product_id?: string
          source_info?: string | null
          tag_id?: string | null
        }
        Relationships: []
      }
      bids: {
        Row: {
          auction_id: string
          bid_amount: number
          bidder_id: string
          created_at: string
          id: string
          max_bid_amount: number
        }
        Insert: {
          auction_id: string
          bid_amount: number
          bidder_id: string
          created_at?: string
          id?: string
          max_bid_amount?: number
        }
        Update: {
          auction_id?: string
          bid_amount?: number
          bidder_id?: string
          created_at?: string
          id?: string
          max_bid_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_post_products: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          post_id: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          post_id: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          post_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_products_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_sales_status"
            referencedColumns: ["product_id"]
          },
        ]
      }
      blog_post_related_posts: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          post_id: string
          related_post_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          post_id: string
          related_post_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          post_id?: string
          related_post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_related_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_related_posts_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_sections: {
        Row: {
          content: Json
          created_at: string | null
          display_order: number
          id: string
          post_id: string
          section_type: string
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          display_order?: number
          id?: string
          post_id: string
          section_type: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          display_order?: number
          id?: string
          post_id?: string
          section_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_sections_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_tags: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_bio: string | null
          author_id: string | null
          author_name: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          cta_label: string | null
          cta_link: string | null
          excerpt: string | null
          featured_image: string | null
          hero_banner: string | null
          id: string
          publish_date: string | null
          reading_time: number | null
          scheduled_publish_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          author_bio?: string | null
          author_id?: string | null
          author_name?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          cta_label?: string | null
          cta_link?: string | null
          excerpt?: string | null
          featured_image?: string | null
          hero_banner?: string | null
          id?: string
          publish_date?: string | null
          reading_time?: number | null
          scheduled_publish_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          author_bio?: string | null
          author_id?: string | null
          author_name?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          cta_label?: string | null
          cta_link?: string | null
          excerpt?: string | null
          featured_image?: string | null
          hero_banner?: string | null
          id?: string
          publish_date?: string | null
          reading_time?: number | null
          scheduled_publish_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      buyer_profiles: {
        Row: {
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_city: string | null
          billing_country: string | null
          billing_first_name: string | null
          billing_last_name: string | null
          billing_phone: string | null
          billing_postal_code: string | null
          billing_state: string | null
          created_at: string
          id: string
          preferred_payment_method: string | null
          shipping_address_line1: string | null
          shipping_address_line2: string | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_first_name: string | null
          shipping_last_name: string | null
          shipping_phone: string | null
          shipping_postal_code: string | null
          shipping_state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_first_name?: string | null
          billing_last_name?: string | null
          billing_phone?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          created_at?: string
          id?: string
          preferred_payment_method?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_first_name?: string | null
          shipping_last_name?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_first_name?: string | null
          billing_last_name?: string | null
          billing_phone?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          created_at?: string
          id?: string
          preferred_payment_method?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_first_name?: string | null
          shipping_last_name?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      buyer_protection_fees: {
        Row: {
          created_at: string
          id: string
          max_price: number | null
          min_price: number
          percentage: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_price?: number | null
          min_price?: number
          percentage?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_price?: number | null
          min_price?: number
          percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      cart: {
        Row: {
          created_at: string
          id: string
          listing_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "product_sales_status"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "cart_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      category_attribute_filters: {
        Row: {
          attribute_id: string | null
          category_id: string | null
          created_at: string | null
          display_order: number | null
          filter_name: string | null
          filter_type: string | null
          id: string
          is_active: boolean | null
          show_in_top_line: boolean | null
          sub_sub_subcategory_id: string | null
          sub_subcategory_id: string | null
          subcategory_id: string | null
          updated_at: string | null
        }
        Insert: {
          attribute_id?: string | null
          category_id?: string | null
          created_at?: string | null
          display_order?: number | null
          filter_name?: string | null
          filter_type?: string | null
          id?: string
          is_active?: boolean | null
          show_in_top_line?: boolean | null
          sub_sub_subcategory_id?: string | null
          sub_subcategory_id?: string | null
          subcategory_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attribute_id?: string | null
          category_id?: string | null
          created_at?: string | null
          display_order?: number | null
          filter_name?: string | null
          filter_type?: string | null
          id?: string
          is_active?: boolean | null
          show_in_top_line?: boolean | null
          sub_sub_subcategory_id?: string | null
          sub_subcategory_id?: string | null
          subcategory_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_attribute_filters_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_attribute_filters_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_attribute_filters_sub_sub_subcategory_id_fkey"
            columns: ["sub_sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_sub_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_attribute_filters_sub_subcategory_id_fkey"
            columns: ["sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_attribute_filters_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_filter_settings: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          show_brand_filter: boolean | null
          show_color_filter: boolean | null
          show_price_filter: boolean | null
          show_size_filter: boolean | null
          sub_sub_subcategory_id: string | null
          sub_subcategory_id: string | null
          subcategory_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          show_brand_filter?: boolean | null
          show_color_filter?: boolean | null
          show_price_filter?: boolean | null
          show_size_filter?: boolean | null
          sub_sub_subcategory_id?: string | null
          sub_subcategory_id?: string | null
          subcategory_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          show_brand_filter?: boolean | null
          show_color_filter?: boolean | null
          show_price_filter?: boolean | null
          show_size_filter?: boolean | null
          sub_sub_subcategory_id?: string | null
          sub_subcategory_id?: string | null
          subcategory_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_filter_settings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_filter_settings_sub_sub_subcategory_id_fkey"
            columns: ["sub_sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_sub_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_filter_settings_sub_subcategory_id_fkey"
            columns: ["sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_filter_settings_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_grid_images: {
        Row: {
          button_text: string
          category_id: string
          created_at: string
          display_order: number
          id: string
          image_url: string
          link: string
          updated_at: string
        }
        Insert: {
          button_text: string
          category_id: string
          created_at?: string
          display_order: number
          id?: string
          image_url: string
          link: string
          updated_at?: string
        }
        Update: {
          button_text?: string
          category_id?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          link?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_grid_images_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_search_index: {
        Row: {
          category_id: string
          category_level: number
          category_name: string
          created_at: string
          display_label: string
          id: string
          is_synonym: boolean | null
          level1_name: string | null
          level1_slug: string | null
          level2_name: string | null
          level2_slug: string | null
          level3_name: string | null
          level3_slug: string | null
          level4_name: string | null
          level4_slug: string | null
          search_term: string
          search_url: string
          updated_at: string
        }
        Insert: {
          category_id: string
          category_level: number
          category_name: string
          created_at?: string
          display_label: string
          id?: string
          is_synonym?: boolean | null
          level1_name?: string | null
          level1_slug?: string | null
          level2_name?: string | null
          level2_slug?: string | null
          level3_name?: string | null
          level3_slug?: string | null
          level4_name?: string | null
          level4_slug?: string | null
          search_term: string
          search_url: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          category_level?: number
          category_name?: string
          created_at?: string
          display_label?: string
          id?: string
          is_synonym?: boolean | null
          level1_name?: string | null
          level1_slug?: string | null
          level2_name?: string | null
          level2_slug?: string | null
          level3_name?: string | null
          level3_slug?: string | null
          level4_name?: string | null
          level4_slug?: string | null
          search_term?: string
          search_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_page_products: {
        Row: {
          created_at: string
          display_order: number
          id: string
          page_id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          page_id: string
          product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          page_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_page_products_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "content_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_page_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_page_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_sales_status"
            referencedColumns: ["product_id"]
          },
        ]
      }
      content_pages: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          page_type: string
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          page_type?: string
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          page_type?: string
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      currency_rates: {
        Row: {
          base_currency: string | null
          id: string
          last_updated: string | null
          rate: number
          target_currency: string
        }
        Insert: {
          base_currency?: string | null
          id?: string
          last_updated?: string | null
          rate: number
          target_currency: string
        }
        Update: {
          base_currency?: string | null
          id?: string
          last_updated?: string | null
          rate?: number
          target_currency?: string
        }
        Relationships: []
      }
      footer_columns: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      footer_links: {
        Row: {
          column_id: string
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean | null
          label: string
          updated_at: string | null
          url: string
        }
        Insert: {
          column_id: string
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          label: string
          updated_at?: string | null
          url: string
        }
        Update: {
          column_id?: string
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "footer_links_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "footer_columns"
            referencedColumns: ["id"]
          },
        ]
      }
      founders_list: {
        Row: {
          created_at: string
          email: string
          id: string
          intent: string | null
          interests: string[] | null
          name: string
          price_range: string | null
          selling_plans: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          intent?: string | null
          interests?: string[] | null
          name: string
          price_range?: string | null
          selling_plans?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          intent?: string | null
          interests?: string[] | null
          name?: string
          price_range?: string | null
          selling_plans?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      grading_guide_categories: {
        Row: {
          category_id: string
          created_at: string
          grading_guide_id: string
          id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          grading_guide_id: string
          id?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          grading_guide_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_guide_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_guide_categories_grading_guide_id_fkey"
            columns: ["grading_guide_id"]
            isOneToOne: false
            referencedRelation: "grading_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_guide_sub_sub_subcategories: {
        Row: {
          created_at: string
          grading_guide_id: string
          id: string
          sub_sub_subcategory_id: string
        }
        Insert: {
          created_at?: string
          grading_guide_id: string
          id?: string
          sub_sub_subcategory_id: string
        }
        Update: {
          created_at?: string
          grading_guide_id?: string
          id?: string
          sub_sub_subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_guide_sub_sub_subcategories_grading_guide_id_fkey"
            columns: ["grading_guide_id"]
            isOneToOne: false
            referencedRelation: "grading_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_guide_sub_sub_subcategories_sub_sub_subcategory_id_fkey"
            columns: ["sub_sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_sub_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_guide_sub_subcategories: {
        Row: {
          created_at: string
          grading_guide_id: string
          id: string
          sub_subcategory_id: string
        }
        Insert: {
          created_at?: string
          grading_guide_id: string
          id?: string
          sub_subcategory_id: string
        }
        Update: {
          created_at?: string
          grading_guide_id?: string
          id?: string
          sub_subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_guide_sub_subcategories_grading_guide_id_fkey"
            columns: ["grading_guide_id"]
            isOneToOne: false
            referencedRelation: "grading_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_guide_sub_subcategories_sub_subcategory_id_fkey"
            columns: ["sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_guide_subcategories: {
        Row: {
          created_at: string
          grading_guide_id: string
          id: string
          subcategory_id: string
        }
        Insert: {
          created_at?: string
          grading_guide_id: string
          id?: string
          subcategory_id: string
        }
        Update: {
          created_at?: string
          grading_guide_id?: string
          id?: string
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_guide_subcategories_grading_guide_id_fkey"
            columns: ["grading_guide_id"]
            isOneToOne: false
            referencedRelation: "grading_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_guide_subcategories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_guides: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_card_items: {
        Row: {
          button_link: string | null
          button_text: string | null
          created_at: string | null
          display_order: number | null
          homepage_card_id: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link: string | null
          overlay_text: string | null
          updated_at: string | null
        }
        Insert: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          display_order?: number | null
          homepage_card_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link?: string | null
          overlay_text?: string | null
          updated_at?: string | null
        }
        Update: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          display_order?: number | null
          homepage_card_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link?: string | null
          overlay_text?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homepage_card_items_homepage_card_id_fkey"
            columns: ["homepage_card_id"]
            isOneToOne: false
            referencedRelation: "homepage_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_cards: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      instagram_posts: {
        Row: {
          created_at: string | null
          display_order: number | null
          embed_code: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          embed_code?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          embed_code?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      listings: {
        Row: {
          archived: boolean
          auction_end_time: string | null
          auction_type: string | null
          brand_id: string | null
          category_id: string | null
          created_at: string
          current_bid: number | null
          discounted_price: number | null
          excerpt: string | null
          height: number | null
          id: string
          is_webp_main_image: boolean | null
          length: number | null
          meta_description: string | null
          meta_title: string | null
          moderation_reason: string | null
          moderation_status: string | null
          offers_enabled: boolean | null
          product_description: string | null
          product_image: string | null
          product_image_alts: Json | null
          product_images: string[] | null
          product_name: string
          product_type: string
          seller_id: string
          showcase_image: string | null
          sku: string | null
          slug: string | null
          starting_price: number
          status: string | null
          stock_id: string | null
          stock_quantity: number | null
          stream_id: string
          sub_sub_subcategory_id: string | null
          sub_subcategory_id: string | null
          subcategory_id: string | null
          thumbnail: string | null
          updated_at: string
          view_count: number | null
          weight: number | null
          width: number | null
        }
        Insert: {
          archived?: boolean
          auction_end_time?: string | null
          auction_type?: string | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          current_bid?: number | null
          discounted_price?: number | null
          excerpt?: string | null
          height?: number | null
          id?: string
          is_webp_main_image?: boolean | null
          length?: number | null
          meta_description?: string | null
          meta_title?: string | null
          moderation_reason?: string | null
          moderation_status?: string | null
          offers_enabled?: boolean | null
          product_description?: string | null
          product_image?: string | null
          product_image_alts?: Json | null
          product_images?: string[] | null
          product_name: string
          product_type?: string
          seller_id: string
          showcase_image?: string | null
          sku?: string | null
          slug?: string | null
          starting_price: number
          status?: string | null
          stock_id?: string | null
          stock_quantity?: number | null
          stream_id: string
          sub_sub_subcategory_id?: string | null
          sub_subcategory_id?: string | null
          subcategory_id?: string | null
          thumbnail?: string | null
          updated_at?: string
          view_count?: number | null
          weight?: number | null
          width?: number | null
        }
        Update: {
          archived?: boolean
          auction_end_time?: string | null
          auction_type?: string | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          current_bid?: number | null
          discounted_price?: number | null
          excerpt?: string | null
          height?: number | null
          id?: string
          is_webp_main_image?: boolean | null
          length?: number | null
          meta_description?: string | null
          meta_title?: string | null
          moderation_reason?: string | null
          moderation_status?: string | null
          offers_enabled?: boolean | null
          product_description?: string | null
          product_image?: string | null
          product_image_alts?: Json | null
          product_images?: string[] | null
          product_name?: string
          product_type?: string
          seller_id?: string
          showcase_image?: string | null
          sku?: string | null
          slug?: string | null
          starting_price?: number
          status?: string | null
          stock_id?: string | null
          stock_quantity?: number | null
          stream_id?: string
          sub_sub_subcategory_id?: string | null
          sub_subcategory_id?: string | null
          subcategory_id?: string | null
          thumbnail?: string | null
          updated_at?: string
          view_count?: number | null
          weight?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_sub_sub_subcategory_id_fkey"
            columns: ["sub_sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_sub_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_sub_subcategory_id_fkey"
            columns: ["sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      master_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      mega_menu_best_sellers: {
        Row: {
          category_id: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean | null
          item_level: number
          sub_sub_subcategory_id: string | null
          sub_subcategory_id: string | null
          subcategory_id: string | null
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          item_level?: number
          sub_sub_subcategory_id?: string | null
          sub_subcategory_id?: string | null
          subcategory_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          item_level?: number
          sub_sub_subcategory_id?: string | null
          sub_subcategory_id?: string | null
          subcategory_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mega_menu_best_sellers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mega_menu_best_sellers_sub_sub_subcategory_id_fkey"
            columns: ["sub_sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_sub_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mega_menu_best_sellers_sub_subcategory_id_fkey"
            columns: ["sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mega_menu_best_sellers_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      mega_menu_category_brands: {
        Row: {
          brand_id: string
          category_id: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          category_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          category_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mega_menu_category_brands_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mega_menu_category_brands_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      mega_menu_custom_list_items: {
        Row: {
          category_id: string | null
          category_level: number | null
          created_at: string
          display_order: number
          id: string
          is_active: boolean | null
          list_id: string
          name: string
          updated_at: string
          url: string | null
        }
        Insert: {
          category_id?: string | null
          category_level?: number | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          list_id: string
          name: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          category_id?: string | null
          category_level?: number | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          list_id?: string
          name?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mega_menu_custom_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "mega_menu_custom_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      mega_menu_custom_lists: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean | null
          list_type: string
          name: string
          system_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          list_type?: string
          name: string
          system_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          list_type?: string
          name?: string
          system_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      mega_menu_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_alt: string | null
          image_link: string | null
          image_url: string
          is_active: boolean
          layout_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_alt?: string | null
          image_link?: string | null
          image_url: string
          is_active?: boolean
          layout_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_alt?: string | null
          image_link?: string | null
          image_url?: string
          is_active?: boolean
          layout_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mega_menu_images_layout_id_fkey"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "mega_menu_layouts"
            referencedColumns: ["id"]
          },
        ]
      }
      mega_menu_layouts: {
        Row: {
          category_id: string
          columns: Json
          created_at: string
          id: string
          image_alt: string | null
          image_column_span: number | null
          image_column_start: number | null
          image_link: string | null
          image_url: string | null
          is_active: boolean | null
          template_type: string
          updated_at: string
        }
        Insert: {
          category_id: string
          columns?: Json
          created_at?: string
          id?: string
          image_alt?: string | null
          image_column_span?: number | null
          image_column_start?: number | null
          image_link?: string | null
          image_url?: string | null
          is_active?: boolean | null
          template_type?: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          columns?: Json
          created_at?: string
          id?: string
          image_alt?: string | null
          image_column_span?: number | null
          image_column_start?: number | null
          image_link?: string | null
          image_url?: string | null
          is_active?: boolean | null
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mega_menu_layouts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: true
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      mega_menu_luxury_brands: {
        Row: {
          brand_id: string
          category_id: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          category_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          category_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mega_menu_luxury_brands_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mega_menu_luxury_brands_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      mega_menu_trending_items: {
        Row: {
          category_id: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean | null
          item_level: number
          sub_sub_subcategory_id: string | null
          sub_subcategory_id: string | null
          subcategory_id: string | null
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          item_level?: number
          sub_sub_subcategory_id?: string | null
          sub_subcategory_id?: string | null
          subcategory_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          item_level?: number
          sub_sub_subcategory_id?: string | null
          sub_subcategory_id?: string | null
          subcategory_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mega_menu_trending_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mega_menu_trending_items_sub_sub_subcategory_id_fkey"
            columns: ["sub_sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_sub_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mega_menu_trending_items_sub_subcategory_id_fkey"
            columns: ["sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mega_menu_trending_items_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          id: string
          is_flagged: boolean | null
          listing_id: string | null
          message: string
          order_id: string | null
          parent_message_id: string | null
          recipient_id: string
          report_reason: string | null
          reported_at: string | null
          reported_by: string | null
          sender_id: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_flagged?: boolean | null
          listing_id?: string | null
          message: string
          order_id?: string | null
          parent_message_id?: string | null
          recipient_id: string
          report_reason?: string | null
          reported_at?: string | null
          reported_by?: string | null
          sender_id: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_flagged?: boolean | null
          listing_id?: string | null
          message?: string
          order_id?: string | null
          parent_message_id?: string | null
          recipient_id?: string
          report_reason?: string | null
          reported_at?: string | null
          reported_by?: string | null
          sender_id?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      no_products_settings: {
        Row: {
          content: string | null
          created_at: string | null
          cta_link: string | null
          cta_text: string | null
          id: string
          image_url: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          image_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          image_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          follower_id: string | null
          id: string
          message: string
          order_id: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          follower_id?: string | null
          id?: string
          message: string
          order_id?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string | null
          id?: string
          message?: string
          order_id?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          buyer_id: string
          created_at: string
          expires_at: string | null
          id: string
          listing_id: string
          message: string | null
          offer_amount: number
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          listing_id: string
          message?: string | null
          offer_amount: number
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          listing_id?: string
          message?: string | null
          offer_amount?: number
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "product_sales_status"
            referencedColumns: ["product_id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_gbp: number | null
          buyer_confirmed: boolean | null
          buyer_id: string
          created_at: string
          delivery_status: string
          display_amount: number | null
          display_currency: string | null
          exchange_rate_used: number | null
          funds_available_at: string | null
          funds_released: boolean | null
          id: string
          issue_description: string | null
          issue_reported: boolean | null
          listing_id: string
          order_amount: number
          order_date: string
          payout_status: string | null
          quantity: number
          seller_id: string
          status: string
          stream_id: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          amount_gbp?: number | null
          buyer_confirmed?: boolean | null
          buyer_id: string
          created_at?: string
          delivery_status?: string
          display_amount?: number | null
          display_currency?: string | null
          exchange_rate_used?: number | null
          funds_available_at?: string | null
          funds_released?: boolean | null
          id?: string
          issue_description?: string | null
          issue_reported?: boolean | null
          listing_id: string
          order_amount: number
          order_date?: string
          payout_status?: string | null
          quantity?: number
          seller_id: string
          status?: string
          stream_id: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          amount_gbp?: number | null
          buyer_confirmed?: boolean | null
          buyer_id?: string
          created_at?: string
          delivery_status?: string
          display_amount?: number | null
          display_currency?: string | null
          exchange_rate_used?: number | null
          funds_available_at?: string | null
          funds_released?: boolean | null
          id?: string
          issue_description?: string | null
          issue_reported?: boolean | null
          listing_id?: string
          order_amount?: number
          order_date?: string
          payout_status?: string | null
          quantity?: number
          seller_id?: string
          status?: string
          stream_id?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "product_sales_status"
            referencedColumns: ["product_id"]
          },
        ]
      }
      page_sections: {
        Row: {
          content: Json
          created_at: string | null
          display_order: number
          id: string
          page_id: string
          section_type: string
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          display_order?: number
          id?: string
          page_id: string
          section_type: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          display_order?: number
          id?: string
          page_id?: string
          section_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "content_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attribute_values: {
        Row: {
          attribute_id: string
          created_at: string
          id: string
          product_id: string
          updated_at: string
          value_boolean: boolean | null
          value_date: string | null
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          attribute_id: string
          created_at?: string
          id?: string
          product_id: string
          updated_at?: string
          value_boolean?: boolean | null
          value_date?: string | null
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          attribute_id?: string
          created_at?: string
          id?: string
          product_id?: string
          updated_at?: string
          value_boolean?: boolean | null
          value_date?: string | null
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_values_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attribute_values_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attribute_values_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_sales_status"
            referencedColumns: ["product_id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          disable_main_link: boolean | null
          display_order: number
          grading_guide_id: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          master_category_id: string | null
          name: string
          show_in_mega_menu: boolean | null
          size_guide_id: string | null
          slug: string
          synonyms: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          disable_main_link?: boolean | null
          display_order: number
          grading_guide_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          master_category_id?: string | null
          name: string
          show_in_mega_menu?: boolean | null
          size_guide_id?: string | null
          slug: string
          synonyms?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          disable_main_link?: boolean | null
          display_order?: number
          grading_guide_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          master_category_id?: string | null
          name?: string
          show_in_mega_menu?: boolean | null
          size_guide_id?: string | null
          slug?: string
          synonyms?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_grading_guide_id_fkey"
            columns: ["grading_guide_id"]
            isOneToOne: false
            referencedRelation: "grading_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_master_category_id_fkey"
            columns: ["master_category_id"]
            isOneToOne: false
            referencedRelation: "master_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_size_guide_id_fkey"
            columns: ["size_guide_id"]
            isOneToOne: false
            referencedRelation: "size_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      product_level2_categories: {
        Row: {
          created_at: string
          id: string
          product_id: string
          subcategory_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          subcategory_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_level2_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_level2_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_sales_status"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_level2_categories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_level3_categories: {
        Row: {
          created_at: string
          id: string
          product_id: string
          sub_subcategory_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          sub_subcategory_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          sub_subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_level3_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_level3_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_sales_status"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_level3_categories_sub_subcategory_id_fkey"
            columns: ["sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_level4_categories: {
        Row: {
          created_at: string
          id: string
          product_id: string
          sub_sub_subcategory_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          sub_sub_subcategory_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          sub_sub_subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_level4_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_level4_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_sales_status"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_level4_categories_sub_sub_subcategory_id_fkey"
            columns: ["sub_sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_sub_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sub_sub_subcategories: {
        Row: {
          created_at: string
          description: string | null
          grading_guide_id: string | null
          id: string
          is_active: boolean | null
          name: string
          show_in_mega_menu: boolean | null
          size_guide_id: string | null
          slug: string
          sub_subcategory_id: string
          synonyms: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          grading_guide_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          show_in_mega_menu?: boolean | null
          size_guide_id?: string | null
          slug: string
          sub_subcategory_id: string
          synonyms?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          grading_guide_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          show_in_mega_menu?: boolean | null
          size_guide_id?: string | null
          slug?: string
          sub_subcategory_id?: string
          synonyms?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_sub_sub_subcategories_grading_guide_id_fkey"
            columns: ["grading_guide_id"]
            isOneToOne: false
            referencedRelation: "grading_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sub_sub_subcategories_size_guide_id_fkey"
            columns: ["size_guide_id"]
            isOneToOne: false
            referencedRelation: "size_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sub_sub_subcategories_sub_subcategory_id_fkey"
            columns: ["sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sub_sub_subcategories_sub_subcategory_id_fkey1"
            columns: ["sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sub_subcategories: {
        Row: {
          created_at: string
          description: string | null
          grading_guide_id: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          show_in_category_grid: boolean | null
          show_in_mega_menu: boolean | null
          size_guide_id: string | null
          slug: string
          subcategory_id: string
          synonyms: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          grading_guide_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          show_in_category_grid?: boolean | null
          show_in_mega_menu?: boolean | null
          size_guide_id?: string | null
          slug: string
          subcategory_id: string
          synonyms?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          grading_guide_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          show_in_category_grid?: boolean | null
          show_in_mega_menu?: boolean | null
          size_guide_id?: string | null
          slug?: string
          subcategory_id?: string
          synonyms?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_sub_subcategories_grading_guide_id_fkey"
            columns: ["grading_guide_id"]
            isOneToOne: false
            referencedRelation: "grading_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sub_subcategories_size_guide_id_fkey"
            columns: ["size_guide_id"]
            isOneToOne: false
            referencedRelation: "size_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sub_subcategories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_subcategories: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          grading_guide_id: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          show_in_mega_menu: boolean | null
          size_guide_id: string | null
          slug: string
          synonyms: string[] | null
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          grading_guide_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          show_in_mega_menu?: boolean | null
          size_guide_id?: string | null
          slug: string
          synonyms?: string[] | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          grading_guide_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          show_in_mega_menu?: boolean | null
          size_guide_id?: string | null
          slug?: string
          synonyms?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_subcategories_category_id_fkey1"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_subcategories_grading_guide_id_fkey"
            columns: ["grading_guide_id"]
            isOneToOne: false
            referencedRelation: "grading_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_subcategories_size_guide_id_fkey"
            columns: ["size_guide_id"]
            isOneToOne: false
            referencedRelation: "size_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tag_links: {
        Row: {
          created_at: string
          id: string
          product_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tag_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tag_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_sales_status"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_tag_links_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "product_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          category_id: string | null
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          expo_push_token: string | null
          full_name: string | null
          id: string
          is_blocked: boolean | null
          preferred_currency: string | null
          updated_at: string
          user_id: string
          user_type: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          expo_push_token?: string | null
          full_name?: string | null
          id?: string
          is_blocked?: boolean | null
          preferred_currency?: string | null
          updated_at?: string
          user_id: string
          user_type?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          expo_push_token?: string | null
          full_name?: string | null
          id?: string
          is_blocked?: boolean | null
          preferred_currency?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string | null
          username?: string | null
        }
        Relationships: []
      }
      prohibited_words: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          updated_at: string
          word: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          word: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          word?: string
        }
        Relationships: []
      }
      promo_message: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_replies: {
        Row: {
          created_at: string
          id: string
          reply_text: string
          review_id: string
          seller_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          reply_text: string
          review_id: string
          seller_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          reply_text?: string
          review_id?: string
          seller_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          buyer_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          seller_id: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          seller_id: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          seller_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string
          first_name: string
          id: string
          is_default: boolean | null
          label: string | null
          last_name: string
          phone: string
          postal_code: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string
          created_at?: string
          first_name: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          last_name: string
          phone: string
          postal_code: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string
          first_name?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          last_name?: string
          phone?: string
          postal_code?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_show_products: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_name: string
          product_price: number
          quantity: number
          show_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          product_price: number
          quantity?: number
          show_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          product_price?: number
          quantity?: number
          show_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      seller_fees: {
        Row: {
          created_at: string
          fee_type: string
          id: string
          percentage: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          fee_type: string
          id?: string
          percentage?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          fee_type?: string
          id?: string
          percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      seller_profiles: {
        Row: {
          business_license: string | null
          business_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          display_name_format: string | null
          id: string
          is_suspended: boolean | null
          return_address_line1: string | null
          return_address_line2: string | null
          return_city: string | null
          return_country: string | null
          return_policy: string | null
          return_postal_code: string | null
          return_state: string | null
          shipping_policy: string | null
          shop_description: string | null
          shop_logo_url: string | null
          shop_name: string | null
          shop_tagline: string | null
          shop_type: string | null
          suspended_at: string | null
          suspension_reason: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_license?: string | null
          business_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          display_name_format?: string | null
          id?: string
          is_suspended?: boolean | null
          return_address_line1?: string | null
          return_address_line2?: string | null
          return_city?: string | null
          return_country?: string | null
          return_policy?: string | null
          return_postal_code?: string | null
          return_state?: string | null
          shipping_policy?: string | null
          shop_description?: string | null
          shop_logo_url?: string | null
          shop_name?: string | null
          shop_tagline?: string | null
          shop_type?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_license?: string | null
          business_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          display_name_format?: string | null
          id?: string
          is_suspended?: boolean | null
          return_address_line1?: string | null
          return_address_line2?: string | null
          return_city?: string | null
          return_country?: string | null
          return_policy?: string | null
          return_postal_code?: string | null
          return_state?: string | null
          shipping_policy?: string | null
          shop_description?: string | null
          shop_logo_url?: string | null
          shop_name?: string | null
          shop_tagline?: string | null
          shop_type?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_registrations: {
        Row: {
          categories: string[]
          created_at: string
          email: string
          id: string
          selling_methods: string[]
          shop_name: string | null
        }
        Insert: {
          categories?: string[]
          created_at?: string
          email: string
          id?: string
          selling_methods?: string[]
          shop_name?: string | null
        }
        Update: {
          categories?: string[]
          created_at?: string
          email?: string
          id?: string
          selling_methods?: string[]
          shop_name?: string | null
        }
        Relationships: []
      }
      shared_wishlists: {
        Row: {
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          name: string | null
          share_token: string
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          share_token: string
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          share_token?: string
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      shipping_bands: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          max_weight: number
          min_weight: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          max_weight: number
          min_weight: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          max_weight?: number
          min_weight?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      shipping_labels: {
        Row: {
          barcode_base64: string | null
          created_at: string
          generated_at: string
          id: string
          label_base64: string | null
          label_data: Json | null
          label_type: string
          label_uri: string | null
          order_id: string
          qr_code_base64: string | null
          qr_code_uri: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          barcode_base64?: string | null
          created_at?: string
          generated_at?: string
          id?: string
          label_base64?: string | null
          label_data?: Json | null
          label_type: string
          label_uri?: string | null
          order_id: string
          qr_code_base64?: string | null
          qr_code_uri?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          barcode_base64?: string | null
          created_at?: string
          generated_at?: string
          id?: string
          label_base64?: string | null
          label_data?: Json | null
          label_type?: string
          label_uri?: string | null
          order_id?: string
          qr_code_base64?: string | null
          qr_code_uri?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_labels_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_options: {
        Row: {
          created_at: string | null
          estimated_days_max: number | null
          estimated_days_min: number | null
          id: string
          is_active: boolean | null
          provider_id: string | null
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          id?: string
          is_active?: boolean | null
          provider_id?: string | null
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          id?: string
          is_active?: boolean | null
          provider_id?: string | null
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_options_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "shipping_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_options_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_info_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "shipping_options_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      shipping_provider_prices: {
        Row: {
          band_id: string | null
          band_name: string | null
          created_at: string | null
          currency: string
          id: string
          max_weight: number | null
          min_weight: number | null
          price: number
          provider_id: string
          updated_at: string | null
        }
        Insert: {
          band_id?: string | null
          band_name?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          max_weight?: number | null
          min_weight?: number | null
          price?: number
          provider_id: string
          updated_at?: string | null
        }
        Update: {
          band_id?: string | null
          band_name?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          max_weight?: number | null
          min_weight?: number | null
          price?: number
          provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_provider_prices_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "shipping_bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_provider_prices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "shipping_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_providers: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      shop_banners: {
        Row: {
          button_bg_color: string | null
          button_link: string | null
          button_text: string | null
          button_text_color: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string
          is_active: boolean | null
          rotation_interval: number | null
          title: string
          updated_at: string
        }
        Insert: {
          button_bg_color?: string | null
          button_link?: string | null
          button_text?: string | null
          button_text_color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean | null
          rotation_interval?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          button_bg_color?: string | null
          button_link?: string | null
          button_text?: string | null
          button_text_color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean | null
          rotation_interval?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      shop_brand_section: {
        Row: {
          brand_link: string
          brand_name: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          brand_link: string
          brand_name: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          brand_link?: string
          brand_name?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      shop_hero_images: {
        Row: {
          button_text: string
          created_at: string
          display_order: number
          id: string
          image_url: string
          link: string
          title: string | null
          updated_at: string
        }
        Insert: {
          button_text?: string
          created_at?: string
          display_order: number
          id?: string
          image_url: string
          link?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          button_text?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          link?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shop_section_products: {
        Row: {
          created_at: string
          display_order: number
          id: string
          product_id: string
          shop_section_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          product_id: string
          shop_section_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          product_id?: string
          shop_section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_section_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_section_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_sales_status"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "shop_section_products_shop_section_id_fkey"
            columns: ["shop_section_id"]
            isOneToOne: false
            referencedRelation: "shop_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_sections: {
        Row: {
          category_id: string | null
          created_at: string
          custom_link: string | null
          display_order: number
          id: string
          image_path: string | null
          image_url: string
          is_active: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          custom_link?: string | null
          display_order?: number
          id?: string
          image_path?: string | null
          image_url: string
          is_active?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          custom_link?: string | null
          display_order?: number
          id?: string
          image_path?: string | null
          image_url?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_sections_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_video_config: {
        Row: {
          created_at: string | null
          cta_bg_color: string | null
          cta_link: string | null
          cta_text: string | null
          cta_text_color: string | null
          id: string
          is_active: boolean | null
          phone_mockup_url: string | null
          subtitle: string | null
          title: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          cta_bg_color?: string | null
          cta_link?: string | null
          cta_text?: string | null
          cta_text_color?: string | null
          id?: string
          is_active?: boolean | null
          phone_mockup_url?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          cta_bg_color?: string | null
          cta_link?: string | null
          cta_text?: string | null
          cta_text_color?: string | null
          id?: string
          is_active?: boolean | null
          phone_mockup_url?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      shop_video_features: {
        Row: {
          config_id: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link: string | null
          text: string | null
          updated_at: string | null
        }
        Insert: {
          config_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link?: string | null
          text?: string | null
          updated_at?: string | null
        }
        Update: {
          config_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link?: string | null
          text?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_video_features_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "shop_video_config"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_video_section: {
        Row: {
          button_bg_color: string | null
          button_link: string | null
          button_text: string | null
          button_text_color: string | null
          created_at: string | null
          feature_1_image: string | null
          feature_1_link: string | null
          feature_1_text: string | null
          feature_2_image: string | null
          feature_2_link: string | null
          feature_2_text: string | null
          feature_3_image: string | null
          feature_3_link: string | null
          feature_3_text: string | null
          feature_4_image: string | null
          feature_4_link: string | null
          feature_4_text: string | null
          feature_5_image: string | null
          feature_5_link: string | null
          feature_5_text: string | null
          feature_6_image: string | null
          feature_6_link: string | null
          feature_6_text: string | null
          id: string
          is_active: boolean | null
          phone_mockup_url: string | null
          subtitle: string | null
          title: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          button_bg_color?: string | null
          button_link?: string | null
          button_text?: string | null
          button_text_color?: string | null
          created_at?: string | null
          feature_1_image?: string | null
          feature_1_link?: string | null
          feature_1_text?: string | null
          feature_2_image?: string | null
          feature_2_link?: string | null
          feature_2_text?: string | null
          feature_3_image?: string | null
          feature_3_link?: string | null
          feature_3_text?: string | null
          feature_4_image?: string | null
          feature_4_link?: string | null
          feature_4_text?: string | null
          feature_5_image?: string | null
          feature_5_link?: string | null
          feature_5_text?: string | null
          feature_6_image?: string | null
          feature_6_link?: string | null
          feature_6_text?: string | null
          id?: string
          is_active?: boolean | null
          phone_mockup_url?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          button_bg_color?: string | null
          button_link?: string | null
          button_text?: string | null
          button_text_color?: string | null
          created_at?: string | null
          feature_1_image?: string | null
          feature_1_link?: string | null
          feature_1_text?: string | null
          feature_2_image?: string | null
          feature_2_link?: string | null
          feature_2_text?: string | null
          feature_3_image?: string | null
          feature_3_link?: string | null
          feature_3_text?: string | null
          feature_4_image?: string | null
          feature_4_link?: string | null
          feature_4_text?: string | null
          feature_5_image?: string | null
          feature_5_link?: string | null
          feature_5_text?: string | null
          feature_6_image?: string | null
          feature_6_link?: string | null
          feature_6_text?: string | null
          id?: string
          is_active?: boolean | null
          phone_mockup_url?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          created_at: string
          id: string
          instagram_post_1: string | null
          instagram_post_2: string | null
          instagram_post_3: string | null
          shop_feature_1_button_link: string | null
          shop_feature_1_button_text: string | null
          shop_feature_1_image: string | null
          shop_feature_1_link: string | null
          shop_feature_1_text: string | null
          shop_feature_2_button_link: string | null
          shop_feature_2_button_text: string | null
          shop_feature_2_image: string | null
          shop_feature_2_link: string | null
          shop_feature_2_text: string | null
          shop_feature_3_button_link: string | null
          shop_feature_3_button_text: string | null
          shop_feature_3_image: string | null
          shop_feature_3_link: string | null
          shop_feature_3_text: string | null
          shop_feature_4_button_link: string | null
          shop_feature_4_button_text: string | null
          shop_feature_4_image: string | null
          shop_feature_4_link: string | null
          shop_feature_4_text: string | null
          shop_features_description: string | null
          shop_features_title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instagram_post_1?: string | null
          instagram_post_2?: string | null
          instagram_post_3?: string | null
          shop_feature_1_button_link?: string | null
          shop_feature_1_button_text?: string | null
          shop_feature_1_image?: string | null
          shop_feature_1_link?: string | null
          shop_feature_1_text?: string | null
          shop_feature_2_button_link?: string | null
          shop_feature_2_button_text?: string | null
          shop_feature_2_image?: string | null
          shop_feature_2_link?: string | null
          shop_feature_2_text?: string | null
          shop_feature_3_button_link?: string | null
          shop_feature_3_button_text?: string | null
          shop_feature_3_image?: string | null
          shop_feature_3_link?: string | null
          shop_feature_3_text?: string | null
          shop_feature_4_button_link?: string | null
          shop_feature_4_button_text?: string | null
          shop_feature_4_image?: string | null
          shop_feature_4_link?: string | null
          shop_feature_4_text?: string | null
          shop_features_description?: string | null
          shop_features_title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instagram_post_1?: string | null
          instagram_post_2?: string | null
          instagram_post_3?: string | null
          shop_feature_1_button_link?: string | null
          shop_feature_1_button_text?: string | null
          shop_feature_1_image?: string | null
          shop_feature_1_link?: string | null
          shop_feature_1_text?: string | null
          shop_feature_2_button_link?: string | null
          shop_feature_2_button_text?: string | null
          shop_feature_2_image?: string | null
          shop_feature_2_link?: string | null
          shop_feature_2_text?: string | null
          shop_feature_3_button_link?: string | null
          shop_feature_3_button_text?: string | null
          shop_feature_3_image?: string | null
          shop_feature_3_link?: string | null
          shop_feature_3_text?: string | null
          shop_feature_4_button_link?: string | null
          shop_feature_4_button_text?: string | null
          shop_feature_4_image?: string | null
          shop_feature_4_link?: string | null
          shop_feature_4_text?: string | null
          shop_features_description?: string | null
          shop_features_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      size_guide_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          size_guide_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          size_guide_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          size_guide_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "size_guide_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "size_guide_categories_size_guide_id_fkey"
            columns: ["size_guide_id"]
            isOneToOne: false
            referencedRelation: "size_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      size_guide_sub_sub_subcategories: {
        Row: {
          created_at: string
          id: string
          size_guide_id: string
          sub_sub_subcategory_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          size_guide_id: string
          sub_sub_subcategory_id: string
        }
        Update: {
          created_at?: string
          id?: string
          size_guide_id?: string
          sub_sub_subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "size_guide_sub_sub_subcategories_size_guide_id_fkey"
            columns: ["size_guide_id"]
            isOneToOne: false
            referencedRelation: "size_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "size_guide_sub_sub_subcategories_sub_sub_subcategory_id_fkey"
            columns: ["sub_sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_sub_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      size_guide_sub_subcategories: {
        Row: {
          created_at: string
          id: string
          size_guide_id: string
          sub_subcategory_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          size_guide_id: string
          sub_subcategory_id: string
        }
        Update: {
          created_at?: string
          id?: string
          size_guide_id?: string
          sub_subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "size_guide_sub_subcategories_size_guide_id_fkey"
            columns: ["size_guide_id"]
            isOneToOne: false
            referencedRelation: "size_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "size_guide_sub_subcategories_sub_subcategory_id_fkey"
            columns: ["sub_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_sub_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      size_guide_subcategories: {
        Row: {
          created_at: string
          id: string
          size_guide_id: string
          subcategory_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          size_guide_id: string
          subcategory_id: string
        }
        Update: {
          created_at?: string
          id?: string
          size_guide_id?: string
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "size_guide_subcategories_size_guide_id_fkey"
            columns: ["size_guide_id"]
            isOneToOne: false
            referencedRelation: "size_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "size_guide_subcategories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      size_guides: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      stream_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      streams: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration: string | null
          end_time: string | null
          id: string
          seller_id: string
          start_time: string
          status: string
          thumbnail: string | null
          timezone: string | null
          title: string
          updated_at: string
          viewer_count: number
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          duration?: string | null
          end_time?: string | null
          id?: string
          seller_id: string
          start_time: string
          status?: string
          thumbnail?: string | null
          timezone?: string | null
          title: string
          updated_at?: string
          viewer_count?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration?: string | null
          end_time?: string | null
          id?: string
          seller_id?: string
          start_time?: string
          status?: string
          thumbnail?: string | null
          timezone?: string | null
          title?: string
          updated_at?: string
          viewer_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "streams_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_info_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "streams_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "streams_seller_id_fkey1"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      stripe_connected_accounts: {
        Row: {
          charges_enabled: boolean
          created_at: string
          details_submitted: boolean
          id: string
          onboarding_complete: boolean
          payouts_enabled: boolean
          seller_id: string
          stripe_account_id: string
          updated_at: string
        }
        Insert: {
          charges_enabled?: boolean
          created_at?: string
          details_submitted?: boolean
          id?: string
          onboarding_complete?: boolean
          payouts_enabled?: boolean
          seller_id: string
          stripe_account_id: string
          updated_at?: string
        }
        Update: {
          charges_enabled?: boolean
          created_at?: string
          details_submitted?: boolean
          id?: string
          onboarding_complete?: boolean
          payouts_enabled?: boolean
          seller_id?: string
          stripe_account_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_payouts: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          requested_at: string
          seller_id: string
          status: string
          stripe_payout_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          requested_at?: string
          seller_id: string
          status?: string
          stripe_payout_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          requested_at?: string
          seller_id?: string
          status?: string
          stripe_payout_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stripe_transactions: {
        Row: {
          buyer_id: string
          created_at: string
          currency: string
          id: string
          order_id: string | null
          platform_fee: number
          seller_id: string
          seller_net: number
          status: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          currency?: string
          id?: string
          order_id?: string | null
          platform_fee: number
          seller_id: string
          seller_net: number
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          currency?: string
          id?: string
          order_id?: string | null
          platform_fee?: number
          seller_id?: string
          seller_net?: number
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      support_contact_cards: {
        Row: {
          created_at: string | null
          description: string
          display_order: number | null
          email: string | null
          icon: string
          id: string
          is_active: boolean | null
          link: string | null
          phone: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          display_order?: number | null
          email?: string | null
          icon: string
          id?: string
          is_active?: boolean | null
          link?: string | null
          phone?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          display_order?: number | null
          email?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          link?: string | null
          phone?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      support_faqs: {
        Row: {
          answer: string
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      support_page_settings: {
        Row: {
          id: string
          meta_description: string | null
          meta_title: string | null
          page_description: string | null
          page_title: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          page_description?: string | null
          page_title?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          page_description?: string | null
          page_title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_seller_admins: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          is_active: boolean | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_seller_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          followed_user_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followed_user_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followed_user_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      user_notification_preferences: {
        Row: {
          created_at: string
          id: string
          message_notifications: boolean
          offer_updates: boolean
          order_updates: boolean
          promotional_emails: boolean
          seller_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_notifications?: boolean
          offer_updates?: boolean
          order_updates?: boolean
          promotional_emails?: boolean
          seller_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_notifications?: boolean
          offer_updates?: boolean
          order_updates?: boolean
          promotional_emails?: boolean
          seller_updates?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "product_sales_status"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "wishlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      product_sales_status: {
        Row: {
          has_sales: boolean | null
          product_id: string | null
          seller_id: string | null
        }
        Relationships: []
      }
      seller_info_view: {
        Row: {
          avatar_url: string | null
          display_name_format: string | null
          full_name: string | null
          shop_description: string | null
          shop_logo_url: string | null
          shop_name: string | null
          shop_tagline: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_webp_format: { Args: { image_url: string }; Returns: boolean }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_products_missing_attribute: {
        Args: {
          p_archived?: boolean
          p_attribute_id: string
          p_seller_id?: string
        }
        Returns: {
          product_id: string
        }[]
      }
      get_public_seller_info: {
        Args: { seller_user_id: string }
        Returns: {
          business_name: string
          created_at: string
          id: string
          return_policy: string
          shipping_policy: string
          shop_description: string
          shop_logo_url: string
          shop_name: string
          updated_at: string
          user_id: string
        }[]
      }
      get_seller_info: {
        Args: { seller_uuid: string }
        Returns: {
          price: string
          seller_avatar: string
          seller_name: string
        }[]
      }
      get_user_id_by_email: { Args: { user_email: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_system_seller_admin: { Args: { _user_id: string }; Returns: boolean }
      rebuild_category_search_index: { Args: never; Returns: undefined }
      release_cleared_funds: { Args: never; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sync_system_seller_admins: {
        Args: never
        Returns: {
          already_synced: number
          pending_signup: number
          synced_count: number
        }[]
      }
    }
    Enums: {
      app_role: "user" | "admin" | "super_admin"
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
      app_role: ["user", "admin", "super_admin"],
    },
  },
} as const
