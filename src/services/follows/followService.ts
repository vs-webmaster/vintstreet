// Follows Service
// Centralized data access for user follow operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import { normalizeError, logError } from '@/lib/errors';
import type { Result } from '@/types/api';
import { failure } from '@/types/api';

export interface UserFollow {
  id: string;
  follower_id: string;
  followed_user_id: string;
  created_at: string;
}

// Check if a user is following another user
export async function checkFollowStatus(
  followerId: string,
  followedUserId: string,
): Promise<Result<UserFollow | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('user_follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('followed_user_id', followedUserId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return { data: (data as UserFollow) || null, error: null };
  }, 'checkFollowStatus');
}

// Follow a user
export async function followUser(followerId: string, followedUserId: string): Promise<Result<UserFollow>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: followerId,
        followed_user_id: followedUserId,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as UserFollow, error: null };
  }, 'followUser');
}

// Unfollow a user
export async function unfollowUser(followerId: string, followedUserId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('followed_user_id', followedUserId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'unfollowUser');
}

// Unfollow by follow ID
export async function unfollowById(followId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('user_follows').delete().eq('id', followId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'unfollowById');
}

// Fetch users that a user is following
export async function fetchFollowing(userId: string): Promise<Result<UserFollow[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('user_follows').select('*').eq('follower_id', userId);

    if (error) throw error;
    return { data: (data || []) as UserFollow[], error: null };
  }, 'fetchFollowing');
}

// Fetch followers of a user
export async function fetchFollowers(userId: string): Promise<Result<UserFollow[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('user_follows').select('*').eq('followed_user_id', userId);

    if (error) throw error;
    return { data: (data || []) as UserFollow[], error: null };
  }, 'fetchFollowers');
}

// Toggle follow status (follow if not following, unfollow if following)
export async function toggleFollow(
  followerId: string,
  followedUserId: string,
): Promise<Result<{ isFollowing: boolean }>> {
  try {
    const statusResult = await checkFollowStatus(followerId, followedUserId);
    if (!statusResult.success) {
      return statusResult as Result<{ isFollowing: boolean }>;
    }

    const isCurrentlyFollowing = statusResult.data !== null;

    if (isCurrentlyFollowing) {
      const unfollowResult = await unfollowUser(followerId, followedUserId);
      if (!unfollowResult.success) {
        return unfollowResult as Result<{ isFollowing: boolean }>;
      }
      return { success: true, data: { isFollowing: false } };
    } else {
      const followResult = await followUser(followerId, followedUserId);
      if (!followResult.success) {
        return followResult as Result<{ isFollowing: boolean }>;
      }
      return { success: true, data: { isFollowing: true } };
    }
  } catch (error) {
    logError(error, 'followService:toggleFollow');
    return failure(normalizeError(error));
  }
}
