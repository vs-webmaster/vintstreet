// Blog Tags Service
// Centralized data access for blog tag operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface CreateBlogTagInput {
  name: string;
  slug?: string;
}

// Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Fetch all blog tags
export async function fetchBlogTags(): Promise<Result<BlogTag[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('blog_tags').select('*').order('name');

    if (error) throw error;
    return { data: (data || []) as BlogTag[], error: null };
  }, 'fetchBlogTags');
}

// Create a new blog tag
export async function createBlogTag(input: CreateBlogTagInput): Promise<Result<BlogTag>> {
  return withMutation(async () => {
    const slug = input.slug || generateSlug(input.name);

    const { data, error } = await supabase.from('blog_tags').insert({ name: input.name, slug }).select().single();

    if (error) throw error;
    return { data: data as BlogTag, error: null };
  }, 'createBlogTag');
}

// Update a blog tag
export async function updateBlogTag(tagId: string, input: CreateBlogTagInput): Promise<Result<BlogTag>> {
  return withMutation(async () => {
    const slug = input.slug || generateSlug(input.name);

    const { data, error } = await supabase
      .from('blog_tags')
      .update({ name: input.name, slug })
      .eq('id', tagId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as BlogTag, error: null };
  }, 'updateBlogTag');
}

// Delete a blog tag
export async function deleteBlogTag(tagId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('blog_tags').delete().eq('id', tagId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteBlogTag');
}
