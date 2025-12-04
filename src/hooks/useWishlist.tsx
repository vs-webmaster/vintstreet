import { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from './useAuth';
import {
  loadWishlist as loadWishlistService,
  addToWishlist as addToWishlistService,
  removeFromWishlist as removeFromWishlistService,
  clearWishlist as clearWishlistService,
  toggleWishlistItem,
  type WishlistItem,
} from '@/services/wishlist';
import { isFailure } from '@/types/api';

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (listingId: string) => Promise<void>;
  removeFromWishlist: (listingId: string) => Promise<void>;
  toggleItem: (listingId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  getTotalItems: () => number;
  isInWishlist: (listingId: string) => boolean;
  getWishlistListingIds: () => string[];
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const fetchWishlistItems = async () => {
      if (!user) {
        setWishlistItems([]);
        return;
      }

      const result = await loadWishlistService(user.id);
      if (result.success) {
        setWishlistItems(result.data);
      }
    };
    fetchWishlistItems();
  }, [user]);

  const addToWishlist = async (listingId: string) => {
    try {
      if (!user) {
        throw new Error('User must be authenticated to add items to wishlist');
      }

      // Check if item already exists in wishlist
      const existingItem = wishlistItems.find((item) => item.listings?.id === listingId);
      if (existingItem) {
        return;
      }

      // Use service
      const result = await addToWishlistService(user.id, listingId);

      if (isFailure(result)) {
        throw result.error;
      }

      // Reload wishlist
      const loadResult = await loadWishlistService(user.id);
      if (loadResult.success) {
        setWishlistItems(loadResult.data);
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  };

  const removeFromWishlist = async (listingId: string) => {
    try {
      if (!user) {
        throw new Error('User must be authenticated to remove items from wishlist');
      }

      // Use service
      const result = await removeFromWishlistService(user.id, listingId);

      if (isFailure(result)) {
        throw result.error;
      }

      // Reload wishlist
      const loadResult = await loadWishlistService(user.id);
      if (loadResult.success) {
        setWishlistItems(loadResult.data);
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  };

  const clearWishlist = async () => {
    try {
      if (!user) return;

      // Use service
      const result = await clearWishlistService(user.id);

      if (isFailure(result)) {
        throw result.error;
      }

      setWishlistItems([]);
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      throw error;
    }
  };

  const getTotalItems = () => {
    return wishlistItems.length;
  };

  const isInWishlist = (listingId: string) => {
    return wishlistItems.some((item) => item.listing_id === listingId);
  };

  const getWishlistListingIds = () => {
    return wishlistItems.map((item) => item.listing_id).filter((id): id is string => !!id);
  };

  const toggleItem = async (listingId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to toggle wishlist items');
    }

    try {
      const result = await toggleWishlistItem(user.id, listingId);

      if (isFailure(result)) {
        throw result.error;
      }

      // Reload wishlist
      const loadResult = await loadWishlistService(user.id);
      if (loadResult.success) {
        setWishlistItems(loadResult.data);
      }
    } catch (error) {
      console.error('Error toggling wishlist item:', error);
      throw error;
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        toggleItem,
        clearWishlist,
        getTotalItems,
        isInWishlist,
        getWishlistListingIds,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
