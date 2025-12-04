import { uploadFile, getPublicUrl, type StorageBucket } from '@/services/storage';
import { isFailure } from '@/types/api';

/**
 * Convert a File object to a base64 data URL
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Upload an image to Supabase storage and return the public URL.
 *
 * @param file - The file to upload
 * @param pathPrefix - Path prefix for the file (e.g., 'category-grid/123' or 'shop-hero')
 * @param bucket - Storage bucket name (defaults to 'product-images')
 * @returns The public URL of the uploaded image
 */
export const uploadImageToStorage = async (
  file: File,
  pathPrefix: string,
  bucket: StorageBucket = 'product-images',
): Promise<string> => {
  const result = await uploadFile(file, {
    bucket,
    pathPrefix,
  });

  if (isFailure(result)) {
    throw result.error;
  }

  return result.data.url;
};
