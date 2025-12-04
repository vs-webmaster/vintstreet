import { useState } from 'react';
import { Apple, SmartphoneIcon, Mail } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { createShippingOptions, deleteShippingOptionsBySeller, fetchShippingProviders } from '@/services/shipping';
import { upsertSellerProfile } from '@/services/users';
import { isFailure } from '@/types/api';
import sellerWelcomeImage from '@/assets/seller-welcome.webp';

const categories = [
  "Men's Fashion",
  "Women's Fashion",
  'Junior Fashion',
  'Shoes',
  'Accessories',
  'Games & consoles',
  'Vinyl',
  'Comic Books',
  'Trading Cards',
  'VeeFriends',
];

export const SetupTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [setupStep, setSetupStep] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sellingMethods, setSellingMethods] = useState<string[]>([]);
  const [shopName, setShopName] = useState('');
  const [sendingEmail, setSendingEmail] = useState<'ios' | 'android' | null>(null);

  // Shipping settings state
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [deliveryTimeframe, setDeliveryTimeframe] = useState({ min: '', max: '' });
  const [addressData, setAddressData] = useState({
    return_address_line1: '',
    return_address_line2: '',
    return_city: '',
    return_state: '',
    return_postal_code: '',
    return_country: 'GB',
  });

  // Fetch shipping providers
  const { data: providers = [] } = useQuery({
    queryKey: ['shipping-providers-setup'],
    queryFn: async () => {
      const result = await fetchShippingProviders();
      if (isFailure(result)) throw result.error;
      // Filter out Royal Mail
      return result.data.filter((p) => p.name !== 'Royal Mail');
    },
    enabled: setupStep === 4,
  });

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  const handleMethodToggle = (method: string) => {
    setSellingMethods((prev) => (prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]));
  };

  const handleSendDownloadLink = async (platform: 'ios' | 'android') => {
    setSendingEmail(platform);
    try {
      const link =
        platform === 'ios' ? 'https://apps.apple.com/vintstreet' : 'https://play.google.com/store/apps/vintstreet';

      // For now, just show a toast. In production, you'd call an edge function to send the email
      toast({
        title: 'Download link sent!',
        description: `Check your email (${user?.email}) for the ${platform === 'ios' ? 'App Store' : 'Google Play'} download link`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to send download link',
        variant: 'destructive',
      });
    } finally {
      setSendingEmail(null);
    }
  };

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

  const handleNextStep = async () => {
    if (setupStep === 1 && selectedCategories.length === 0) return;
    if (setupStep === 2 && sellingMethods.length === 0) return;
    if (setupStep === 3 && !shopName.trim()) return;

    // Step 4: Validate and save shipping settings
    if (setupStep === 4) {
      if (selectedProviders.size === 0) {
        toast({ title: 'Error', description: 'Please select at least one shipping provider', variant: 'destructive' });
        return;
      }
      if (!deliveryTimeframe.min || !deliveryTimeframe.max) {
        toast({ title: 'Error', description: 'Please enter delivery timeframe', variant: 'destructive' });
        return;
      }
      if (
        !addressData.return_address_line1 ||
        !addressData.return_city ||
        !addressData.return_state ||
        !addressData.return_postal_code
      ) {
        toast({ title: 'Error', description: 'Please fill in all required address fields', variant: 'destructive' });
        return;
      }

      try {
        // Create/update seller profile first (required for shipping_options foreign key)
        const profileResult = await upsertSellerProfile(user!.id, {
          shop_name: shopName.trim() || 'My Shop',
          business_name: shopName.trim() || 'My Shop',
          return_address_line1: addressData.return_address_line1.trim(),
          return_address_line2: addressData.return_address_line2.trim() || null,
          return_city: addressData.return_city.trim(),
          return_state: addressData.return_state.trim() || null,
          return_postal_code: addressData.return_postal_code.trim(),
          return_country: addressData.return_country,
        });

        if (isFailure(profileResult)) throw profileResult.error;

        // Delete existing shipping options
        const deleteResult = await deleteShippingOptionsBySeller(user!.id);
        if (isFailure(deleteResult)) throw deleteResult.error;

        // Insert new shipping options
        const optionsToInsert = Array.from(selectedProviders).map((providerId) => ({
          seller_id: user!.id,
          provider_id: providerId,
          estimated_days_min: parseInt(deliveryTimeframe.min) || null,
          estimated_days_max: parseInt(deliveryTimeframe.max) || null,
          is_active: true,
        }));

        const createResult = await createShippingOptions(optionsToInsert);
        if (isFailure(createResult)) throw createResult.error;

        toast({ title: 'Success', description: 'Shipping settings saved' });
        setSetupStep(setupStep + 1);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to save shipping settings',
          variant: 'destructive',
        });
        return;
      }
      return;
    }

    if (setupStep === 5) {
      // On the final step, update the shop name if user changed it
      try {
        // Update seller profile with final shop name
        const updateResult = await upsertSellerProfile(user!.id, {
          shop_name: shopName.trim(),
          business_name: shopName.trim(),
        });

        if (isFailure(updateResult)) throw updateResult.error;

        toast({
          title: 'Setup Complete!',
          description: 'Your shop is ready to go',
        });

        // Redirect to add product page
        window.location.href = 'https://vintstreet.com/add-product';
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to complete setup',
          variant: 'destructive',
        });
        return;
      }
    } else {
      setSetupStep(setupStep + 1);
    }
  };

  const canProceed = () => {
    if (setupStep === 0) return true;
    if (setupStep === 1) return selectedCategories.length > 0;
    if (setupStep === 2) return sellingMethods.length > 0;
    if (setupStep === 3) return shopName.trim().length > 0;
    if (setupStep === 4)
      return (
        selectedProviders.size > 0 &&
        deliveryTimeframe.min !== '' &&
        deliveryTimeframe.max !== '' &&
        addressData.return_address_line1 !== '' &&
        addressData.return_city !== '' &&
        addressData.return_state !== '' &&
        addressData.return_postal_code !== ''
      );
    if (setupStep === 5) return true;
    return false;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      {/* Progress Indicator */}
      <div className="mb-12">
        <div className="mb-4 flex items-center justify-center gap-2">
          {[0, 1, 2, 3, 4, 5].map((num) => (
            <div
              key={num}
              className={`h-2 flex-1 rounded-full transition-colors ${num <= setupStep ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">Step {setupStep + 1} of 6</p>
      </div>

      {/* Step 0: Welcome */}
      {setupStep === 0 && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="mb-8 text-4xl font-bold text-foreground">Welcome to VintStreet Sellers</h1>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
            <div className="order-2 md:order-1">
              <img
                src={sellerWelcomeImage}
                alt="VintStreet Sellers"
                className="h-auto w-full rounded-lg object-cover"
              />
            </div>
            <div className="order-1 space-y-4 md:order-2">
              <p className="text-lg text-foreground">
                We are a UK first marketplace where you can list, livestream or auction your products. We are always
                here to help and support you on your selling journey.
              </p>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button size="lg" onClick={handleNextStep} className="px-12">
              Get Started
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Categories */}
      {setupStep === 1 && (
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-6 text-center">
              <h1 className="mb-4 text-4xl font-bold text-foreground">What type of things would you like to sell?</h1>
              <p className="text-muted-foreground">Select all that apply</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {categories.map((category) => (
                <label
                  key={category}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                    selectedCategories.includes(category)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Checkbox
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                    className="border-current"
                  />
                  <span className="font-medium">{category}</span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleNextStep} disabled={!canProceed()} className="px-12">
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Selling Methods */}
      {setupStep === 2 && (
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-6 text-center">
              <h1 className="mb-4 text-4xl font-bold text-foreground">How would you like to sell?</h1>
              <p className="text-muted-foreground">You can choose one or both</p>
            </div>

            <div className="mx-auto grid max-w-md grid-cols-1 gap-4">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                  sellingMethods.includes('Upload listings')
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Checkbox
                  checked={sellingMethods.includes('Upload listings')}
                  onCheckedChange={() => handleMethodToggle('Upload listings')}
                  className="border-current"
                />
                <div>
                  <span className="text-lg font-medium">Upload listings</span>
                  <p
                    className={`text-sm ${
                      sellingMethods.includes('Upload listings')
                        ? 'text-primary-foreground/80'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Create product listings to sell anytime
                  </p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                  sellingMethods.includes('Livestream')
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Checkbox
                  checked={sellingMethods.includes('Livestream')}
                  onCheckedChange={() => handleMethodToggle('Livestream')}
                  className="border-current"
                />
                <div>
                  <span className="text-lg font-medium">Livestream</span>
                  <p
                    className={`text-sm ${sellingMethods.includes('Livestream') ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
                  >
                    Sell live and engage with buyers in real-time
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <Button size="lg" variant="outline" onClick={() => setSetupStep(1)} className="px-12">
                Back
              </Button>
              <Button size="lg" onClick={handleNextStep} disabled={!canProceed()} className="px-12">
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Shop Name */}
      {setupStep === 3 && (
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-6 text-center">
              <h1 className="mb-4 text-4xl font-bold text-foreground">Your Shop Name</h1>
              <p className="text-muted-foreground">Choose a memorable name for your shop</p>
            </div>

            <div className="mx-auto max-w-md space-y-4">
              <div>
                <Label htmlFor="shopName" className="text-base">
                  Shop name
                </Label>
                <Input
                  id="shopName"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Enter your shop name"
                  className="mt-2 p-6 text-lg"
                  maxLength={50}
                />
                <p className="mt-2 text-sm text-muted-foreground">{shopName.length}/50 characters</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <Button size="lg" variant="outline" onClick={() => setSetupStep(2)} className="px-12">
                Back
              </Button>
              <Button size="lg" onClick={handleNextStep} disabled={!canProceed()} className="px-12">
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Shipping Settings */}
      {setupStep === 4 && (
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-6 text-center">
              <h1 className="mb-4 text-4xl font-bold text-foreground">Shipping Settings</h1>
              <p className="text-muted-foreground">Set up your shipping address and delivery options</p>
            </div>

            <div className="space-y-6">
              {/* Shipping Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Shipping From</h3>

                <div>
                  <Label htmlFor="address_line1">Address Line 1 *</Label>
                  <Input
                    id="address_line1"
                    value={addressData.return_address_line1}
                    onChange={(e) => setAddressData((prev) => ({ ...prev, return_address_line1: e.target.value }))}
                    placeholder="Street address"
                    maxLength={200}
                  />
                </div>

                <div>
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    value={addressData.return_address_line2}
                    onChange={(e) => setAddressData((prev) => ({ ...prev, return_address_line2: e.target.value }))}
                    placeholder="Apartment, suite, unit, etc."
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
              </div>

              {/* Shipping Providers */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Shipping Providers *</h3>
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
                        <div className="flex items-start justify-between">
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
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Delivery Timeframe */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Delivery Timeframe *</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_days">Minimum Days</Label>
                    <Input
                      id="min_days"
                      type="number"
                      min="1"
                      value={deliveryTimeframe.min}
                      onChange={(e) => setDeliveryTimeframe((prev) => ({ ...prev, min: e.target.value }))}
                      placeholder="e.g., 2"
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
                      placeholder="e.g., 5"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <Button size="lg" variant="outline" onClick={() => setSetupStep(3)} className="px-12">
                Back
              </Button>
              <Button size="lg" onClick={handleNextStep} disabled={!canProceed()} className="px-12">
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: App Download */}
      {setupStep === 5 && (
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-6 text-center">
              <h1 className="mb-4 text-4xl font-bold text-foreground">Download the VintStreet App</h1>
              <p className="text-muted-foreground">Manage your shop and go live on the go</p>
            </div>

            {/* App Download Buttons */}
            <div className="mx-auto flex max-w-md flex-col gap-6">
              <div className="space-y-3">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-auto w-full py-4"
                  onClick={() => window.open('https://apps.apple.com/vintstreet', '_blank')}
                >
                  <Apple className="mr-3 h-8 w-8" />
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Download on the</div>
                    <div className="text-lg font-semibold">App Store</div>
                  </div>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  onClick={() => handleSendDownloadLink('ios')}
                  disabled={sendingEmail === 'ios'}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {sendingEmail === 'ios' ? 'Sending...' : 'Send download link to email'}
                </Button>
              </div>

              <div className="space-y-3">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-auto w-full py-4"
                  onClick={() => window.open('https://play.google.com/store/apps/vintstreet', '_blank')}
                >
                  <SmartphoneIcon className="mr-3 h-8 w-8" />
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Get it on</div>
                    <div className="text-lg font-semibold">Google Play</div>
                  </div>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  onClick={() => handleSendDownloadLink('android')}
                  disabled={sendingEmail === 'android'}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {sendingEmail === 'android' ? 'Sending...' : 'Send download link to email'}
                </Button>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <Button size="lg" variant="outline" onClick={() => setSetupStep(4)} className="px-12">
                Back
              </Button>
              <Button size="lg" onClick={handleNextStep} className="bg-green-600 px-12 hover:bg-green-700">
                Complete Setup & Add First Product
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
