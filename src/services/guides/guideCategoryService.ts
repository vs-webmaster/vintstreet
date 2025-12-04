// Guide Category Service
// Centralized data access for guide category assignment operations

import { supabase } from '@/integrations/supabase/client';
import type { Result } from '@/types/api';
import { success, failure } from '@/types/api';
import { normalizeError, logError } from '@/lib/errors';

export interface GuideCategoryAssignment {
  level1: Set<string>;
  level2: Set<string>;
  level3: Set<string>;
  level4: Set<string>;
}

// Fetch size guide category assignments
export async function fetchSizeGuideAssignments(guideId: string): Promise<Result<GuideCategoryAssignment>> {
  try {
    const [level1, level2, level3, level4] = await Promise.all([
      supabase.from('size_guide_categories').select('category_id').eq('size_guide_id', guideId),
      supabase.from('size_guide_subcategories').select('subcategory_id').eq('size_guide_id', guideId),
      supabase.from('size_guide_sub_subcategories').select('sub_subcategory_id').eq('size_guide_id', guideId),
      supabase.from('size_guide_sub_sub_subcategories').select('sub_sub_subcategory_id').eq('size_guide_id', guideId),
    ]);

    if (level1.error) throw level1.error;
    if (level2.error) throw level2.error;
    if (level3.error) throw level3.error;
    if (level4.error) throw level4.error;

    return success({
      level1: new Set(level1.data?.map((d) => d.category_id) || []),
      level2: new Set(level2.data?.map((d) => d.subcategory_id) || []),
      level3: new Set(level3.data?.map((d) => d.sub_subcategory_id) || []),
      level4: new Set(level4.data?.map((d) => d.sub_sub_subcategory_id) || []),
    });
  } catch (error) {
    logError(error, 'fetchSizeGuideAssignments');
    return failure(normalizeError(error));
  }
}

// Fetch grading guide category assignments
export async function fetchGradingGuideAssignments(guideId: string): Promise<Result<GuideCategoryAssignment>> {
  try {
    const [level1, level2, level3, level4] = await Promise.all([
      supabase.from('grading_guide_categories').select('category_id').eq('grading_guide_id', guideId),
      supabase.from('grading_guide_subcategories').select('subcategory_id').eq('grading_guide_id', guideId),
      supabase.from('grading_guide_sub_subcategories').select('sub_subcategory_id').eq('grading_guide_id', guideId),
      supabase
        .from('grading_guide_sub_sub_subcategories')
        .select('sub_sub_subcategory_id')
        .eq('grading_guide_id', guideId),
    ]);

    if (level1.error) throw level1.error;
    if (level2.error) throw level2.error;
    if (level3.error) throw level3.error;
    if (level4.error) throw level4.error;

    return success({
      level1: new Set(level1.data?.map((d) => d.category_id) || []),
      level2: new Set(level2.data?.map((d) => d.subcategory_id) || []),
      level3: new Set(level3.data?.map((d) => d.sub_subcategory_id) || []),
      level4: new Set(level4.data?.map((d) => d.sub_sub_subcategory_id) || []),
    });
  } catch (error) {
    logError(error, 'fetchGradingGuideAssignments');
    return failure(normalizeError(error));
  }
}

// Save size guide category assignments
export async function saveSizeGuideAssignments(
  guideId: string,
  assignments: GuideCategoryAssignment,
): Promise<Result<boolean>> {
  try {
    // Delete existing assignments
    await Promise.all([
      supabase.from('size_guide_categories').delete().eq('size_guide_id', guideId),
      supabase.from('size_guide_subcategories').delete().eq('size_guide_id', guideId),
      supabase.from('size_guide_sub_subcategories').delete().eq('size_guide_id', guideId),
      supabase.from('size_guide_sub_sub_subcategories').delete().eq('size_guide_id', guideId),
    ]);

    // Insert new assignments
    const inserts = [];

    if (assignments.level1.size > 0) {
      inserts.push(
        supabase.from('size_guide_categories').insert(
          Array.from(assignments.level1).map((id) => ({
            size_guide_id: guideId,
            category_id: id,
          })),
        ),
      );
    }

    if (assignments.level2.size > 0) {
      inserts.push(
        supabase.from('size_guide_subcategories').insert(
          Array.from(assignments.level2).map((id) => ({
            size_guide_id: guideId,
            subcategory_id: id,
          })),
        ),
      );
    }

    if (assignments.level3.size > 0) {
      inserts.push(
        supabase.from('size_guide_sub_subcategories').insert(
          Array.from(assignments.level3).map((id) => ({
            size_guide_id: guideId,
            sub_subcategory_id: id,
          })),
        ),
      );
    }

    if (assignments.level4.size > 0) {
      inserts.push(
        supabase.from('size_guide_sub_sub_subcategories').insert(
          Array.from(assignments.level4).map((id) => ({
            size_guide_id: guideId,
            sub_sub_subcategory_id: id,
          })),
        ),
      );
    }

    if (inserts.length > 0) {
      const results = await Promise.all(inserts);
      for (const result of results) {
        if (result.error) throw result.error;
      }
    }

    return success(true);
  } catch (error) {
    logError(error, 'saveSizeGuideAssignments');
    return failure(normalizeError(error));
  }
}

// Save grading guide category assignments
export async function saveGradingGuideAssignments(
  guideId: string,
  assignments: GuideCategoryAssignment,
): Promise<Result<boolean>> {
  try {
    // Delete existing assignments
    await Promise.all([
      supabase.from('grading_guide_categories').delete().eq('grading_guide_id', guideId),
      supabase.from('grading_guide_subcategories').delete().eq('grading_guide_id', guideId),
      supabase.from('grading_guide_sub_subcategories').delete().eq('grading_guide_id', guideId),
      supabase.from('grading_guide_sub_sub_subcategories').delete().eq('grading_guide_id', guideId),
    ]);

    // Insert new assignments
    const inserts = [];

    if (assignments.level1.size > 0) {
      inserts.push(
        supabase.from('grading_guide_categories').insert(
          Array.from(assignments.level1).map((id) => ({
            grading_guide_id: guideId,
            category_id: id,
          })),
        ),
      );
    }

    if (assignments.level2.size > 0) {
      inserts.push(
        supabase.from('grading_guide_subcategories').insert(
          Array.from(assignments.level2).map((id) => ({
            grading_guide_id: guideId,
            subcategory_id: id,
          })),
        ),
      );
    }

    if (assignments.level3.size > 0) {
      inserts.push(
        supabase.from('grading_guide_sub_subcategories').insert(
          Array.from(assignments.level3).map((id) => ({
            grading_guide_id: guideId,
            sub_subcategory_id: id,
          })),
        ),
      );
    }

    if (assignments.level4.size > 0) {
      inserts.push(
        supabase.from('grading_guide_sub_sub_subcategories').insert(
          Array.from(assignments.level4).map((id) => ({
            grading_guide_id: guideId,
            sub_sub_subcategory_id: id,
          })),
        ),
      );
    }

    if (inserts.length > 0) {
      const results = await Promise.all(inserts);
      for (const result of results) {
        if (result.error) throw result.error;
      }
    }

    return success(true);
  } catch (error) {
    logError(error, 'saveGradingGuideAssignments');
    return failure(normalizeError(error));
  }
}
