// Basket Order Summary Component
// Displays totals and checkout button

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const COUNTRY_NAMES: Record<string, string> = {
  GB: 'United Kingdom',
  US: 'United States',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  BE: 'Belgium',
  IE: 'Ireland',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
};

interface BasketOrderSummaryProps {
  itemCount: number;
  sellerCount: number;
  subtotal: number;
  totalShipping: number;
  buyerProtectionFee: number;
  total: number;
  shippingCountry: string;
  canCheckout: boolean;
  hasOutOfStockItems: boolean;
  onSelectCountry: () => void;
}

export const BasketOrderSummary = ({
  itemCount,
  sellerCount,
  subtotal,
  totalShipping,
  buyerProtectionFee,
  total,
  shippingCountry,
  canCheckout,
  hasOutOfStockItems,
  onSelectCountry,
}: BasketOrderSummaryProps) => {
  const navigate = useNavigate();

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <h3 className="text-xl font-semibold">Order Summary</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span>Subtotal ({itemCount} items)</span>
          <span>£{subtotal.toFixed(2)}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span>
                Shipping ({sellerCount} seller{sellerCount > 1 ? 's' : ''})
              </span>
              {shippingCountry && (
                <span className="text-xs text-muted-foreground">to {COUNTRY_NAMES[shippingCountry] || shippingCountry}</span>
              )}
            </div>
            {shippingCountry ? (
              <span>£{totalShipping.toFixed(2)}</span>
            ) : (
              <Button variant="outline" size="sm" onClick={onSelectCountry}>
                Select Country
              </Button>
            )}
          </div>
          <p className="text-xs italic text-muted-foreground">Final shipping cost will be calculated at checkout</p>
          {shippingCountry && (
            <Button variant="ghost" size="sm" onClick={onSelectCountry} className="w-full text-xs">
              Change Destination
            </Button>
          )}
        </div>

        <div className="flex justify-between">
          <span className="text-blue-600">Buyer Protection</span>
          <span className="text-blue-600">£{buyerProtectionFee.toFixed(2)}</span>
        </div>

        <Separator />

        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>£{total.toFixed(2)}</span>
        </div>

        <Button className="w-full" size="lg" disabled={!canCheckout} onClick={() => canCheckout && navigate('/checkout')}>
          Proceed to Checkout
        </Button>

        {!canCheckout && itemCount > 0 && (
          <p className="text-center text-sm text-destructive">
            {hasOutOfStockItems
              ? 'Remove out of stock items to proceed'
              : !shippingCountry
                ? 'Select shipping country to proceed'
                : 'Select shipping options for all sellers'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
