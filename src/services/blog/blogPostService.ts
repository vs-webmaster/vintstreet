// Blog Post Service
// Centralized data access for blog post-related operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  author_id?: string | null;
  author_name?: string | null;
  publish_date: string;
  featured_image?: string | null;
  excerpt?: string | null;
  category_id?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  reading_time?: number | null;
  hero_banner?: string | null;
  cta_link?: string | null;
  cta_label?: string | null;
  visibility: 'draft' | 'scheduled' | 'published';
  scheduled_publish_at?: string | null;
  author_bio?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface BlogPostListItem {
  id: string;
  title: string;
  slug: string;
  visibility: 'draft' | 'scheduled' | 'published';
}

export interface BlogPostWithRelations {
  id: string;
  title: string;
  slug: string;
  author_id?: string | null;
  author_name?: string | null;
  publish_date: string;
  featured_image?: string | null;
  excerpt?: string | null;
  category_id?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  reading_time?: number | null;
  hero_banner?: string | null;
  cta_link?: string | null;
  cta_label?: string | null;
  visibility: 'draft' | 'scheduled' | 'published';
  scheduled_publish_at?: string | null;
  author_bio?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  blog_categories?: {
    name: string;
  } | null;
  blog_post_tags?: Array<{
    blog_tags: {
      name: string;
    };
  }>;
}

export interface SearchBlogPostsOptions {
  excludePostId?: string;
  searchQuery?: string;
  limit?: number;
  visibility?: 'draft' | 'scheduled' | 'published';
}

// Search blog posts
export async function searchBlogPosts(options: SearchBlogPostsOptions = {}): Promise<Result<BlogPostListItem[]>> {
  return withErrorHandling(async () => {
    let query = supabase
      .from('blog_posts')
      .select('id, title, slug, visibility')
      .order('created_at', { ascending: false });

    if (options.excludePostId) {
      query = query.neq('id', options.excludePostId);
    }

    if (options.searchQuery) {
      query = query.ilike('title', `%${options.searchQuery}%`);
    }

    if (options.visibility) {
      query = query.eq('visibility', options.visibility);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: (data || []) as BlogPostListItem[], error: null };
  }, 'searchBlogPosts');
}

