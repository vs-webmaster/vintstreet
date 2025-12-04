// Storage Service
// Centralized file/image upload service for Supabase Storage

import { supabase } from '@/integrations/supabase/client';
import type { Result } from '@/types/api';
import { success, failure, isFailure } from '@/types/api';
import { normalizeError, logError } from '@/lib/errors';

export type StorageBucket = 'product-images' | 'blog-images' | 'avatars' | 'mega-menu-images';

export interface UploadOptions {
  bucket: StorageBucket;
  pathPrefix?: string;
  fileName?: string;
  upsert?: boolean;
  contentType?: string;
  cacheControl?: string;
}

// Upload a single file to storage
export async function uploadFile(
  file: File | Blob,
  options: UploadOptions,
): Promise<Result<{ url: string; path: string }>> {
  try {
    const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';

    const fileName = options.fileName || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = options.pathPrefix ? `${options.pathPrefix}/${fileName}` : fileName;

    const uploadOptions: {
      upsert?: boolean;
      contentType?: string;
      cacheControl?: string;
    } = {};

    if (options.upsert !== undefined) uploadOptions.upsert = options.upsert;
    if (options.contentType) uploadOptions.contentType = options.contentType;
    if (options.cacheControl) uploadOptions.cacheControl = options.cacheControl;

    const { error: uploadError } = await supabase.storage.from(options.bucket).upload(filePath, file, uploadOptions);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from(options.bucket).getPublicUrl(filePath);

    return success({
      url: publicUrl,
      path: filePath,
    });
  } catch (error) {
    logError(error, 'storageService:uploadFile');
    return failure(normalizeError(error));
  }
}

// Upload multiple files to storage
export async function uploadFiles(
  files: (File | Blob)[],
  options: UploadOptions,
): Promise<Result<{ url: string; path: string }[]>> {
  try {
    const uploadPromises = files.map((file, index) => {
      const fileOptions: UploadOptions = {
        ...options,
        pathPrefix: options.pathPrefix,
        fileName: options.fileName ? `${index}-${options.fileName}` : undefined,
      };
      return uploadFile(file, fileOptions);
    });

    const results = await Promise.all(uploadPromises);

    const failed = results.find((r) => !r.success);
    if (isFailure(failed)) {
      return failed;
    }

    const successful = results
      .filter((r): r is { success: true; data: { url: string; path: string } } => r.success)
      .map((r) => r.data);

    return success(successful);
  } catch (error) {
    logError(error, 'storageService:uploadFiles');
    return failure(normalizeError(error));
  }
}

// Delete a file from storage
export async function deleteFile(bucket: StorageBucket, filePath: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) throw error;

    return success(true);
  } catch (error) {
    logError(error, 'storageService:deleteFile');
    return failure(normalizeError(error));
  }
}

// Get public URL for a file
export function getPublicUrl(bucket: StorageBucket, filePath: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return publicUrl;
}

// Upload product image
export async function uploadProductImage(
  file: File | Blob,
  userId: string,
  fileName?: string,
): Promise<Result<{ url: string; path: string }>> {
  return uploadFile(file, {
    bucket: 'product-images',
    pathPrefix: userId,
    fileName,
  });
}

// Upload blog image
export async function uploadBlogImage(
  file: File | Blob,
  fileName?: string,
): Promise<Result<{ url: string; path: string }>> {
  return uploadFile(file, {
    bucket: 'blog-images',
    fileName,
    cacheControl: '3600',
    upsert: false,
  });
}

// Upload avatar image
export async function uploadAvatarImage(
  file: File | Blob,
  userId: string,
  fileName?: string,
): Promise<Result<{ url: string; path: string }>> {
  const finalFileName = fileName || `avatar-${Date.now()}.jpg`;
  return uploadFile(file, {
    bucket: 'avatars',
    pathPrefix: userId,
    fileName: finalFileName,
    contentType: 'image/jpeg',
    upsert: true,
  });
}

// Upload mega menu image
export async function uploadMegaMenuImage(
  file: File | Blob,
  fileName?: string,
): Promise<Result<{ url: string; path: string }>> {
  return uploadFile(file, {
    bucket: 'mega-menu-images',
    fileName,
    upsert: true,
  });
}

// Upload multiple product images
export async function uploadProductImages(
  files: (File | Blob)[],
  userId: string,
): Promise<Result<{ url: string; path: string }[]>> {
  return uploadFiles(files, {
    bucket: 'product-images',
    pathPrefix: userId,
  });
}

// Upload brand logo
export async function uploadBrandLogo(
  file: File | Blob,
  fileName?: string,
): Promise<Result<{ url: string; path: string }>> {
  const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
  const finalFileName = fileName || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  return uploadFile(file, {
    bucket: 'product-images',
    pathPrefix: 'brands',
    fileName: finalFileName,
  });
}
