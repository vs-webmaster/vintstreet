import { useState } from 'react';
import { invokeEdgeFunction } from '@/services/functions';
import { isFailure } from '@/types/api';

interface ModerationResult {
  isApproved: boolean;
  requiresReview: boolean;
  categories: Array<{
    class: string;
    score: number;
  }>;
  message?: string;
}

export const useHiveModeration = () => {
  const [isChecking, setIsChecking] = useState(false);

  const moderateText = async (text: string): Promise<ModerationResult> => {
    setIsChecking(true);
    try {
      const result = await invokeEdgeFunction<ModerationResult>({
        functionName: 'moderate-content',
        body: { type: 'text', content: text },
      });

      if (isFailure(result)) {
        console.error('Moderation error:', result.error);
        // Return approved by default if moderation fails
        return {
          isApproved: true,
          requiresReview: false,
          categories: [],
          message: 'Moderation check failed, content approved by default',
        };
      }

      return result.data;
    } catch (error) {
      console.error('Moderation error:', error);
      return {
        isApproved: true,
        requiresReview: false,
        categories: [],
        message: 'Moderation check failed, content approved by default',
      };
    } finally {
      setIsChecking(false);
    }
  };

  const moderateImage = async (imageUrl: string): Promise<ModerationResult> => {
    setIsChecking(true);
    try {
      const result = await invokeEdgeFunction<ModerationResult>({
        functionName: 'moderate-content',
        body: { type: 'image', content: imageUrl },
      });

      if (isFailure(result)) {
        console.error('Moderation error:', result.error);
        return {
          isApproved: true,
          requiresReview: false,
          categories: [],
          message: 'Moderation check failed, content approved by default',
        };
      }

      return result.data;
    } catch (error) {
      console.error('Moderation error:', error);
      return {
        isApproved: true,
        requiresReview: false,
        categories: [],
        message: 'Moderation check failed, content approved by default',
      };
    } finally {
      setIsChecking(false);
    }
  };

  const moderateImageFile = async (file: File): Promise<ModerationResult> => {
    setIsChecking(true);
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await invokeEdgeFunction<ModerationResult>({
        functionName: 'moderate-content',
        body: { type: 'image', content: base64 },
      });

      if (isFailure(result)) {
        console.error('Moderation error:', result.error);
        return {
          isApproved: true,
          requiresReview: false,
          categories: [],
          message: 'Moderation check failed, content approved by default',
        };
      }

      return result.data;
    } catch (error) {
      console.error('Moderation error:', error);
      return {
        isApproved: true,
        requiresReview: false,
        categories: [],
        message: 'Moderation check failed, content approved by default',
      };
    } finally {
      setIsChecking(false);
    }
  };

  return {
    moderateText,
    moderateImage,
    moderateImageFile,
    isChecking,
  };
};
