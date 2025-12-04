// Checkout Shipping Section
// Displays shipping options grouped by seller

import { Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { type ShippingOptionRow } from '@/services/shipping';

interface CheckoutShippingSectionProps {
  sellerIds: string[];
  selectedShippingOptions: Record<string, string>;
  setSelectedShippingOptions: (options: Record<string, string>) => void;
  getSellerItems: (sellerId: string) => Array<{ id: string; listings?: { product_name?: string } }>;
  getSellerWeight: (sellerId: string) => number;
  getValidOptions: (sellerId: string) => ShippingOptionRow[];
  getOptionPrice: (option: ShippingOptionRow, sellerId: string) => number;
}

export const CheckoutShippingSection = ({
  sellerIds,
  selectedShippingOptions,
  setSelectedShippingOptions,
  getSellerItems,
  getSellerWeight,
  getValidOptions,
  getOptionPrice,
}: CheckoutShippingSectionProps) => {
  if (sellerIds.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipping Method
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sellerIds.map((sellerId) => {
          const sellerItems = getSellerItems(sellerId);
          const totalWeight = getSellerWeight(sellerId);
          const validOptions = getValidOptions(sellerId);

          if (validOptions.length === 0) {
            return (
              <div key={sellerId} className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">
                  No shipping options available for items weighing {totalWeight.toFixed(2)}kg. Please contact the
                  seller.
                </p>
              </div>
            );
          }

          return (
            <div key={sellerId} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Shipping for {sellerItems.length} item(s)</p>
                <div className="flex flex-col items-end gap-1">
                  {totalWeight >= 0 && (
                    <span className="text-sm text-muted-foreground">Total Weight: {totalWeight.toFixed(2)}kg</span>
                  )}
                </div>
              </div>
              <RadioGroup
                value={selectedShippingOptions[sellerId]}
                onValueChange={(value) => {
                  setSelectedShippingOptions({ ...selectedShippingOptions, [sellerId]: value });
                }}
              >
                {validOptions.map((option) => {
                  const postagePrice = getOptionPrice(option, sellerId);

                  return (
                    <div
                      key={option.id}
                      className="flex items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{option.shipping_providers?.name || 'Shipping'}</p>
                            {option.shipping_providers?.description && (
                              <p className="text-sm text-muted-foreground">{option.shipping_providers?.description}</p>
                            )}
                            {!!(option.estimated_days_min && option.estimated_days_max) && (
                              <p className="text-sm text-muted-foreground">
                                {option.estimated_days_min}-{option.estimated_days_max} business days
                              </p>
                            )}
                          </div>
                          <p className="font-semibold">£{postagePrice.toFixed(2)}</p>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
