// Checkout Address Section
// Handles saved address selection and new address entry

import { useNavigate } from 'react-router-dom';
import { MapPin, Package } from 'lucide-react';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SavedAddress, ShippingDetails } from '@/hooks/useCheckoutAddress';

interface CheckoutAddressSectionProps {
  savedAddresses: SavedAddress[];
  selectedAddressId: string | null;
  setSelectedAddressId: (id: string | null) => void;
  useExistingAddress: boolean;
  setUseExistingAddress: (use: boolean) => void;
  manualAddressMode: boolean;
  setManualAddressMode: (manual: boolean) => void;
  addressSelected: boolean;
  setAddressSelected: (selected: boolean) => void;
  saveAddress: boolean;
  setSaveAddress: (save: boolean) => void;
  shippingDetails: ShippingDetails;
  setShippingDetails: (details: ShippingDetails) => void;
}

export const CheckoutAddressSection = ({
  savedAddresses,
  selectedAddressId,
  setSelectedAddressId,
  useExistingAddress,
  setUseExistingAddress,
  manualAddressMode,
  setManualAddressMode,
  addressSelected,
  setAddressSelected,
  saveAddress,
  setSaveAddress,
  shippingDetails,
  setShippingDetails,
}: CheckoutAddressSectionProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Shipping Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {savedAddresses && savedAddresses.length > 0 && (
          <div className="space-y-4 border-b pb-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Delivery Address</Label>
              <Button variant="link" size="sm" onClick={() => navigate('/my-addresses')} className="text-xs">
                Manage Addresses
              </Button>
            </div>

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

              {useExistingAddress && (
                <div className="ml-6 space-y-2">
                  <RadioGroup value={selectedAddressId || ''} onValueChange={setSelectedAddressId}>
                    {savedAddresses.map((address) => (
                      <div
                        key={address.id}
                        className="flex items-start space-x-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                        <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="font-medium">{address.label || 'Address'}</span>
                              {address.is_default && (
                                <span className="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm">
                              {address.first_name} {address.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {address.address_line1}
                              {address.address_line2 && `, ${address.address_line2}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {address.city}, {address.state} {address.postal_code}, {address.country}
                            </p>
                            <p className="text-sm text-muted-foreground">{address.phone}</p>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new" className="cursor-pointer">
                  Use a different address
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {(!useExistingAddress || !savedAddresses || savedAddresses.length === 0) && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={shippingDetails.firstName}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={shippingDetails.lastName}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            {!manualAddressMode ? (
              <>
                <AddressAutocomplete
                  id="searchAddress"
                  label="Search Address"
                  value={shippingDetails.addressLine1}
                  onChange={(value) => setShippingDetails({ ...shippingDetails, addressLine1: value })}
                  onAddressSelect={(address) => {
                    setShippingDetails({
                      ...shippingDetails,
                      addressLine1: address.addressLine1,
                      city: address.city,
                      state: address.state,
                      postalCode: address.postalCode,
                      country: address.country || shippingDetails.country,
                    });
                    setAddressSelected(true);
                  }}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setManualAddressMode(true)}
                  className="w-full"
                >
                  Add address manually
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setManualAddressMode(false);
                  setAddressSelected(false);
                }}
                className="w-full"
              >
                Use address lookup
              </Button>
            )}

            {(manualAddressMode || addressSelected) && (
              <>
                {manualAddressMode && (
                  <div>
                    <Label htmlFor="addressLine1Manual">Address Line 1 *</Label>
                    <Input
                      id="addressLine1Manual"
                      value={shippingDetails.addressLine1}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, addressLine1: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    value={shippingDetails.addressLine2}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, addressLine2: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={shippingDetails.city}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/County</Label>
                    <Input
                      id="state"
                      value={shippingDetails.state}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, state: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={shippingDetails.postalCode}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, postalCode: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Select
                      value={shippingDetails.country}
                      onValueChange={(value) => {
                        setShippingDetails({ ...shippingDetails, country: value });
                        localStorage.setItem('shipping_country', value);
                      }}
                    >
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="ES">Spain</SelectItem>
                        <SelectItem value="IT">Italy</SelectItem>
                        <SelectItem value="NL">Netherlands</SelectItem>
                        <SelectItem value="BE">Belgium</SelectItem>
                        <SelectItem value="IE">Ireland</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">Changing country may affect shipping costs</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={shippingDetails.phone}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="saveAddress"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="saveAddress" className="cursor-pointer text-sm font-normal">
                    Save this address for next time
                  </Label>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
