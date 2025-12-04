import { useState } from 'react';
import { Star, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { Review } from '@/services/reviews';

interface SellerReviewsTabProps {
  reviews: Review[];
  userReview: any;
  userId: string | undefined;
  sellerId: string;
  onSubmitReview: (rating: number, comment: string) => void;
  isSubmitting: boolean;
}

export const SellerReviewsTab = ({
  reviews,
  userReview,
  userId,
  sellerId,
  onSubmitReview,
  isSubmitting,
}: SellerReviewsTabProps) => {
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  const handleSubmit = () => {
    if (!userId) {
      toast.error('Please log in to leave a review');
      return;
    }
    if (!newReview.comment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    onSubmitReview(newReview.rating, newReview.comment);
    setNewReview({ rating: 5, comment: '' });
  };

  return (
    <>
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium">Reviews ({reviews.length})</h3>
          {userId && !userReview && userId !== sellerId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const reviewSection = document.getElementById('add-review');
                reviewSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Review
            </Button>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="py-8 text-center">
            <Star className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No reviews yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {reviews.map((review) => (
              <div key={review.id} className="rounded border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {review.buyer_profile?.full_name || review.buyer_profile?.username || 'Anonymous'}
                  </span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="mb-2 text-sm text-muted-foreground">{review.comment}</p>}
                <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Review Section */}
      {userId && !userReview && userId !== sellerId && (
        <Card className="mt-4 p-6" id="add-review">
          <h3 className="mb-4 font-medium">Leave a Review</h3>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Rating</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-6 w-6 cursor-pointer ${
                      i < newReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                    }`}
                    onClick={() => setNewReview((prev) => ({ ...prev, rating: i + 1 }))}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Comment</p>
              <Textarea
                placeholder="Share your experience..."
                value={newReview.comment}
                onChange={(e) => setNewReview((prev) => ({ ...prev, comment: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>

            <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </Card>
      )}

      {userReview && (
        <Card className="mt-4 p-6">
          <h3 className="mb-3 font-medium">Your Review</h3>
          <div className="mb-2 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < userReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          {userReview.comment && <p className="text-sm text-muted-foreground">{userReview.comment}</p>}
        </Card>
      )}
    </>
  );
};
