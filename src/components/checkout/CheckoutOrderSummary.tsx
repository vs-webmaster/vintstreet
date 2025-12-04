// Checkout Order Summary
// Displays cart items, totals, and checkout button

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useBuyerProtectionFees, calculateBuyerProtectionFee } from '@/hooks/useBuyerProtectionFees';

interface CartItem {
  id: string;
  listings?: {
    product_name?: string;
    discounted_price?: number | null;
    starting_price?: number;
  };
}

interface CheckoutOrderSummaryProps {
  cartItems: CartItem[];
  subtotal: number;
  shippingCost: number;
  buyerProtectionFee: number;
  total: number;
  loading: boolean;
  isGenerating: boolean;
  onCheckout: () => void;
}

export const CheckoutOrderSummary = ({
  cartItems,
  subtotal,
  shippingCost,
  buyerProtectionFee,
  total,
  loading,
  isGenerating,
  onCheckout,
}: CheckoutOrderSummaryProps) => {
  const { data: buyerProtectionFees } = useBuyerProtectionFees();

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {cartItems.map((item) => {
            const itemPrice = item.listings?.discounted_price || item.listings?.starting_price || 0;
            const itemProtectionFee = calculateBuyerProtectionFee(itemPrice, buyerProtectionFees);
            return (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.listings?.product_name}</span>
                  <span>£{itemPrice.toFixed(2)}</span>
                </div>
                {itemProtectionFee !== null && (
                  <div className="flex justify-between text-xs text-blue-600">
                    <span className="pl-2">+ Buyer Protection</span>
                    <span>£{itemProtectionFee.toFixed(2)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Separator />

        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>£{subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{shippingCost === 0 ? 'Free' : `£${shippingCost.toFixed(2)}`}</span>
        </div>

        <div className="flex justify-between text-blue-600">
          <span>Buyer Protection</span>
          <span>£{buyerProtectionFee.toFixed(2)}</span>
        </div>

        <Separator />

        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>£{total.toFixed(2)}</span>
        </div>

        <Button className="w-full" size="lg" onClick={onCheckout} disabled={loading || isGenerating}>
          {loading || isGenerating ? (isGenerating ? 'Generating Labels...' : 'Processing...') : 'Continue to Payment'}
        </Button>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          By clicking continue, you'll be redirected to Stripe to complete your purchase securely
        </p>
      </CardContent>
    </Card>
  );
};
