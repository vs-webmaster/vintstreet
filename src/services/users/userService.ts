// Users Service
// Centralized data access for user profiles, seller profiles, and buyer profiles

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import { failure, success, type Result } from '@/types/api';
import { normalizeError, logError, NotFoundError } from '@/lib/errors';
import type { Profile, SellerProfile, BuyerProfile, UserType } from '@/types/user';

export interface UserFilters {
  userType?: UserType;
  isActive?: boolean;
  search?: string;
}

export interface UpdateProfileInput {
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  user_type?: UserType;
  is_active?: boolean;
  preferred_currency?: string | null;
}

export interface CreateSellerProfileInput {
  user_id: string;
  shop_name?: string;
  shop_description?: string;
  business_name?: string;
  business_address?: string;
  business_city?: string;
  business_postal_code?: string;
  business_country?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface UpdateSellerProfileInput {
  shop_name?: string | null;
  shop_description?: string | null;
  shop_tagline?: string | null;
  shop_logo_url?: string | null;
  business_name?: string | null;
  business_address?: string | null;
  business_city?: string | null;
  business_postal_code?: string | null;
  business_country?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  display_name_format?: 'shop_name' | 'personal_name' | null;
  return_address_line1?: string | null;
  return_address_line2?: string | null;
  return_city?: string | null;
  return_state?: string | null;
  return_postal_code?: string | null;
  return_country?: string | null;
  return_policy?: string | null;
  shipping_policy?: string | null;
  tax_id?: string | null;
  business_license?: string | null;
  setup_completed?: boolean;
  setup_step?: number;
  is_suspended?: boolean;
  suspended_at?: string | null;
  suspension_reason?: string | null;
}

export interface UpdateBuyerProfileInput {
  shipping_first_name?: string | null;
  shipping_last_name?: string | null;
  shipping_phone?: string | null;
  shipping_address_line1?: string | null;
  shipping_address_line2?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  shipping_country?: string | null;
  billing_first_name?: string | null;
  billing_last_name?: string | null;
  billing_phone?: string | null;
  billing_address_line1?: string | null;
  billing_address_line2?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_postal_code?: string | null;
  billing_country?: string | null;
  preferred_payment_method?: string | null;
}

// ==================== PROFILE FUNCTIONS ====================

// Fetch user profile by user ID
export async function fetchProfile(userId: string): Promise<Result<Profile>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();

    if (error) throw error;
    return { data: data as Profile, error: null };
  }, 'fetchProfile');
}

// Fetch profile by email
export async function fetchProfileByEmail(email: string): Promise<Result<Profile | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();

    if (error) throw error;
    return { data: data as Profile | null, error: null };
  }, 'fetchProfileByEmail') as Promise<Result<Profile | null>>;
}

// Update user profile
export async function updateProfile(userId: string, updates: UpdateProfileInput): Promise<Result<Profile | null>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from('profiles').update(updates).eq('user_id', userId).select().single();

    if (error) throw error;
    return { data: data as Profile, error: null };
  }, 'updateProfile');
}

// Update user type
export async function updateUserType(userId: string, userType: UserType): Promise<Result<Profile | null>> {
  return updateProfile(userId, { user_type: userType });
}

// ==================== SELLER PROFILE FUNCTIONS ====================

// Fetch seller profile by user ID
export async function fetchSellerProfile(userId: string): Promise<Result<SellerProfile | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('seller_profiles').select('*').eq('user_id', userId).maybeSingle();

    if (error) throw error;
    return { data: data as SellerProfile | null, error: null };
  }, 'fetchSellerProfile') as Promise<Result<SellerProfile | null>>;
}

// Batch fetch seller profiles
export async function fetchSellerProfiles(userIds: string[]): Promise<Result<SellerProfile[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('seller_profiles').select('*').in('user_id', userIds);

    if (error) throw error;
    return { data: data as SellerProfile[], error: null };
  }, 'fetchSellerProfiles');
}

