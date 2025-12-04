// Basket Seller Group Component
// Displays items and shipping options for a single seller

import { Trash2, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { SellerGroup } from '@/hooks/useBasketShipping';
import { useBuyerProtectionFees, calculateBuyerProtectionFee } from '@/hooks/useBuyerProtectionFees';
import { type ShippingOptionRow, type ProviderPriceRow } from '@/services/shipping';

interface BasketSellerGroupProps {
  group: SellerGroup;
  shippingCountry: string;
  filteredOptions: ShippingOptionRow[];
  allSellerOptions: ShippingOptionRow[];
  onShippingChange: (sellerId: string, shippingId: string) => void;
  onRemoveItem: (itemId: string) => void;
  getProviderBandForWeight: (providerId: string | null, weight: number) => ProviderPriceRow | null;
}

export const BasketSellerGroup = ({
  group,
  shippingCountry,
  filteredOptions,
  allSellerOptions,
  onShippingChange,
  onRemoveItem,
  getProviderBandForWeight,
}: BasketSellerGroupProps) => {
  const { data: buyerProtectionFees } = useBuyerProtectionFees();
  
  const totalWeight = group.items.reduce((sum, item) => {
    const weight = item.listings?.weight ?? 0;
    return sum + (typeof weight === 'number' ? weight : 0);
  }, 0);

  return (
    <Card>
      <CardHeader className="bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Sold by {group.sellerName}</h3>
          </div>
          <div className="flex flex-col items-end gap-1">
            {totalWeight >= 0 && (
              <span className="text-sm text-muted-foreground">Total Weight: {totalWeight.toFixed(2)}kg</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {/* Items from this seller */}
        {group.items.map((item) => {
          const itemPrice = item.listings?.discounted_price || item.listings?.starting_price || 0;
          const protectionFee = calculateBuyerProtectionFee(itemPrice, buyerProtectionFees);
          
          return (
            <div key={item.id} className="flex gap-4 border-b pb-4 last:border-b-0 last:pb-0">
              <img
                src={item.listings?.thumbnail}
                alt={item.listings?.product_name}
                className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
              />
              <div className="flex-1">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="my-2 font-semibold text-foreground">{item.listings?.product_name}</h4>
                    <div className="flex items-center gap-2">
                      {item.listings?.discounted_price && (
                        <span className="text-sm text-muted-foreground line-through">
                          £{item.listings?.starting_price?.toFixed(2)}
                        </span>
                      )}
                      <span className="font-semibold text-foreground">
                        £{itemPrice.toFixed(2)}
                      </span>
                    </div>
                    {protectionFee !== null && (
                      <p className="text-sm text-blue-600">(Buyer Protection: £{protectionFee.toFixed(2)})</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveItem(item.listings?.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Shipping Options */}
        {shippingCountry ? (
          <div className="border-t pt-4">
            <div className="mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <h4 className="font-semibold">Shipping Options</h4>
            </div>
            <RadioGroup
              value={group.selectedShipping || ''}
              onValueChange={(value) => onShippingChange(group.sellerId, value)}
            >
              {filteredOptions.map((option) => {
                const providerBand = getProviderBandForWeight(option.provider_id, totalWeight);
                if (!providerBand || !providerBand.price) return null;

                const postagePrice = Number(providerBand.price);

                return (
                  <div
                    key={option.id}
                    className="flex cursor-pointer items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{option.shipping_providers?.name}</p>
                          {providerBand.band_name && (
                            <p className="text-xs text-muted-foreground">{providerBand.band_name}</p>
                          )}
                          {option.shipping_providers?.description && (
                            <p className="text-sm text-muted-foreground">{option.shipping_providers?.description}</p>
                          )}
                          {!!(option.estimated_days_min && option.estimated_days_max) && (
                            <p className="text-sm text-muted-foreground">
                              Estimated delivery: {option.estimated_days_min}-{option.estimated_days_max} days
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
            {allSellerOptions.length === 0 && (
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                  Shipping options not yet configured by seller
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The seller needs to set up shipping options in their dashboard before checkout
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="border-t pt-4">
            <div className="rounded-lg border border-muted bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                Please select your shipping country above to view shipping options
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
