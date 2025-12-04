// Review Service
// Centralized data access for review operations

import { supabase } from '@/integrations/supabase/client';
import type { Result } from '@/types/api';
import { success, failure, isFailure } from '@/types/api';
import { normalizeError, logError } from '@/lib/errors';

export interface Review {
  id: string;
  buyer_id: string;
  seller_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  updated_at: string;
  buyer_profile?: {
    full_name: string | null;
    username: string | null;
    avatar_url?: string | null;
  } | null;
}

export interface ReviewReply {
  id: string;
  review_id: string;
  seller_id: string;
  reply_text: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithReplies extends Review {
  review_replies: ReviewReply[];
}

export interface CreateReviewInput {
  buyer_id: string;
  seller_id: string;
  rating: number;
  comment?: string | null;
}

export interface CreateReviewReplyInput {
  review_id: string;
  seller_id: string;
  reply_text: string;
}

// Fetch reviews by seller ID
export async function fetchReviewsBySeller(sellerId: string): Promise<Result<Review[]>> {
  try {
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('id, buyer_id, seller_id, rating, comment, created_at, updated_at')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (reviewsError) throw reviewsError;

    if (!reviewsData || reviewsData.length === 0) {
      return success([]);
    }

    // Fetch buyer profiles
    const buyerIds = [...new Set(reviewsData.map((r) => r.buyer_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, avatar_url')
      .in('user_id', buyerIds);

    if (profilesError) throw profilesError;

    const profilesMap = new Map((profilesData || []).map((p) => [p.user_id, p]));

    const reviewsWithProfiles: Review[] = reviewsData.map((review) => ({
      ...review,
      buyer_profile: profilesMap.get(review.buyer_id) || null,
    }));

    return success(reviewsWithProfiles);
  } catch (error) {
    logError(error, 'reviewService:fetchReviewsBySeller');
    return failure(normalizeError(error));
  }
}

// Fetch reviews with replies by seller ID
export async function fetchReviewsWithRepliesBySeller(sellerId: string): Promise<Result<ReviewWithReplies[]>> {
  try {
    // Fetch reviews
    const reviewsResult = await fetchReviewsBySeller(sellerId);
    if (isFailure(reviewsResult)) {
      return reviewsResult;
    }

    const reviews = reviewsResult.data || [];
    if (reviews.length === 0) {
      return success([]);
    }

    // Fetch review replies
    const reviewIds = reviews.map((r) => r.id);
    const { data: repliesData, error: repliesError } = await supabase
      .from('review_replies')
      .select('*')
      .in('review_id', reviewIds);

    if (repliesError) throw repliesError;

    // Group replies by review_id
    const repliesMap = new Map<string, ReviewReply[]>();
    (repliesData || []).forEach((reply) => {
      if (!repliesMap.has(reply.review_id)) {
        repliesMap.set(reply.review_id, []);
      }
      repliesMap.get(reply.review_id)!.push(reply as ReviewReply);
    });

    // Combine reviews with replies
    const reviewsWithReplies: ReviewWithReplies[] = reviews.map((review) => ({
      ...review,
      review_replies: repliesMap.get(review.id) || [],
    }));

    return success(reviewsWithReplies);
  } catch (error) {
    logError(error, 'reviewService:fetchReviewsWithRepliesBySeller');
    return failure(normalizeError(error));
  }
}

// Check if user has reviewed a seller
export async function checkUserReview(buyerId: string, sellerId: string): Promise<Result<Review | null>> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine
      throw error;
    }

    return success((data || null) as Review | null);
  } catch (error) {
    logError(error, 'reviewService:checkUserReview');
    return failure(normalizeError(error));
  }
}

// Create a review
export async function createReview(input: CreateReviewInput): Promise<Result<Review>> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        buyer_id: input.buyer_id,
        seller_id: input.seller_id,
        rating: input.rating,
        comment: input.comment?.trim() || null,
      })
      .select()
      .single();

    if (error) throw error;

    return success(data as Review);
  } catch (error) {
    logError(error, 'reviewService:createReview');
    return failure(normalizeError(error));
  }
}

// Create a review reply
export async function createReviewReply(input: CreateReviewReplyInput): Promise<Result<ReviewReply>> {
  try {
    const { data, error } = await supabase
      .from('review_replies')
      .insert({
        review_id: input.review_id,
        seller_id: input.seller_id,
        reply_text: input.reply_text,
      })
      .select()
      .single();

    if (error) throw error;

    return success(data as ReviewReply);
  } catch (error) {
    logError(error, 'reviewService:createReviewReply');
    return failure(normalizeError(error));
  }
}

// Get review statistics for a seller
export async function getReviewStats(sellerId: string): Promise<
  Result<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  }>
> {
  try {
    const reviewsResult = await fetchReviewsBySeller(sellerId);
    if (isFailure(reviewsResult)) {
      return reviewsResult;
    }

    const reviews = reviewsResult.data || [];

    if (reviews.length === 0) {
      return success({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
    });

    return success({
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution,
    });
  } catch (error) {
    logError(error, 'reviewService:getReviewStats');
    return failure(normalizeError(error));
  }
}

// Get count of unreplied reviews for a seller
export async function getUnrepliedReviewCount(sellerId: string): Promise<Result<number>> {
  try {
    const reviewsResult = await fetchReviewsBySeller(sellerId);
    if (isFailure(reviewsResult)) {
      return reviewsResult as Result<number>;
    }

    const reviews = reviewsResult.data || [];
    if (reviews.length === 0) {
      return success(0);
    }

    // Fetch all review replies for these reviews
    const reviewIds = reviews.map((r) => r.id);
    const { data: repliesData, error: repliesError } = await supabase
      .from('review_replies')
      .select('review_id')
      .in('review_id', reviewIds);

    if (repliesError) throw repliesError;

    const repliedReviewIds = new Set((repliesData || []).map((r) => r.review_id));
    const unrepliedCount = reviews.filter((r) => !repliedReviewIds.has(r.id)).length;

    return success(unrepliedCount);
  } catch (error) {
    logError(error, 'reviewService:getUnrepliedReviewCount');
    return failure(normalizeError(error));
  }
}
