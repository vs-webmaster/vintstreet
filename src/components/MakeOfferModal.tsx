import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { createOffer } from '@/services/offers';
import { isFailure } from '@/types/api';

interface MakeOfferModalProps {
  productId: string;
  productName: string;
  currentPrice: number;
  sellerId?: string;
  children: React.ReactNode;
}

const MakeOfferModal = ({ productId, productName, currentPrice, sellerId, children }: MakeOfferModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to make an offer.',
        variant: 'destructive',
      });
      return;
    }

    if (!offerAmount || parseFloat(offerAmount) <= 0) {
      toast({
        title: 'Invalid Offer',
        description: 'Please enter a valid offer amount.',
        variant: 'destructive',
      });
      return;
    }

    if (!sellerId) {
      toast({
        title: 'Error',
        description: 'Seller information is missing. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(offerAmount);

    setIsSubmitting(true);

    try {
      const result = await createOffer({
        listing_id: productId,
        buyer_id: user.id,
        seller_id: sellerId,
        offer_amount: amount,
        message: message.trim() || null,
        status: 'pending',
      });

      if (isFailure(result)) {
        throw result.error;
      }

      // Invalidate offers queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['seller-offers'] });

      toast({
        title: 'Offer Submitted',
        description: `Your offer of £${amount.toFixed(2)} for ${productName} has been submitted.`,
      });

      setIsOpen(false);
      setOfferAmount('');
      setMessage('');
    } catch (error: any) {
      console.error('Error submitting offer:', error);
      toast({
        title: 'Error',
        description: error?.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Make an Offer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <div className="rounded-md bg-muted p-3">
              <p className="font-medium">{productName}</p>
              <p className="text-sm text-muted-foreground">Current price: £{currentPrice.toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-amount">Your Offer (£)</Label>
            <Input
              id="offer-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Enter your offer amount"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              required
            />
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setOfferAmount((currentPrice * 0.85).toFixed(2))}
              >
                £{(currentPrice * 0.85).toFixed(2)}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setOfferAmount((currentPrice * 0.9).toFixed(2))}
              >
                £{(currentPrice * 0.9).toFixed(2)}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setOfferAmount((currentPrice * 0.95).toFixed(2))}
              >
                £{(currentPrice * 0.95).toFixed(2)}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Message (Optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Add a message to the seller..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Offer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MakeOfferModal;