// Check if seller profile exists
export async function checkSellerProfileExists(userId: string): Promise<Result<boolean>> {
  return withErrorHandling(async () => {
    const { count, error } = await supabase
      .from('seller_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return { data: (count || 0) > 0, error: null };
  }, 'checkSellerProfileExists');
}

// Create seller profile
export async function createSellerProfile(input: CreateSellerProfileInput): Promise<Result<SellerProfile | null>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('seller_profiles')
      .insert({
        user_id: input.user_id,
        shop_name: input.shop_name,
        shop_description: input.shop_description,
        business_name: input.business_name,
        business_address: input.business_address,
        business_city: input.business_city,
        business_postal_code: input.business_postal_code,
        business_country: input.business_country,
        contact_email: input.contact_email,
        contact_phone: input.contact_phone,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as SellerProfile, error: null };
  }, 'createSellerProfile');
}

// Update seller profile
export async function updateSellerProfile(
  userId: string,
  updates: UpdateSellerProfileInput,
): Promise<Result<SellerProfile | null>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('seller_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as SellerProfile, error: null };
  }, 'updateSellerProfile');
}

// Upsert seller profile (create or update)
export async function upsertSellerProfile(
  userId: string,
  data: UpdateSellerProfileInput,
): Promise<Result<SellerProfile | null>> {
  return withMutation(async () => {
    const { data: result, error } = await supabase
      .from('seller_profiles')
      .upsert(
        {
          user_id: userId,
          ...data,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        },
      )
      .select()
      .single();

    if (error) throw error;
    return { data: result as SellerProfile, error: null };
  }, 'upsertSellerProfile');
}

// ==================== BUYER PROFILE FUNCTIONS ====================

// Fetch buyer profile by user ID
export async function fetchBuyerProfile(userId: string): Promise<Result<BuyerProfile | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('buyer_profiles').select('*').eq('user_id', userId).maybeSingle();

    if (error) throw error;
    return { data: data as BuyerProfile | null, error: null };
  }, 'fetchBuyerProfile') as Promise<Result<BuyerProfile | null>>;
}

// Fetch multiple buyer profiles by user IDs
export async function fetchBuyerProfilesByUserIds(userIds: string[]): Promise<Result<BuyerProfile[]>> {
  return withErrorHandling(async () => {
    if (userIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase.from('buyer_profiles').select('*').in('user_id', userIds);

    if (error) throw error;
    return { data: (data || []) as BuyerProfile[], error: null };
  }, 'fetchBuyerProfilesByUserIds');
}

// Fetch multiple profiles by user IDs
export async function fetchProfilesByUserIds(userIds: string[]): Promise<Result<Profile[]>> {
  return withErrorHandling(async () => {
    if (userIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase.from('profiles').select('*').in('user_id', userIds);

    if (error) throw error;
    return { data: (data || []) as Profile[], error: null };
  }, 'fetchProfilesByUserIds');
}

// Fetch all profiles (admin only)
export async function fetchAllProfiles(): Promise<Result<Profile[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as Profile[], error: null };
  }, 'fetchAllProfiles');
}

// Fetch multiple seller profiles by user IDs
export async function fetchSellerProfilesByUserIds(userIds: string[]): Promise<Result<SellerProfile[]>> {
  return withErrorHandling(async () => {
    if (userIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('seller_profiles')
      .select('user_id, shop_name, display_name_format')
      .in('user_id', userIds);

    if (error) throw error;
    return { data: (data || []) as SellerProfile[], error: null };
  }, 'fetchSellerProfilesByUserIds');
}

// Fetch user role
export async function fetchUserRole(userId: string): Promise<Result<'user' | 'admin' | 'super_admin'>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { data: (data?.role as 'user' | 'admin' | 'super_admin') || 'user', error: null };
  }, 'fetchUserRole');
}

// Fetch non-suspended seller user IDs
export async function fetchNonSuspendedSellerIds(): Promise<Result<string[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('seller_profiles').select('user_id').eq('is_suspended', false);

    if (error) throw error;
    return { data: (data || []).map((s) => s.user_id), error: null };
  }, 'fetchNonSuspendedSellerIds');
}

