import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HandHeart, Check, X, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { fetchOffersBySeller, updateOfferStatus } from '@/services/offers';
import { createOrder } from '@/services/orders';
import { isSuccess, isFailure } from '@/types/api';

export const OffersTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['seller-offers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const result = await fetchOffersBySeller(user.id);
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    enabled: !!user?.id,
  });

  const updateOfferMutation = useMutation({
    mutationFn: async ({ offerId, status }: { offerId: string; status: 'accepted' | 'declined' }) => {
      // Get the offer details
      const offer = offers.find((o) => o.id === offerId);
      if (!offer) throw new Error('Offer not found');

      // Update offer status using service
      const updateResult = await updateOfferStatus(offerId, status);
      if (isFailure(updateResult)) {
        throw updateResult.error;
      }

      // If accepted, create an order
      // Note: Database trigger automatically updates listing status
      if (status === 'accepted') {
        const orderResult = await createOrder({
          listing_id: offer.listing_id,
          buyer_id: offer.buyer_id,
          seller_id: offer.seller_id,
          order_amount: offer.offer_amount,
          quantity: 1,
          stream_id: 'offer-' + offerId,
          status: 'completed',
          delivery_status: 'processing',
          display_currency: 'GBP',
          display_amount: offer.offer_amount,
          amount_gbp: offer.offer_amount,
        });

        if (isFailure(orderResult)) {
          throw orderResult.error;
        }
      }

      return { offerId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-offers', user?.id] });
      toast.success('Offer updated successfully');
    },
    onError: (error: unknown) => {
      console.error('Error updating offer:', error);
      toast.error(error?.message || 'Failed to update offer');
    },
  });

  const handleOfferAction = (offerId: string, status: 'accepted' | 'declined') => {
    updateOfferMutation.mutate({ offerId, status });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-600 text-yellow-600">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="outline" className="border-green-600 text-green-600">
            <Check className="mr-1 h-3 w-3" />
            Accepted
          </Badge>
        );
      case 'declined':
        return (
          <Badge variant="outline" className="border-red-600 text-red-600">
            <X className="mr-1 h-3 w-3" />
            Declined
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingOffers = offers.filter((offer) => offer.status === 'pending');
  const completedOffers = offers.filter((offer) => offer.status !== 'pending');

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Loading offers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center text-lg font-semibold text-foreground">
          <HandHeart className="mr-2 h-5 w-5 text-blue-600" />
          Product Offers
        </h3>
        <div className="flex gap-2">
          <Badge variant="outline" className="border-yellow-600 text-yellow-600">
            {pendingOffers.length} Pending
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            {completedOffers.length} Completed
          </Badge>
        </div>
      </div>

      {offers.length === 0 ? (
        <div className="py-12 text-center">
          <HandHeart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No offers yet</h3>
          <p className="text-muted-foreground">Offers from buyers will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Offers */}
          {pendingOffers.length > 0 && (
            <div>
              <h4 className="mb-4 text-lg font-medium text-yellow-600">Pending Offers ({pendingOffers.length})</h4>
              <div className="space-y-4">
                {pendingOffers.map((offer) => (
                  <Card key={offer.id} className="border-yellow-200 p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h5 className="font-semibold">Offer #{offer.id.slice(-8)}</h5>
                        <p className="text-sm text-muted-foreground">Listing: {offer.listing_id.slice(-8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(offer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">£{Number(offer.offer_amount).toFixed(2)}</p>
                        {getStatusBadge(offer.status)}
                      </div>
                    </div>

                    {/* Product Details */}
                    {offer.message && (
                      <div className="mb-4 rounded-lg bg-muted p-3">
                        <p className="mb-1 text-sm font-medium">Buyer's Message:</p>
                        <p className="text-sm text-muted-foreground">{offer.message}</p>
                      </div>
                    )}

                    <div className="mb-4 flex items-center gap-3 rounded-lg bg-muted p-3">
                      <img
                        src={
                          offer.listings?.thumbnail ||
                          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=80&h=80&fit=crop'
                        }
                        alt={offer.listings?.product_name || 'Product'}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium">{offer.listings?.product_name || 'Product'}</p>
                        <p className="text-xs text-muted-foreground">
                          Original Price: £{Number(offer.listings?.starting_price || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleOfferAction(offer.id, 'accepted')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={updateOfferMutation.isPending}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Accept Offer
                      </Button>
                      <Button
                        onClick={() => handleOfferAction(offer.id, 'declined')}
                        variant="outline"
                        className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                        disabled={updateOfferMutation.isPending}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Offers */}
          {completedOffers.length > 0 && (
            <div>
              <h4 className="mb-4 text-lg font-medium text-muted-foreground">
                Recent Activity ({completedOffers.length})
              </h4>
              <div className="space-y-4">
                {completedOffers.slice(0, 5).map((offer) => (
                  <Card key={offer.id} className="bg-muted/50 p-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          offer.listings?.thumbnail ||
                          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=80&h=80&fit=crop'
                        }
                        alt={offer.listings?.product_name || 'Product'}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-medium">{offer.listings?.product_name || 'Product'}</h5>
                            <p className="text-sm text-muted-foreground">
                              {new Date(offer.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">£{Number(offer.offer_amount).toFixed(2)}</p>
                            {getStatusBadge(offer.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
