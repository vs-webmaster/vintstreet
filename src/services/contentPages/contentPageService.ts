// Content Page Service
// Centralized data access for content page operations

import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/services/storage';
import type { Result } from '@/types/api';
import { success, failure, isFailure } from '@/types/api';
import { normalizeError, logError } from '@/lib/errors';

export interface ContentPage {
  id: string;
  title: string;
  slug: string;
  meta_description?: string | null;
  is_published: boolean;
  page_type?: 'content' | 'product';
}

export interface PageSection {
  id?: string;
  page_id: string;
  section_type: string;
  content: unknown;
  display_order: number;
}

// Fetch content page by ID
export async function fetchContentPage(
  pageId: string,
): Promise<Result<{ page: ContentPage; sections: PageSection[] }>> {
  try {
    const { data: page, error: pageError } = await supabase.from('content_pages').select('*').eq('id', pageId).single();

    if (pageError) {
      logError(pageError, 'fetchContentPage');
      return failure(normalizeError(pageError));
    }

    const { data: pageSections, error: sectionsError } = await supabase
      .from('page_sections')
      .select('*')
      .eq('page_id', pageId)
      .order('display_order');

    if (sectionsError) {
      logError(sectionsError, 'fetchContentPage - sections');
      return failure(normalizeError(sectionsError));
    }

    return success({
      page: page as ContentPage,
      sections: (pageSections || []) as PageSection[],
    });
  } catch (error) {
    logError(error, 'fetchContentPage');
    return failure(normalizeError(error));
  }
}

// Update content page
export async function updateContentPage(
  pageId: string,
  data: {
    title: string;
    slug: string;
    meta_description?: string | null;
    is_published: boolean;
  },
): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('content_pages').update(data).eq('id', pageId);

    if (error) {
      logError(error, 'updateContentPage');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'updateContentPage');
    return failure(normalizeError(error));
  }
}

// Save page sections
export async function savePageSections(
  pageId: string,
  sections: Omit<PageSection, 'id' | 'page_id'>[],
): Promise<Result<boolean>> {
  try {
    // Delete existing sections
    const { error: deleteError } = await supabase.from('page_sections').delete().eq('page_id', pageId);

    if (deleteError) {
      logError(deleteError, 'savePageSections - delete');
      return failure(normalizeError(deleteError));
    }

    // Insert new sections
    if (sections.length > 0) {
      const sectionsToInsert = sections.map((section, index) => ({
        page_id: pageId,
        section_type: section.section_type,
        content: section.content,
        display_order: index,
      }));

      const { error: insertError } = await supabase.from('page_sections').insert(sectionsToInsert);

      if (insertError) {
        logError(insertError, 'savePageSections - insert');
        return failure(normalizeError(insertError));
      }
    }

    return success(true);
  } catch (error) {
    logError(error, 'savePageSections');
    return failure(normalizeError(error));
  }
}

// Upload image to storage
export async function uploadContentImage(file: File, path: string): Promise<Result<string>> {
  try {
    const result = await uploadFile(file, {
      bucket: 'product-images',
      pathPrefix: path,
    });

    if (isFailure(result)) {
      throw result.error;
    }

    return success(result.data.url);
  } catch (error) {
    logError(error, 'uploadContentImage');
    return failure(normalizeError(error));
  }
}
