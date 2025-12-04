import { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from './useAuth';
import {
  loadCart,
  addToCart as addToCartService,
  removeFromCart as removeFromCartService,
  clearCart as clearCartService,
  mergeGuestCart,
  loadGuestCart,
  guestCartUtils,
  type CartItem,
} from '@/services/cart';
import { isFailure } from '@/types/api';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (listingId: string) => Promise<void>;
  removeFromCart: (listingId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalItems: () => number;
  isInCart: (listingId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const fetchCartItems = async () => {
      if (!user) {
        // Load guest cart
        const result = await loadGuestCart();
        if (result.success) {
          setCartItems(result.data);
        }
        return;
      }

      // Load user cart
      const result = await loadCart(user.id);
      if (result.success) {
        setCartItems(result.data);
      }
    };
    fetchCartItems();
  }, [user]);

  // Merge guest cart with database cart when user logs in
  useEffect(() => {
    const mergeGuestCartItems = async () => {
      if (!user) return;

      const guestListingIds = guestCartUtils.getGuestCart();
      if (guestListingIds.length === 0) return;

      try {
        const result = await mergeGuestCart(user.id, guestListingIds);
        if (result.success) {
          // Clear guest cart
          guestCartUtils.clearGuestCart();
          // Reload cart
          setCartItems(result.data);
        }
      } catch (error) {
        console.error('Error merging guest cart:', error);
      }
    };

    mergeGuestCartItems();
  }, [user]);

  const addToCart = async (listingId: string) => {
    try {
      // Check if item already exists in cart
      const existingItem = cartItems.find((item) => item.listing_id === listingId);
      if (existingItem) {
        return;
      }

      if (!user) {
        // Guest user - store in localStorage
        guestCartUtils.addToGuestCart(listingId);

        // Reload cart
        const result = await loadGuestCart();
        if (result.success) {
          setCartItems(result.data);
        }
        return;
      }

      // Authenticated user - use service
      const result = await addToCartService(user.id, listingId);

      if (isFailure(result)) {
        throw result.error;
      }

      // Reload cart from database
      const cartResult = await loadCart(user.id);
      if (cartResult.success) {
        setCartItems(cartResult.data);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (listingId: string) => {
    try {
      if (!user) {
        // Guest user - remove from localStorage
        guestCartUtils.removeFromGuestCart(listingId);

        // Reload cart
        const result = await loadGuestCart();
        if (result.success) {
          setCartItems(result.data);
        }
        return;
      }

      // Authenticated user - use service
      const result = await removeFromCartService(user.id, listingId);

      if (isFailure(result)) {
        throw result.error;
      }

      // Reload cart from database
      const cartResult = await loadCart(user.id);
      if (isFailure(cartResult)) {
        throw cartResult.error;
      }
      setCartItems(cartResult.data);
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      if (!user) {
        // Guest user - clear localStorage
        guestCartUtils.clearGuestCart();
        setCartItems([]);
        return;
      }

      // Authenticated user - use service
      const result = await clearCartService(user.id);

      if (isFailure(result)) {
        throw result.error;
      }

      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  const getTotalItems = () => {
    return cartItems.length;
  };

  const isInCart = (listingId: string) => {
    return cartItems.some((item) => item.listing_id === listingId);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        getTotalItems,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
