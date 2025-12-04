import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Percent, Save } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useSellerFees, useUpdateSellerFee } from '@/hooks/useSellerFees';

export default function AdminSellerFeesPage() {
  const { data: fees, isLoading } = useSellerFees();
  const updateFee = useUpdateSellerFee();

  const [marketplaceFee, setMarketplaceFee] = useState<string>('');
  const [auctionFee, setAuctionFee] = useState<string>('');

  useEffect(() => {
    if (fees) {
      const marketplace = fees.find((f) => f.fee_type === 'marketplace');
      const auction = fees.find((f) => f.fee_type === 'auction');
      setMarketplaceFee(marketplace?.percentage.toString() || '0');
      setAuctionFee(auction?.percentage.toString() || '0');
    }
  }, [fees]);

  const handleSave = async () => {
    try {
      await Promise.all([
        updateFee.mutateAsync({ feeType: 'marketplace', percentage: parseFloat(marketplaceFee) || 0 }),
        updateFee.mutateAsync({ feeType: 'auction', percentage: parseFloat(auctionFee) || 0 }),
      ]);
      toast.success('Seller fees updated successfully');
    } catch (error) {
      toast.error('Failed to update seller fees');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Seller Fees</h1>
            <p className="text-muted-foreground">
              Configure the percentage fees charged to sellers for marketplace and auction sales.
            </p>
          </div>
          <Button onClick={handleSave} disabled={updateFee.isPending}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Marketplace Fee
              </CardTitle>
              <CardDescription>
                Fee percentage charged on all marketplace (buy-it-now) product sales.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="marketplace-fee">Fee Percentage</Label>
                <div className="relative">
                  <Input
                    id="marketplace-fee"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={marketplaceFee}
                    onChange={(e) => setMarketplaceFee(e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Example:</strong> For a £100 sale with a {marketplaceFee || 0}% fee, the seller pays{' '}
                  <span className="font-semibold text-foreground">
                    £{((100 * (parseFloat(marketplaceFee) || 0)) / 100).toFixed(2)}
                  </span>{' '}
                  and receives{' '}
                  <span className="font-semibold text-foreground">
                    £{(100 - (100 * (parseFloat(marketplaceFee) || 0)) / 100).toFixed(2)}
                  </span>
                  .
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Auction Fee
              </CardTitle>
              <CardDescription>Fee percentage charged on all auction product sales.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auction-fee">Fee Percentage</Label>
                <div className="relative">
                  <Input
                    id="auction-fee"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={auctionFee}
                    onChange={(e) => setAuctionFee(e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Example:</strong> For a £100 auction sale with a {auctionFee || 0}% fee, the seller pays{' '}
                  <span className="font-semibold text-foreground">
                    £{((100 * (parseFloat(auctionFee) || 0)) / 100).toFixed(2)}
                  </span>{' '}
                  and receives{' '}
                  <span className="font-semibold text-foreground">
                    £{(100 - (100 * (parseFloat(auctionFee) || 0)) / 100).toFixed(2)}
                  </span>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How Seller Fees Work</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <ul className="list-disc space-y-2 pl-4 text-muted-foreground">
              <li>
                Seller fees are deducted from the seller's earnings when a sale is completed.
              </li>
              <li>
                The fee is calculated as a percentage of the product sale price (excluding shipping).
              </li>
              <li>
                Fees are displayed to sellers in their order history so they know exactly what they'll receive.
              </li>
              <li>
                Different fee rates can be set for marketplace (buy-it-now) sales and auction sales.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
