import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, User, Reply, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { StarRating } from '@/components/StarRating';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { fetchReviewsWithRepliesBySeller, createReviewReply, type ReviewWithReplies } from '@/services/reviews';
import { isSuccess, isFailure } from '@/types/api';

export const ReviewsTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [showReplyBox, setShowReplyBox] = useState<{ [key: string]: boolean }>({});

  // Fetch reviews for the current seller
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['seller-reviews', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const result = await fetchReviewsWithRepliesBySeller(user.id);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!user?.id,
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, reply }: { reviewId: string; reply: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const result = await createReviewReply({
        review_id: reviewId,
        seller_id: user.id,
        reply_text: reply.trim(),
      });

      if (isFailure(result)) {
        throw result.error;
      }

      return result.data;
    },
    onSuccess: (_, { reviewId }) => {
      queryClient.invalidateQueries({ queryKey: ['seller-reviews', user?.id] });
      setReplyText((prev) => ({ ...prev, [reviewId]: '' }));
      setShowReplyBox((prev) => ({ ...prev, [reviewId]: false }));
      toast.success('Reply posted successfully!');
    },
    onError: (error: unknown) => {
      console.error('Error posting reply:', error);
      toast.error(error?.message || 'Failed to post reply');
    },
  });

  const handleReply = (reviewId: string) => {
    const reply = replyText[reviewId]?.trim();
    if (!reply) return;

    replyMutation.mutate({ reviewId, reply });
  };

  const toggleReplyBox = (reviewId: string) => {
    setShowReplyBox((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const updateReplyText = (reviewId: string, text: string) => {
    setReplyText((prev) => ({
      ...prev,
      [reviewId]: text,
    }));
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-1/3 rounded bg-muted"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded bg-muted"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-6 text-lg font-semibold text-foreground">Customer Reviews</h3>

      {reviews.length === 0 ? (
        <div className="py-8 text-center">
          <Star className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No reviews yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Reviews from customers will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg border p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {review.buyer_profile?.avatar_url ? (
                      <img
                        src={review.buyer_profile.avatar_url}
                        alt="Customer"
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {review.buyer_profile?.full_name || review.buyer_profile?.username || 'Anonymous Customer'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(review.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
                <StarRating rating={review.rating} size="md" />
              </div>

              {review.comment && <p className="mb-3 text-sm text-muted-foreground">{review.comment}</p>}

              {/* Existing Replies */}
              {review.review_replies && review.review_replies.length > 0 && (
                <div className="mt-4 border-l-2 border-muted pl-4">
                  {review.review_replies.map((reply) => (
                    <div key={reply.id} className="mb-2 rounded-lg bg-muted/30 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                          <Reply className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm font-medium">You replied</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(reply.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-sm">{reply.reply_text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Section */}
              <div className="mt-4 border-t pt-3">
                {!showReplyBox[review.id] ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleReplyBox(review.id)}
                    className="text-primary"
                  >
                    <Reply className="mr-2 h-4 w-4" />
                    Reply to Review
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Write your reply..."
                      value={replyText[review.id] || ''}
                      onChange={(e) => updateReplyText(review.id, e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleReply(review.id)}
                        disabled={!replyText[review.id]?.trim() || replyMutation.isPending}
                        size="sm"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {replyMutation.isPending ? 'Posting...' : 'Post Reply'}
                      </Button>
                      <Button variant="outline" onClick={() => toggleReplyBox(review.id)} size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
