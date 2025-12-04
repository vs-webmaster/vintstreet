import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, Truck, Package } from 'lucide-react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  fetchAllShippingProviders,
  fetchShippingProviderPricesByProvider,
  createShippingProvider,
  updateShippingProvider,
  deleteShippingProvider,
  createShippingProviderPrice,
  updateShippingProviderPrice,
  deleteShippingProviderPrice,
  type ShippingProviderRow,
} from '@/services/shipping';
import { isFailure } from '@/types/api';

export const ShippingProvidersTab = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ShippingProviderRow | null>(null);
  const [pricingProvider, setPricingProvider] = useState<ShippingProviderRow | null>(null);
  const [newBandName, setNewBandName] = useState('');
  const [formData, setFormData] = useState<{
    id?: string;
    name: string;
    description: string;
    logo_url: string;
    is_active: boolean;
    display_order: number;
  }>({
    name: '',
    description: '',
    logo_url: '',
    is_active: true,
    display_order: 0,
  });

  // Fetch provider prices with their weights
  const { data: providerPrices = [], refetch: refetchPrices } = useQuery({
    queryKey: ['provider-prices', pricingProvider?.id],
    queryFn: async () => {
      if (!pricingProvider?.id) return [];
      const result = await fetchShippingProviderPricesByProvider(pricingProvider.id);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!pricingProvider?.id,
  });

  // Fetch shipping providers
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['shipping-providers-admin'],
    queryFn: async () => {
      const result = await fetchAllShippingProviders();
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (data.id) {
        // Update existing
        const result = await updateShippingProvider(data.id, {
          name: data.name,
          description: data.description || null,
          logo_url: data.logo_url || null,
          is_active: data.is_active,
          display_order: data.display_order,
        });

        if (isFailure(result)) {
          throw result.error;
        }
      } else {
        // Create new
        const result = await createShippingProvider({
          name: data.name,
          description: data.description || null,
          logo_url: data.logo_url || null,
          is_active: data.is_active,
          display_order: data.display_order,
        });

        if (isFailure(result)) {
          throw result.error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-providers-admin'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-providers'] });
      toast.success(editingProvider ? 'Provider updated' : 'Provider added');
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Save provider error:', error);
      toast.error('Failed to save provider');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteShippingProvider(id);
      if (isFailure(result)) {
        throw result.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-providers-admin'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-providers'] });
      toast.success('Provider deleted');
    },
    onError: (error) => {
      console.error('Delete provider error:', error);
      toast.error('Failed to delete provider');
    },
  });

  const handleOpenDialog = (provider?: ShippingProviderRow) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        id: provider.id,
        name: provider.name,
        description: provider.description,
        logo_url: provider.logo_url,
        is_active: provider.is_active,
        display_order: provider.display_order,
      });
    } else {
      setEditingProvider(null);
      setFormData({
        name: '',
        description: '',
        logo_url: '',
        is_active: true,
        display_order: providers.length,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProvider(null);
    setFormData({
      name: '',
      description: '',
      logo_url: '',
      is_active: true,
      display_order: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Please enter a provider name');
      return;
    }

    saveMutation.mutate(formData);
  };

  const handleAddWeightBand = async () => {
    if (!pricingProvider?.id) return;
    if (!newBandName.trim()) {
      toast.error('Please enter a band name');
      return;
    }

    try {
      const result = await createShippingProviderPrice({
        provider_id: pricingProvider.id,
        band_name: newBandName.trim(),
        min_weight: 0,
        max_weight: 0,
        price: 0,
        currency: 'GBP',
        band_id: null,
      });

      if (isFailure(result)) {
        throw result.error;
      }

      toast.success('Weight band added');
      setNewBandName('');
      refetchPrices();
    } catch (error: any) {
      console.error('Add band error:', error);
      toast.error(`Failed to add band: ${error.message || 'Unknown error'}`);
    }
  };

  const handleUpdateProviderPrice = async (priceId: string, field: string, value: string) => {
    if (!pricingProvider?.id) return;

    try {
      // For band_name, use string value directly
      if (field === 'band_name') {
        if (!value.trim()) {
          toast.error('Band name cannot be empty');
          return;
        }

        const result = await updateShippingProviderPrice(priceId, { band_name: value.trim() });
        if (isFailure(result)) {
          throw result.error;
        }

        toast.success('Updated successfully');
        refetchPrices();
        return;
      }

      // For numeric fields
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        toast.error('Please enter a valid value');
        return;
      }

      const updateData: any = { [field]: numValue };
      const result = await updateShippingProviderPrice(priceId, updateData);
      if (isFailure(result)) {
        throw result.error;
      }

      toast.success('Updated successfully');
      refetchPrices();
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(`Failed to update: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteWeightBand = async (priceId: string) => {
    if (!pricingProvider?.id) return;

    try {
      const result = await deleteShippingProviderPrice(priceId);
      if (isFailure(result)) {
        throw result.error;
      }

      toast.success('Weight band deleted');
      refetchPrices();
    } catch (error: any) {
      console.error('Delete band error:', error);
      toast.error(`Failed to delete band: ${error.message || 'Unknown error'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading shipping providers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Shipping Providers</h2>
          <p className="text-muted-foreground">Manage system-wide shipping providers for sellers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingProvider ? 'Edit' : 'Add'} Shipping Provider</DialogTitle>
                <DialogDescription>Configure a shipping provider that sellers can use</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Provider Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., DPD, Yodel, Evri"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the provider"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, logo_url: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  />
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
                  {saveMutation.isPending ? 'Saving...' : editingProvider ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {providers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Truck className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No Shipping Providers</h3>
            <p className="mb-4 text-muted-foreground">Add shipping providers that sellers can choose from</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {provider.logo_url && (
                      <img src={provider.logo_url} alt={provider.name} className="h-12 w-12 object-contain" />
                    )}
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {provider.name}
                        {!provider.is_active && (
                          <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">Inactive</span>
                        )}
                      </CardTitle>
                      {provider.description && <CardDescription>{provider.description}</CardDescription>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPricingProvider(provider);
                        setIsPricingDialogOpen(true);
                      }}
                    >
                      <Package className="mr-1 h-4 w-4" />
                      Weight Pricing
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleOpenDialog(provider)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${provider.name}?`)) {
                          deleteMutation.mutate(provider.id!);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6 text-sm text-muted-foreground">
                  <span className="font-medium">Display Order:</span> {provider.display_order}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Weight-Based Pricing Dialog */}
      <Dialog open={isPricingDialogOpen} onOpenChange={setIsPricingDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Weight-Based Pricing for {pricingProvider?.name}</DialogTitle>
            <DialogDescription>Set prices for different weight categories</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New band name (e.g., Small, Medium, Large)"
                value={newBandName}
                onChange={(e) => setNewBandName(e.target.value)}
              />
              <Button onClick={handleAddWeightBand}>
                <Plus className="mr-2 h-4 w-4" />
                Add Band
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Band Name</TableHead>
                  <TableHead>Min Weight (kg)</TableHead>
                  <TableHead>Max Weight (kg)</TableHead>
                  <TableHead className="text-right">Price (£)</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providerPrices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No weight bands yet. Add one above to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  providerPrices.map((priceRow: any) => (
                    <TableRow key={priceRow.id}>
                      <TableCell>
                        <Input
                          type="text"
                          defaultValue={priceRow.band_name || 'Unnamed'}
                          onBlur={(e) => handleUpdateProviderPrice(priceRow.id, 'band_name', e.target.value)}
                          className="font-medium"
                          placeholder="Band name"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={priceRow.min_weight || 0}
                          onBlur={(e) => handleUpdateProviderPrice(priceRow.id, 'min_weight', e.target.value)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={priceRow.max_weight || 0}
                          onBlur={(e) => handleUpdateProviderPrice(priceRow.id, 'max_weight', e.target.value)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={priceRow.price || 0}
                          onBlur={(e) => handleUpdateProviderPrice(priceRow.id, 'price', e.target.value)}
                          className="ml-auto w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Delete this weight band?')) {
                              handleDeleteWeightBand(priceRow.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <p className="text-sm text-muted-foreground">Values are saved automatically when you leave each field.</p>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsPricingDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
