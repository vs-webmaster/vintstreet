import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Building2, Plus, Trash2, Mail, Package, Edit, RefreshCw, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import {
  createShippingOption,
  fetchShippingProviders,
  fetchShippingOptionsBySeller,
  updateShippingOption,
  deleteShippingOption,
} from '@/services/shipping';
import {
  fetchSystemSellerProfile,
  updateSystemSellerProfile,
  createSystemSellerProfile,
  fetchSystemSellerAdmins,
  addSystemSellerAdmin,
  removeSystemSellerAdmin,
  syncSystemSellerAdmins,
  getUserIdByEmail,
} from '@/services/users';
import { isFailure } from '@/types/api';

interface SystemSellerData {
  shop_name: string;
  business_name: string;
  shop_description: string;
  shop_tagline: string;
  shop_logo_url: string;
  contact_email: string;
  contact_phone: string;
  return_address_line1: string;
  return_address_line2: string;
  return_city: string;
  return_state: string;
  return_postal_code: string;
  return_country: string;
  return_policy: string;
  shipping_policy: string;
}

interface ShippingOption {
  id?: string;
  provider_id: string;
  is_active: boolean;
}

export const SystemSellerTab = () => {
  // All hooks must be called before any early returns
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [formData, setFormData] = useState<SystemSellerData>({
    shop_name: '',
    business_name: '',
    shop_description: '',
    shop_tagline: '',
    shop_logo_url: '',
    contact_email: '',
    contact_phone: '',
    return_address_line1: '',
    return_address_line2: '',
    return_city: '',
    return_state: '',
    return_postal_code: '',
    return_country: 'US',
    return_policy: '',
    shipping_policy: '',
  });
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [systemSellerEmail, setSystemSellerEmail] = useState('');

  // Shipping options state
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  const [editingShippingOption, setEditingShippingOption] = useState<ShippingOption | null>(null);
  const [shippingFormData, setShippingFormData] = useState<ShippingOption>({
    provider_id: '',
    is_active: true,
  });

  // Fetch system seller profile
  const { data: systemSeller, isLoading } = useQuery({
    queryKey: ['system-seller-profile'],
    queryFn: async () => {
      const result = await fetchSystemSellerProfile('VintStreet System');
      if (isFailure(result)) throw result.error;

      if (result.data) {
        setFormData({
          shop_name: result.data.shop_name || '',
          business_name: result.data.business_name || '',
          shop_description: result.data.shop_description || '',
          shop_tagline: result.data.shop_tagline || '',
          shop_logo_url: result.data.shop_logo_url || '',
          contact_email: result.data.contact_email || '',
          contact_phone: result.data.contact_phone || '',
          return_address_line1: result.data.return_address_line1 || '',
          return_address_line2: result.data.return_address_line2 || '',
          return_city: result.data.return_city || '',
          return_state: result.data.return_state || '',
          return_postal_code: result.data.return_postal_code || '',
          return_country: result.data.return_country || 'US',
          return_policy: result.data.return_policy || '',
          shipping_policy: result.data.shipping_policy || '',
        });
      }

      return result.data;
    },
  });

  // Fetch ALL super admins (from both system_seller_admins and user_roles)
  const { data: systemAdmins = [], refetch: refetchAdmins } = useQuery({
    queryKey: ['system-seller-admins'],
    queryFn: async () => {
      const result = await fetchSystemSellerAdmins();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  // Fetch shipping providers
  const { data: shippingProviders = [] } = useQuery({
    queryKey: ['shipping-providers'],
    queryFn: async () => {
      const result = await fetchShippingProviders();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  // Fetch system seller shipping options
  const { data: shippingOptions = [], refetch: refetchShippingOptions } = useQuery({
    queryKey: ['system-seller-shipping-options', systemSeller?.user_id],
    queryFn: async () => {
      if (!systemSeller?.user_id) return [];

      const result = await fetchShippingOptionsBySeller(systemSeller.user_id);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!systemSeller?.user_id,
  });

  // Save system seller profile
  const saveMutation = useMutation({
    mutationFn: async (data: SystemSellerData) => {
      if (!systemSeller?.id) {
        throw new Error('System seller profile not found');
      }

      const result = await updateSystemSellerProfile(systemSeller.id, data);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-seller-profile'] });
      toast({
        title: 'Success',
        description: 'System seller profile updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update system seller profile',
        variant: 'destructive',
      });
    },
  });

  // Add system seller admin
  const addAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const result = await addSystemSellerAdmin(email, user.id);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    onSuccess: (data) => {
      refetchAdmins();
      setNewAdminEmail('');

      if (data.userExists) {
        toast({
          title: 'Success',
          description: 'Admin added and super_admin role granted immediately',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Admin email added. They will get super_admin role when they sign up.',
        });
      }
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add admin email',
        variant: 'destructive',
      });
    },
  });

  // Remove system seller admin
  const removeAdminMutation = useMutation({
    mutationFn: async (adminId: string) => {
      const result = await removeSystemSellerAdmin(adminId);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      refetchAdmins();
      toast({
        title: 'Success',
        description: 'Admin removed (role remains active until manually revoked)',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove admin email',
        variant: 'destructive',
      });
    },
  });

  // Sync system seller admins with user_roles
  const syncAdminsMutation = useMutation({
    mutationFn: async () => {
      const result = await syncSystemSellerAdmins();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    onSuccess: (data: unknown) => {
      refetchAdmins();
      const result = data[0];
      toast({
        title: 'Sync Complete',
        description: `Synced: ${result.synced_count}, Already synced: ${result.already_synced}, Pending signup: ${result.pending_signup}`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to sync admins',
        variant: 'destructive',
      });
    },
  });

  // Shipping option mutations
  const saveShippingMutation = useMutation({
    mutationFn: async (data: ShippingOption) => {
      if (!systemSeller?.user_id) throw new Error('System seller not found');

      if (data.id) {
        // Update existing
        const result = await updateShippingOption(data.id, {
          provider_id: data.provider_id,
          is_active: data.is_active,
        });
        if (isFailure(result)) throw result.error;
      } else {
        // Create new
        const result = await createShippingOption({
          seller_id: systemSeller.user_id,
          provider_id: data.provider_id,
          is_active: data.is_active,
        });
        if (isFailure(result)) throw result.error;
      }
    },
    onSuccess: () => {
      refetchShippingOptions();
      toast({
        title: 'Success',
        description: editingShippingOption ? 'Shipping option updated' : 'Shipping option added',
      });
      handleCloseShippingDialog();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save shipping option',
        variant: 'destructive',
      });
    },
  });

  const deleteShippingMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteShippingOption(id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      refetchShippingOptions();
      toast({
        title: 'Success',
        description: 'Shipping option deleted',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete shipping option',
        variant: 'destructive',
      });
    },
  });

  const handleInputChange = (field: keyof SystemSellerData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminEmail.includes('@')) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }
    addAdminMutation.mutate(newAdminEmail);
  };

  const handleOpenShippingDialog = (option?: unknown) => {
    if (option) {
      setEditingShippingOption(option);
      setShippingFormData({
        id: option.id,
        provider_id: option.provider_id || '',
        is_active: option.is_active,
      });
    } else {
      setEditingShippingOption(null);
      setShippingFormData({
        provider_id: '',
        is_active: true,
      });
    }
    setIsShippingDialogOpen(true);
  };

  const handleCloseShippingDialog = () => {
    setIsShippingDialogOpen(false);
    setEditingShippingOption(null);
    setShippingFormData({
      provider_id: '',
      is_active: true,
    });
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!shippingFormData.provider_id) {
      toast({
        title: 'Error',
        description: 'Please select a provider',
        variant: 'destructive',
      });
      return;
    }

    saveShippingMutation.mutate(shippingFormData);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const createSystemSeller = async () => {
    if (!systemSellerEmail) {
      toast({
        title: 'Error',
        description: 'Please enter the email address of the user who should own the system seller profile',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Get user ID by email
      const userIdResult = await getUserIdByEmail(systemSellerEmail);
      if (isFailure(userIdResult) || !userIdResult.data) {
        toast({
          title: 'User Not Found',
          description: `No user found with email ${systemSellerEmail}. They need to sign up first.`,
          variant: 'destructive',
        });
        return;
      }

      const userId = userIdResult.data;

      // Check if this user already has a seller profile
      const existingProfileResult = await fetchSystemSellerProfile();
      if (existingProfileResult.success && existingProfileResult.data?.user_id === userId) {
        toast({
          title: 'Cannot Create System Seller',
          description: `User ${systemSellerEmail} already has a seller profile. Please use a different user without an existing seller profile.`,
          variant: 'destructive',
        });
        return;
      }

      const createResult = await createSystemSellerProfile(userId, {
        shop_name: 'VintStreet System',
        business_name: 'VintStreet Ltd',
        shop_description: 'Official VintStreet marketplace system account for master product listings',
        shop_tagline: 'Your Trusted Marketplace',
        contact_email: 'support@vintstreet.com',
        contact_phone: '+44 20 1234 5678',
        return_policy:
          'All items sold through VintStreet are covered by our comprehensive return policy. Returns accepted within 30 days of delivery for items in original condition.',
        shipping_policy:
          'We offer various shipping options to ensure your items arrive safely and on time. Shipping costs and delivery times vary by location and item size.',
        display_name_format: 'shop_name',
      });

      if (isFailure(createResult)) throw createResult.error;

      toast({
        title: 'Success',
        description: `System seller profile created and assigned to ${systemSellerEmail}`,
      });

      setSystemSellerEmail('');
      queryClient.invalidateQueries({ queryKey: ['system-seller-profile'] });
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create system seller profile',
        variant: 'destructive',
      });
    }
  };

  if (!systemSeller) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            System Seller Not Found
          </CardTitle>
          <CardDescription>
            The system seller profile (VintStreet System) doesn't exist yet. Create it to enable master product
            listings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="system-seller-email">Assign to User Email</Label>
            <Input
              id="system-seller-email"
              type="email"
              placeholder="user@example.com"
              value={systemSellerEmail}
              onChange={(e) => setSystemSellerEmail(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Enter the email of an existing user who should own the system seller profile. This user must not have an
              existing seller profile.
            </p>
          </div>
          <Button onClick={createSystemSeller}>
            <Plus className="mr-2 h-4 w-4" />
            Create System Seller Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Seller Admins Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                System Seller Admins
              </CardTitle>
              <CardDescription>
                Manage email addresses that have permission to manage the system seller and master products
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncAdminsMutation.mutate()}
              disabled={syncAdminsMutation.isPending}
            >
              {syncAdminsMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync Roles
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddAdmin} className="flex gap-2">
            <Input
              type="email"
              placeholder="admin@example.com"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={addAdminMutation.isPending}>
              {addAdminMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Plus className="mr-2 h-4 w-4" />
              Add Admin
            </Button>
          </form>

          {systemAdmins.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead>Role Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemAdmins.map((admin: unknown) => {
                  return (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        <div>
                          {admin.email}
                          {(admin.full_name || admin.username) && (
                            <div className="text-xs text-muted-foreground">{admin.full_name || admin.username}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin.user_id ? 'default' : 'secondary'}>
                          {admin.user_id ? 'Signed Up' : 'Pending Signup'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {admin.has_super_admin_role && (
                            <Badge variant="default" className="w-fit gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              Super Admin
                            </Badge>
                          )}
                          {admin.is_system_seller_admin && (
                            <Badge variant="outline" className="w-fit">
                              System Seller Admin
                            </Badge>
                          )}
                          {!admin.has_super_admin_role && !admin.user_id && (
                            <Badge variant="outline">Will Grant on Signup</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        {admin.is_system_seller_admin ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAdminMutation.mutate(admin.id)}
                            disabled={removeAdminMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Global Admin</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No admin emails added yet</p>
          )}
        </CardContent>
      </Card>

      {/* System Seller Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              System Seller Profile
            </CardTitle>
            <CardDescription>Manage the system seller profile used for master product listings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Business Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shop_name">Shop Name *</Label>
                  <Input
                    id="shop_name"
                    value={formData.shop_name}
                    onChange={(e) => handleInputChange('shop_name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop_tagline">Shop Tagline</Label>
                <Input
                  id="shop_tagline"
                  value={formData.shop_tagline}
                  onChange={(e) => handleInputChange('shop_tagline', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop_description">Shop Description</Label>
                <Textarea
                  id="shop_description"
                  value={formData.shop_description}
                  onChange={(e) => handleInputChange('shop_description', e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop_logo_url">Shop Logo URL</Label>
                <Input
                  id="shop_logo_url"
                  type="url"
                  value={formData.shop_logo_url}
                  onChange={(e) => handleInputChange('shop_logo_url', e.target.value)}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Return Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Return Address</h3>
              <div className="space-y-2">
                <Label htmlFor="return_address_line1">Address Line 1</Label>
                <Input
                  id="return_address_line1"
                  value={formData.return_address_line1}
                  onChange={(e) => handleInputChange('return_address_line1', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="return_address_line2">Address Line 2</Label>
                <Input
                  id="return_address_line2"
                  value={formData.return_address_line2}
                  onChange={(e) => handleInputChange('return_address_line2', e.target.value)}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="return_city">City</Label>
                  <Input
                    id="return_city"
                    value={formData.return_city}
                    onChange={(e) => handleInputChange('return_city', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="return_state">State</Label>
                  <Input
                    id="return_state"
                    value={formData.return_state}
                    onChange={(e) => handleInputChange('return_state', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="return_postal_code">Postal Code</Label>
                  <Input
                    id="return_postal_code"
                    value={formData.return_postal_code}
                    onChange={(e) => handleInputChange('return_postal_code', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="return_country">Country</Label>
                  <Input
                    id="return_country"
                    value={formData.return_country}
                    onChange={(e) => handleInputChange('return_country', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Policies */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Policies</h3>
              <div className="space-y-2">
                <Label htmlFor="return_policy">Return Policy</Label>
                <Textarea
                  id="return_policy"
                  value={formData.return_policy}
                  onChange={(e) => handleInputChange('return_policy', e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping_policy">Shipping Policy</Label>
                <Textarea
                  id="shipping_policy"
                  value={formData.shipping_policy}
                  onChange={(e) => handleInputChange('shipping_policy', e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save System Seller Profile
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* System Seller Shipping Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Shipping Options
              </CardTitle>
              <CardDescription>Manage shipping options for system seller products</CardDescription>
            </div>
            <Dialog open={isShippingDialogOpen} onOpenChange={setIsShippingDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenShippingDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Shipping Option
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleShippingSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingShippingOption ? 'Edit' : 'Add'} Shipping Option</DialogTitle>
                    <DialogDescription>
                      Select shipping options to display at checkout for system seller products
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="provider">Shipping Provider *</Label>
                      <Select
                        value={shippingFormData.provider_id}
                        onValueChange={(value) => setShippingFormData((prev) => ({ ...prev, provider_id: value }))}
                      >
                        <SelectTrigger id="provider">
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          {shippingProviders.map((provider: unknown) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              {provider.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={shippingFormData.is_active}
                        onCheckedChange={(checked) => setShippingFormData((prev) => ({ ...prev, is_active: checked }))}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleCloseShippingDialog}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saveShippingMutation.isPending}>
                      {saveShippingMutation.isPending ? 'Saving...' : editingShippingOption ? 'Update' : 'Add'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {shippingOptions.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No Shipping Options</h3>
              <p className="mb-4 text-muted-foreground">
                Add shipping options to allow customers to purchase system seller products
              </p>
              <Button onClick={() => handleOpenShippingDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Shipping Option
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {shippingOptions.map((option: unknown) => (
                <Card key={option.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {option.shipping_providers?.name || 'Unknown Provider'}
                          {!option.is_active && (
                            <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">Inactive</span>
                          )}
                        </CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenShippingDialog(option)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this shipping option?')) {
                              deleteShippingMutation.mutate(option.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      This shipping provider will be available at checkout for system seller products
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
