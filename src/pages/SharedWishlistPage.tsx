import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PriceDisplay } from '@/components/PriceDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { usePublicWishlist } from '@/hooks/usePublicWishlist';
import { useWishlist } from '@/hooks/useWishlist';

export default function SharedWishlistPage() {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, error } = usePublicWishlist(token || '');

  const { addToWishlist, isInWishlist } = useWishlist();

  const handleAddToWishlist = async (listingId: string) => {
    if (!user) {
      toast.error('Please log in to add items to your wishlist');
      return;
    }

    if (isInWishlist(listingId)) {
      toast.info('This item is already in your wishlist');
      return;
    }

    try {
      await addToWishlist(listingId);
      toast.success('Added to your wishlist!');
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-1/3 rounded bg-muted"></div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-80 rounded-lg bg-muted"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="mb-4 text-3xl font-bold">Wishlist Not Found</h1>
            <p className="mb-6 text-muted-foreground">
              This shared wishlist may have been removed or is no longer active.
            </p>
            <Button onClick={() => navigate('/shop')}>Browse Shop</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { sharedWishlist, wishlistItems, ownerName } = data;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold">{sharedWishlist.name || `${ownerName}'s Wishlist`}</h1>
            {sharedWishlist.description && <p className="text-muted-foreground">{sharedWishlist.description}</p>}
            <p className="mt-2 text-sm text-muted-foreground">
              Shared by {ownerName} • {wishlistItems.length} items
            </p>
          </div>

          {/* Products Grid */}
          {wishlistItems.length === 0 ? (
            <div className="py-12 text-center">
              <Heart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">This wishlist is empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {wishlistItems.map((item) => {
                const listing = item.listings;
                if (!listing) return null;

                const hasDiscount = listing.discounted_price && listing.discounted_price < listing.starting_price;

                const productUrl = listing.slug || listing.id;
                return (
                  <Card key={item.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                    <div
                      className="relative aspect-square cursor-pointer"
                      onClick={() => navigate(`/product/${productUrl}`)}
                    >
                      <img
                        src={listing.thumbnail || '/placeholder.svg'}
                        alt={`${listing.product_name}-vintstreet`}
                        className="h-full w-full object-cover"
                      />
                      {hasDiscount && (
                        <div className="absolute right-2 top-2 rounded-md bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground">
                          SALE
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <h3
                        className="mb-2 line-clamp-2 cursor-pointer text-lg font-semibold hover:text-primary"
                        onClick={() => navigate(`/product/${productUrl}`)}
                      >
                        {listing.product_name}
                      </h3>

                      <div className="space-y-1">
                        {hasDiscount ? (
                          <>
                            <PriceDisplay
                              gbpPrice={listing.discounted_price!}
                              className="text-lg font-bold text-destructive"
                            />
                            <PriceDisplay
                              gbpPrice={listing.starting_price}
                              className="text-sm text-muted-foreground line-through"
                            />
                          </>
                        ) : (
                          <PriceDisplay gbpPrice={listing.starting_price} className="text-lg font-bold" />
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="flex gap-2 p-4 pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/product/${productUrl}`)}
                        className="flex-1"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      {user ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToWishlist(listing.id)}
                          className="flex-1"
                        >
                          <Heart className="mr-2 h-4 w-4" />
                          Add
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => navigate('/auth')} className="flex-1">
                          <Heart className="mr-2 h-4 w-4" />
                          Login
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
