import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import {
  createShippingOption,
  fetchAllShippingProviders,
  fetchShippingOptionsBySeller,
  deleteShippingOption,
} from '@/services/shipping';
import { fetchSellerProfile, upsertSellerProfile, UpdateSellerProfileInput } from '@/services/users';
import { isFailure } from '@/types/api';

interface ShippingAddress {
  return_address_line1: string;
  return_address_line2?: string;
  return_city: string;
  return_state: string;
  return_postal_code: string;
  return_country: string;
}

interface ShippingSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShippingSettingsDialog = ({ open, onOpenChange }: ShippingSettingsDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [deliveryTimeframe, setDeliveryTimeframe] = useState({
    min: '',
    max: '',
  });
  const [addressData, setAddressData] = useState<ShippingAddress>({
    return_address_line1: '',
    return_address_line2: '',
    return_city: '',
    return_state: '',
    return_postal_code: '',
    return_country: 'GB',
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Fetch seller's shipping address
  const { data: sellerProfile } = useQuery({
    queryKey: ['seller-shipping-address', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const result = await fetchSellerProfile(user.id);
      if (isFailure(result)) {
        // If profile doesn't exist, that's okay
        if (result.error.message?.includes('not found')) {
          return null;
        }
        throw result.error;
      }

      const profile = result.data;
      if (profile) {
        setAddressData({
          return_address_line1: profile.return_address_line1 || '',
          return_address_line2: profile.return_address_line2 || '',
          return_city: profile.return_city || '',
          return_state: profile.return_state || '',
          return_postal_code: profile.return_postal_code || '',
          return_country: profile.return_country || 'GB',
        });
      }

      return profile;
    },
    enabled: !!user?.id && open,
  });

  // Fetch shipping providers
  const { data: providers = [] } = useQuery({
    queryKey: ['shipping-providers'],
    queryFn: async () => {
      const result = await fetchAllShippingProviders();
      if (isFailure(result)) {
        throw result.error;
      }
      // Filter to only active providers and sort by display_order
      return (result.data || []).filter((p) => p.is_active).sort((a, b) => a.display_order - b.display_order);
    },
    enabled: open && !!sellerProfile,
  });

  // Fetch seller's existing shipping options
  const { data: existingOptions = [], isLoading } = useQuery({
    queryKey: ['seller-shipping-options', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const result = await fetchShippingOptionsBySeller(user.id);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || [];
    },
    enabled: !!user?.id && open,
  });

  // Load existing selections when data is available
  useEffect(() => {
    if (existingOptions && existingOptions.length > 0) {
      const providerIds = new Set(existingOptions.map((opt: any) => opt.provider_id).filter(Boolean));
      setSelectedProviders(providerIds);

      // Use the first option's timeframe (since they should all be the same)
      const firstOption = existingOptions[0];
      if (firstOption) {
        setDeliveryTimeframe({
          min: firstOption.estimated_days_min?.toString() || '',
          max: firstOption.estimated_days_max?.toString() || '',
        });
      }
    }
  }, [existingOptions]);

  // Save shipping address mutation
  const saveAddressMutation = useMutation({
    mutationFn: async (data: ShippingAddress) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updates: UpdateSellerProfileInput = {
        return_address_line1: data.return_address_line1.trim() || null,
        return_address_line2: data.return_address_line2?.trim() || null,
        return_city: data.return_city.trim() || null,
        return_state: data.return_state.trim() || null,
        return_postal_code: data.return_postal_code.trim() || null,
        return_country: data.return_country || null,
      };

      const result = await upsertSellerProfile(user.id, updates);
      if (isFailure(result)) {
        throw result.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-shipping-address'] });
      toast.success('Shipping address updated');
      setIsEditingAddress(false);
    },
    onError: (error) => {
      console.error('Save shipping address error:', error);
      toast.error('Failed to save shipping address');
    },
  });

  // Save shipping settings mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      if (selectedProviders.size === 0) {
        throw new Error('Please select at least one shipping provider');
      }

      if (!deliveryTimeframe.min || !deliveryTimeframe.max) {
        throw new Error('Please enter delivery timeframe');
      }

      // First, delete all existing shipping options for this seller
      if (existingOptions.length > 0) {
        const deletePromises = existingOptions.map((opt: any) => deleteShippingOption(opt.id));
        const deleteResults = await Promise.all(deletePromises);
        const failedDelete = deleteResults.find((r) => isFailure(r));
        if (failedDelete) {
          throw failedDelete.error;
        }
      }

      // Then insert new options for each selected provider
      const optionsToInsert = Array.from(selectedProviders).map((providerId) => ({
        seller_id: user.id,
        provider_id: providerId,
        estimated_days_min: parseInt(deliveryTimeframe.min),
        estimated_days_max: parseInt(deliveryTimeframe.max),
        is_active: true,
      }));

      const createPromises = optionsToInsert.map((option) => createShippingOption(option));
      const createResults = await Promise.all(createPromises);
      const failedCreate = createResults.find((r) => isFailure(r));
      if (failedCreate) {
        throw failedCreate.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-shipping-options'] });
      toast.success('Shipping settings saved');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error('Save shipping settings error:', error);
      toast.error(error.message || 'Failed to save shipping settings');
    },
  });

  const toggleProvider = (providerId: string) => {
    setSelectedProviders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(providerId)) {
        newSet.delete(providerId);
      } else {
        newSet.add(providerId);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !addressData.return_address_line1 ||
      !addressData.return_city ||
      !addressData.return_state ||
      !addressData.return_postal_code ||
      !addressData.return_country
    ) {
      toast.error('Please fill in all required address fields');
      return;
    }

    saveAddressMutation.mutate(addressData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Shipping Settings</DialogTitle>
          <DialogDescription>Manage your shipping address and delivery options</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Shipping Address Section */}
          <Card>
            {!isEditingAddress ? (
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">Shipping From:</h3>
                    {addressData.return_city ? (
                      <span className="text-sm text-muted-foreground">
                        {[
                          addressData.return_address_line1,
                          addressData.return_address_line2,
                          addressData.return_city,
                          addressData.return_state,
                          addressData.return_postal_code,
                          addressData.return_country,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsEditingAddress(true)}>
                    Edit
                  </Button>
                </div>
              </CardHeader>
            ) : (
              <>
                <CardHeader className="py-3 pb-2">
                  <h3 className="text-lg font-semibold">Shipping From</h3>
                </CardHeader>
                <CardContent className="pb-4">
                  <form onSubmit={handleSaveAddress} className="space-y-4">
                    <div>
                      <Label htmlFor="address_line1">Address Line 1 *</Label>
                      <Input
                        id="address_line1"
                        value={addressData.return_address_line1}
                        onChange={(e) => setAddressData((prev) => ({ ...prev, return_address_line1: e.target.value }))}
                        placeholder="Street address, P.O. box"
                        required
                        maxLength={200}
                      />
                    </div>

                    <div>
                      <Label htmlFor="address_line2">Address Line 2</Label>
                      <Input
                        id="address_line2"
                        value={addressData.return_address_line2}
                        onChange={(e) => setAddressData((prev) => ({ ...prev, return_address_line2: e.target.value }))}
                        placeholder="Apartment, suite, unit, building, floor, etc."
                        maxLength={200}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={addressData.return_city}
                          onChange={(e) => setAddressData((prev) => ({ ...prev, return_city: e.target.value }))}
                          placeholder="City"
                          required
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State/Province *</Label>
                        <Input
                          id="state"
                          value={addressData.return_state}
                          onChange={(e) => setAddressData((prev) => ({ ...prev, return_state: e.target.value }))}
                          placeholder="State or Province"
                          required
                          maxLength={100}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="postal_code">Postcode *</Label>
                        <Input
                          id="postal_code"
                          value={addressData.return_postal_code}
                          onChange={(e) => setAddressData((prev) => ({ ...prev, return_postal_code: e.target.value }))}
                          placeholder="Postcode"
                          required
                          maxLength={20}
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country *</Label>
                        <Select
                          value={addressData.return_country}
                          onValueChange={(value) => setAddressData((prev) => ({ ...prev, return_country: value }))}
                        >
                          <SelectTrigger id="country">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="bg-background">
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditingAddress(false);
                          if (sellerProfile) {
                            setAddressData({
                              return_address_line1: sellerProfile.return_address_line1 || '',
                              return_address_line2: sellerProfile.return_address_line2 || '',
                              return_city: sellerProfile.return_city || '',
                              return_state: sellerProfile.return_state || '',
                              return_postal_code: sellerProfile.return_postal_code || '',
                              return_country: sellerProfile.return_country || 'GB',
                            });
                          }
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={saveAddressMutation.isPending}>
                        {saveAddressMutation.isPending ? 'Saving...' : 'Save Address'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </>
            )}
          </Card>

          {/* Shipping Options Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Shipping Providers</h3>
              <p className="text-sm text-muted-foreground">Select providers and set delivery timeframe</p>
            </div>

            {isLoading ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : providers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="mb-4 h-16 w-16 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No Shipping Providers Available</h3>
                  <p className="text-center text-sm text-muted-foreground">
                    Contact support to set up shipping providers.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Provider Cards Grid */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {providers.map((provider: any) => (
                    <Card
                      key={provider.id}
                      className={`cursor-pointer transition-all ${
                        selectedProviders.has(provider.id)
                          ? 'bg-primary/5 ring-2 ring-primary'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => toggleProvider(provider.id)}
                    >
                      <CardContent className="p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{provider.name}</h4>
                            {provider.description && (
                              <p className="mt-1 text-xs text-muted-foreground">{provider.description}</p>
                            )}
                          </div>
                          <div
                            className={`ml-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 ${
                              selectedProviders.has(provider.id)
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground'
                            }`}
                          >
                            {selectedProviders.has(provider.id) && (
                              <svg
                                className="h-3 w-3 text-primary-foreground"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Delivery Timeframe */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Delivery Timeframe</CardTitle>
                    <CardDescription>Set your estimated delivery time (applies to all providers)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="min_days">Minimum Days</Label>
                        <Input
                          id="min_days"
                          type="number"
                          min="1"
                          value={deliveryTimeframe.min}
                          onChange={(e) => setDeliveryTimeframe((prev) => ({ ...prev, min: e.target.value }))}
                          placeholder="2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_days">Maximum Days</Label>
                        <Input
                          id="max_days"
                          type="number"
                          min="1"
                          value={deliveryTimeframe.max}
                          onChange={(e) => setDeliveryTimeframe((prev) => ({ ...prev, max: e.target.value }))}
                          placeholder="5"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              saveMutation.isPending || selectedProviders.size === 0 || !deliveryTimeframe.min || !deliveryTimeframe.max
            }
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
