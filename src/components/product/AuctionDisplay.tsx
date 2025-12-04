import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Hammer, TrendingUp, Info } from 'lucide-react';
import { toast } from 'sonner';
import { PriceDisplay } from '@/components/PriceDisplay';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { fetchAuctionByListingId, fetchBidsByAuctionId } from '@/services/auctions';
import { invokeEdgeFunction } from '@/services/functions';
import { isFailure } from '@/types/api';

interface AuctionDisplayProps {
  productId: string;
}

export const AuctionDisplay = ({ productId }: AuctionDisplayProps) => {
  const { user } = useAuth();
  const [bidAmount, setBidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  // Fetch auction data
  const { data: auction, refetch: refetchAuction } = useQuery({
    queryKey: ['auction', productId],
    queryFn: async () => {
      const result = await fetchAuctionByListingId(productId);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Fetch bid history
  const { data: bids = [] } = useQuery({
    queryKey: ['bids', auction?.id],
    queryFn: async () => {
      if (!auction?.id) return [];
      const result = await fetchBidsByAuctionId(auction.id);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!auction?.id,
    refetchInterval: 5000,
  });

  // Calculate time remaining
  useEffect(() => {
    if (!auction?.end_time) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const end = new Date(auction.end_time);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Auction ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [auction?.end_time]);

  const handlePlaceBid = async () => {
    if (!user) {
      toast.error('Please sign in to place a bid');
      return;
    }

    if (!auction) return;

    const maxBidAmount = parseFloat(bidAmount);
    if (isNaN(maxBidAmount) || maxBidAmount <= 0) {
      toast.error('Please enter a valid maximum bid');
      return;
    }

    const currentBid = auction.current_bid || auction.starting_bid || 0;
    const increment = currentBid < 50 ? 1 : currentBid < 100 ? 2 : currentBid < 500 ? 5 : 10;
    const minimumBid = currentBid + increment;

    if (maxBidAmount < minimumBid) {
      toast.error(`Maximum bid must be at least £${minimumBid.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);

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
        const isLeading = data.isLeading;
        toast.success(
          isLeading
            ? `You're winning! Current bid: £${data.currentBid.toFixed(2)}`
            : `Bid placed! Current bid: £${data.currentBid.toFixed(2)} (another bidder is leading)`,
        );
        setBidAmount('');
        refetchAuction();
      } else {
        throw new Error(data.error || 'Failed to place bid');
      }
    } catch (error: unknown) {
      console.error('Error placing bid:', error);
      toast.error(error.message || 'Failed to place bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!auction) return null;

  const isAuctionEnded = timeRemaining === 'Auction ended';

  return (
    <Card
      className={`border-2 p-6 shadow-lg ${
        isAuctionEnded
          ? 'border-muted bg-gradient-to-br from-muted/50 to-muted/30'
          : 'border-blue-500/20 bg-gradient-to-br from-blue-50 via-primary/5 to-secondary/10'
      }`}
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-full p-2 shadow-md ${
              isAuctionEnded
                ? 'bg-gradient-to-br from-muted-foreground to-muted-foreground/80'
                : 'bg-gradient-to-br from-blue-500 to-blue-600'
            }`}
          >
            <Hammer className="h-6 w-6 text-white" />
          </div>
          <Badge
            className={`border-0 px-4 py-1.5 text-base font-semibold shadow-md ${
              isAuctionEnded
                ? 'bg-muted-foreground text-white'
                : 'animate-pulse bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
            }`}
          >
            {isAuctionEnded ? 'AUCTION ENDED' : 'LIVE AUCTION'}
          </Badge>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden md:inline">How it works</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>How Auto-Bidding Works</DialogTitle>
              <DialogDescription className="space-y-3 pt-4 text-left">
                <p className="flex items-start gap-2">
                  <span className="font-bold text-primary">•</span>
                  <span>Enter your maximum bid - this is the highest amount you're willing to pay</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-primary">•</span>
                  <span>The system will automatically bid incrementally on your behalf</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-primary">•</span>
                  <span>You'll only pay the minimum amount needed to stay in the lead</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-primary">•</span>
                  <span>Your maximum bid is kept confidential from other bidders</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-primary">•</span>
                  <span className="font-semibold">
                    Your bid is binding - if you win, you must complete the purchase
                  </span>
                </p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        <div>
          <p className="mb-1 text-xs text-muted-foreground md:text-sm">Current Bid</p>
          <div className="text-lg font-bold md:text-xl">
            <PriceDisplay gbpPrice={auction.current_bid} />
          </div>
          {!auction.reserve_met && (
            <Badge variant="outline" className="mt-1 border-orange-500 text-xs text-orange-500 md:mt-2">
              Reserve not met
            </Badge>
          )}
        </div>

        <div>
          <p className="mb-1 text-xs text-muted-foreground md:text-sm">Time Remaining</p>
          <div className="flex items-center gap-2 text-base font-semibold md:text-lg">
            <Clock className="h-4 w-4" />
            {timeRemaining}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs text-muted-foreground md:text-sm">Total Bids</p>
          <div className="flex items-center gap-2 text-base font-semibold md:text-lg">
            <TrendingUp className="h-4 w-4" />
            {auction.bid_count}
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {isAuctionEnded ? (
        <div className="rounded-lg border border-muted bg-muted/50 p-4 text-center">
          <p className="text-base font-semibold text-muted-foreground">This auction has ended</p>
          <p className="mt-1 text-sm text-muted-foreground">Bidding is no longer available for this item</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="bid-amount" className="text-sm font-semibold md:text-base">
              Place Your Bid
            </Label>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden md:inline">Bid History</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bid History ({bids.length})</DialogTitle>
                </DialogHeader>
                {bids.length > 0 ? (
                  <div className="max-h-[400px] space-y-2 overflow-y-auto pr-2">
                    {bids.map((bid, index) => (
                      <div
                        key={bid.id}
                        className={`flex items-center justify-between rounded-lg border p-3 ${
                          index === 0 ? 'border-primary/30 bg-primary/10' : 'border-muted bg-muted/50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-bold">
                              <PriceDisplay gbpPrice={bid.bid_amount} />
                            </p>
                            {index === 0 && (
                              <Badge variant="default" className="text-xs">
                                Current High Bid
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(bid.created_at).toLocaleString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {bid.bidder_id === user?.id ? 'Your Bid' : `Bidder ***${bid.bidder_id.slice(-4)}`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">No bids yet. Be the first to bid!</div>
                )}
              </DialogContent>
            </Dialog>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">Set your max bid for auto-bidding.</p>
          <div className="flex items-end gap-2">
            <div>
              <div className="relative w-[140px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">£</span>
                <Input
                  id="bid-amount"
                  type="number"
                  step="0.01"
                  min={auction.current_bid + 0.01}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`${(auction.current_bid + 1).toFixed(0)}`}
                  className="h-11 pl-7 text-base"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <Button onClick={handlePlaceBid} disabled={isSubmitting || !user} size="lg" className="min-w-[120px]">
              {isSubmitting ? 'Placing...' : 'Place Bid'}
            </Button>
          </div>

          {!user && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/20">
              <p className="text-sm text-orange-800 dark:text-orange-300">
                <strong>Sign in required:</strong> You must be signed in to place a bid
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