// Create buyer profile
export async function createBuyerProfile(
  userId: string,
  input: UpdateBuyerProfileInput = {},
): Promise<Result<BuyerProfile | null>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('buyer_profiles')
      .insert({ user_id: userId, ...input })
      .select()
      .single();

    if (error) throw error;
    return { data: data as BuyerProfile, error: null };
  }, 'createBuyerProfile');
}

// Update buyer profile
export async function updateBuyerProfile(
  userId: string,
  updates: UpdateBuyerProfileInput,
): Promise<Result<BuyerProfile | null>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('buyer_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as BuyerProfile, error: null };
  }, 'updateBuyerProfile');
}

// ==================== ADMIN FUNCTIONS ====================

// Fetch all users with pagination
export async function fetchAllUsers(
  filters: UserFilters = {},
  page = 1,
  pageSize = 20,
): Promise<Result<{ data: Profile[]; totalCount: number }>> {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    let filteredData = data || [];
    if (filters.userType) {
      filteredData = filteredData.filter((p) => p.user_type === filters.userType);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filteredData = filteredData.filter(
        (p) =>
          p.username?.toLowerCase().includes(search) ||
          p.full_name?.toLowerCase().includes(search) ||
          p.email?.toLowerCase().includes(search),
      );
    }

    return {
      success: true,
      data: {
        data: filteredData as Profile[],
        totalCount: count || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
<<<<<<< HEAD
      error: error as unknown,
=======
      error: normalizeError(error),
>>>>>>> a275e0e6fd466fe0415be180aa3be0c399054c93
    };
  }
}

// Get user type stats for dashboard
// Fetch seller info map for multiple sellers (using seller_info_view)
<<<<<<< HEAD
export async function fetchSellerInfoMap(sellerIds: string[]): Promise<Result<Map<string, unknown>>> {
=======
export interface SellerInfo {
  user_id: string;
  shop_name: string | null;
  display_name_format: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  [key: string]: unknown;
}

export async function fetchSellerInfoMap(sellerIds: string[]): Promise<Result<Map<string, SellerInfo>>> {
>>>>>>> a275e0e6fd466fe0415be180aa3be0c399054c93
  try {
    if (sellerIds.length === 0) {
      return { success: true, data: new Map() };
    }

    const { data: sellers, error } = await supabase.from('seller_info_view').select('*').in('user_id', sellerIds);

    if (error) throw error;

    const sellerMap = new Map((sellers || []).map((s) => [s.user_id, s]));
    return success(sellerMap);
  } catch (error) {
    logError(error, 'fetchSellerInfoMap');
    return failure(normalizeError(error));
  }
}

// Fetch seller profiles by shop names (for backwards compatibility)
export interface SellerNameMapping {
  user_id: string;
  shop_name: string;
}

export async function fetchSellerProfilesByShopNames(shopNames: string[]): Promise<Result<SellerNameMapping[]>> {
  try {
    if (shopNames.length === 0) {
      return success([]);
    }

    const { data, error } = await supabase
      .from('seller_profiles')
      .select('user_id, shop_name')
      .in('shop_name', shopNames);

    if (error) throw error;

    return success((data || []) as SellerNameMapping[]);
  } catch (error) {
    logError(error, 'fetchSellerProfilesByShopNames');
    return failure(normalizeError(error));
  }
}

// Fetch seller profile with user profile
<<<<<<< HEAD
export async function fetchSellerProfileWithUser(sellerId: string): Promise<Result<unknown>> {
=======
export interface SellerProfileWithUser {
  shop_name: string | null;
  display_name_format: string | null;
  profile: {
    full_name: string | null;
    username: string | null;
  } | null;
  profiles: {
    full_name: string | null;
    username: string | null;
  } | null;
}

export async function fetchSellerProfileWithUser(sellerId: string): Promise<Result<SellerProfileWithUser | null>> {
>>>>>>> a275e0e6fd466fe0415be180aa3be0c399054c93
  try {
    const [sellerResult, profileResult] = await Promise.all([
      supabase.from('seller_profiles').select('shop_name, display_name_format').eq('user_id', sellerId).single(),
      supabase.from('profiles').select('full_name, username').eq('user_id', sellerId).single(),
    ]);

    if (sellerResult.error && sellerResult.error.code !== 'PGRST116') {
      throw sellerResult.error;
    }
    if (profileResult.error && profileResult.error.code !== 'PGRST116') {
      throw profileResult.error;
    }

    return success(
      sellerResult.data
        ? {
            ...sellerResult.data,
            profile: profileResult.data,
            profiles: profileResult.data,
          }
        : null,
    );
  } catch (error) {
    logError(error, 'fetchSellerProfileWithUser');
    return failure(normalizeError(error));
  }
}

export async function fetchUserStats(): Promise<Result<Record<string, number>>> {
  try {
    const { data, error } = await supabase.from('profiles').select('user_type');

    if (error) throw error;

    const counts: Record<string, number> = {
      buyer: 0,
      seller: 0,
      both: 0,
      total: data?.length || 0,
    };

    data?.forEach((profile) => {
      const type = profile.user_type || 'buyer';
      counts[type] = (counts[type] || 0) + 1;
    });

    return { success: true, data: counts };
  } catch (error) {
<<<<<<< HEAD
    return { success: false, error: error as unknown };
=======
    return { success: false, error: normalizeError(error) };
>>>>>>> a275e0e6fd466fe0415be180aa3be0c399054c93
  }
}

// Block a user
export async function blockUser(userId: string): Promise<Result<Profile | null>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_blocked: true })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as Profile, error: null };
  }, 'blockUser');
}

