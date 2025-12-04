import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';
import { fetchProductByIdOrSlug } from '@/services/products';
import {
  fetchShippingOptionsBySeller,
  fetchShippingProviderPrices,
  getProviderBandForWeight,
  type ProviderPriceRow,
} from '@/services/shipping';
import { fetchSavedAddresses } from '@/services/users';
import { isFailure } from '@/types/api';

interface ShippingAddress {
  id?: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

interface ShippingAddressDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (address: ShippingAddress, shippingCost: number, shippingOptionId: string) => void;
  productId: string;
  sellerId: string;
}

export const ShippingAddressDialog = ({
  open,
  onClose,
  onConfirm,
  productId,
  sellerId,
}: ShippingAddressDialogProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'shipping' | 'address'>('shipping');
  const [confirmedAddress, setConfirmedAddress] = useState<ShippingAddress | null>(null);
  const [confirmedShippingOption, setConfirmedShippingOption] = useState<unknown>(null);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [selectedShippingOption, setSelectedShippingOption] = useState<string>('');
  const [useExistingAddress, setUseExistingAddress] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [newAddress, setNewAddress] = useState<ShippingAddress>({
    first_name: '',
    last_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United Kingdom',
    phone: '',
  });

  // Fetch product weight
  const { data: product } = useQuery({
    queryKey: ['product-weight', productId],
    queryFn: async () => {
      const result = await fetchProductByIdOrSlug(productId);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
    enabled: open,
  });

  // Fetch seller's shipping options
  const { data: shippingOptions = [] } = useQuery({
    queryKey: ['seller-shipping-options', sellerId],
    queryFn: async () => {
      const result = await fetchShippingOptionsBySeller(sellerId);
      if (isFailure(result)) {
        throw result.error;
      }
      // Filter to only active options
      return (result.data || []).filter((opt) => opt.is_active) as unknown[];
    },
    enabled: open && !!sellerId,
  });

  // Fetch shipping provider prices
  const { data: providerPrices = [] } = useQuery({
    queryKey: ['shipping-provider-prices'],
    queryFn: async () => {
      const result = await fetchShippingProviderPrices();
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
  });

  // Fetch saved addresses
  const { data: savedAddresses = [], isLoading } = useQuery({
    queryKey: ['saved-addresses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const result = await fetchSavedAddresses(user.id);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
    enabled: open && !!user?.id,
  });

  // Auto-select default or first address
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const defaultAddress = savedAddresses.find((addr: unknown) => addr.is_default) || savedAddresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [savedAddresses, selectedAddressId]);

  // Get the provider price band that matches a given total weight (in kg)
  const getProviderBandForWeightLocal = useCallback(
    (providerId: string | null, totalWeightKg: number): ProviderPriceRow | null => {
      if (!providerId || !providerPrices || providerPrices.length === 0) return null;

      return getProviderBandForWeight(providerPrices as ProviderPriceRow[], providerId, totalWeightKg);
    },
    [providerPrices],
  );

  // Calculate shipping cost based on weight and shipping option
  const calculateShippingCost = useCallback(
    (shippingOption: unknown): number => {
      if (!shippingOption || !product) {
        return 0;
      }

      const productWeight = Number(product.weight) || 0;
      const providerBand = getProviderBandForWeightLocal(shippingOption.provider_id, productWeight);

      if (!providerBand || !providerBand.price) {
        return 0;
      }

      return Number(providerBand.price);
    },
    [product, getProviderBandForWeightLocal],
  );

  // Auto-select cheapest shipping option when dialog opens
  useEffect(() => {
    if (open && shippingOptions.length > 0 && providerPrices.length > 0 && product && !selectedShippingOption) {
      const productWeight = Number(product.weight) || 0;

      // Find the first valid option with a price band
      const validOption = shippingOptions.find((option: unknown) => {
        const providerBand = getProviderBandForWeightLocal(option.provider_id, productWeight);
        return providerBand && providerBand.price;
      });

      if (validOption) {
        const cost = calculateShippingCost(validOption);
        setSelectedShippingOption(String(validOption.id));
        setShippingCost(cost);
      }
    }
  }, [
    open,
    shippingOptions,
    providerPrices,
    product,
    selectedShippingOption,
    getProviderBandForWeightLocal,
    calculateShippingCost,
  ]);

  const handleShippingConfirm = () => {
    if (!selectedShippingOption) {
      toast.error('Please select a shipping option');
      return;
    }

    const option = shippingOptions.find((opt: unknown) => String(opt.id) === selectedShippingOption);
    if (!option) {
      toast.error('Please select a valid shipping option');
      return;
    }

    const cost = calculateShippingCost(option);
    setConfirmedShippingOption(option);
    setShippingCost(cost);
    setStep('address');
  };

  const handleAddressConfirm = () => {
    if (!confirmedShippingOption || !selectedShippingOption) {
      toast.error('Please select a shipping option');
      return;
    }

    let address: ShippingAddress;

    if (useExistingAddress) {
      const selected = savedAddresses.find((addr: unknown) => addr.id === selectedAddressId);
      if (!selected) {
        toast.error('Please select an address');
        return;
      }
      address = {
        id: selected.id,
        first_name: selected.first_name,
        last_name: selected.last_name,
        address_line1: selected.address_line1,
        address_line2: selected.address_line2,
        city: selected.city,
        state: selected.state,
        postal_code: selected.postal_code,
        country: selected.country,
        phone: selected.phone,
      };
    } else {
      // Validate new address
      if (
        !newAddress.first_name ||
        !newAddress.last_name ||
        !newAddress.address_line1 ||
        !newAddress.city ||
        !newAddress.postal_code ||
        !newAddress.country
      ) {
        toast.error('Please fill in all required fields');
        return;
      }
      address = newAddress;
    }

    setConfirmedAddress(address);
    onConfirm(address, shippingCost, selectedShippingOption);
  };

  const handleShippingOptionChange = (optionId: string) => {
    setSelectedShippingOption(optionId);
    const option = shippingOptions.find((opt: unknown) => String(opt.id) === optionId);
    if (option) {
      const cost = calculateShippingCost(option);
      setShippingCost(cost);
    }
  };

  const handleBack = () => {
    setStep('shipping');
  };

  const handleDialogClose = () => {
    setStep('shipping');
    setConfirmedAddress(null);
    setConfirmedShippingOption(null);
    setShippingCost(0);
    setSelectedShippingOption('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {step === 'shipping' ? 'Select Shipping Method' : 'Confirm Shipping Address'}
          </DialogTitle>
          <DialogDescription>
            {step === 'shipping'
              ? 'Choose your preferred shipping method'
              : 'Confirm your shipping address and review shipping cost'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === 'shipping' ? (
            <div className="space-y-4">
              {shippingOptions.length > 0 ? (
                <div className="space-y-3">
                  <Label>Select Shipping Method</Label>
                  <RadioGroup value={selectedShippingOption} onValueChange={handleShippingOptionChange}>
                    {shippingOptions
                      .filter((opt) => {
                        if (opt.seller_id !== sellerId) return false;

                        const shippingCountry = localStorage.getItem('shipping_country');
                        const providerName = opt.shipping_providers?.name?.toLowerCase() || '';
                        const isUK = shippingCountry === 'GB';

                        // Filter out International Royal Mail Tracked if UK is selected
                        if (isUK && providerName.includes('international')) {
                          return false;
                        }

                        // Show only international options for non-UK countries
                        if (!isUK && !providerName.includes('international')) {
                          return false;
                        }

                        return true;
                      })
                      .map((option: unknown) => {
                        const productWeight = Number(product?.weight) || 0;
                        const providerBand = getProviderBandForWeightLocal(option.provider_id, productWeight);

                        // Only show options that have a valid price band for this weight
                        if (!providerBand || !providerBand.price) {
                          return null;
                        }

                        const cost = Number(providerBand.price);
                        const optionId = String(option.id);

                        return (
                          <div
                            key={optionId}
                            className="flex cursor-pointer items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50"
                          >
                            <RadioGroupItem value={optionId} id={optionId} />
                            <label htmlFor={optionId} className="flex-1 cursor-pointer">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{option.shipping_providers?.name || 'Shipping'}</p>
                                  {providerBand.band_name && (
                                    <p className="text-xs text-muted-foreground">{providerBand.band_name}</p>
                                  )}
                                  {option.shipping_providers?.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {option.shipping_providers.description}
                                    </p>
                                  )}
                                  {!!(option.estimated_days_min && option.estimated_days_max) && (
                                    <p className="text-sm text-muted-foreground">
                                      Estimated delivery: {option.estimated_days_min}-{option.estimated_days_max} days
                                    </p>
                                  )}
                                </div>
                                <p className="font-semibold">£{cost.toFixed(2)}</p>
                              </div>
                            </label>
                          </div>
                        );
                      })
                      .filter(Boolean)}
                  </RadioGroup>

                  {selectedShippingOption && (
                    <Card className="bg-primary/5 p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between font-medium">
                          <span>Shipping Cost</span>
                          <span className="text-primary">£{shippingCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="bg-muted/50 p-4">
                  <p className="text-center text-sm text-muted-foreground">
                    {shippingOptions.length === 0
                      ? 'No shipping options available from this seller. Please contact the seller for shipping arrangements.'
                      : 'No shipping options available for this product weight. Please contact the seller for shipping arrangements.'}
                  </p>
                </Card>
              )}
            </div>
          ) : (
            <>
              {confirmedShippingOption && (
                <Card className="mb-4 bg-muted/50 p-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Selected Shipping Method:</h3>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {confirmedShippingOption.shipping_providers?.name || 'Shipping'}
                        {confirmedShippingOption.estimated_days_min && confirmedShippingOption.estimated_days_max && (
                          <span className="ml-2">
                            ({confirmedShippingOption.estimated_days_min}-{confirmedShippingOption.estimated_days_max}{' '}
                            days)
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-primary">£{shippingCost.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              )}

              {savedAddresses.length > 0 && (
                <RadioGroup
                  value={useExistingAddress ? 'existing' : 'new'}
                  onValueChange={(value) => setUseExistingAddress(value === 'existing')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="existing" id="existing" />
                    <Label htmlFor="existing" className="cursor-pointer">
                      Use saved address
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="new" />
                    <Label htmlFor="new" className="cursor-pointer">
                      Use new address
                    </Label>
                  </div>
                </RadioGroup>
              )}

              {useExistingAddress && savedAddresses.length > 0 ? (
                <div className="space-y-3">
                  <Label>Select Address</Label>
                  <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                    {savedAddresses.map((address: unknown) => (
                      <Card key={address.id} className="cursor-pointer p-4 transition-colors hover:border-primary">
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                          <label htmlFor={address.id} className="flex-1 cursor-pointer">
                            <div className="font-medium">
                              {address.first_name} {address.last_name}
                              {address.is_default && (
                                <span className="ml-2 rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {address.address_line1}
                              {address.address_line2 && <>, {address.address_line2}</>}
                              <br />
                              {address.city}, {address.state} {address.postal_code}
                              <br />
                              {address.country}
                              {address.phone && (
                                <>
                                  <br />
                                  Phone: {address.phone}
                                </>
                              )}
                            </div>
                          </label>
                        </div>
                      </Card>
                    ))}
                  </RadioGroup>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Plus className="h-4 w-4" />
                    <span>Enter new shipping address</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        value={newAddress.first_name}
                        onChange={(e) => setNewAddress({ ...newAddress, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        value={newAddress.last_name}
                        onChange={(e) => setNewAddress({ ...newAddress, last_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <AddressAutocomplete
                    id="address_line1"
                    label="Address Line 1"
                    value={newAddress.address_line1}
                    onChange={(value) => setNewAddress({ ...newAddress, address_line1: value })}
                    onAddressSelect={(address) => {
                      setNewAddress({
                        ...newAddress,
                        address_line1: address.addressLine1,
                        city: address.city,
                        state: address.state,
                        postal_code: address.postalCode,
                        country: address.country || newAddress.country,
                      });
                    }}
                    required
                  />

                  <div>
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      value={newAddress.address_line2}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/County</Label>
                      <Input
                        id="state"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postal_code">Postal Code *</Label>
                      <Input
                        id="postal_code"
                        value={newAddress.postal_code}
                        onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={newAddress.country}
                        onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          {step === 'address' && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={handleDialogClose}>
            Cancel
          </Button>
          <Button onClick={step === 'shipping' ? handleShippingConfirm : handleAddressConfirm} disabled={isLoading}>
            {step === 'shipping' ? 'Continue to Address' : 'Confirm & Continue to Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
