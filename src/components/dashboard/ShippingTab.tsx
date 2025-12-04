import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAuth } from '@/hooks/useAuth';
import {
  fetchShippingProviders,
  fetchShippingOptionsBySeller,
  createShippingOption,
  updateShippingOption,
  deleteShippingOption,
} from '@/services/shipping';
import { isFailure } from '@/types/api';

interface ShippingOption {
  id?: string;
  provider_id: string;
  estimated_days_min: string;
  estimated_days_max: string;
  is_active: boolean;
}

const ShippingTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<ShippingOption | null>(null);
  const [formData, setFormData] = useState<ShippingOption>({
    provider_id: '',
    estimated_days_min: '',
    estimated_days_max: '',
    is_active: true,
  });

  // Fetch shipping providers
  const { data: providers = [] } = useQuery({
    queryKey: ['shipping-providers'],
    queryFn: async () => {
      const result = await fetchShippingProviders();
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
  });

  // Fetch shipping options with provider details
  const { data: shippingOptions = [], isLoading } = useQuery({
    queryKey: ['seller-shipping-options', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const result = await fetchShippingOptionsBySeller(user.id);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!user?.id,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ShippingOption) => {
      if (!user?.id) throw new Error('User not authenticated');

      if (data.id) {
        // Update existing
        const result = await updateShippingOption(data.id, {
          provider_id: data.provider_id,
          estimated_days_min: data.estimated_days_min ? parseInt(data.estimated_days_min) : null,
          estimated_days_max: data.estimated_days_max ? parseInt(data.estimated_days_max) : null,
          is_active: data.is_active,
        });

        if (isFailure(result)) {
          throw result.error;
        }
      } else {
        // Create new
        const result = await createShippingOption({
          seller_id: user.id,
          provider_id: data.provider_id,
          estimated_days_min: data.estimated_days_min ? parseInt(data.estimated_days_min) : null,
          estimated_days_max: data.estimated_days_max ? parseInt(data.estimated_days_max) : null,
          is_active: data.is_active,
        });

        if (isFailure(result)) {
          throw result.error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-shipping-options', user?.id] });
      toast.success(editingOption ? 'Shipping option updated' : 'Shipping option added');
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Save shipping option error:', error);
      toast.error('Failed to save shipping option');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteShippingOption(id);
      if (isFailure(result)) {
        throw result.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-shipping-options', user?.id] });
      toast.success('Shipping option deleted');
    },
    onError: (error) => {
      console.error('Delete shipping option error:', error);
      toast.error('Failed to delete shipping option');
    },
  });

  const handleOpenDialog = (option?: unknown) => {
    if (option) {
      setEditingOption(option);
      setFormData({
        id: option.id,
        provider_id: option.provider_id || '',
        estimated_days_min: option.estimated_days_min?.toString() || '',
        estimated_days_max: option.estimated_days_max?.toString() || '',
        is_active: option.is_active,
      });
    } else {
      setEditingOption(null);
      setFormData({
        provider_id: '',
        estimated_days_min: '',
        estimated_days_max: '',
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingOption(null);
    setFormData({
      provider_id: '',
      estimated_days_min: '',
      estimated_days_max: '',
      is_active: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.provider_id) {
      toast.error('Please select a provider and enter a price');
      return;
    }

    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading shipping options...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Shipping Options</h2>
          <p className="text-muted-foreground">Manage shipping rates for your products</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Shipping Option
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingOption ? 'Edit' : 'Add'} Shipping Option</DialogTitle>
                <DialogDescription>Configure shipping rates and delivery times for your products</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="provider">Shipping Provider *</Label>
                  <Select
                    value={formData.provider_id}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, provider_id: value }))}
                  >
                    <SelectTrigger id="provider">
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {providers.map((provider: unknown) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimated_days_min">Min Days</Label>
                    <Input
                      id="estimated_days_min"
                      type="number"
                      value={formData.estimated_days_min}
                      onChange={(e) => setFormData((prev) => ({ ...prev, estimated_days_min: e.target.value }))}
                      placeholder="3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated_days_max">Max Days</Label>
                    <Input
                      id="estimated_days_max"
                      type="number"
                      value={formData.estimated_days_max}
                      onChange={(e) => setFormData((prev) => ({ ...prev, estimated_days_max: e.target.value }))}
                      placeholder="5"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : editingOption ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {shippingOptions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No Shipping Options</h3>
            <p className="mb-4 text-muted-foreground">
              Add shipping options to allow customers to purchase your products
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Shipping Option
            </Button>
          </CardContent>
        </Card>
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
                    <Button variant="outline" size="icon" onClick={() => handleOpenDialog(option)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this shipping option?')) {
                          deleteMutation.mutate(option.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="text-lg font-semibold">£{option.price.toFixed(2)}</p>
                  </div>
                  {!!(option.estimated_days_min && option.estimated_days_max) && (
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                      <p className="text-lg font-semibold">
                        {option.estimated_days_min}-{option.estimated_days_max} days
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShippingTab;
