import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { checkSellerProfile, resetSellerProfile } from '@/store/slices/sellerProfileSlice';

export const useSellerProfile = () => {
  const { user, isSeller } = useAuth();
  const dispatch = useAppDispatch();
  const { hasSellerProfile, loading } = useAppSelector((state) => state.sellerProfile);

  useEffect(() => {
    if (!user?.id || !isSeller) {
      dispatch(resetSellerProfile());
      return;
    }

    dispatch(checkSellerProfile({ userId: user.id, isSeller }));
  }, [user?.id, isSeller, dispatch]);

  return {
    hasSellerProfile,
    loading,
  };
};
