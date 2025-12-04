// Guides Service
// Centralized data access for grading and size guides

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export type GuideType = 'grading' | 'size';
export type GuideTableName = 'grading_guides' | 'size_guides';

export interface Guide {
  id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateGuideInput {
  name: string;
  content: string;
}

export interface UpdateGuideInput {
  name?: string;
  content?: string;
}

// Fetch all guides by type
export async function fetchGuides(tableName: GuideTableName): Promise<Result<Guide[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from(tableName).select('*').order('name');

    if (error) throw error;
    return { data: (data || []) as Guide[], error: null };
  }, 'fetchGuides');
}

// Fetch a single guide by ID
export async function fetchGuideById(tableName: GuideTableName, guideId: string): Promise<Result<Guide | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from(tableName).select('*').eq('id', guideId).maybeSingle();

    if (error) throw error;
    return { data: (data as Guide) || null, error: null };
  }, 'fetchGuideById');
}

// Create a new guide
export async function createGuide(tableName: GuideTableName, input: CreateGuideInput): Promise<Result<Guide>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from(tableName).insert([input]).select().single();

    if (error) throw error;
    return { data: data as Guide, error: null };
  }, 'createGuide');
}

// Update an existing guide
export async function updateGuide(
  tableName: GuideTableName,
  guideId: string,
  input: UpdateGuideInput,
): Promise<Result<Guide>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from(tableName).update(input).eq('id', guideId).select().single();

    if (error) throw error;
    return { data: data as Guide, error: null };
  }, 'updateGuide');
}

// Delete a guide
export async function deleteGuide(tableName: GuideTableName, guideId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from(tableName).delete().eq('id', guideId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteGuide');
}

// Fetch guides by category hierarchy
export interface GuidesByCategory {
  sizeGuide: Guide | null;
  gradingGuide: Guide | null;
}

export async function fetchGuidesByCategoryHierarchy(params: {
  categoryId?: string;
  subcategoryId?: string;
  subSubcategoryId?: string;
  subSubSubcategoryId?: string;
}): Promise<Result<GuidesByCategory>> {
  return withErrorHandling(async () => {
    let sizeGuide: Guide | null = null;
    let gradingGuide: Guide | null = null;

    // Check Level 4 first
    if (params.subSubSubcategoryId) {
      const [sizeResult, gradingResult] = await Promise.all([
        supabase
          .from('size_guide_sub_sub_subcategories')
          .select('size_guides(*)')
          .eq('sub_sub_subcategory_id', params.subSubSubcategoryId)
          .limit(1)
          .maybeSingle(),
        supabase
          .from('grading_guide_sub_sub_subcategories')
          .select('grading_guides(*)')
          .eq('sub_sub_subcategory_id', params.subSubSubcategoryId)
          .limit(1)
          .maybeSingle(),
      ]);

      if (sizeResult.data?.size_guides) sizeGuide = sizeResult.data.size_guides as Guide;
      if (gradingResult.data?.grading_guides) gradingGuide = gradingResult.data.grading_guides as Guide;
    }

    // Check Level 3 if not found
    if ((!sizeGuide || !gradingGuide) && params.subSubcategoryId) {
      const [sizeResult, gradingResult] = await Promise.all([
        !sizeGuide
          ? supabase
              .from('size_guide_sub_subcategories')
              .select('size_guides(*)')
              .eq('sub_subcategory_id', params.subSubcategoryId)
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        !gradingGuide
          ? supabase
              .from('grading_guide_sub_subcategories')
              .select('grading_guides(*)')
              .eq('sub_subcategory_id', params.subSubcategoryId)
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (!sizeGuide && sizeResult.data?.size_guides) sizeGuide = sizeResult.data.size_guides as Guide;
      if (!gradingGuide && gradingResult.data?.grading_guides)
        gradingGuide = gradingResult.data.grading_guides as Guide;
    }

    // Check Level 2 if not found
    if ((!sizeGuide || !gradingGuide) && params.subcategoryId) {
      const [sizeResult, gradingResult] = await Promise.all([
        !sizeGuide
          ? supabase
              .from('size_guide_subcategories')
              .select('size_guides(*)')
              .eq('subcategory_id', params.subcategoryId)
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        !gradingGuide
          ? supabase
              .from('grading_guide_subcategories')
              .select('grading_guides(*)')
              .eq('subcategory_id', params.subcategoryId)
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (!sizeGuide && sizeResult.data?.size_guides) sizeGuide = sizeResult.data.size_guides as Guide;
      if (!gradingGuide && gradingResult.data?.grading_guides)
        gradingGuide = gradingResult.data.grading_guides as Guide;
    }

    // Check Level 1 if not found
    if ((!sizeGuide || !gradingGuide) && params.categoryId) {
      const [sizeResult, gradingResult] = await Promise.all([
        !sizeGuide
          ? supabase
              .from('size_guide_categories')
              .select('size_guides(*)')
              .eq('category_id', params.categoryId)
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        !gradingGuide
          ? supabase
              .from('grading_guide_categories')
              .select('grading_guides(*)')
              .eq('category_id', params.categoryId)
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (!sizeGuide && sizeResult.data?.size_guides) sizeGuide = sizeResult.data.size_guides as Guide;
      if (!gradingGuide && gradingResult.data?.grading_guides)
        gradingGuide = gradingResult.data.grading_guides as Guide;
    }

    return { data: { sizeGuide, gradingGuide }, error: null };
  }, 'fetchGuidesByCategoryHierarchy');
}
