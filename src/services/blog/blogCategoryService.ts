// Blog Category Service
// Centralized data access for blog category operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Fetch all active blog categories
export async function fetchActiveBlogCategories(): Promise<Result<BlogCategory[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return { data: (data || []) as BlogCategory[], error: null };
  }, 'fetchActiveBlogCategories');
}

// Fetch all blog categories (including inactive)
export async function fetchAllBlogCategories(): Promise<Result<BlogCategory[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('blog_categories').select('*').order('display_order');

    if (error) throw error;
    return { data: (data || []) as BlogCategory[], error: null };
  }, 'fetchAllBlogCategories');
}

// Fetch blog category by slug
export async function fetchBlogCategoryBySlug(slug: string): Promise<Result<BlogCategory | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return { data: (data as BlogCategory) || null, error: null };
  }, 'fetchBlogCategoryBySlug');
}

// Create blog category
export interface CreateBlogCategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  is_active?: boolean;
  display_order?: number;
}

export async function createBlogCategory(input: CreateBlogCategoryInput): Promise<Result<BlogCategory>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from('blog_categories').insert(input).select().single();

    if (error) throw error;
    return { data: data as BlogCategory, error: null };
  }, 'createBlogCategory');
}

// Update blog category
export interface UpdateBlogCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
  display_order?: number;
}

export async function updateBlogCategory(
  categoryId: string,
  input: UpdateBlogCategoryInput,
): Promise<Result<BlogCategory>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from('blog_categories').update(input).eq('id', categoryId).select().single();

    if (error) throw error;
    return { data: data as BlogCategory, error: null };
  }, 'updateBlogCategory');
}

// Delete blog category
export async function deleteBlogCategory(categoryId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('blog_categories').delete().eq('id', categoryId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteBlogCategory');
}