// Fetch blog posts by IDs
export async function fetchBlogPostsByIds(postIds: string[]): Promise<Result<BlogPostListItem[]>> {
  return withErrorHandling(async () => {
    if (postIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase.from('blog_posts').select('id, title, slug, visibility').in('id', postIds);

    if (error) throw error;
    return { data: (data || []) as BlogPostListItem[], error: null };
  }, 'fetchBlogPostsByIds');
}

// Fetch all blog posts with categories and tags for admin
export async function fetchAllBlogPostsForAdmin(): Promise<Result<BlogPostWithRelations[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(
        `
        *,
        blog_categories(name),
        blog_post_tags(
          blog_tags(name)
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as BlogPostWithRelations[], error: null };
  }, 'fetchAllBlogPostsForAdmin');
}

// Delete blog post
export async function deleteBlogPost(postId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('blog_posts').delete().eq('id', postId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteBlogPost');
}

// Fetch published blog posts with optional category filter
export interface BlogPostWithCategory extends BlogPost {
  blog_categories?: {
    name: string;
    slug: string;
  } | null;
}

export async function fetchPublishedBlogPosts(categorySlug?: string): Promise<Result<BlogPostWithCategory[]>> {
  return withErrorHandling(async () => {
    let query = supabase
      .from('blog_posts')
      .select('*, blog_categories!inner(name, slug)')
      .eq('visibility', 'published');

    if (categorySlug) {
      query = query.eq('blog_categories.slug', categorySlug);
    }

    const { data, error } = await query.order('publish_date', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as BlogPostWithCategory[], error: null };
  }, 'fetchPublishedBlogPosts');
}

// Fetch blog post by ID with all relations (for editor)
export interface BlogPostForEditor extends BlogPost {
  blog_post_sections?: Array<{
    id: string;
    post_id: string;
    section_type: string;
    content: any;
    display_order: number;
  }>;
  blog_post_tags?: Array<{
    tag_id: string;
  }>;
  blog_post_products?: Array<{
    product_id: string;
  }>;
  blog_post_related_posts?: Array<{
    related_post_id: string;
  }>;
}

export async function fetchBlogPostForEditor(postId: string): Promise<Result<BlogPostForEditor | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(
        `
        *,
        blog_post_sections(*),
        blog_post_tags(tag_id),
        blog_post_products(product_id),
        blog_post_related_posts!blog_post_related_posts_post_id_fkey(related_post_id)
      `,
      )
      .eq('id', postId)
      .maybeSingle();

    if (error) throw error;
    return { data: (data as BlogPostForEditor) || null, error: null };
  }, 'fetchBlogPostForEditor');
}

// Fetch blog post by slug with all relations (for public view)
export interface BlogPostBySlug extends BlogPostWithRelations {
  blog_post_sections?: Array<{
    id: string;
    post_id: string;
    section_type: string;
    content: any;
    display_order: number;
  }>;
}

export async function fetchBlogPostBySlug(slug: string): Promise<Result<BlogPostBySlug | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(
        `
        *,
        blog_categories(name),
        blog_post_sections(*),
        blog_post_tags(blog_tags(name))
      `,
      )
      .eq('slug', slug)
      .eq('visibility', 'published')
      .maybeSingle();

    if (error) throw error;
    return { data: (data as BlogPostBySlug) || null, error: null };
  }, 'fetchBlogPostBySlug');
}

// Create or update blog post
export interface CreateOrUpdateBlogPostInput {
  title: string;
  slug: string;
  author_name?: string | null;
  publish_date: string;
  featured_image?: string | null;
  excerpt?: string | null;
  category_id?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  reading_time?: number | null;
  hero_banner?: string | null;
  cta_link?: string | null;
  cta_label?: string | null;
  visibility: 'draft' | 'scheduled' | 'published';
  author_bio?: string | null;
  created_by?: string | null;
}

export async function createBlogPost(input: CreateOrUpdateBlogPostInput): Promise<Result<BlogPost>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from('blog_posts').insert(input).select().single();

    if (error) throw error;
    return { data: data as BlogPost, error: null };
  }, 'createBlogPost');
}

export async function updateBlogPost(
  postId: string,
  input: Partial<CreateOrUpdateBlogPostInput>,
): Promise<Result<BlogPost>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from('blog_posts').update(input).eq('id', postId).select().single();

    if (error) throw error;
    return { data: data as BlogPost, error: null };
  }, 'updateBlogPost');
}

// Manage blog post sections
export interface BlogPostSection {
  post_id: string;
  section_type: string;
  content: any;
  display_order: number;
}

export async function saveBlogPostSections(
  postId: string,
  sections: Omit<BlogPostSection, 'post_id'>[],
): Promise<Result<boolean>> {
  return withMutation(async () => {
    // Delete existing sections
    const { error: deleteError } = await supabase.from('blog_post_sections').delete().eq('post_id', postId);
    if (deleteError) throw deleteError;

    // Insert new sections
    if (sections.length > 0) {
      const sectionsToInsert = sections.map((section, index) => ({
        post_id: postId,
        section_type: section.section_type,
        content: section.content,
        display_order: index,
      }));

      const { error: insertError } = await supabase.from('blog_post_sections').insert(sectionsToInsert);
      if (insertError) throw insertError;
    }

    return { data: true, error: null };
  }, 'saveBlogPostSections');
}

// Manage blog post tags
export async function saveBlogPostTags(postId: string, tagIds: string[]): Promise<Result<boolean>> {
  return withMutation(async () => {
    // Delete existing tags
    const { error: deleteError } = await supabase.from('blog_post_tags').delete().eq('post_id', postId);
    if (deleteError) throw deleteError;

    // Insert new tags
    if (tagIds.length > 0) {
      const tagsToInsert = tagIds.map((tagId) => ({
        post_id: postId,
        tag_id: tagId,
      }));

      const { error: insertError } = await supabase.from('blog_post_tags').insert(tagsToInsert);
      if (insertError) throw insertError;
    }

    return { data: true, error: null };
  }, 'saveBlogPostTags');
}

// Manage blog post products
export async function saveBlogPostProducts(postId: string, productIds: string[]): Promise<Result<boolean>> {
  return withMutation(async () => {
    // Delete existing products
    const { error: deleteError } = await supabase.from('blog_post_products').delete().eq('post_id', postId);
    if (deleteError) throw deleteError;

    // Insert new products
    if (productIds.length > 0) {
      const productsToInsert = productIds.map((productId) => ({
        post_id: postId,
        product_id: productId,
      }));

      const { error: insertError } = await supabase.from('blog_post_products').insert(productsToInsert);
      if (insertError) throw insertError;
    }

    return { data: true, error: null };
  }, 'saveBlogPostProducts');
}

// Manage blog post related posts
export async function saveBlogPostRelatedPosts(postId: string, relatedPostIds: string[]): Promise<Result<boolean>> {
  return withMutation(async () => {
    // Delete existing related posts
    const { error: deleteError } = await supabase.from('blog_post_related_posts').delete().eq('post_id', postId);
    if (deleteError) throw deleteError;

    // Insert new related posts
    if (relatedPostIds.length > 0) {
      const relatedPostsToInsert = relatedPostIds.map((relatedPostId) => ({
        post_id: postId,
        related_post_id: relatedPostId,
      }));

      const { error: insertError } = await supabase.from('blog_post_related_posts').insert(relatedPostsToInsert);
      if (insertError) throw insertError;
    }

    return { data: true, error: null };
  }, 'saveBlogPostRelatedPosts');
}
