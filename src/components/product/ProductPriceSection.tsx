import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Check, Zap } from 'lucide-react';
import { toast } from 'sonner';
import MakeOfferModal from '@/components/MakeOfferModal';
import { ShippingAddressDialog } from '@/components/ShippingAddressDialog';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { useBuyerProtectionFees, calculateBuyerProtectionFee } from '@/hooks/useBuyerProtectionFees';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Product } from '@/hooks/useProductData';
import { useShippingLabel } from '@/hooks/useShippingLabel';
import { invokeEdgeFunction } from '@/services/functions';
import { createOrder } from '@/services/orders';
import { updateBuyerProfileShipping, createSavedAddress } from '@/services/users';
import { isFailure } from '@/types/api';

interface ProductPriceSectionProps {
  product: Product;
  cartItems: unknown[];
  onAddToCart: () => void;
}

export const ProductPriceSection = ({ product, cartItems, onAddToCart }: ProductPriceSectionProps) => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const isMobile = useIsMobile();
  const { generateLabel, isGenerating } = useShippingLabel();
  const { data: buyerProtectionFees } = useBuyerProtectionFees();

  const currentPrice = product.discounted_price || product.starting_price;
  const buyerProtectionFee = calculateBuyerProtectionFee(currentPrice, buyerProtectionFees);
  const [showCheckoutPopover, setShowCheckoutPopover] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [preventPopoverClose, setPreventPopoverClose] = useState(false);

  // Fetch saved addresses to check if address is new
  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['saved-addresses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { fetchSavedAddresses } = await import('@/services/users/userService');
      const result = await fetchSavedAddresses(user.id);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch seller info for the product
  const { data: sellerInfo } = useQuery({
    queryKey: ['seller-info', product.seller_id],
    queryFn: async () => {
      if (!product.seller_id) return null;
      const { fetchSellerInfoMap } = await import('@/services/users/userService');
      const result = await fetchSellerInfoMap([product.seller_id]);
      if (!result.success || !result.data) {
        return null;
      }
      const seller = result.data.get(product.seller_id);
      return seller ? { shop_name: seller.shop_name } : null;
    },
    enabled: !!product.seller_id,
  });

  useEffect(() => {
    if (cartItems) {
      const isInCart = cartItems.some((item) => item.id === product.id);
      setIsAddedToCart(isInCart);
    }
  }, [product.id, cartItems]);

  const handleAddToCart = () => {
    const existingItem = cartItems.find((item) => item.id === product.id);
    if (existingItem) {
      toast.error(`${product.product_name} is already in your cart. Adjust quantity from the basket.`);
      return;
    }

    onAddToCart();
    setIsAddedToCart(true);
    setShowCheckoutPopover(true);
    setPreventPopoverClose(true);

    setTimeout(() => {
      setPreventPopoverClose(false);
      setShowCheckoutPopover(false);
    }, 15000);
  };

  const handleBuyNowClick = async () => {
    // Check if user is authenticated
    if (!session) {
      toast.error('Please sign in to purchase');
      navigate('/auth?redirect=/product/' + product.id);
      return;
    }

    // Show shipping address dialog
    setShowShippingDialog(true);
  };

  const handleShippingConfirm = async (address: unknown, shippingCost: number, shippingOptionId: string) => {
    if (!user) {
      toast.error('Please log in to complete your order');
      return;
    }

    try {
      setIsBuyingNow(true);
      setShowShippingDialog(false);

      // Check if this is a new address (not from saved addresses)
      const isNewAddress = !address.id || !savedAddresses.some((addr: unknown) => addr.id === address.id);

      // Save shipping info to buyer profile and saved addresses if new address
      if (isNewAddress) {
        // Update buyer profile shipping info
        const profileResult = await updateBuyerProfileShipping(user.id, {
          shipping_first_name: address.first_name,
          shipping_last_name: address.last_name,
          shipping_address_line1: address.address_line1,
          shipping_address_line2: address.address_line2 || null,
          shipping_city: address.city,
          shipping_state: address.state || null,
          shipping_postal_code: address.postal_code,
          shipping_country: address.country,
          shipping_phone: address.phone || null,
        });

        if (isFailure(profileResult)) {
          console.error('Error saving shipping info:', profileResult.error);
        }

        // Save to saved_addresses table
        const addressResult = await createSavedAddress({
          user_id: user.id,
          first_name: address.first_name,
          last_name: address.last_name,
          address_line1: address.address_line1,
          address_line2: address.address_line2 || null,
          city: address.city,
          state: address.state || null,
          postal_code: address.postal_code,
          country: address.country,
          phone: address.phone || null,
          is_default: savedAddresses.length === 0,
        });

        if (isFailure(addressResult)) {
          console.error('Error saving address:', addressResult.error);
        }
      }

      // Create pending order for the product
      const orderResult = await createOrder({
        listing_id: product.id,
        buyer_id: user.id,
        seller_id: product.seller_id,
        order_amount: product.discounted_price || product.starting_price || 0,
        stream_id: 'marketplace-order',
        status: 'pending',
        delivery_status: 'processing',
      });

      if (isFailure(orderResult)) throw orderResult.error;

      const orderData = orderResult.data;

      // Prepare shipping address data for label generation
      const shippingAddressData = {
        first_name: address.first_name,
        last_name: address.last_name,
        address_line1: address.address_line1,
        address_line2: address.address_line2 || '',
        city: address.city,
        state: address.state || '',
        postal_code: address.postal_code,
        country: address.country,
        phone: address.phone || '',
        email: user.email || '',
      };

      // Generate shipping label for the order
      toast.info('Generating shipping label...');
      const labelResult = await generateLabel(orderData.id, shippingAddressData, shippingOptionId);

      if (!labelResult || !labelResult.success) {
        toast.error('Failed to generate shipping label. Please try again.');
        setIsBuyingNow(false);
        return;
      }

      // All labels generated successfully, proceed with checkout
      toast.success('Shipping label generated successfully. Proceeding to payment...');

      // Prepare order data for create-checkout-split
      const orderForCheckout = {
        id: orderData.id,
        seller_id: product.seller_id,
        product_name: product.product_name,
        seller_name: sellerInfo?.shop_name || 'Seller',
        price: product.discounted_price || product.starting_price || 0,
      };

      // Call Stripe Checkout edge function
      const result = await invokeEdgeFunction<{ url?: string }>({
        functionName: 'create-checkout-split',
        body: {
          orders: [orderForCheckout],
          shippingCost: shippingCost,
          platform: 'web',
        },
      });

      if (isFailure(result)) throw result.error;

      // Redirect to Stripe Checkout
      if (result.data?.url) {
        window.location.href = result.data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: unknown) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to process checkout. Please try again.');
      setIsBuyingNow(false);
    }
  };

  const isOutOfStock = product.status === 'out_of_stock' || product.stock_quantity === 0;
  const isAuction = product.auction_type && product.auction_type !== 'marketplace';

  return (
    <>
      {/* Desktop/Tablet version - hidden on mobile */}
      <div className="hidden flex-col gap-4 rounded-lg bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between md:flex">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            {product.discounted_price ? (
              <>
                <span className="text-2xl font-bold text-primary md:text-3xl">
                  £{product.discounted_price.toFixed(2)}
                </span>
                <span className="text-lg text-muted-foreground line-through md:text-xl">
                  £{product.starting_price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-primary md:text-3xl">£{product.starting_price.toFixed(2)}</span>
            )}
          </div>
          {buyerProtectionFee !== null && (
            <p className="text-sm text-blue-600">(Buyer Protection: £{buyerProtectionFee.toFixed(2)})</p>
          )}
          {isOutOfStock && <span className="text-sm font-semibold text-destructive">Out of Stock</span>}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {!isAuction && (
            <Button
              size="lg"
              onClick={handleBuyNowClick}
              className="h-auto flex-1 bg-buy-now py-3 text-buy-now-foreground hover:bg-buy-now/90"
              disabled={isOutOfStock || isBuyingNow || isGenerating}
            >
              {isBuyingNow || isGenerating ? (
                isGenerating ? (
                  'Generating Labels...'
                ) : (
                  'Processing...'
                )
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Buy Now
                </>
              )}
            </Button>
          )}

          {!isAuction && (
            <Popover
              open={!isMobile && showCheckoutPopover}
              onOpenChange={(open) => {
                if (!preventPopoverClose) {
                  setShowCheckoutPopover(open);
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  size="lg"
                  onClick={handleAddToCart}
                  className="h-auto flex-1 py-3"
                  variant={isAddedToCart ? 'secondary' : 'outline'}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock ? (
                    'Out of Stock'
                  ) : isAddedToCart ? (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="center" side="bottom">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    <p className="font-semibold">Added to cart!</p>
                  </div>
                  <Button onClick={() => navigate('/basket')} className="w-full">
                    Checkout Now
                  </Button>
                  <Button variant="outline" onClick={() => setShowCheckoutPopover(false)} className="w-full">
                    Continue Shopping
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {product.offers_enabled && !isOutOfStock && !isAuction && (
            <MakeOfferModal
              productId={product.id}
              productName={product.product_name}
              currentPrice={product.discounted_price || product.starting_price}
              sellerId={product.seller_id}
            >
              <Button size="lg" variant="outline" className="h-auto flex-1 py-3">
                Make Offer
              </Button>
            </MakeOfferModal>
          )}
        </div>
      </div>

      {/* Mobile version - price info and stacked buttons (visible on mobile) */}
      <div className="rounded-lg bg-muted/30 p-4 md:hidden">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              {product.discounted_price ? (
                <>
                  <span className="text-2xl font-bold text-primary">£{product.discounted_price.toFixed(2)}</span>
                  <span className="text-lg text-muted-foreground line-through">
                    £{product.starting_price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-primary">£{product.starting_price.toFixed(2)}</span>
              )}
            </div>
            {buyerProtectionFee !== null && (
              <p className="text-sm text-blue-600">(Buyer Protection: £{buyerProtectionFee.toFixed(2)})</p>
            )}
            {isOutOfStock && <span className="text-sm font-semibold text-destructive">Out of Stock</span>}
          </div>

          {/* Stacked buttons */}
          <div className="flex flex-col gap-2">
            {!isAuction && (
              <Button
                size="lg"
                onClick={handleBuyNowClick}
                className="h-auto w-full bg-buy-now py-3 text-buy-now-foreground hover:bg-buy-now/90"
                disabled={isOutOfStock || isBuyingNow || isGenerating}
              >
                {isBuyingNow || isGenerating ? (
                  isGenerating ? (
                    'Generating Labels...'
                  ) : (
                    'Processing...'
                  )
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    Buy Now
                  </>
                )}
              </Button>
            )}

            {!isAuction && (
              <Popover
                open={isMobile && showCheckoutPopover}
                onOpenChange={(open) => {
                  if (!preventPopoverClose) {
                    setShowCheckoutPopover(open);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    size="lg"
                    onClick={handleAddToCart}
                    className="h-auto w-full py-3"
                    variant={isAddedToCart ? 'secondary' : 'outline'}
                    disabled={isOutOfStock}
                  >
                    {isOutOfStock ? (
                      'Out of Stock'
                    ) : isAddedToCart ? (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        Added to Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="center" side="top">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-5 w-5" />
                      <p className="font-semibold">Added to cart!</p>
                    </div>
                    <Button onClick={() => navigate('/basket')} className="w-full">
                      Checkout Now
                    </Button>
                    <Button variant="outline" onClick={() => setShowCheckoutPopover(false)} className="w-full">
                      Continue Shopping
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {product.offers_enabled && !isOutOfStock && !isAuction && (
              <MakeOfferModal
                productId={product.id}
                productName={product.product_name}
                currentPrice={product.discounted_price || product.starting_price}
                sellerId={product.seller_id}
              >
                <Button size="lg" variant="outline" className="h-auto w-full py-3">
                  Make Offer
                </Button>
              </MakeOfferModal>
            )}
          </div>
        </div>
      </div>

      <ShippingAddressDialog
        open={showShippingDialog}
        onClose={() => setShowShippingDialog(false)}
        onConfirm={handleShippingConfirm}
        productId={product.id}
        sellerId={product.seller_id}
      />
    </>
  );
};
