// Content Service
// Centralized data access for content page operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

// Fetch content page products
export async function fetchContentPageProducts(
  pageId: string,
): Promise<Result<Array<{ product_id: string; display_order: number }>>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('content_page_products')
      .select('product_id, display_order')
      .eq('page_id', pageId)
      .order('display_order');

    if (error) throw error;
<<<<<<< HEAD
    return { data: (data || []) as unknown, error: null };
=======
    return { data: (data || []) as Array<{ product_id: string; display_order: number }>, error: null };
>>>>>>> a275e0e6fd466fe0415be180aa3be0c399054c93
  }, 'fetchContentPageProducts');
}

// Add product to content page
export async function addProductToContentPage(
  pageId: string,
  productId: string,
  displayOrder: number,
): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('content_page_products').insert({
      page_id: pageId,
      product_id: productId,
      display_order: displayOrder,
    });

    if (error) throw error;
    return { data: true, error: null };
  }, 'addProductToContentPage');
}

// Remove product from content page
export async function removeProductFromContentPage(pageId: string, productId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase
      .from('content_page_products')
      .delete()
      .eq('page_id', pageId)
      .eq('product_id', productId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'removeProductFromContentPage');
}

// Update content page product display order
export async function updateContentPageProductOrder(
  pageId: string,
  productId: string,
  displayOrder: number,
): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase
      .from('content_page_products')
      .update({ display_order: displayOrder })
      .eq('page_id', pageId)
      .eq('product_id', productId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'updateContentPageProductOrder');
}

// Footer interfaces
export interface FooterColumn {
  id: string;
  title: string;
  display_order: number;
  is_active: boolean;
}

export interface FooterLink {
  id: string;
  column_id: string;
  label: string;
  url: string;
  display_order: number;
  is_active: boolean;
}

// Fetch footer columns
export async function fetchFooterColumns(): Promise<Result<FooterColumn[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('footer_columns').select('*').order('display_order');

    if (error) throw error;
    return { data: (data || []) as FooterColumn[], error: null };
  }, 'fetchFooterColumns');
}

// Fetch footer links
export async function fetchFooterLinks(): Promise<Result<FooterLink[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('footer_links').select('*').order('display_order');

    if (error) throw error;
    return { data: (data || []) as FooterLink[], error: null };
  }, 'fetchFooterLinks');
}

// Content Page interfaces
export interface ContentPage {
  id: string;
  title: string;
  slug: string;
  content?: string | null;
  page_type?: string | null;
  meta_description?: string | null;
  is_published: boolean;
  created_at: string;
  updated_at?: string;
}

// Fetch all content pages
export async function fetchAllContentPages(): Promise<Result<ContentPage[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('content_pages').select('*').order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as ContentPage[], error: null };
  }, 'fetchAllContentPages');
}

// Fetch content page by slug
export async function fetchContentPageBySlug(slug: string): Promise<Result<ContentPage | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('content_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error) throw error;
    return { data: (data as ContentPage) || null, error: null };
  }, 'fetchContentPageBySlug');
}

// Fetch page sections
<<<<<<< HEAD
export async function fetchPageSections(pageId: string): Promise<Result<unknown[]>> {
=======
export async function fetchPageSections(pageId: string): Promise<Result<PageSection[]>> {
>>>>>>> a275e0e6fd466fe0415be180aa3be0c399054c93
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('page_sections')
      .select('*')
      .eq('page_id', pageId)
      .order('display_order');

    if (error) throw error;
<<<<<<< HEAD
    return { data: (data || []) as unknown[], error: null };
=======
    return { data: (data || []) as PageSection[], error: null };
>>>>>>> a275e0e6fd466fe0415be180aa3be0c399054c93
  }, 'fetchPageSections');
}

// Delete content page
export async function deleteContentPage(pageId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('content_pages').delete().eq('id', pageId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteContentPage');
}

// Create content page
export async function createContentPage(input: {
  title: string;
  slug: string;
  meta_description?: string | null;
  page_type: 'content' | 'product';
}): Promise<Result<ContentPage>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('content_pages')
      .insert({
        title: input.title,
        slug: input.slug,
        meta_description: input.meta_description || null,
        page_type: input.page_type,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as ContentPage, error: null };
  }, 'createContentPage');
}

// Update content page publish status
export async function updateContentPagePublishStatus(pageId: string, isPublished: boolean): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('content_pages').update({ is_published: isPublished }).eq('id', pageId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'updateContentPagePublishStatus');
}

// Fetch content pages with optional filters
export interface FetchContentPagesOptions {
  isPublished?: boolean;
}

export async function fetchContentPages(options: FetchContentPagesOptions = {}): Promise<Result<ContentPage[]>> {
  return withErrorHandling(async () => {
    let query = supabase.from('content_pages').select('*').order('title');

    if (options.isPublished !== undefined) {
      query = query.eq('is_published', options.isPublished);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: (data || []) as ContentPage[], error: null };
  }, 'fetchContentPages');
}
