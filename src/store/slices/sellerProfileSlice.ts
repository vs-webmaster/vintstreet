import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/integrations/supabase/client';

interface SellerProfile {
  id: string;
  shop_name: string | null;
  business_name: string | null;
}

interface SellerProfileState {
  hasSellerProfile: boolean;
  profile: SellerProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: SellerProfileState = {
  hasSellerProfile: false,
  profile: null,
  loading: true,
  error: null,
};

export const checkSellerProfile = createAsyncThunk(
  'sellerProfile/check',
  async ({ userId, isSeller }: { userId: string; isSeller: boolean }) => {
    if (!userId || !isSeller) {
      return { hasSellerProfile: false, profile: null };
    }

    try {
      const { data, error } = await supabase
        .from('seller_profiles')
        .select('id, shop_name, business_name')
        .eq('user_id', userId)
        .single();

      if (error) {
        return { hasSellerProfile: false, profile: null };
      }

      // Check if the seller profile is complete (has shop_name and business_name)
      const hasSellerProfile = !!data && !!data.shop_name && !!data.business_name;

      return {
        hasSellerProfile,
        profile: data || null,
      };
    } catch (error) {
      return { hasSellerProfile: false, profile: null };
    }
  },
);

const sellerProfileSlice = createSlice({
  name: 'sellerProfile',
  initialState,
  reducers: {
    resetSellerProfile: (state) => {
      state.hasSellerProfile = false;
      state.profile = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkSellerProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkSellerProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.hasSellerProfile = action.payload.hasSellerProfile;
        state.profile = action.payload.profile;
        state.error = null;
      })
      .addCase(checkSellerProfile.rejected, (state, action) => {
        state.loading = false;
        state.hasSellerProfile = false;
        state.profile = null;
        state.error = action.error.message || 'Failed to check seller profile';
      });
  },
});

export const { resetSellerProfile } = sellerProfileSlice.actions;
export default sellerProfileSlice.reducer;
