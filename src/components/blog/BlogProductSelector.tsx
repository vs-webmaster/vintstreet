import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/useDebounce';
import { searchProductsByName, fetchProductsByIds } from '@/services/products';
import { isFailure } from '@/types/api';

interface BlogProductSelectorProps {
  selectedProducts: string[];
  onProductsChange: (products: string[]) => void;
}

export const BlogProductSelector = ({ selectedProducts, onProductsChange }: BlogProductSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['products-search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];

      const result = await searchProductsByName(debouncedSearch, { limit: 20, includeDetails: true });
      if (isFailure(result)) throw result.error;

      return result.data.map((p) => ({
        id: p.id,
        product_name: p.product_name,
        thumbnail: p.thumbnail || null,
        starting_price: p.starting_price || 0,
      }));
    },
    enabled: debouncedSearch.length >= 2,
  });

  const { data: selectedProductsData = [] } = useQuery({
    queryKey: ['blog-selected-products', selectedProducts],
    enabled: selectedProducts.length > 0,
    queryFn: async () => {
      const result = await fetchProductsByIds(selectedProducts);
      if (isFailure(result)) throw result.error;

      return result.data.map((p) => ({
        id: p.id,
        product_name: p.product_name,
        thumbnail: p.thumbnail,
        starting_price: p.starting_price,
      }));
    },
  });

  const addProduct = (productId: string) => {
    if (!selectedProducts.includes(productId)) {
      onProductsChange([...selectedProducts, productId]);
    }
  };

  const removeProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter((id) => id !== productId));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Related Products</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Search Products</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products (min 2 characters)..."
              className="pl-9"
            />
          </div>
        </div>

        {searchQuery && searchQuery.length >= 2 && (
          <div className="max-h-60 overflow-y-auto rounded-lg border p-4">
            {isSearching ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Searching...</p>
            ) : searchResults.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No products found</p>
            ) : (
              <div className="space-y-2">
                {searchResults
                  .filter((product) => !selectedProducts.includes(product.id))
                  .map((product: any) => (
                    <div
                      key={product.id}
                      className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-accent"
                      onClick={() => addProduct(product.id)}
                    >
                      {product.thumbnail && (
                        <img
                          src={product.thumbnail}
                          alt={product.product_name}
                          className="h-12 w-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{product.product_name}</p>
                        <p className="text-xs text-muted-foreground">£{product.starting_price}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Add
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {selectedProductsData.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Products ({selectedProductsData.length})</Label>
            <div className="grid gap-2">
              {selectedProductsData.map((product: any) => (
                <div key={product.id} className="flex items-center gap-3 rounded-lg border p-3">
                  {product.thumbnail && (
                    <img
                      src={product.thumbnail}
                      alt={product.product_name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{product.product_name}</p>
                    <p className="text-xs text-muted-foreground">£{product.starting_price}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeProduct(product.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
