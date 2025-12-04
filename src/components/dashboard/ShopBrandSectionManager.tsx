import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchBrandItems, createBrandItem, deleteBrandItem } from '@/services/shop/shopBrandSectionService';
import { isFailure } from '@/types/api';

export const ShopBrandSectionManager = () => {
  const queryClient = useQueryClient();
  const [newBrand, setNewBrand] = useState({ brand_name: '', brand_link: '' });

  const { data: brands, isLoading } = useQuery({
    queryKey: ['shop-brand-section'],
    queryFn: async () => {
      const result = await fetchBrandItems();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (brand: { brand_name: string; brand_link: string }) => {
      const maxOrder = brands?.length ? Math.max(...brands.map((b) => b.display_order)) : 0;

      const result = await createBrandItem({
        ...brand,
        display_order: maxOrder + 1,
        is_active: true,
      });

      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-brand-section'] });
      setNewBrand({ brand_name: '', brand_link: '' });
      toast.success('Brand added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add brand: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteBrandItem(id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-brand-section'] });
      toast.success('Brand deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete brand: ' + error.message);
    },
  });

  const handleAdd = () => {
    if (!newBrand.brand_name.trim() || !newBrand.brand_link.trim()) {
      toast.error('Please fill in both brand name and link');
      return;
    }
    addMutation.mutate(newBrand);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Section Manager</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Brand */}
        <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
          <h3 className="font-semibold">Add New Brand</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand-name">Brand Name</Label>
              <Input
                id="brand-name"
                value={newBrand.brand_name}
                onChange={(e) => setNewBrand({ ...newBrand, brand_name: e.target.value })}
                placeholder="e.g., Nike, Adidas"
              />
            </div>
            <div>
              <Label htmlFor="brand-link">Link</Label>
              <Input
                id="brand-link"
                value={newBrand.brand_link}
                onChange={(e) => setNewBrand({ ...newBrand, brand_link: e.target.value })}
                placeholder="/shop?brand=nike"
              />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={addMutation.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </Button>
        </div>

        {/* Existing Brands */}
        <div className="space-y-4">
          <h3 className="font-semibold">Current Brands</h3>
          {brands && brands.length > 0 ? (
            <div className="space-y-2">
              {brands.map((brand) => (
                <div key={brand.id} className="flex items-center gap-4 rounded-lg border bg-card p-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <div className="grid flex-1 grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Brand Name</Label>
                      <p className="font-medium">{brand.brand_name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Link</Label>
                      <p className="text-sm text-muted-foreground">{brand.brand_link}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(brand.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">No brands added yet. Add your first brand above.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
