import { AlertCircle, Info, Gavel, ShoppingBag } from 'lucide-react';
import { BrandSelector } from '@/components/BrandSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCurrency } from '@/hooks/useCurrency';
import { ProductFormData } from '@/hooks/useProductForm';

interface ProductInfoFormProps {
  formData: ProductFormData;
  onInputChange: (field: string, value: string | boolean | string[]) => void;
  onSelectBrand?: (brandId: string | null, brandName: string) => void;
  nameErrors?: string[];
  descriptionErrors?: string[];
  listingType?: 'marketplace' | 'auction';
  onListingTypeChange?: (type: 'marketplace' | 'auction') => void;
  auctionData?: {
    reservePrice: string;
    startingBid: string;
    duration: string;
  };
  onAuctionDataChange?: (field: string, value: string) => void;
}

export const ProductInfoForm = ({
  formData,
  onInputChange,
  onSelectBrand,
  nameErrors = [],
  descriptionErrors = [],
  listingType = 'marketplace',
  onListingTypeChange,
  auctionData,
  onAuctionDataChange,
}: ProductInfoFormProps) => {
  const { currency } = useCurrency();

  const getCurrencySymbol = () => {
    const symbols: Record<string, string> = {
      GBP: '£',
      USD: '$',
      EUR: '€',
      CAD: 'C$',
      AUD: 'A$',
      JPY: '¥',
    };
    return symbols[currency] || currency;
  };

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Product Information</h3>
      <div className="space-y-4">
        <div>
          <Label>Listing Type *</Label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onListingTypeChange?.('marketplace')}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                listingType === 'marketplace'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              <ShoppingBag className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Marketplace</div>
                <div className="text-xs text-muted-foreground">Fixed price listing</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onListingTypeChange?.('auction')}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                listingType === 'auction'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              <Gavel className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Auction</div>
                <div className="text-xs text-muted-foreground">Time-limited bidding</div>
              </div>
            </button>
          </div>
        </div>

        {listingType === 'auction' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Auction Fee: 4%</strong> of final sale price. Auctions cannot be cancelled once started.
            </AlertDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            placeholder="Enter product name"
            required
            className={nameErrors.length > 0 ? 'border-destructive' : ''}
          />
          {nameErrors.length > 0 && (
            <div className="mt-2 flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>Prohibited words detected: {nameErrors.join(', ')}</span>
            </div>
          )}
        </div>

        <div>
          <Label>Brand</Label>
          <BrandSelector
            selectedBrandId={formData.brand_id || null}
            onSelectBrand={(brandId, brandName) => {
              if (onSelectBrand) {
                onSelectBrand(brandId, brandName);
              }
            }}
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder="Describe your product"
            rows={4}
            className={descriptionErrors.length > 0 ? 'border-destructive' : ''}
          />
          {descriptionErrors.length > 0 && (
            <div className="mt-2 flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>Prohibited words detected: {descriptionErrors.join(', ')}</span>
            </div>
          )}
        </div>

        {listingType === 'marketplace' ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price" className="mb-2 flex items-center gap-2">
                Price *
                <Badge variant="secondary" className="text-xs font-normal">
                  {getCurrencySymbol()} {currency}
                </Badge>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => onInputChange('price', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="discountedPrice" className="mb-2 flex items-center gap-2">
                Sale Price
                <Badge variant="secondary" className="text-xs font-normal">
                  {getCurrencySymbol()} {currency}
                </Badge>
              </Label>
              <Input
                id="discountedPrice"
                type="number"
                step="0.01"
                value={formData.discountedPrice || ''}
                onChange={(e) => onInputChange('discountedPrice', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reservePrice">Reserve Price (£) *</Label>
                <Input
                  id="reservePrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={auctionData?.reservePrice || formData.price}
                  onChange={(e) => {
                    onAuctionDataChange?.('reservePrice', e.target.value);
                    onInputChange('price', e.target.value);
                  }}
                  placeholder="Minimum price to sell"
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">Hidden from bidders</p>
              </div>

              <div>
                <Label htmlFor="startingBid">Starting Bid (£)</Label>
                <Input
                  id="startingBid"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={auctionData?.startingBid || ''}
                  onChange={(e) => onAuctionDataChange?.('startingBid', e.target.value)}
                  placeholder="Optional - defaults to £0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="duration">Auction Duration *</Label>
              <Select
                value={auctionData?.duration || '7'}
                onValueChange={(value) => onAuctionDataChange?.('duration', value)}
              >
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
          </div>
        )}
      </div>
    </Card>
  );
};
