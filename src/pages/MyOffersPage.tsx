import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, HandHeart, Clock, Check, X, Filter, CreditCard, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MakeOfferModal from '@/components/MakeOfferModal';
import { PriceDisplay } from '@/components/PriceDisplay';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { deleteOffer, fetchOffersByBuyerWithDetails, type OfferWithDetails as Offer } from '@/services/offers';
import { createOrder } from '@/services/orders';
import { isFailure } from '@/types/api';

const MyOffersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [offerToCancel, setOfferToCancel] = useState<string | null>(null);

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['buyer-offers', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const result = await fetchOffersByBuyerWithDetails(user.id);
      if (isFailure(result)) throw result.error;

      return result.data;
    },
    enabled: !!user,
  });

  // Get unique categories from offers
  const availableCategories = Array.from(
    new Set(offers.filter((o) => o.listing?.product_categories?.name).map((o) => o.listing!.product_categories!.name)),
  ).sort();

  // Apply filters
  const filteredOffers = offers.filter((offer) => {
    const matchesCategory = categoryFilter === 'all' || offer.listing?.product_categories?.name === categoryFilter;
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    return matchesCategory && matchesStatus;
  });

  const handlePayNow = async (offer: Offer) => {
    if (!offer.listing) return;

    try {
      // Create order for the accepted offer
      // Note: Database trigger automatically updates listing status
      const result = await createOrder({
        buyer_id: user!.id,
        seller_id: offer.seller_id,
        listing_id: offer.listing_id,
        order_amount: offer.offer_amount,
        quantity: 1,
        stream_id: 'shop', // For shop items
        status: 'completed',
        delivery_status: 'processing',
      });

      if (isFailure(result)) {
        toast.error('Failed to process payment');
        console.error(result.error);
        return;
      }

      toast.success('Payment successful! Your order has been placed.');
      // Refresh offers to update payment status
      window.location.reload();
    } catch (error) {
      toast.error('Failed to process payment');
      console.error(error);
    }
  };

  // Cancel offer mutation
  const cancelOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const result = await deleteOffer(offerId);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-offers', user?.id] });
      toast.success('Offer cancelled successfully');
      setOfferToCancel(null);
    },
    onError: (error) => {
      console.error('Error cancelling offer:', error);
      toast.error('Failed to cancel offer');
      setOfferToCancel(null);
    },
  });

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

  const pendingOffers = filteredOffers.filter((offer) => offer.status === 'pending');
  const acceptedOffers = filteredOffers.filter((offer) => offer.status === 'accepted');
  const declinedOffers = filteredOffers.filter((offer) => offer.status === 'declined');

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="flex items-center text-3xl font-bold text-foreground">
              <HandHeart className="mr-3 h-8 w-8 text-blue-600" />
              My Offers
            </h1>
            <p className="mt-1 text-muted-foreground">Track your product offers</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="border-yellow-600 text-yellow-600">
              {pendingOffers.length} Pending
            </Badge>
            <Badge variant="outline" className="border-green-600 text-green-600">
              {acceptedOffers.length} Accepted
            </Badge>
            <Badge variant="outline" className="border-red-600 text-red-600">
              {declinedOffers.length} Declined
            </Badge>
          </div>
        </div>

        {/* Filters */}
        {offers.length > 0 && (
          <div className="mb-6">
            {(categoryFilter !== 'all' || statusFilter !== 'all') && (
              <div className="mb-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCategoryFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Status Filter */}
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('pending')}
                    className={statusFilter === 'pending' ? '' : 'border-yellow-600 text-yellow-600 hover:bg-yellow-50'}
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    Pending
                  </Button>
                  <Button
                    variant={statusFilter === 'accepted' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('accepted')}
                    className={statusFilter === 'accepted' ? '' : 'border-green-600 text-green-600 hover:bg-green-50'}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Accepted
                  </Button>
                  <Button
                    variant={statusFilter === 'declined' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('declined')}
                    className={statusFilter === 'declined' ? '' : 'border-red-600 text-red-600 hover:bg-red-50'}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Declined
                  </Button>
                </div>

                {/* Category Filter */}
                {availableCategories.length > 0 && (
                  <>
                    <div className="h-6 w-px bg-border" />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={categoryFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCategoryFilter('all')}
                      >
                        All Categories
                      </Button>
                      {availableCategories.map((category) => (
                        <Button
                          key={category}
                          variant={categoryFilter === category ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCategoryFilter(category)}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading your offers...</p>
          </div>
        ) : offers.length === 0 || filteredOffers.length === 0 ? (
          offers.length === 0 ? (
            <div className="py-12 text-center">
              <HandHeart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">No offers yet</h3>
              <p className="mb-6 text-muted-foreground">Start making offers on products you're interested in</p>
              <Button onClick={() => navigate('/shop')}>Browse Products</Button>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Filter className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">No matching offers</h3>
              <p className="mb-6 text-muted-foreground">Try adjusting your filters</p>
              <Button
                variant="outline"
                onClick={() => {
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-6">
            {/* Pending Offers */}
            {pendingOffers.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-yellow-600">Pending Offers ({pendingOffers.length})</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {pendingOffers.map((offer) => (
                    <Card
                      key={offer.id}
                      className="overflow-hidden border-yellow-200 transition-shadow hover:shadow-lg"
                    >
                      <div className="relative aspect-square">
                        <img
                          src={
                            offer.listing?.thumbnail ||
                            'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop'
                          }
                          alt={offer.listing?.product_name || 'Product'}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute right-2 top-2">{getStatusBadge(offer.status)}</div>
                      </div>
                      <div className="p-4">
                        <h3 className="mb-1 line-clamp-2 text-base font-semibold">
                          {offer.listing?.product_name || 'Product'}
                        </h3>
                        {offer.listing?.product_categories?.name && (
                          <Badge variant="outline" className="mb-2 text-xs">
                            {offer.listing.product_categories.name}
                          </Badge>
                        )}
                        <div className="mb-3 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Original:</span>
                            <PriceDisplay
                              gbpPrice={Number(offer.listing?.starting_price || 0)}
                              className="font-medium"
                            />
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Your Offer:</span>
                            <PriceDisplay gbpPrice={Number(offer.offer_amount)} className="font-bold text-green-600" />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(offer.created_at).toLocaleDateString()}
                        </p>
                        {offer.message && (
                          <div className="mt-3 rounded bg-muted p-2 text-xs">
                            <p className="mb-1 font-medium">Your Message:</p>
                            <p className="line-clamp-2 text-muted-foreground">{offer.message}</p>
                          </div>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="mt-3 w-full"
                          onClick={() => setOfferToCancel(offer.id)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Cancel Offer
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Accepted Offers */}
            {acceptedOffers.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-green-600">Accepted Offers ({acceptedOffers.length})</h2>
                <div className="grid gap-4">
                  {acceptedOffers.map((offer) => (
                    <Card key={offer.id} className="border-green-200 bg-green-50/50 p-4">
                      <div className="flex gap-4">
                        <img
                          src={
                            offer.listing?.thumbnail ||
                            'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=80&h=80&fit=crop'
                          }
                          alt={offer.listing?.product_name || 'Product'}
                          loading="lazy"
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{offer.listing?.product_name || 'Product'}</h3>
                              {offer.listing?.product_categories?.name && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {offer.listing.product_categories.name}
                                </Badge>
                              )}
                              <p className="mt-1 text-sm text-muted-foreground">
                                {new Date(offer.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 text-right">
                              <div>
                                <p className="text-lg font-semibold">£{Number(offer.offer_amount).toFixed(2)}</p>
                                {getStatusBadge(offer.status)}
                              </div>
                              {!offer.payment_completed ? (
                                <div className="flex flex-col items-end gap-1">
                                  <Badge variant="outline" className="border-red-600 text-red-600">
                                    Payment Pending
                                  </Badge>
                                  <Button size="sm" onClick={() => handlePayNow(offer)} className="mt-1">
                                    <CreditCard className="mr-1 h-3 w-3" />
                                    Pay Now
                                  </Button>
                                </div>
                              ) : (
                                <Badge variant="outline" className="border-green-600 text-green-600">
                                  Payment Completed
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Declined Offers */}
            {declinedOffers.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-red-600">Declined Offers ({declinedOffers.length})</h2>
                <div className="grid gap-4">
                  {declinedOffers.map((offer) => (
                    <Card key={offer.id} className="border-red-200 bg-red-50/50 p-4">
                      <div className="flex gap-4">
                        <img
                          src={
                            offer.listing?.thumbnail ||
                            'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=80&h=80&fit=crop'
                          }
                          alt={offer.listing?.product_name || 'Product'}
                          loading="lazy"
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium">{offer.listing?.product_name || 'Product'}</h3>
                              {offer.listing?.product_categories?.name && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {offer.listing.product_categories.name}
                                </Badge>
                              )}
                              <p className="mt-1 text-sm text-muted-foreground">
                                {new Date(offer.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 text-right">
                              <div>
                                <p className="text-lg font-semibold">£{Number(offer.offer_amount).toFixed(2)}</p>
                                {getStatusBadge(offer.status)}
                              </div>
                              <MakeOfferModal
                                productId={offer.listing_id}
                                productName={offer.listing?.product_name || 'Product'}
                                currentPrice={offer.listing?.starting_price || 0}
                                sellerId={offer.seller_id}
                              >
                                <Button size="sm" variant="outline">
                                  Make New Offer
                                </Button>
                              </MakeOfferModal>
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

      {/* Cancel Offer Confirmation Dialog */}
      <AlertDialog open={!!offerToCancel} onOpenChange={(open) => !open && setOfferToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Offer?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this offer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Offer</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => offerToCancel && cancelOfferMutation.mutate(offerToCancel)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Offer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Footer />
    </div>
  );
};

export default MyOffersPage;
