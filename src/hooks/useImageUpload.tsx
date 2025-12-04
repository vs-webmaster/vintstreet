import { useState } from 'react';
import { toast } from 'sonner';
import { compressImages } from '@/lib/imageCompression';
import { uploadProductImages } from '@/services/storage';
import { isFailure } from '@/types/api';
import { useHiveModeration } from './useHiveModeration';

export const useImageUpload = (userId: string) => {
  const [images, setImages] = useState<File[]>([]);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState<number>(0);
  const { moderateImageFile } = useHiveModeration();

  const addImages = (files: File[]) => {
    setImages((prev) => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    // Adjust main image index if needed
    if (mainImageIndex >= currentImages.length + index) {
      setMainImageIndex(Math.max(0, mainImageIndex - 1));
    }
  };

  const removeCurrentImage = (index: number) => {
    setCurrentImages((prev) => prev.filter((_, i) => i !== index));
    // Adjust main image index if needed
    if (mainImageIndex === index) {
      setMainImageIndex(0);
    } else if (mainImageIndex > index) {
      setMainImageIndex(mainImageIndex - 1);
    }
  };

  const setInitialImages = (urls: string[]) => {
    // SAFE: Only set images if we have valid URLs, preserve existing if empty array passed
    if (urls && Array.isArray(urls) && urls.length > 0) {
      setCurrentImages(urls);
      setMainImageIndex(0);
    } else if (currentImages.length === 0) {
      // Only set empty if we don't have any images yet
      setCurrentImages([]);
      setMainImageIndex(0);
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    const allImages = [...currentImages];

    if (images.length === 0) return allImages;

    try {
      // Moderate images first
      toast.loading('Moderating images...', { id: 'moderate' });
      for (const image of images) {
        const result = await moderateImageFile(image);
        if (!result.isApproved) {
          toast.error(`Image rejected: ${result.message}`, { id: 'moderate' });
          throw new Error(`Image moderation failed: ${result.message}`);
        }
        if (result.requiresReview) {
          toast.warning(`Image flagged for review`, { id: 'moderate', duration: 3000 });
        }
      }
      toast.dismiss('moderate');

      toast.loading('Compressing images...', { id: 'compress' });
      const compressedImages = await compressImages(images, (current, total) => {
        toast.loading(`Compressing images... ${current}/${total}`, { id: 'compress' });
      });
      toast.dismiss('compress');

      toast.loading('Uploading images...', { id: 'upload' });

      // Upload all images using StorageService
      const uploadResult = await uploadProductImages(compressedImages, userId);

      if (isFailure(uploadResult)) {
        throw uploadResult.error;
      }

      const uploadedUrls = uploadResult.data.map((item) => item.url);
      toast.dismiss('upload');

      const combinedImages = [...allImages, ...uploadedUrls];

      // Reorder array so main image is first
      if (mainImageIndex > 0 && mainImageIndex < combinedImages.length) {
        const mainImage = combinedImages[mainImageIndex];
        combinedImages.splice(mainImageIndex, 1);
        combinedImages.unshift(mainImage);
      }

      return combinedImages;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.dismiss('upload');
      toast.error('Failed to upload images');
      throw error;
    }
  };

  return {
    images,
    currentImages,
    mainImageIndex,
    addImages,
    removeImage,
    removeCurrentImage,
    setInitialImages,
    setMainImageIndex,
    uploadImages,
  };
};
