import { useState } from 'react';
import { Info, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createAuction } from '@/services/auctions';
import { updateProduct } from '@/services/products';
import { isFailure } from '@/types/api';

interface AuctionListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  productPrice: number;
  onSuccess?: () => void;
}

export const AuctionListingModal = ({
  open,
  onOpenChange,
  productId,
  productName,
  productPrice,
  onSuccess,
}: AuctionListingModalProps) => {
  const [reservePrice, setReservePrice] = useState(productPrice.toString());
  const [startingBid, setStartingBid] = useState('');
  const [duration, setDuration] = useState<string>('7');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const reservePriceNum = parseFloat(reservePrice);
      const startingBidNum = startingBid ? parseFloat(startingBid) : null;

      if (isNaN(reservePriceNum) || reservePriceNum <= 0) {
        toast.error('Please enter a valid reserve price');
        return;
      }

      if (startingBidNum && startingBidNum >= reservePriceNum) {
        toast.error('Starting bid must be less than reserve price');
        return;
      }

      const durationDays = parseInt(duration);
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + durationDays);

      // Update listing to auction type
      const listingResult = await updateProduct(productId, { auction_type: 'auction' as any });
      if (isFailure(listingResult)) throw listingResult.error;

      // Create auction
      const auctionResult = await createAuction({
        listing_id: productId,
        reserve_price: reservePriceNum,
        starting_bid: startingBidNum || 0,
        current_bid: startingBidNum || 0,
        auction_duration: durationDays,
        start_time: new Date().toISOString(),
        end_time: endTime.toISOString(),
        status: 'active',
      });

      if (isFailure(auctionResult)) throw auctionResult.error;

      toast.success('Auction listing created successfully!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating auction:', error);
      toast.error(error.message || 'Failed to create auction listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>List as Auction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Product</Label>
            <p className="mt-1 text-sm text-muted-foreground">{productName}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reserve-price">Reserve Price (£) *</Label>
            <Input
              id="reserve-price"
              type="number"
              step="0.01"
              min="0.01"
              value={reservePrice}
              onChange={(e) => setReservePrice(e.target.value)}
              placeholder="Minimum price to sell"
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimum price you're willing to accept. Not visible to bidders.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="starting-bid">Starting Bid (£)</Label>
            <Input
              id="starting-bid"
              type="number"
              step="0.01"
              min="0.01"
              value={startingBid}
              onChange={(e) => setStartingBid(e.target.value)}
              placeholder="Optional - defaults to £0"
            />
            <p className="text-xs text-muted-foreground">Initial bid amount. Leave empty to start at £0.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Auction Duration *</Label>
            <Select value={duration} onValueChange={setDuration} required>
              <SelectTrigger id="duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Day</SelectItem>
                <SelectItem value="3">3 Days</SelectItem>
                <SelectItem value="5">5 Days</SelectItem>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="10">10 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Auction Fee: 4%</strong> of final sale price
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Important:</strong> Auctions cannot be cancelled once started. Make sure all details are correct.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Creating...' : 'Create Auction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
