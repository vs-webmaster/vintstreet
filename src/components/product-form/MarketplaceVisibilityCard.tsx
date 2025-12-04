import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface MarketplaceVisibilityCardProps {
  isMarketplaceListed: boolean;
  onToggle: (value: boolean) => void;
  isSubmitting: boolean;
  isEditMode: boolean;
  onSaveDraft: () => Promise<void>;
  onPublish: () => Promise<void>;
  listingType?: 'marketplace' | 'auction';
}

export const MarketplaceVisibilityCard = ({
  isMarketplaceListed,
  onToggle,
  isSubmitting,
  isEditMode,
  onSaveDraft,
  onPublish,
  listingType = 'marketplace',
}: MarketplaceVisibilityCardProps) => {
  const publishLabel = listingType === 'auction' ? 'Publish Auction' : 'Publish to Marketplace';
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Product Visibility
          </CardTitle>
          <CardDescription>Control where your product appears</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketplace-toggle">List on Marketplace</Label>
              <p className="text-sm text-muted-foreground">
                {isMarketplaceListed ? 'Visible on marketplace and your shop' : 'Only visible in your shop'}
              </p>
            </div>
            <Switch
              id="marketplace-toggle"
              checked={isMarketplaceListed}
              onCheckedChange={onToggle}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Button type="button" onClick={onPublish} className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Publishing...' : isEditMode ? 'Update & Publish' : publishLabel}
        </Button>

        <Button
          type="button"
          onClick={onSaveDraft}
          variant="outline"
          className="w-full"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving Draft...' : 'Save as Draft'}
        </Button>
      </div>
    </div>
  );
};
