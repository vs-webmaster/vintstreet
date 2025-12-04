import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Building2, Mail, MapPin, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { fetchSellerProfile, upsertSellerProfile } from '@/services/users/userService';
import { isSuccess } from '@/types/api';

interface SellerProfileData {
  business_name?: string;
  shop_name?: string;
  shop_tagline?: string;
  shop_description?: string;
  display_name_format?: 'shop_name' | 'personal_name';
  contact_email?: string;
  contact_phone?: string;
  return_address_line1?: string;
  return_address_line2?: string;
  return_city?: string;
  return_state?: string;
  return_postal_code?: string;
  return_country?: string;
  shipping_policy?: string;
  return_policy?: string;
  tax_id?: string;
  business_license?: string;
}

const SellerProfileForm = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SellerProfileData>({
    business_name: '',
    shop_name: '',
    shop_tagline: '',
    shop_description: '',
    display_name_format: 'shop_name',
    contact_email: '',
    contact_phone: '',
    return_address_line1: '',
    return_address_line2: '',
    return_city: '',
    return_state: '',
    return_postal_code: '',
    return_country: 'US',
    shipping_policy: '',
    return_policy: '',
    tax_id: '',
    business_license: '',
  });

  // Fetch existing seller profile
  const { data: sellerProfile, isLoading } = useQuery({
    queryKey: ['seller-profile-form', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const result = await fetchSellerProfile(user.id);
      if (isSuccess(result)) {
        return result.data;
      }
      console.error('Error fetching seller profile:', result.error);
      return null;
    },
    enabled: !!user?.id,
  });

  // Generate preview names for display options
  const getPersonalNamePreview = () => {
    if (!profile?.full_name) return 'e.g., John S.';

    const nameParts = profile.full_name.trim().split(' ');
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const surnameInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
      return `${firstName} ${surnameInitial}.`;
    }
    return profile.full_name;
  };

  const getShopNamePreview = () => {
    return formData.shop_name || 'Your Shop Name';
  };

  // Update form data when profile is loaded
  useEffect(() => {
    if (sellerProfile) {
      setFormData({
        business_name: sellerProfile.business_name || '',
        business_license: sellerProfile.business_license || '',
        shop_name: sellerProfile.shop_name || '',
        shop_tagline: sellerProfile.shop_tagline || '',
        shop_description: sellerProfile.shop_description || '',
        display_name_format: (sellerProfile.display_name_format as 'shop_name' | 'personal_name') || 'shop_name',
        contact_email: sellerProfile.contact_email || '',
        contact_phone: sellerProfile.contact_phone || '',
        return_address_line1: sellerProfile.return_address_line1 || '',
        return_address_line2: sellerProfile.return_address_line2 || '',
        return_city: sellerProfile.return_city || '',
        return_state: sellerProfile.return_state || '',
        return_postal_code: sellerProfile.return_postal_code || '',
        return_country: sellerProfile.return_country || 'US',
        shipping_policy: sellerProfile.shipping_policy || '',
        return_policy: sellerProfile.return_policy || '',
        tax_id: sellerProfile.tax_id || '',
      });
    }
  }, [sellerProfile]);

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (data: SellerProfileData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const result = await upsertSellerProfile(user.id, data);
      if (!isSuccess(result)) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['seller-profile-form', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
    },
    onError: (error) => {
      console.error('Save profile error:', error);
      toast.error('Failed to update profile');
    },
  });

  const handleInputChange = (field: keyof SellerProfileData, value: string | 'shop_name' | 'personal_name') => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfileMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Information */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Business Information</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="shop_name">Shop Name *</Label>
            <Input
              id="shop_name"
              value={formData.shop_name}
              onChange={(e) => handleInputChange('shop_name', e.target.value)}
              placeholder="Your shop display name"
              required
            />
          </div>

          <div>
            <Label htmlFor="business_name">Business Name</Label>
            <Input
              id="business_name"
              value={formData.business_name}
              onChange={(e) => handleInputChange('business_name', e.target.value)}
              placeholder="Legal business name"
            />
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="shop_tagline">Shop Tagline</Label>
          <Input
            id="shop_tagline"
            value={formData.shop_tagline}
            onChange={(e) => handleInputChange('shop_tagline', e.target.value)}
            placeholder="A catchy one-liner for your shop"
            maxLength={100}
          />
          <p className="mt-1 text-xs text-muted-foreground">{formData.shop_tagline?.length || 0}/100 characters</p>
        </div>

        <div className="mt-4">
          <Label htmlFor="shop_description">Shop Description</Label>
          <Textarea
            id="shop_description"
            value={formData.shop_description}
            onChange={(e) => handleInputChange('shop_description', e.target.value)}
            placeholder="Tell customers about your shop..."
            className="min-h-[100px]"
            maxLength={1000}
          />
          <p className="mt-1 text-xs text-muted-foreground">{formData.shop_description?.length || 0}/1000 characters</p>
        </div>

        <div className="mt-4">
          <Label className="mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Display Name Preference
          </Label>
          <RadioGroup
            value={formData.display_name_format}
            onValueChange={(value) => handleInputChange('display_name_format', value as 'shop_name' | 'personal_name')}
          >
            <div className="flex items-center space-x-2 rounded-lg border p-3">
              <RadioGroupItem value="shop_name" id="shop_name_format" />
              <Label htmlFor="shop_name_format" className="flex-1 cursor-pointer">
                <div>
                  <p className="font-medium">{getShopNamePreview()}</p>
                  <p className="text-xs text-muted-foreground">Show shop name on product and seller pages</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 rounded-lg border p-3">
              <RadioGroupItem value="personal_name" id="personal_name_format" />
              <Label htmlFor="personal_name_format" className="flex-1 cursor-pointer">
                <div>
                  <p className="font-medium">{getPersonalNamePreview()}</p>
                  <p className="text-xs text-muted-foreground">Show first name and surname initial</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="tax_id">Tax ID (Optional)</Label>
            <Input
              id="tax_id"
              value={formData.tax_id}
              onChange={(e) => handleInputChange('tax_id', e.target.value)}
              placeholder="Tax identification number"
            />
          </div>

          <div>
            <Label htmlFor="business_license">Business License (Optional)</Label>
            <Input
              id="business_license"
              value={formData.business_license}
              onChange={(e) => handleInputChange('business_license', e.target.value)}
              placeholder="Business license number"
            />
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Contact Information</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleInputChange('contact_email', e.target.value)}
              placeholder="customer@yourshop.com"
            />
          </div>

          <div>
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              value={formData.contact_phone}
              onChange={(e) => handleInputChange('contact_phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </Card>

      {/* Return Address */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Return Address</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="return_address_line1">Address Line 1</Label>
            <Input
              id="return_address_line1"
              value={formData.return_address_line1}
              onChange={(e) => handleInputChange('return_address_line1', e.target.value)}
              placeholder="Street address"
            />
          </div>

          <div>
            <Label htmlFor="return_address_line2">Address Line 2 (Optional)</Label>
            <Input
              id="return_address_line2"
              value={formData.return_address_line2}
              onChange={(e) => handleInputChange('return_address_line2', e.target.value)}
              placeholder="Apartment, suite, etc."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="return_city">City</Label>
              <Input
                id="return_city"
                value={formData.return_city}
                onChange={(e) => handleInputChange('return_city', e.target.value)}
                placeholder="City"
              />
            </div>

            <div>
              <Label htmlFor="return_state">State</Label>
              <Input
                id="return_state"
                value={formData.return_state}
                onChange={(e) => handleInputChange('return_state', e.target.value)}
                placeholder="State"
              />
            </div>

            <div>
              <Label htmlFor="return_postal_code">ZIP Code</Label>
              <Input
                id="return_postal_code"
                value={formData.return_postal_code}
                onChange={(e) => handleInputChange('return_postal_code', e.target.value)}
                placeholder="ZIP code"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Policies */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Policies</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="shipping_policy">Shipping Policy</Label>
            <Textarea
              id="shipping_policy"
              value={formData.shipping_policy}
              onChange={(e) => handleInputChange('shipping_policy', e.target.value)}
              placeholder="Describe your shipping policies, delivery times, costs..."
              className="min-h-[80px]"
            />
          </div>

          <div>
            <Label htmlFor="return_policy">Return Policy</Label>
            <Textarea
              id="return_policy"
              value={formData.return_policy}
              onChange={(e) => handleInputChange('return_policy', e.target.value)}
              placeholder="Describe your return and refund policies..."
              className="min-h-[80px]"
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={saveProfileMutation.isPending} className="min-w-[120px]">
          {saveProfileMutation.isPending ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default SellerProfileForm;
