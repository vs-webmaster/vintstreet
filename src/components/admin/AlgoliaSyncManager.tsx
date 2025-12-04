// Admin component for managing Algolia sync
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { syncAllProductsToAlgolia, syncAllCategoriesToAlgolia, syncAllBrandsToAlgolia } from '@/lib/algoliaSync';

export const AlgoliaSyncManager = () => {
  const queryClient = useQueryClient();
  const [isSyncingProducts, setIsSyncingProducts] = useState(false);
  const [isSyncingCategories, setIsSyncingCategories] = useState(false);
  const [isSyncingBrands, setIsSyncingBrands] = useState(false);

  // Sync all products mutation
  const syncAllProductsMutation = useMutation({
    mutationFn: syncAllProductsToAlgolia,
    onMutate: () => {
      setIsSyncingProducts(true);
    },
    onSuccess: (data) => {
      toast.success(`Successfully synced ${data.count} products to Algolia`);
      queryClient.invalidateQueries({ queryKey: ['algolia-product-queue-status'] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message;
      if (errorMessage.includes('not deployed')) {
        toast.error('Edge Function not deployed. See ALGOLIA_SETUP.md for instructions.', { duration: 10000 });
      } else {
        toast.error(`Failed to sync products: ${errorMessage}`);
      }
    },
    onSettled: () => {
      setIsSyncingProducts(false);
    },
  });

  // Sync all categories mutation
  const syncAllCategoriesMutation = useMutation({
    mutationFn: syncAllCategoriesToAlgolia,
    onMutate: () => {
      setIsSyncingCategories(true);
    },
    onSuccess: (data) => {
      toast.success(`Successfully synced ${data.count} categories to Algolia`);
      queryClient.invalidateQueries({ queryKey: ['algolia-category-queue-status'] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message;
      if (errorMessage.includes('not deployed')) {
        toast.error('Edge Function not deployed. See ALGOLIA_SETUP.md for instructions.', { duration: 10000 });
      } else {
        toast.error(`Failed to sync categories: ${errorMessage}`);
      }
    },
    onSettled: () => {
      setIsSyncingCategories(false);
    },
  });

  // Sync all brands mutation
  const syncAllBrandsMutation = useMutation({
    mutationFn: syncAllBrandsToAlgolia,
    onMutate: () => {
      setIsSyncingBrands(true);
    },
    onSuccess: (data) => {
      toast.success(`Successfully synced ${data.count} brands to Algolia`);
      queryClient.invalidateQueries({ queryKey: ['algolia-brand-queue-status'] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message;
      if (errorMessage.includes('not deployed')) {
        toast.error('Edge Function not deployed. See ALGOLIA_SETUP.md for instructions.', { duration: 10000 });
      } else {
        toast.error(`Failed to sync brands: ${errorMessage}`);
      }
    },
    onSettled: () => {
      setIsSyncingBrands(false);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Algolia Search Sync Manager</CardTitle>
        <CardDescription>
          Manage synchronization of products, categories, and brands with Algolia AI Search
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Products Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Products</h3>
          <Button onClick={() => syncAllProductsMutation.mutate()} disabled={isSyncingProducts} className="w-full">
            {isSyncingProducts ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Sync All Products
              </>
            )}
          </Button>
        </div>

        {/* Categories Section */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold">Categories</h3>
          <Button onClick={() => syncAllCategoriesMutation.mutate()} disabled={isSyncingCategories} className="w-full">
            {isSyncingCategories ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Sync All Categories
              </>
            )}
          </Button>
        </div>

        {/* Brands Section */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold">Brands</h3>
          <Button onClick={() => syncAllBrandsMutation.mutate()} disabled={isSyncingBrands} className="w-full">
            {isSyncingBrands ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Sync All Brands
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
