/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, PoundSterling, Edit, Trash2, Eye, EyeOff, Upload, FileEdit } from 'lucide-react';
import { AddProductModal } from '@/components/AddProductModal';
import { BulkProductUpload } from '@/components/BulkProductUpload';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { fetchProductsBySeller, archiveProduct } from '@/services/products';
import { isFailure } from '@/types/api';

interface ProductTemplatesProps {
  streamId?: string;
}

export const ProductTemplates = ({ streamId }: ProductTemplatesProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<'livestream' | 'shop'>('livestream');
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'live' | 'sold' | 'draft' | 'private'>('live');
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  const fetchShopProducts = async () => {
    try {
      if (!user) return;

      const result = await fetchProductsBySeller(user.id, { includeArchived: true });

      if (isFailure(result)) {
        console.error('Error fetching shop products:', result.error);
        return;
      }

      setShopProducts((result.data || []) as any);
    } catch (error) {
      console.error('Error in fetchShopProducts:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    await fetchShopProducts();
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDeleteProduct = async (productId: string) => {
    try {
      const result = await archiveProduct(productId);

      if (isFailure(result)) {
        throw result.error;
      }

      toast({
        title: 'Product archived',
        description: 'Product has been archived successfully.',
      });

      setDeleteDialogOpen(false);
      setProductToDelete(null);
      // Refresh product lists
      fetchProducts();
    } catch (error) {
      console.error('Error archiving product:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive product. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price);
  };

  const handleEditProduct = (product: unknown) => {
    navigate(`/edit-product/${product.id}`);
  };

  const renderProductGrid = (products: unknown[]) => {
    if (products.length === 0) {
      return (
        <Card className="p-4 text-center">
          <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mb-2 text-sm text-muted-foreground">No products yet</p>
          <p className="mb-3 text-xs text-muted-foreground">Create your first product template</p>
        </Card>
      );
    }

    return (
      <div className="grid max-w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="space-y-2">
                {/* Product Image */}
                <div className="aspect-square w-full">
                  {product.thumbnail ? (
                    <img
                      src={product.thumbnail}
                      alt={product.product_name}
                      className="h-full w-full rounded border object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded border bg-muted">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="flex-1 truncate text-sm font-medium text-foreground">{product.product_name}</h4>
                    <div className="flex flex-shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEditProduct(product);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          confirmDelete(product.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-1">
                    {/* Draft/Published/Private status */}
                    {product.status === 'draft' && (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      >
                        <FileEdit className="mr-1 h-3 w-3" />
                        Draft
                      </Badge>
                    )}
                    {product.status === 'private' && (
                      <Badge
                        variant="outline"
                        className="border-purple-200 bg-purple-50 text-xs text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300"
                      >
                        <EyeOff className="mr-1 h-3 w-3" />
                        Private
                      </Badge>
                    )}
                    {product.status === 'published' && (
                      <Badge
                        variant="outline"
                        className="border-green-200 bg-green-50 text-xs text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Published
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <PoundSterling className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium text-primary">{formatPrice(product.starting_price)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-1/2 rounded bg-muted"></div>
          <div className="h-20 rounded bg-muted"></div>
        </div>
      </Card>
    );
  }

  // Filter products based on status
  const filteredProducts = shopProducts.filter((product) => {
    if (statusFilter === 'live') {
      return product.status === 'published';
    } else if (statusFilter === 'sold') {
      return product.stock_quantity === 0 || (product.stock_quantity !== null && product.stock_quantity <= 0);
    } else if (statusFilter === 'draft') {
      return product.status === 'draft';
    } else if (statusFilter === 'private') {
      return product.status === 'private';
    }
    return true;
  });

  // Calculate counts for each filter
  const liveCount = shopProducts.filter((p) => p.status === 'published').length;
  const soldCount = shopProducts.filter(
    (p) => p.stock_quantity === 0 || (p.stock_quantity !== null && p.stock_quantity <= 0),
  ).length;
  const draftCount = shopProducts.filter((p) => p.status === 'draft').length;
  const privateCount = shopProducts.filter((p) => p.status === 'private').length;

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button onClick={() => setIsBulkUploadOpen(true)} variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
      </div>

      {/* Status Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === 'live' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('live')}
          size="sm"
        >
          Live Listings {liveCount > 0 && `(${liveCount})`}
        </Button>
        <Button
          variant={statusFilter === 'private' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('private')}
          size="sm"
        >
          Private {privateCount > 0 && `(${privateCount})`}
        </Button>
        <Button
          variant={statusFilter === 'sold' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('sold')}
          size="sm"
        >
          Sold {soldCount > 0 && `(${soldCount})`}
        </Button>
        <Button
          variant={statusFilter === 'draft' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('draft')}
          size="sm"
        >
          Draft {draftCount > 0 && `(${draftCount})`}
        </Button>
      </div>

      {renderProductGrid(filteredProducts)}

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        streamId={streamId || 'template'}
        productType={selectedProductType}
        onProductAdded={fetchProducts}
      />

      <BulkProductUpload
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onProductsAdded={fetchProducts}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this product? You can unarchive it later from the archived products page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => productToDelete && handleDeleteProduct(productToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