// Unblock a user
export async function unblockUser(userId: string): Promise<Result<Profile | null>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_blocked: false })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as Profile, error: null };
  }, 'unblockUser');
}

// Get user stats counts (listings, orders sold, orders purchased, last purchase date)
export interface UserStatsCounts {
  items_listed: number;
  items_sold: number;
  purchases: number;
  last_purchase_date: string | null;
}

export async function getUserStatsCounts(userId: string): Promise<Result<UserStatsCounts>> {
  return withErrorHandling(async () => {
    const [listingsResult, ordersSoldResult, ordersPurchasedResult, lastOrderResult] = await Promise.all([
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', userId),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('seller_id', userId),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('buyer_id', userId),
      supabase
        .from('orders')
        .select('created_at')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      data: {
        items_listed: listingsResult.count || 0,
        items_sold: ordersSoldResult.count || 0,
        purchases: ordersPurchasedResult.count || 0,
        last_purchase_date: lastOrderResult.data?.created_at || null,
      },
      error: null,
    };
  }, 'getUserStatsCounts');
}

// ==================== SAVED ADDRESSES ====================

export interface SavedAddress {
  id: string;
  user_id: string;
  label?: string | null;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSavedAddressInput {
  user_id: string;
  label?: string | null;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default?: boolean;
}

// Fetch saved addresses for a user
export async function fetchSavedAddresses(userId: string): Promise<Result<SavedAddress[]>> {
  try {
    const { data, error } = await supabase
      .from('saved_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return success((data || []) as SavedAddress[]);
  } catch (error) {
    logError(error, 'userService:fetchSavedAddresses');
    return failure(normalizeError(error));
  }
}

// Create a saved address
export async function createSavedAddress(input: CreateSavedAddressInput): Promise<Result<SavedAddress>> {
  try {
    const { data, error } = await supabase.from('saved_addresses').insert(input).select().single();

    if (error) throw error;

    return success(data as SavedAddress);
  } catch (error) {
    logError(error, 'userService:createSavedAddress');
    return failure(normalizeError(error));
  }
}

// Update buyer profile shipping address
export async function updateBuyerProfileShipping(
  userId: string,
  shippingDetails: {
    shipping_first_name: string;
    shipping_last_name: string;
    shipping_address_line1: string;
    shipping_address_line2?: string;
    shipping_city: string;
    shipping_state: string;
    shipping_postal_code: string;
    shipping_country: string;
    shipping_phone: string;
  },
): Promise<Result<BuyerProfile | null>> {
  try {
    const { data, error } = await supabase
      .from('buyer_profiles')
      .upsert(
        {
          user_id: userId,
          ...shippingDetails,
        },
        { onConflict: 'user_id' },
      )
      .select()
      .single();

    if (error) throw error;

    return success(data as BuyerProfile | null);
  } catch (error) {
    logError(error, 'userService:updateBuyerProfileShipping');
    return failure(normalizeError(error));
  }
}

export interface SystemSellerProfile {
  id: string;
  user_id: string;
  shop_name: string;
  business_name?: string;
  shop_description?: string;
  shop_tagline?: string;
  shop_logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  return_address_line1?: string;
  return_address_line2?: string;
  return_city?: string;
  return_state?: string;
  return_postal_code?: string;
  return_country?: string;
  return_policy?: string;
  shipping_policy?: string;
  display_name_format?: string;
}

export interface SystemSellerAdmin {
  id: string;
  email: string;
  user_id?: string;
  created_at?: string;
  is_active: boolean;
  is_system_seller_admin?: boolean;
  has_super_admin_role?: boolean;
  full_name?: string;
  username?: string;
}

// Fetch system seller profile by shop name
export async function fetchSystemSellerProfile(
  shopName: string = 'VintStreet System',
): Promise<Result<SystemSellerProfile | null>> {
  try {
    const { data, error } = await supabase.from('seller_profiles').select('*').eq('shop_name', shopName).maybeSingle();

    if (error) {
      logError(error, 'fetchSystemSellerProfile');
      return failure(normalizeError(error));
    }

    return success(data as SystemSellerProfile | null);
  } catch (error) {
    logError(error, 'fetchSystemSellerProfile');
    return failure(normalizeError(error));
  }
}

// Update system seller profile
export async function updateSystemSellerProfile(
  profileId: string,
  data: Partial<SystemSellerProfile>,
): Promise<Result<SystemSellerProfile>> {
  try {
    const { data: updated, error } = await supabase
      .from('seller_profiles')
      .update(data)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      logError(error, 'updateSystemSellerProfile');
      return failure(normalizeError(error));
    }

    if (!updated) {
      return failure(new NotFoundError('System seller profile', profileId));
    }

    return success(updated as SystemSellerProfile);
  } catch (error) {
    logError(error, 'updateSystemSellerProfile');
    return failure(normalizeError(error));
  }
}

// Create system seller profile
export async function createSystemSellerProfile(
  userId: string,
  data: Partial<SystemSellerProfile>,
): Promise<Result<SystemSellerProfile>> {
  try {
    const { data: created, error } = await supabase
      .from('seller_profiles')
      .insert({
        user_id: userId,
        ...data,
      })
      .select()
      .single();

    if (error) {
      logError(error, 'createSystemSellerProfile');
      return failure(normalizeError(error));
    }

    return success(created as SystemSellerProfile);
  } catch (error) {
    logError(error, 'createSystemSellerProfile');
    return failure(normalizeError(error));
  }
}

// Fetch all system seller admins (from both system_seller_admins and user_roles)
export async function fetchSystemSellerAdmins(): Promise<Result<SystemSellerAdmin[]>> {
  try {
    // Get all super_admins from user_roles
    const { data: superAdminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role, profiles(user_id, email, full_name, username)')
      .eq('role', 'super_admin');

    if (rolesError) {
      logError(rolesError, 'fetchSystemSellerAdmins');
      return failure(normalizeError(rolesError));
    }

    // Get system_seller_admins entries
    const { data: sellerAdmins, error: sellerError } = await supabase
      .from('system_seller_admins')
      .select('*, profiles(user_id, email, full_name, username)')
      .eq('is_active', true);

    if (sellerError) {
      logError(sellerError, 'fetchSystemSellerAdmins');
      return failure(normalizeError(sellerError));
    }

    // Merge the lists
    const adminMap = new Map<string, SystemSellerAdmin>();

    // Add all super_admins
    superAdminRoles?.forEach((admin: unknown) => {
      const profile = admin.profiles;
      if (profile) {
        adminMap.set(admin.user_id, {
          id: admin.user_id,
          email: profile.email,
          user_id: admin.user_id,
          created_at: null,
          is_active: true,
          is_system_seller_admin: false,
          has_super_admin_role: true,
          full_name: profile.full_name,
          username: profile.username,
        });
      }
    });

    // Override/add system_seller_admins
    sellerAdmins?.forEach((admin: unknown) => {
      const existing = adminMap.get(admin.user_id || admin.email);
      const profile = admin.profiles;

      adminMap.set(admin.user_id || admin.email, {
        id: admin.id,
        email: admin.email,
        user_id: admin.user_id,
        created_at: admin.created_at,
        is_active: admin.is_active,
        is_system_seller_admin: true,
        has_super_admin_role: existing?.has_super_admin_role || !!admin.user_id,
        full_name: profile?.full_name || existing?.full_name,
        username: profile?.username || existing?.username,
      });
    });

    const admins = Array.from(adminMap.values()).sort((a, b) => {
      if (a.created_at && b.created_at) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (a.created_at) return -1;
      if (b.created_at) return 1;
      return 0;
    });

    return success(admins);
  } catch (error) {
    logError(error, 'fetchSystemSellerAdmins');
    return failure(normalizeError(error));
  }
}

// Add system seller admin
export async function addSystemSellerAdmin(email: string, createdBy: string): Promise<Result<{ userExists: boolean }>> {
  try {
    // Check if user exists with this email
    const { data: userId, error: lookupError } = await supabase.rpc('get_user_id_by_email', {
      user_email: email,
    });

    let insertedUserId = null;

    if (!lookupError && userId) {
      insertedUserId = userId;
    }

    // Insert into system_seller_admins
    const { error } = await supabase.from('system_seller_admins').insert({
      email,
      user_id: insertedUserId,
      created_by: createdBy,
    });

    if (error) {
      logError(error, 'addSystemSellerAdmin');
      return failure(normalizeError(error));
    }

    // If user exists, grant role immediately
    if (insertedUserId) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: insertedUserId,
          role: 'super_admin',
        })
        .select()
        .single();

      // Ignore conflict errors (user already has role)
      if (roleError && !roleError.message.includes('duplicate')) {
        logError(roleError, 'addSystemSellerAdmin - grant role');
      }
    }

    return success({ userExists: !!insertedUserId });
  } catch (error) {
    logError(error, 'addSystemSellerAdmin');
    return failure(normalizeError(error));
  }
}

// Remove system seller admin
export async function removeSystemSellerAdmin(adminId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('system_seller_admins').update({ is_active: false }).eq('id', adminId);

    if (error) {
      logError(error, 'removeSystemSellerAdmin');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'removeSystemSellerAdmin');
    return failure(normalizeError(error));
  }
}

// Sync system seller admins with user_roles
export async function syncSystemSellerAdmins(): Promise<Result<unknown>> {
  try {
    const { data, error } = await supabase.rpc('sync_system_seller_admins');

    if (error) {
      logError(error, 'syncSystemSellerAdmins');
      return failure(normalizeError(error));
    }

    return success(data);
  } catch (error) {
    logError(error, 'syncSystemSellerAdmins');
    return failure(normalizeError(error));
  }
}

// Get user ID by email
export async function getUserIdByEmail(email: string): Promise<Result<string | null>> {
  try {
    const { data: userId, error } = await supabase.rpc('get_user_id_by_email', {
      user_email: email,
    });

    if (error) {
      logError(error, 'getUserIdByEmail');
      return failure(normalizeError(error));
    }

    return success(userId);
  } catch (error) {
    logError(error, 'getUserIdByEmail');
    return failure(normalizeError(error));
  }
}
