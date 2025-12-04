// Instagram Service
// Centralized data access for Instagram posts operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface InstagramPost {
  id: string;
  embed_code: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Fetch all Instagram posts (admin)
export async function fetchInstagramPosts(): Promise<Result<InstagramPost[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('instagram_posts')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as InstagramPost[], error: null };
  }, 'fetchInstagramPosts');
}

// Fetch active Instagram posts (public)
export async function fetchActiveInstagramPosts(): Promise<Result<InstagramPost[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('instagram_posts')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as InstagramPost[], error: null };
  }, 'fetchActiveInstagramPosts');
}

// Replace all Instagram posts (delete all and insert new ones)
export async function replaceInstagramPosts(
  posts: Array<{ embed_code: string; display_order: number; is_active: boolean }>,
): Promise<Result<InstagramPost[]>> {
  return withMutation(async () => {
    // Delete all existing posts
    const { error: deleteError } = await supabase.from('instagram_posts').delete().gte('display_order', 0);

    if (deleteError) throw deleteError;

    // Insert new posts if any
    if (posts.length > 0) {
      const { data, error: insertError } = await supabase.from('instagram_posts').insert(posts).select();

      if (insertError) throw insertError;
      return { data: (data || []) as InstagramPost[], error: null };
    }

    return { data: [], error: null };
  }, 'replaceInstagramPosts');
}
