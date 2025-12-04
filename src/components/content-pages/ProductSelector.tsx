/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchContentPageProducts, addProductToContentPage, removeProductFromContentPage } from '@/services/content';
import { fetchProductsByIds, fetchProducts } from '@/services/products';
import { fetchSellerProfilesByShopNames } from '@/services/users';
import { isFailure } from '@/types/api';

interface Product {
  id: string;
  product_name: string;
  thumbnail: string;
  sku: string | null;
}

interface ProductSelectorProps {
  pageId: string;
}

export const ProductSelector = ({ pageId }: ProductSelectorProps) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch system seller
  const { data: systemSeller } = useQuery({
    queryKey: ['system-seller'],
    queryFn: async () => {
      const result = await fetchSellerProfilesByShopNames(['VintStreet System']);
      if (isFailure(result)) throw result.error;
      const seller = result.data.find((s) => s.shop_name === 'VintStreet System');
      return seller ? { user_id: seller.user_id } : null;
    },
  });

  // Fetch selected products for this page
  const { data: selectedProductsData = [] } = useQuery({
    queryKey: ['content-page-products', pageId],
    queryFn: async () => {
      const result = await fetchContentPageProducts(pageId);
      if (isFailure(result)) throw result.error;
      return result.data.map((p) => p.product_id);
    },
  });

  // Fetch full details of selected products
  const { data: selectedProducts = [] } = useQuery({
    queryKey: ['selected-products-details', selectedProductsData],
    queryFn: async () => {
      if (selectedProductsData.length === 0) return [];
      const result = await fetchProductsByIds(selectedProductsData);
      if (isFailure(result)) throw result.error;
      return result.data.map((p) => ({
        id: p.id,
        product_name: p.product_name,
        thumbnail: p.thumbnail || '',
        sku: (p as any).sku || null,
      })) as Product[];
    },
    enabled: selectedProductsData.length > 0,
  });

  // Search products
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
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
        20,
      );
      if (isFailure(result)) throw result.error;
      return result.data.products.map((p) => ({
        id: p.id,
        product_name: p.product_name,
        thumbnail: p.thumbnail || '',
        sku: (p as any).sku || null,
      })) as Product[];
    },
    enabled: !!systemSeller?.user_id && debouncedSearch.length >= 2,
  });

  const addProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const result = await addProductToContentPage(pageId, productId, selectedProductsData.length);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-page-products', pageId] });
      toast.success('Product added');
      setSearchTerm('');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add product: ${error.message}`);
    },
  });

  const removeProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const result = await removeProductFromContentPage(pageId, productId);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-page-products', pageId] });
      toast.success('Product removed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove product: ${error.message}`);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Products */}
        {selectedProducts.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Products ({selectedProducts.length})</Label>
            <div className="space-y-2">
              {selectedProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded bg-accent p-3">
                  <img src={product.thumbnail} alt={product.product_name} className="h-12 w-12 rounded object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{product.product_name}</p>
                    {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProductMutation.mutate(product.id)}
                    disabled={removeProductMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Products */}
        <div className="space-y-2">
          <Label>Add Products</Label>
          <Input
            placeholder="Search by product name or SKU (min 2 characters)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="max-h-80 overflow-y-auto rounded-lg border p-4">
            {!searchTerm || searchTerm.length < 2 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search for products
              </p>
            ) : isSearching ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Searching...</p>
            ) : searchResults.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No products found</p>
            ) : (
              <div className="space-y-2">
                {searchResults
                  .filter((product) => !selectedProductsData.includes(product.id))
                  .map((product) => (
                    <div
                      key={product.id}
                      className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-accent"
                      onClick={() => addProductMutation.mutate(product.id)}
                    >
                      <img
                        src={product.thumbnail}
                        alt={product.product_name}
                        className="h-12 w-12 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{product.product_name}</p>
                        {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
                      </div>
                      <Button variant="outline" size="sm" disabled={addProductMutation.isPending}>
                        Add
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
