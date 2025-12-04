import { useState, useEffect } from 'react';
import { Plus, Play, Square, Timer, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { createProduct, updateProduct, fetchProductsByStream } from '@/services/products';
import { isFailure } from '@/types/api';

interface ListingManagerProps {
  streamId: string;
}

interface Listing {
  id: string;
  product_name: string;
  product_description: string;
  starting_price: number;
  current_bid: number;
  status: 'draft' | 'published' | 'private' | 'out_of_stock';
  auction_end_time: string | null;
  stock_quantity: number | null;
}

const ListingManager = ({ streamId }: ListingManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    product_description: '',
    starting_price: '',
    thumbnail: '',
  });

  // Fetch existing listings when component mounts
  useEffect(() => {
    const loadListings = async () => {
      try {
        const result = await fetchProductsByStream(streamId);
        if (isFailure(result)) {
          console.error('Error fetching listings:', result.error);
          return;
        }

        const listingsData: Listing[] = result.data.map((product) => ({
          id: product.id,
          product_name: product.product_name,
          product_description: product.product_description || '',
          starting_price: product.starting_price,
          current_bid: product.auctions?.[0]?.current_bid || product.starting_price,
          status: product.status as 'draft' | 'published' | 'private' | 'out_of_stock',
          auction_end_time: product.auction_end_time || null,
          stock_quantity: product.stock_quantity || null,
        }));

        setListings(listingsData);
      } catch (error) {
        console.error('Error loading listings:', error);
      }
    };

    loadListings();
  }, [streamId]);

  const createListing = async () => {
    if (!user || !formData.product_name || !formData.starting_price) return;

    setLoading(true);
    try {
      const result = await createProduct({
        seller_id: user.id,
        stream_id: streamId,
        product_name: formData.product_name,
        product_description: formData.product_description || null,
        starting_price: parseFloat(formData.starting_price),
        product_image: formData.thumbnail || null,
        status: 'draft',
        product_type: 'livestream',
      });

      if (isFailure(result)) {
        throw result.error;
      }

      const product = result.data;
      const listing: Listing = {
        id: product.id,
        product_name: product.product_name,
        product_description: product.product_description || '',
        starting_price: product.starting_price,
        current_bid: product.auctions?.[0]?.current_bid || product.starting_price,
        status: product.status as 'draft' | 'published' | 'private' | 'out_of_stock',
        auction_end_time: product.auction_end_time || null,
        stock_quantity: product.stock_quantity || null,
      };

      setListings((prev) => [...prev, listing]);
      setFormData({
        product_name: '',
        product_description: '',
        starting_price: '',
        thumbnail: '',
      });
      setShowCreateForm(false);

      toast({
        title: 'Listing created!',
        description: 'You can now activate it to start the auction',
      });
    } catch (error: any) {
      toast({
        title: 'Error creating listing',
        description: error?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const activateListing = async (listingId: string, durationMinutes: number = 5) => {
    setLoading(true);
    try {
      const auctionEndTime = new Date();
      auctionEndTime.setMinutes(auctionEndTime.getMinutes() + durationMinutes);

      const result = await updateProduct(listingId, {
        status: 'published',
        auction_end_time: auctionEndTime.toISOString(),
      });

      if (isFailure(result)) {
        throw result.error;
      }

      setListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId
            ? { ...listing, status: 'published', auction_end_time: auctionEndTime.toISOString() }
            : listing,
        ),
      );

      toast({
        title: 'Auction started!',
        description: `Bidding is now live for ${durationMinutes} minutes`,
      });
    } catch (error: any) {
      toast({
        title: 'Error starting auction',
        description: error?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deactivateListing = async (listingId: string) => {
    setLoading(true);
    try {
      const result = await updateProduct(listingId, {
        status: 'draft',
        auction_end_time: null,
      });

      if (isFailure(result)) {
        throw result.error;
      }

      setListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId ? { ...listing, status: 'draft', auction_end_time: null } : listing,
        ),
      );

      toast({
        title: 'Auction ended',
        description: 'Bidding has been stopped',
      });
    } catch (error: any) {
      toast({
        title: 'Error ending auction',
        description: error?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Manage Listings
          </CardTitle>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreateForm && (
          <Card className="border-dashed p-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="product_name">Product Name</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, product_name: e.target.value }))}
                  placeholder="Enter product name..."
                />
              </div>

              <div>
                <Label htmlFor="product_description">Description</Label>
                <Textarea
                  id="product_description"
                  value={formData.product_description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, product_description: e.target.value }))}
                  placeholder="Describe your product..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="starting_price">Starting Price (£)</Label>
                <Input
                  id="starting_price"
                  type="number"
                  value={formData.starting_price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, starting_price: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={createListing}
                  disabled={loading || !formData.product_name || !formData.starting_price}
                  className="flex-1"
                >
                  Create Listing
                </Button>
                <Button onClick={() => setShowCreateForm(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {listings.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <Package className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>No listings yet</p>
            <p className="text-sm">Create your first product to start selling</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <Card key={listing.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="font-medium">{listing.product_name}</h4>
                      <Badge
                        variant={
                          listing.status === 'published'
                            ? 'default'
                            : listing.status === 'out_of_stock'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {listing.status === 'published'
                          ? 'Live'
                          : listing.status === 'out_of_stock'
                            ? 'Out of Stock'
                            : 'Draft'}
                      </Badge>
                    </div>
                    {listing.product_description && (
                      <p className="mb-2 text-sm text-muted-foreground">{listing.product_description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span>Starting: £{listing.starting_price}</span>
                      {listing.current_bid > 0 && (
                        <span className="font-medium text-live-indicator">Current: £{listing.current_bid}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {listing.status === 'out_of_stock' ? (
                      <span className="text-sm text-muted-foreground">Sold Out</span>
                    ) : listing.status !== 'published' ? (
                      <Button
                        onClick={() => activateListing(listing.id)}
                        disabled={loading}
                        size="sm"
                        className="bg-live-indicator hover:bg-live-indicator/90"
                      >
                        <Play className="mr-1 h-4 w-4" />
                        Start Auction
                      </Button>
                    ) : (
                      <Button
                        onClick={() => deactivateListing(listing.id)}
                        disabled={loading}
                        size="sm"
                        variant="outline"
                      >
                        <Square className="mr-1 h-4 w-4" />
                        End Auction
                      </Button>
                    )}
                  </div>
                </div>

                {listing.status === 'published' && listing.auction_end_time && (
                  <div className="mt-2 border-t pt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      Ends: {new Date(listing.auction_end_time).toLocaleString()}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ListingManager;
