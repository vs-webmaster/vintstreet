import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { invokeEdgeFunction } from '@/services/functions';
import { fetchSharedWishlistByUserId, deactivateSharedWishlist } from '@/services/wishlist';
import { isFailure } from '@/types/api';

interface GenerateShareLinkParams {
  name?: string;
}

export const useWishlistShare = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const generateShareLink = useMutation({
    mutationFn: async ({ name }: GenerateShareLinkParams) => {
      const result = await invokeEdgeFunction({
        functionName: 'generate-wishlist-share',
        body: { name },
      });

      if (isFailure(result)) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-wishlist', user?.id] });
    },
    onError: (error) => {
      toast.error('Failed to generate share link');
      console.error('Share link generation error:', error);
    },
  });

  const getSharedWishlist = useQuery({
    queryKey: ['shared-wishlist', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const result = await fetchSharedWishlistByUserId(user.id);

      if (isFailure(result)) {
        throw result.error;
      }

      return result.data;
    },
    enabled: !!user?.id,
  });

  const deactivateShare = useMutation({
    mutationFn: async (shareId: string) => {
      const result = await deactivateSharedWishlist(shareId);

      if (isFailure(result)) {
        throw result.error;
      }
    },
    onSuccess: () => {
      toast.success('Share link deactivated');
      queryClient.invalidateQueries({ queryKey: ['shared-wishlist', user?.id] });
    },
    onError: (error) => {
      toast.error('Failed to deactivate share link');
      console.error('Share deactivation error:', error);
    },
  });

  return {
    generateShareLink,
    getSharedWishlist,
    deactivateShare,
  };
};
