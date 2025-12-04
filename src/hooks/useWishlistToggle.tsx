/**
 * Hook for toggling wishlist items with consistent toast feedback
 */

import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useWishlist } from '@/hooks/useWishlist';

interface UseWishlistToggleOptions {
  productId: string;
  productName: string;
}

export function useWishlistToggle({ productId, productName }: UseWishlistToggleOptions) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const isProductInWishlist = isInWishlist(productId);

  const handleWishlistToggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user?.id) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to your wishlist.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isProductInWishlist) {
        await removeFromWishlist(productId);
        toast({
          title: 'Removed from wishlist',
          description: `${productName} has been removed from your wishlist.`,
        });
      } else {
        await addToWishlist(productId);
        toast({
          title: 'Added to wishlist',
          description: `${productName} has been added to your wishlist.`,
        });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to update wishlist. Please try again.',
        variant: 'destructive',
      });
    }
  }, [user?.id, isProductInWishlist, productId, productName, addToWishlist, removeFromWishlist, toast]);

  return {
    isProductInWishlist,
    handleWishlistToggle,
  };
}
