import { useState, useEffect } from 'react';
import { Timer, Gavel, Crown, ArrowUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SvgAngledButton } from '@/components/ui/svg-angled-button';
import { BiddingFeesInfo } from '@/components/BiddingFeesInfo';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { fetchAuctionByListingId } from '@/services/auctions';
import { invokeEdgeFunction } from '@/services/functions';
import { fetchProductsByStream } from '@/services/products';
import { subscribeToPostgresChanges } from '@/services/realtime';
import { isFailure, isSuccess } from '@/types/api';

interface Listing {
  id: string;
  product_name: string;
  product_description: string;
  starting_price: number;
  current_bid: number;
  status: string;
  auction_end_time: string | null;
  seller_id: string;
}
interface Bid {
  id: string;
  listing_id: string;
  bidder_id: string;
  bid_amount: number;
  created_at: string;
}
interface BiddingSectionProps {
  streamId: string;
  isStreamer?: boolean;
}
const BiddingSection = ({ streamId, isStreamer = false }: BiddingSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [bids, setBids] = useState<Record<string, Bid[]>>({});
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showCustomBid, setShowCustomBid] = useState<Record<string, boolean>>({});
  useEffect(() => {
    fetchListings();
    const unsubscribe = subscribeToUpdates();
    return unsubscribe;
  }, [streamId]);
  const fetchListings = async () => {
    const result = await fetchProductsByStream(streamId, { status: 'published' });

    if (isSuccess(result) && result.data && result.data.length > 0) {
      setListings(result.data as unknown);

      // Note: Bids table not yet implemented - commenting out for now
      // for (const listing of listingsData) {
      //   const { data: bidsData } = await supabase.from('bids').select('*')
      //     .eq('listing_id', listing.id).order('created_at', { ascending: false }).limit(5);
      //   if (bidsData) {
      //     setBids(prev => ({ ...prev, [listing.id]: bidsData }));
      //   }
      // }
    } else {
      // Add mock data for demonstration when no real auctions exist
      const mockListings: Listing[] = [
        {
          id: 'demo-1',
          product_name: 'Item #23',
          product_description: 'Authentic Chanel quilted leather bag in excellent condition',
          starting_price: 150,
          current_bid: 15,
          status: 'published',
          auction_end_time: new Date(Date.now() + 15 * 1000).toISOString(),
          // 15 seconds from now
          seller_id: 'demo-seller',
        },
      ];
      setListings(mockListings);

      // Add mock bids
      setBids({
        'demo-1': [
          {
            id: 'bid-1',
            listing_id: 'demo-1',
            bidder_id: 'bidder-123',
            bid_amount: 15,
            created_at: new Date().toISOString(),
          },
          {
            id: 'bid-2',
            listing_id: 'demo-1',
            bidder_id: 'bidder-456',
            bid_amount: 275,
            created_at: new Date(Date.now() - 60000).toISOString(),
          },
          {
            id: 'bid-3',
            listing_id: 'demo-1',
            bidder_id: 'bidder-789',
            bid_amount: 260,
            created_at: new Date(Date.now() - 120000).toISOString(),
          },
        ],
      });
    }
  };
  const subscribeToUpdates = () => {
    // Subscribe to listing updates
    const unsubscribeListings = subscribeToPostgresChanges(
      'listings_updates',
      {
        table: 'listings',
        filter: `stream_id=eq.${streamId}`,
        event: '*',
      },
      () => fetchListings(),
    );

    // Subscribe to bid updates
    const unsubscribeBids = subscribeToPostgresChanges<Bid>(
      'bids_updates',
      {
        table: 'bids',
        event: 'INSERT',
      },
      (payload) => {
        if (payload.new) {
          const newBid = payload.new;
          setBids((prev) => ({
            ...prev,
            [newBid.listing_id]: [newBid, ...(prev[newBid.listing_id] || [])].slice(0, 5),
          }));
        }
      },
    );

    return () => {
      unsubscribeListings();
      unsubscribeBids();
    };
  };
  const placeBid = async (listingId: string) => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to place a bid',
        variant: 'destructive',
      });
      return;
    }

    const maxBidAmount = parseFloat(bidAmounts[listingId] || '0');
    const currentListing = listings.find((l) => l.id === listingId);

    if (!currentListing) {
      toast({
        title: 'Error',
        description: 'Listing not found',
        variant: 'destructive',
      });
      return;
    }

    // Get the auction ID for this listing
    const auctionResult = await fetchAuctionByListingId(listingId);
    if (isFailure(auctionResult) || !auctionResult.data) {
      toast({
        title: 'Error',
        description: 'Auction not found or has ended',
        variant: 'destructive',
      });
      return;
    }

    const auction = auctionResult.data;

    const currentBid = auction.current_bid || auction.starting_bid || 0;
    const increment = currentBid < 50 ? 1 : currentBid < 100 ? 2 : currentBid < 500 ? 5 : 10;
    const minimumBid = currentBid + increment;

    if (maxBidAmount < minimumBid) {
      toast({
        title: 'Bid too low',
        description: `Your maximum bid must be at least £${minimumBid.toFixed(2)}`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Call the proxy bidding edge function
      const result = await invokeEdgeFunction<{
        success: boolean;
        isLeading: boolean;
        currentBid: number;
        error?: string;
      }>({
        functionName: 'place-proxy-bid',
        body: {
          auctionId: auction.id,
          maxBidAmount: maxBidAmount,
        },
      });

      if (isFailure(result)) throw result.error;

      const data = result.data;
      if (data.success) {
        setBidAmounts((prev) => ({
          ...prev,
          [listingId]: '',
        }));

        const isLeading = data.isLeading;
        toast({
          title: isLeading ? "You're winning! 🎉" : 'Bid placed',
          description: isLeading
            ? `Current bid: £${data.currentBid.toFixed(2)} (You're leading with your max of £${maxBidAmount.toFixed(
                2,
              )})`
            : `Current bid: £${data.currentBid.toFixed(2)} (Another bidder is leading)`,
        });
      } else {
        throw new Error(data.error || 'Failed to place bid');
      }
    } catch (error: unknown) {
      console.error('Error placing bid:', error);
      toast({
        title: 'Error placing bid',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  const getNextBidAmount = (currentBid: number) => {
    // Calculate next bid increment based on current bid level
    if (currentBid < 50) return currentBid + 1;
    if (currentBid < 100) return currentBid + 2;
    if (currentBid < 500) return currentBid + 5;
    return currentBid + 10;
  };
  const placeQuickBid = async (listingId: string, amount: number) => {
    setBidAmounts((prev) => ({
      ...prev,
      [listingId]: amount.toString(),
    }));
    await placeBid(listingId);
  };
  const toggleCustomBid = (listingId: string) => {
    setShowCustomBid((prev) => ({
      ...prev,
      [listingId]: !prev[listingId],
    }));
  };
  const formatTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Auction ended';
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  return (
    <div className="space-y-4">
      {listings.length === 0 ? (
        <>
          <Card className="p-6">
            <div className="text-center text-muted-foreground">
              <Gavel className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p>No active auctions in this stream</p>
            </div>
          </Card>

          <BiddingFeesInfo />
        </>
      ) : (
        <>
          {listings.map((listing) => (
            <Card key={listing.id} className="border-gray-800 bg-black p-3 text-white">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{listing.product_name}</h3>
                </div>
                {listing.auction_end_time && (
                  <Badge variant="outline" className="flex items-center gap-1 border-gray-600 text-white">
                    <Timer className="h-3 w-3" />
                    {formatTimeRemaining(listing.auction_end_time)}
                  </Badge>
                )}
              </div>

              {/* Live Auction State */}
              <div className="mb-2 rounded-lg bg-gray-900 p-2">
                {!isStreamer && user && (
                  <div className="space-y-2">
                    {/* Quick Bid Button */}
                    <div className="flex items-center justify-center gap-2">
                      <SvgAngledButton
                        onClick={() => placeQuickBid(listing.id, getNextBidAmount(listing.current_bid))}
                        disabled={loading}
                      >
                        £{getNextBidAmount(listing.current_bid)}
                        <ArrowUp className="animate-arrow-up h-4 w-4" />
                      </SvgAngledButton>
                      <Button
                        onClick={() => toggleCustomBid(listing.id)}
                        variant="outline"
                        disabled={loading}
                        className="border-border bg-transparent text-primary-foreground hover:bg-muted/20 focus-visible:ring-ring"
                      >
                        Custom Bid
                      </Button>
                    </div>

                    {/* Custom Bid Input */}
                    {showCustomBid[listing.id] && (
                      <div className="flex gap-2 rounded border border-gray-700 bg-gray-800 p-2">
                        <div className="flex-1">
                          <Input
                            type="number"
                            placeholder="Enter your maximum bid"
                            value={bidAmounts[listing.id] || ''}
                            onChange={(e) =>
                              setBidAmounts((prev) => ({
                                ...prev,
                                [listing.id]: e.target.value,
                              }))
                            }
                            className="flex-1 border-gray-600 bg-gray-700 text-white"
                            min={listing.current_bid + 0.01}
                            step="0.01"
                          />
                          <p className="mt-1 text-xs text-muted-foreground">We'll bid for you up to this amount</p>
                        </div>
                        <Button
                          onClick={() => placeBid(listing.id)}
                          disabled={loading || !bidAmounts[listing.id]}
                          className="self-start bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <Gavel className="mr-2 h-4 w-4" />
                          Bid
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {bids[listing.id] && bids[listing.id].length > 0 && (
                <>
                  <Separator className="my-2 bg-gray-700" />
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-white">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      Currently Winning:
                      <span className="font-medium text-yellow-400">
                        Bidder {bids[listing.id][0].bidder_id.slice(0, 8)}...
                      </span>
                    </p>
                  </div>
                </>
              )}
            </Card>
          ))}

          <BiddingFeesInfo />
        </>
      )}
    </div>
  );
};
export default BiddingSection;
