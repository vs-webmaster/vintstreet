// Checkout Page
// Orchestrates checkout flow using extracted hooks and components

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  CheckoutAccountModal,
  CheckoutAddressSection,
  CheckoutShippingSection,
  CheckoutOrderSummary,
} from '@/components/checkout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useBuyerProtectionFees, calculateBuyerProtectionFee } from '@/hooks/useBuyerProtectionFees';
import { useCart } from '@/hooks/useCart';
import { useCheckoutAddress } from '@/hooks/useCheckoutAddress';
import { useCheckoutShipping } from '@/hooks/useCheckoutShipping';
import { useSellerNameMappings } from '@/hooks/useSellerNameMappings';
import { useShippingLabel } from '@/hooks/useShippingLabel';
import { invokeEdgeFunction } from '@/services/functions';
import { createOrder } from '@/services/orders';
import { isFailure } from '@/types/api';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { user, profile } = useAuth();
  const { generateLabel, isGenerating } = useShippingLabel();
  const [loading, setLoading] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Resolve seller IDs (supports legacy cart items storing shop_name)
  const rawSellerIds = [...new Set(cartItems.map((item) => item.listings?.seller_id))];
  const { nameMappings, resolvedSellerIds: sellerIds, isUuid } = useSellerNameMappings(rawSellerIds);

  // Address management hook
  const addressHook = useCheckoutAddress({
    userId: user?.id,
    userEmail: user?.email || undefined,
    profileFullName: profile?.full_name || undefined,
  });

  // Shipping management hook
  const shippingHook = useCheckoutShipping({
    cartItems,
    sellerIds,
    nameMappings,
    shippingCountry: addressHook.shippingDetails.country,
  });

  // Buyer protection fees
  const { data: buyerProtectionFees } = useBuyerProtectionFees();

  // Calculate totals
  const subtotal = useMemo(
    () =>
      cartItems.reduce((sum, item) => sum + (item.listings?.discounted_price || item.listings?.starting_price || 0), 0),
    [cartItems],
  );

  const totalBuyerProtectionFee = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const itemPrice = item.listings?.discounted_price || item.listings?.starting_price || 0;
      const fee = calculateBuyerProtectionFee(itemPrice, buyerProtectionFees);
      return sum + (fee || 0);
    }, 0);
  }, [cartItems, buyerProtectionFees]);

  const total = subtotal + shippingHook.shippingCost + totalBuyerProtectionFee;

  // Show account creation modal for guest users
  useEffect(() => {
    if (!user && cartItems.length > 0) {
      setShowAccountModal(true);
    }
  }, [user, cartItems]);

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please create an account to complete checkout');
      setShowAccountModal(true);
      return;
    }

    const finalShippingDetails = addressHook.getFinalShippingDetails();

    if (!addressHook.validateShippingDetails()) {
      toast.error('Please fill in all required shipping fields');
      return;
    }

    if (!Object.values(shippingHook.selectedShippingOptions).every((opt) => opt)) {
      toast.error('Please select shipping options for all items');
      return;
    }

    setLoading(true);

    try {
      // Save address if new
      if (!addressHook.useExistingAddress) {
        await addressHook.saveShippingAddress(user.id);
      }

      // Create pending orders for each item
      const createdOrders = [];
      for (const item of cartItems) {
        const resolvedSellerId = isUuid(item.listings?.seller_id)
          ? item.listings?.seller_id
          : nameMappings?.find((m) => m.shop_name === item.listings?.seller_id)?.user_id || item.listings?.seller_id;

        const orderResult = await createOrder({
          listing_id: item.listing_id,
          buyer_id: user.id,
          seller_id: resolvedSellerId,
          order_amount: item.listings?.discounted_price || item.listings?.starting_price || 0,
          stream_id: 'marketplace-order',
          status: 'pending',
          delivery_status: 'processing',
        });

        if (isFailure(orderResult)) throw orderResult.error;

        const orderData = orderResult.data;
        if (!orderData) throw new Error('Failed to create order');

        createdOrders.push({
          id: orderData.id,
          seller_id: resolvedSellerId,
          product_name: item.listings?.product_name,
          price: item.listings?.discounted_price || item.listings?.starting_price || 0,
        });
      }

      // Generate shipping labels
      toast.info('Generating shipping labels...');

      const shippingAddressData = {
        first_name: finalShippingDetails.firstName,
        last_name: finalShippingDetails.lastName,
        address_line1: finalShippingDetails.addressLine1,
        address_line2: finalShippingDetails.addressLine2,
        city: finalShippingDetails.city,
        state: finalShippingDetails.state,
        postal_code: finalShippingDetails.postalCode,
        country: finalShippingDetails.country,
        phone: finalShippingDetails.phone,
        email: user.email || '',
      };

      for (const order of createdOrders) {
        const labelResult = await generateLabel(
          order.id,
          shippingAddressData,
          shippingHook.selectedShippingOptions[order.seller_id],
        );

        if (!labelResult || !labelResult.success) {
          toast.error('Failed to generate shipping label for order. Please try again.');
          setLoading(false);
          return;
        }
      }

      toast.success('Shipping labels generated successfully. Proceeding to payment...');

      // Call Stripe Checkout
      const checkoutResult = await invokeEdgeFunction<{ url?: string }>({
        functionName: 'create-checkout-split',
        body: {
          orders: createdOrders,
          shippingCost: shippingHook.shippingCost,
        },
      });

      if (isFailure(checkoutResult)) throw checkoutResult.error;

      if (checkoutResult.data?.url) {
        window.location.href = checkoutResult.data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to process checkout. Please try again.');
      setLoading(false);
    }
  };

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="mb-2 text-xl font-semibold">Your basket is empty</h3>
              <p className="mb-4 text-muted-foreground">Add some items to checkout!</p>
              <Button onClick={() => navigate('/shop')}>Continue Shopping</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/basket')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Basket
        </Button>

        <h1 className="mb-8 text-3xl font-bold text-foreground">Checkout</h1>

        <CheckoutAccountModal
          open={showAccountModal}
          onOpenChange={setShowAccountModal}
          onAccountCreated={(email) => {
            addressHook.setShippingDetails({ ...addressHook.shippingDetails, email });
          }}
          hasUser={!!user}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <CheckoutAddressSection
              savedAddresses={addressHook.savedAddresses}
              selectedAddressId={addressHook.selectedAddressId}
              setSelectedAddressId={addressHook.setSelectedAddressId}
              useExistingAddress={addressHook.useExistingAddress}
              setUseExistingAddress={addressHook.setUseExistingAddress}
              manualAddressMode={addressHook.manualAddressMode}
              setManualAddressMode={addressHook.setManualAddressMode}
              addressSelected={addressHook.addressSelected}
              setAddressSelected={addressHook.setAddressSelected}
              saveAddress={addressHook.saveAddress}
              setSaveAddress={addressHook.setSaveAddress}
              shippingDetails={addressHook.shippingDetails}
              setShippingDetails={addressHook.setShippingDetails}
            />

            <CheckoutShippingSection
              sellerIds={sellerIds}
              selectedShippingOptions={shippingHook.selectedShippingOptions}
              setSelectedShippingOptions={(opts) => shippingHook.setSelectedShippingOptions(opts)}
              getSellerItems={shippingHook.getSellerItems}
              getSellerWeight={shippingHook.getSellerWeight}
              getValidOptions={shippingHook.getValidOptions}
              getOptionPrice={shippingHook.getOptionPrice}
            />
          </div>

          <div className="lg:col-span-1">
            <CheckoutOrderSummary
              cartItems={cartItems}
              subtotal={subtotal}
              shippingCost={shippingHook.shippingCost}
              buyerProtectionFee={totalBuyerProtectionFee}
              total={total}
              loading={loading}
              isGenerating={isGenerating}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
