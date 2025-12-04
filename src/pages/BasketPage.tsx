// Basket Page
// Shopping cart with seller-grouped items and shipping selection

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BasketCountryDialog, BasketSellerGroup, BasketOrderSummary } from '@/components/basket';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { useBasketShipping } from '@/hooks/useBasketShipping';

const BasketPage = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart } = useCart();
  const [showCountryDialog, setShowCountryDialog] = useState(false);

  const {
    validCartItems,
    sellerGroups,
    shippingCountry,
    ukRegion,
    setUkRegion,
    shippingOptions,
    subtotal,
    totalShipping,
    totalBuyerProtectionFee,
    total,
    canCheckout,
    handleShippingChange,
    handleCountryChange,
    getProviderBandForWeight,
    getFilteredOptions,
  } = useBasketShipping(cartItems);

  // Show country selection dialog when user first enters basket
  useEffect(() => {
    if (cartItems.length > 0 && !shippingCountry) {
      setShowCountryDialog(true);
    }
  }, [cartItems.length, shippingCountry]);

  const onCountryChange = (value: string) => {
    handleCountryChange(value);
    setShowCountryDialog(false);
  };

  const hasOutOfStockItems = validCartItems.some((item) => item.listings?.status !== 'published');

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <BasketCountryDialog
        open={showCountryDialog}
        onOpenChange={setShowCountryDialog}
        shippingCountry={shippingCountry}
        onCountryChange={onCountryChange}
        ukRegion={ukRegion}
        onUkRegionChange={setUkRegion}
      />

      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/shop')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continue Shopping
        </Button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Basket Items */}
          <div className="lg:col-span-2">
            <h1 className="mb-6 text-3xl font-bold text-foreground">Shopping Basket</h1>

            {cartItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="mb-2 text-xl font-semibold">Your basket is empty</h3>
                  <p className="mb-4 text-muted-foreground">Add some items to get started!</p>
                  <Button onClick={() => navigate('/shop')}>Continue Shopping</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Shipping Destination Warning Banner */}
                {!shippingCountry && (
                  <div
                    className="cursor-pointer rounded-lg border-2 border-orange-500 bg-orange-500/10 p-4 transition-colors hover:bg-orange-500/20"
                    onClick={() => setShowCountryDialog(true)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 flex-shrink-0 text-orange-600 dark:text-orange-400" />
                        <div>
                          <p className="font-semibold text-orange-700 dark:text-orange-400">
                            Shipping destination not selected
                          </p>
                          <p className="text-sm text-orange-600 dark:text-orange-300">
                            Click here to select your shipping country and view available shipping options
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="flex-shrink-0">
                        Select Country
                      </Button>
                    </div>
                  </div>
                )}

                {Object.values(sellerGroups).map((group) => (
                  <BasketSellerGroup
                    key={group.sellerId}
                    group={group}
                    shippingCountry={shippingCountry}
                    filteredOptions={getFilteredOptions(group.sellerId)}
                    allSellerOptions={shippingOptions.filter((opt) => opt.seller_id === group.sellerId)}
                    onShippingChange={handleShippingChange}
                    onRemoveItem={removeFromCart}
                    getProviderBandForWeight={getProviderBandForWeight}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          {cartItems.length > 0 && (
            <div className="lg:col-span-1">
              <BasketOrderSummary
                itemCount={cartItems.length}
                sellerCount={Object.keys(sellerGroups).length}
                subtotal={subtotal}
                totalShipping={totalShipping}
                buyerProtectionFee={totalBuyerProtectionFee}
                total={total}
                shippingCountry={shippingCountry}
                canCheckout={canCheckout}
                hasOutOfStockItems={hasOutOfStockItems}
                onSelectCountry={() => setShowCountryDialog(true)}
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BasketPage;
