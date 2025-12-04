import { useState } from 'react';
import { toast } from 'sonner';
import { invokeEdgeFunction } from '@/services/functions';
import { isFailure } from '@/types/api';

interface ShippingAddress {
  first_name?: string;
  last_name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
}

interface ShippingLabelResponse {
  success: boolean;
  order_id: string;
  tracking_number: string | null;
  label_type: 'ninja' | 'voila';
  data?: any;
  error?: string;
  details?: string;
}

export const useShippingLabel = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateLabel = async (
    orderId: string,
    shippingAddress?: ShippingAddress,
    shippingOptionId?: string,
  ): Promise<ShippingLabelResponse | null> => {
    if (!shippingOptionId) {
      shippingOptionId = null;
    }

    setIsGenerating(true);
    try {
      const result = await invokeEdgeFunction<ShippingLabelResponse>({
        functionName: 'generate-shipping-label',
        body: {
          orderId: orderId,
          shippingAddress: shippingAddress,
          shippingOptionId: shippingOptionId,
        },
      });

      if (isFailure(result)) {
        console.error('Error generating shipping label:', result.error);
        toast.error('Failed to generate shipping label');
        return {
          success: false,
          order_id: orderId,
          tracking_number: null,
          label_type: 'voila',
          error: result.error.message || 'Unknown error',
        };
      }

      if (result.data?.success) {
        toast.success('Shipping label generated successfully');
        return result.data;
      } else {
        toast.error(result.data?.error || 'Failed to generate shipping label');
        return {
          success: false,
          order_id: orderId,
          tracking_number: null,
          label_type: 'voila',
          error: result.data?.error || 'Unknown error',
          details: result.data?.details,
        };
      }
    } catch (error) {
      console.error('Error generating shipping label:', error);
      toast.error('Failed to generate shipping label');
      return {
        success: false,
        order_id: orderId,
        tracking_number: null,
        label_type: 'voila',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateLabel,
    isGenerating,
  };
};
