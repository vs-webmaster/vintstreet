// Audit Service
// Centralized data access for audit and data recovery operations

import { supabase } from '@/integrations/supabase/client';
import { normalizeError, logError } from '@/lib/errors';
import type { Result } from '@/types/api';
import { success, failure } from '@/types/api';

export interface AuditImageRecord {
  id: string;
  listing_id: string;
  old_images: string[];
  new_images: string[];
  changed_at: string;
  operation: string;
}

export interface AuditAttributeRecord {
  id: string;
  product_id: string;
  attribute_id: string;
  operation: string;
  old_values: any;
  new_values: any;
  changed_at: string;
}

export interface AuditTagRecord {
  id: string;
  product_id: string;
  tag_id: string;
  operation: string;
  changed_at: string;
}

// Fetch product image audit history
export async function fetchImageAuditHistory(
  listingId: string,
  limit: number = 50,
): Promise<Result<AuditImageRecord[]>> {
  try {
    const { data, error } = await supabase
      .from('audit_product_images')
      .select('*')
      .eq('listing_id', listingId)
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (error) {
      logError(error, 'fetchImageAuditHistory');
      return failure(normalizeError(error));
    }

    return success((data || []) as AuditImageRecord[]);
  } catch (error) {
    logError(error, 'fetchImageAuditHistory');
    return failure(normalizeError(error));
  }
}

// Fetch product attribute audit history
export async function fetchAttributeAuditHistory(
  productId: string,
  limit: number = 50,
): Promise<Result<AuditAttributeRecord[]>> {
  try {
    const { data, error } = await supabase
      .from('audit_product_attributes')
      .select('*')
      .eq('product_id', productId)
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (error) {
      logError(error, 'fetchAttributeAuditHistory');
      return failure(normalizeError(error));
    }

    return success((data || []) as AuditAttributeRecord[]);
  } catch (error) {
    logError(error, 'fetchAttributeAuditHistory');
    return failure(normalizeError(error));
  }
}

// Fetch product tag audit history
export async function fetchTagAuditHistory(productId: string, limit: number = 50): Promise<Result<AuditTagRecord[]>> {
  try {
    const { data, error } = await supabase
      .from('audit_product_tags')
      .select('*')
      .eq('product_id', productId)
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (error) {
      logError(error, 'fetchTagAuditHistory');
      return failure(normalizeError(error));
    }

    return success((data || []) as AuditTagRecord[]);
  } catch (error) {
    logError(error, 'fetchTagAuditHistory');
    return failure(normalizeError(error));
  }
}

// Scan for data loss
export async function scanForDataLoss(days: number): Promise<
  Result<{
    imageLoss: any[];
    attributeLoss: any[];
    tagLoss: any[];
  }>
> {
  try {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    // Find products where images went from having items to empty
    const { data: imageLoss, error: imgError } = await supabase
      .from('audit_product_images')
      .select('listing_id, old_images, new_images, changed_at')
      .gte('changed_at', daysAgo.toISOString())
      .order('changed_at', { ascending: false });

    if (imgError) {
      logError(imgError, 'scanForDataLoss');
      return failure(normalizeError(imgError));
    }

    // Filter to only those where images were lost
    const lostImages = (imageLoss || []).filter((record: any) => {
      const oldCount = Array.isArray(record.old_images) ? record.old_images.length : 0;
      const newCount = Array.isArray(record.new_images) ? record.new_images.length : 0;
      return oldCount > 0 && newCount === 0;
    });

    // Find products with mass attribute deletions
    const { data: attrLoss, error: attrError } = await supabase
      .from('audit_product_attributes')
      .select('product_id, operation, changed_at')
      .eq('operation', 'DELETE')
      .gte('changed_at', daysAgo.toISOString());

    if (attrError) {
      logError(attrError, 'scanForDataLoss');
      return failure(normalizeError(attrError));
    }

    // Group deletions by product
    const attrDeletionCounts: Record<string, number> = {};
    (attrLoss || []).forEach((record: any) => {
      attrDeletionCounts[record.product_id] = (attrDeletionCounts[record.product_id] || 0) + 1;
    });

    // Products with 3+ attribute deletions
    const massAttrDeletions = Object.entries(attrDeletionCounts)
      .filter(([_, count]) => count >= 3)
      .map(([productId, count]) => ({ product_id: productId, deletion_count: count }));

    // Find products with all tags removed
    const { data: tagLoss, error: tagError } = await supabase
      .from('audit_product_tags')
      .select('product_id, operation, changed_at')
      .eq('operation', 'DELETE')
      .gte('changed_at', daysAgo.toISOString());

    if (tagError) {
      logError(tagError, 'scanForDataLoss');
      return failure(normalizeError(tagError));
    }

    const tagDeletionCounts: Record<string, number> = {};
    (tagLoss || []).forEach((record: any) => {
      tagDeletionCounts[record.product_id] = (tagDeletionCounts[record.product_id] || 0) + 1;
    });

    const massTagDeletions = Object.entries(tagDeletionCounts)
      .filter(([_, count]) => count >= 2)
      .map(([productId, count]) => ({ product_id: productId, deletion_count: count }));

    return success({
      imageLoss: lostImages,
      attributeLoss: massAttrDeletions,
      tagLoss: massTagDeletions,
    });
  } catch (error) {
    logError(error, 'scanForDataLoss');
    return failure(normalizeError(error));
  }
}

// Restore images
export async function restoreImages(listingId: string, images: string[]): Promise<Result<boolean>> {
  try {
    const { error } = await supabase
      .from('listings')
      .update({
        product_images: images,
        thumbnail: images[0] || null,
      })
      .eq('id', listingId);

    if (error) {
      logError(error, 'restoreImages');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'restoreImages');
    return failure(normalizeError(error));
  }
}

// Restore attribute
export async function restoreAttribute(productId: string, attributeId: string, values: any): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('product_attribute_values').upsert({
      product_id: productId,
      attribute_id: attributeId,
      value_text: values.value_text,
      value_number: values.value_number,
      value_boolean: values.value_boolean,
      value_date: values.value_date,
    });

    if (error) {
      logError(error, 'restoreAttribute');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'restoreAttribute');
    return failure(normalizeError(error));
  }
}

// Restore tag
export async function restoreTag(productId: string, tagId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('product_tag_links').insert({
      product_id: productId,
      tag_id: tagId,
    });

    if (error) {
      logError(error, 'restoreTag');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'restoreTag');
    return failure(normalizeError(error));
  }
}

// Cleanup old audit logs
export async function cleanupAuditLogs(olderThanDays: number): Promise<Result<boolean>> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const [r1, r2, r3] = await Promise.all([
      supabase.from('audit_product_images').delete().lt('changed_at', cutoffDate.toISOString()),
      supabase.from('audit_product_attributes').delete().lt('changed_at', cutoffDate.toISOString()),
      supabase.from('audit_product_tags').delete().lt('changed_at', cutoffDate.toISOString()),
    ]);

    if (r1.error) {
      logError(r1.error, 'cleanupAuditLogs');
      return failure(normalizeError(r1.error));
    }
    if (r2.error) {
      logError(r2.error, 'cleanupAuditLogs');
      return failure(normalizeError(r2.error));
    }
    if (r3.error) {
      logError(r3.error, 'cleanupAuditLogs');
      return failure(normalizeError(r3.error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'cleanupAuditLogs');
    return failure(normalizeError(error));
  }
}
