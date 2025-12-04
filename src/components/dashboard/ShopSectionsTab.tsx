import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchCategories } from '@/services/categories';
import { fetchProducts, fetchProductsByIds } from '@/services/products';
import {
  fetchShopSectionsAdmin,
  createShopSection,
  updateShopSection,
  deleteShopSection,
  addProductsToShopSection,
  removeAllProductsFromShopSection,
  fetchShopSectionProducts,
} from '@/services/shop';
import { uploadFile, deleteFile } from '@/services/storage';
import { fetchSystemSellerProfile } from '@/services/users';
import { isFailure } from '@/types/api';

interface ShopSection {
  id: string;
  title: string;
  image_url: string;
  image_path: string | null;
  category_id: string;
  custom_link?: string | null;
  is_active: boolean;
  display_order: number;
}

interface Product {
  id: string;
  product_name: string;
  thumbnail: string;
}

export const ShopSectionsTab = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ShopSection | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    image_path: null as string | null,
    category_id: '',
    custom_link: '',
    is_active: true,
    display_order: 0,
  });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['shop-sections'],
    queryFn: async () => {
      const result = await fetchShopSectionsAdmin();
      if (isFailure(result)) throw result.error;
      return (result.data || []).map((section) => ({
        ...section,
        custom_link: section.custom_link || null,
      })) as ShopSection[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await fetchCategories();
      if (isFailure(result)) throw result.error;
      return (result.data || []).map((cat) => ({ id: cat.id, name: cat.name }));
    },
  });

  // Fetch system seller to get master products
  const { data: systemSeller } = useQuery({
    queryKey: ['system-seller'],
    queryFn: async () => {
      const result = await fetchSystemSellerProfile();
      if (isFailure(result)) throw result.error;
      return result.data ? { user_id: result.data.user_id } : null;
    },
  });

  const debouncedSearch = useDebounce(productSearch, 300);

  const { data: searchedProducts = [], isLoading: isSearching } = useQuery({
    queryKey: ['products-search', systemSeller?.user_id, debouncedSearch],
    queryFn: async () => {
      if (!systemSeller?.user_id || !debouncedSearch || debouncedSearch.length < 2) return [];

      const result = await fetchProducts(
        {
          sellerId: systemSeller.user_id,
          status: ['published'],
          search: debouncedSearch,
        },
        1,
        50,
      );
      if (isFailure(result)) throw result.error;
      return result.data.products.map((p) => ({
        id: p.id,
        product_name: p.product_name,
        thumbnail: p.thumbnail || '',
<<<<<<< HEAD
        sku: (p as unknown).sku || null,
=======
        sku: p.sku || null,
>>>>>>> a275e0e6fd466fe0415be180aa3be0c399054c93
      })) as Product[];
    },
    enabled: !!systemSeller?.user_id && debouncedSearch.length >= 2,
  });

  const { data: sectionProducts = [] } = useQuery({
    queryKey: ['section-products', editingSection?.id],
    queryFn: async () => {
      if (!editingSection?.id) return [];
      const result = await fetchShopSectionProducts(editingSection.id);
      if (isFailure(result)) throw result.error;
      return result.data || [];
    },
    enabled: !!editingSection?.id,
  });

  // Fetch full details of selected products
  const { data: selectedProductDetails = [] } = useQuery({
    queryKey: ['selected-products-details', selectedProducts],
    queryFn: async () => {
      if (selectedProducts.length === 0) return [];
      const result = await fetchProductsByIds(selectedProducts);
      if (isFailure(result)) throw result.error;
      return (result.data || []).map((p) => ({
        id: p.id,
        product_name: p.product_name,
        thumbnail: p.thumbnail || '',
      })) as Product[];
    },
    enabled: selectedProducts.length > 0,
  });

  // Update selected products when editing
  useEffect(() => {
    if (sectionProducts.length > 0) {
      setSelectedProducts(sectionProducts);
    }
  }, [sectionProducts]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      let imagePath = data.image_path;

      // Upload image if file provided
      if (imageFile) {
        const result = await uploadFile(imageFile, {
          bucket: 'product-images',
          pathPrefix: 'shop-sections',
        });

        if (isFailure(result)) {
          throw result.error;
        }

        imagePath = result.data.path;
        data.image_url = result.data.url;
      }

      const createResult = await createShopSection({
        ...data,
        image_path: imagePath,
      });

      if (isFailure(createResult)) throw createResult.error;

      // Insert selected products
      if (selectedProducts.length > 0) {
        const addProductsResult = await addProductsToShopSection(createResult.data.id, selectedProducts);
        if (isFailure(addProductsResult)) throw addProductsResult.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-sections'] });
      toast.success('Section created successfully');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create section: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      let imagePath = data.image_path;

      // Upload new image if file provided
      if (imageFile) {
        const result = await uploadFile(imageFile, {
          bucket: 'product-images',
          pathPrefix: 'shop-sections',
        });

        if (isFailure(result)) {
          throw result.error;
        }

        imagePath = result.data.path;
        data.image_url = result.data.url;

        // Delete old image if exists
        if (data.image_path) {
          await deleteFile('product-images', data.image_path);
        }
      }

      const updateResult = await updateShopSection(id, {
        ...data,
        image_path: imagePath,
      });

      if (isFailure(updateResult)) throw updateResult.error;

      // Update product links
      await removeAllProductsFromShopSection(id);

      if (selectedProducts.length > 0) {
        const addProductsResult = await addProductsToShopSection(id, selectedProducts);
        if (isFailure(addProductsResult)) throw addProductsResult.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-sections'] });
      toast.success('Section updated successfully');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update section: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteShopSection(id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-sections'] });
      toast.success('Section deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete section: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSection) {
      updateMutation.mutate({ id: editingSection.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      image_url: '',
      image_path: null,
      category_id: '',
      custom_link: '',
      is_active: true,
      display_order: 0,
    });
    setSelectedProducts([]);
    setImageFile(null);
    setImagePreview(null);
    setEditingSection(null);
    setIsDialogOpen(false);
    setProductSearch('');
  };

  const handleEdit = (section: ShopSection) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      image_url: section.image_url,
      image_path: section.image_path,
      category_id: section.category_id,
      custom_link: section.custom_link || '',
      is_active: section.is_active,
      display_order: section.display_order,
    });
    setImagePreview(section.image_url);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Shop Sections</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingSection(null);
                resetForm();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSection ? 'Edit' : 'Add'} Shop Section</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Juniors, Mens"
                  required
                />
              </div>

              <div>
                <Label>Section Image</Label>
                {imagePreview && (
                  <div className="relative mb-2 h-48 w-full">
                    <img src={imagePreview} alt="Preview" className="h-full w-full rounded object-cover" />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute right-2 top-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Input type="file" accept="image/*" onChange={handleImageChange} className="cursor-pointer" />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="custom_link">Custom Link (Optional)</Label>
                <Input
                  id="custom_link"
                  value={formData.custom_link}
                  onChange={(e) => setFormData({ ...formData, custom_link: e.target.value })}
                  placeholder="e.g., /shop/mens or https://example.com"
                />
                <p className="mt-1 text-xs text-muted-foreground">Leave empty to use default category link</p>
              </div>

              <div>
                <Label>Select Products (Choose up to 3)</Label>
                <Input
                  type="text"
                  placeholder="Search by product name or SKU (min 2 characters)..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="mb-2"
                />

                {/* Selected products */}
                {selectedProductDetails.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <p className="text-sm font-medium">Selected Products:</p>
                    {selectedProductDetails.map((product) => (
                      <div key={product.id} className="flex items-center gap-3 rounded bg-accent p-2">
                        <img
                          src={product.thumbnail}
                          alt={product.product_name}
                          className="h-10 w-10 rounded object-cover"
                        />
                        <span className="flex-1 text-sm">{product.product_name}</span>
                        <Button type="button" size="sm" variant="ghost" onClick={() => handleProductToggle(product.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search results */}
                <div className="max-h-60 overflow-y-auto rounded-lg border p-4">
                  {!productSearch || productSearch.length < 2 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Type at least 2 characters to search for products
                    </p>
                  ) : isSearching ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Searching...</p>
                  ) : searchedProducts.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">No products found</p>
                  ) : (
                    <div className="space-y-2">
                      {searchedProducts
                        .filter((product) => !selectedProducts.includes(product.id))
                        .map((product) => (
                          <label
                            key={product.id}
                            className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-accent"
                          >
                            <input
                              type="checkbox"
                              checked={false}
                              onChange={() => handleProductToggle(product.id)}
                              disabled={selectedProducts.length >= 3}
                              className="cursor-pointer"
                            />
                            <img
                              src={product.thumbnail}
                              alt={product.product_name}
                              className="h-12 w-12 rounded object-cover"
                            />
                            <span className="text-sm">{product.product_name}</span>
                          </label>
                        ))}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{selectedProducts.length} of 3 selected</p>
              </div>

              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingSection ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sections.map((section) => (
          <Card key={section.id} className="p-4">
            <div className="flex items-center gap-4">
              <img src={section.image_url} alt={section.title} className="h-24 w-24 rounded object-cover" />
              <div className="flex-1">
                <h3 className="font-semibold">{section.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Order: {section.display_order} | {section.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(section)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Delete this section?')) {
                      deleteMutation.mutate(section.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
