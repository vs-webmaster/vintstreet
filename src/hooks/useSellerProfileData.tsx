import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkFollowStatus, followUser, unfollowUser } from '@/services/follows';
import { fetchProducts } from '@/services/products';
import { fetchReviewsBySeller, checkUserReview, createReview } from '@/services/reviews';
import { fetchStreamsByUserId } from '@/services/streams';
import { fetchSellerProfileWithUser, fetchProfile } from '@/services/users';
import { isFailure } from '@/types/api';

interface SellerProfile {
  id?: string;
  user_id: string;
  business_name?: string;
  shop_name?: string;
  shop_description?: string;
  shop_logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  return_address_line1?: string;
  return_city?: string;
  return_state?: string;
  return_country?: string;
  profile?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
    user_type?: string;
  };
  profiles?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
    user_type?: string;
  };
}

interface Stream {
  id: string;
  title: string;
  description?: string;
  status: 'live' | 'scheduled' | 'ended';
  start_time: string;
  category: string;
  thumbnail?: string;
  viewer_count: number;
}

export const useSellerProfileData = (sellerId: string | undefined, userId: string | undefined) => {
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(false);

  // Fetch seller profile
  const { data: sellerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['seller-profile', sellerId],
    queryFn: async () => {
      if (!sellerId) return null;

      const result = await fetchSellerProfileWithUser(sellerId);

      if (!result.success || !result.data) {
        // Fallback: fetch from profiles if no seller profile exists
        const profileResult = await fetchProfile(sellerId);

        if (!isFailure(profileResult) && profileResult.data) {
          const userData = profileResult.data;
          return {
            user_id: sellerId,
            shop_name: userData.full_name || userData.username || 'Seller Profile',
            shop_description: 'Professional seller on VintStreet',
            profiles: {
              username: userData.username,
              full_name: userData.full_name,
              avatar_url: userData.avatar_url,
              user_type: userData.user_type,
            },
          } as SellerProfile;
        }
        return null;
      }

      return result.data as SellerProfile;
    },
    enabled: !!sellerId,
  });

  // Fetch seller's upcoming streams
  const { data: upcomingStreams = [] } = useQuery({
    queryKey: ['seller-upcoming-streams', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const result = await fetchStreamsByUserId(sellerId);

      if (isFailure(result)) {
        console.error('Error fetching streams:', result.error);
        return [];
      }

      // Filter for scheduled streams and sort
      return result.data
        .filter((stream) => stream.status === 'scheduled')
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()) as Stream[];
    },
    enabled: !!sellerId,
  });

  // Fetch seller's products
  const { data: sellerProducts = [] } = useQuery({
    queryKey: ['seller-products', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const result = await fetchProducts(
        {
          sellerId,
          status: ['published', 'private'],
        },
        1,
        1000,
      );

      if (isFailure(result)) {
        console.error('Error fetching products:', result.error);
        return [];
      }

      // Filter out livestream products
      return result.data.products.filter((product) => product.product_type !== 'livestream');
    },
    enabled: !!sellerId,
  });

  // Fetch seller reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['seller-reviews', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const result = await fetchReviewsBySeller(sellerId);

      if (isFailure(result)) {
        console.error('Error fetching reviews:', result.error);
        return [];
      }

      return result.data || [];
    },
    enabled: !!sellerId,
  });

  // Check if current user has reviewed
  const { data: userReview } = useQuery({
    queryKey: ['user-review', userId, sellerId],
    queryFn: async () => {
      if (!userId || !sellerId) return null;

      const result = await checkUserReview(userId, sellerId);

      if (isFailure(result)) {
        console.error('Error checking user review:', result.error);
        return null;
      }

      return result.data;
    },
    enabled: !!userId && !!sellerId,
  });

  // Check follow status
  const { data: followStatus } = useQuery({
    queryKey: ['follow-status', userId, sellerId],
    queryFn: async () => {
      if (!userId || !sellerId) return null;

      const result = await checkFollowStatus(userId, sellerId);

      if (isFailure(result)) {
        console.error('Error checking follow status:', result.error);
        return null;
      }

      return result.data;
    },
    enabled: !!userId && !!sellerId,
  });

  useEffect(() => {
    setIsFollowing(!!followStatus);
  }, [followStatus]);

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ action }: { action: 'follow' | 'unfollow' }) => {
      if (!userId || !sellerId) throw new Error('Missing user or seller ID');

      if (action === 'follow') {
        const result = await followUser(userId, sellerId);
        if (isFailure(result)) throw result.error;
      } else {
        const result = await unfollowUser(userId, sellerId);
        if (isFailure(result)) throw result.error;
      }
    },
    onSuccess: (_, { action }) => {
      setIsFollowing(action === 'follow');
      toast.success(action === 'follow' ? 'Now following seller!' : 'Unfollowed seller');
      queryClient.invalidateQueries({ queryKey: ['follow-status', userId, sellerId] });
    },
    onError: (error) => {
      console.error('Follow/unfollow error:', error);
      toast.error('Failed to update follow status');
    },
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment: string }) => {
      if (!userId || !sellerId) throw new Error('Missing user or seller ID');

      const result = await createReview({
        buyer_id: userId,
        seller_id: sellerId,
        rating,
        comment: comment.trim() || null,
      });

      if (isFailure(result)) {
        throw result.error;
      }
    },
    onSuccess: () => {
      toast.success('Review submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['seller-reviews', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', userId, sellerId] });
    },
    onError: (error) => {
      console.error('Submit review error:', error);
      toast.error('Failed to submit review');
    },
  });

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  };

  return {
    sellerProfile,
    profileLoading,
    upcomingStreams,
    sellerProducts,
    reviews,
    userReview,
    isFollowing,
    followMutation,
    submitReviewMutation,
    getAverageRating,
  };
};
