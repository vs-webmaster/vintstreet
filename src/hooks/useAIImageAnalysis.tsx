import { useState } from 'react';
import { toast } from 'sonner';
import { fileToBase64 } from '@/lib/imageUtils';
import { invokeEdgeFunction } from '@/services/functions';
import { isFailure } from '@/types/api';

interface AISuggestions {
  categoryId: string | null;
  subcategoryId: string | null;
  subSubcategoryId: string | null;
  subSubSubcategoryId: string | null;
}

interface FormData {
  name: string;
  description: string;
  categoryId: string;
}

interface UseAIImageAnalysisProps {
  formData: FormData;
  updateFormData: (field: string, value: unknown) => void;
  onImageRejected?: (reason: string, type: 'rejected' | 'uncertain') => void;
}

export const useAIImageAnalysis = ({ formData, updateFormData, onImageRejected }: UseAIImageAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestions | null>(null);

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);

    try {
      // Convert image to base64
      const base64Image = await fileToBase64(file);

      // Call edge function to analyze image - we need to handle the response manually
      // because Supabase throws for non-2xx status codes
      try {
        const result = await invokeEdgeFunction({
          functionName: 'analyze-product-image',
          body: { imageBase64: base64Image },
        });

        // If we got here without error, process the successful response
        if (!isFailure(result) && result.data) {
          const data = result.data;
          // Handle uncertain status
          if (data.status === 'uncertain') {
            const reason = data.reason || 'Unable to identify this product automatically.';

            if (onImageRejected) {
              onImageRejected(reason, 'uncertain');
            } else {
              toast.info(reason);
            }
            return;
          }

          // Handle identified status
<<<<<<< HEAD
          const { suggestedName, suggestedDescription, suggestedCategory } = data as unknown;
=======
          interface AIImageAnalysisResponse {
            status: string;
            suggestedName?: string;
            suggestedDescription?: string;
            suggestedCategory?: {
              categoryId?: string;
              subcategoryId?: string;
              subSubcategoryId?: string;
              subSubSubcategoryId?: string;
            };
            reason?: string;
          }
          const { suggestedName, suggestedDescription, suggestedCategory } = data as AIImageAnalysisResponse;
>>>>>>> a275e0e6fd466fe0415be180aa3be0c399054c93

          // Only populate fields if they're currently empty
          if (suggestedName && !formData.name) {
            updateFormData('name', suggestedName);
          }

          if (suggestedDescription && !formData.description) {
            updateFormData('description', suggestedDescription);
          }

          // Store AI category suggestions
          if (suggestedCategory) {
            setSuggestions({
              categoryId: suggestedCategory.categoryId,
              subcategoryId: suggestedCategory.subcategoryId,
              subSubcategoryId: suggestedCategory.subSubcategoryId,
              subSubSubcategoryId: suggestedCategory.subSubSubcategoryId,
            });

            // Auto-populate category if empty
            if (!formData.categoryId && suggestedCategory.categoryId) {
              updateFormData('categoryId', suggestedCategory.categoryId);

              if (suggestedCategory.subcategoryId) {
                updateFormData('subcategoryId', suggestedCategory.subcategoryId);

                if (suggestedCategory.subSubcategoryId) {
                  updateFormData('subSubcategoryId', suggestedCategory.subSubcategoryId);

                  if (suggestedCategory.subSubSubcategoryId) {
                    updateFormData('subSubSubcategoryId', suggestedCategory.subSubSubcategoryId);
                  }
                }
              }
            }
          }

          toast.success('✨ AI suggestions applied! Feel free to edit.');
        }
      } catch (functionError: unknown) {
        // When the edge function returns 400, we need to manually fetch the response
        console.error('Function error:', functionError);

        // Try to get the error details from the function error
        // For FunctionsHttpError, we need to call the function again to get the body
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const response = await fetch(`${supabaseUrl}/functions/v1/analyze-product-image`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageBase64: base64Image }),
        });

        const responseData = await response.json();

        // Check status from response
        if (responseData.status === 'rejected') {
          const reason = responseData.reason || 'This image does not appear to be a valid product.';

          if (onImageRejected) {
            onImageRejected(reason, 'rejected');
          } else {
            toast.error(reason);
          }
          return;
        }

        if (responseData.status === 'uncertain') {
          const reason = responseData.reason || 'Unable to identify this product automatically.';

          if (onImageRejected) {
            onImageRejected(reason, 'uncertain');
          } else {
            toast.info(reason);
          }
          return;
        }

        // If we get here with an error status but not rejected/uncertain, show generic error
        if (responseData.error || responseData.status === 'error') {
          toast.error('Unable to get AI suggestions. Please fill in details manually.');
          return;
        }

        toast.error('Unable to get AI suggestions. Please fill in details manually.');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('Unable to analyze image. Please add product details manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeImage, isAnalyzing, suggestions };
};
