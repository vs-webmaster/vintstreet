import { useState, useEffect } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import { useProhibitedWordsValidation } from '@/hooks/useProhibitedWordsValidation';
import { validateProductInput } from '@/lib/prohibitedWordsValidation';
import { updateProduct, archiveProduct } from '@/services/products';
import { isFailure } from '@/types/api';
import type { Database } from '@/integrations/supabase/types';

type ListingUpdate = Database['public']['Tables']['listings']['Update'];

interface ListingProduct {
  id: string;
  product_name: string;
  starting_price: number;
  product_description?: string | null;
  thumbnail?: string | null;
  stream_id: string;
  status: string;
  product_type?: string;
  seller_id?: string;
  created_at?: string;
  updated_at?: string;
  auction_end_time?: string | null;
  current_bid?: number | null;
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ListingProduct | null;
  onProductUpdated: () => void;
}

export const EditProductModal = ({ isOpen, onClose, product, onProductUpdated }: EditProductModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    starting_price: '',
    product_description: '',
    thumbnail: '',
  });
  const { toast } = useToast();

  const { nameErrors, descriptionErrors } = useProhibitedWordsValidation({
    productName: formData.product_name,
    productDescription: formData.product_description,
  });

  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        product_name: product.product_name || '',
        starting_price: product.starting_price?.toString() || '',
        product_description: product.product_description || '',
        thumbnail: product.thumbnail || '',
      });
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    // Validate for prohibited words
    const validation = await validateProductInput(formData.product_name, formData.product_description);

    if (!validation.isValid) {
      toast({
        title: 'Prohibited words detected',
        description: validation.message || 'Product contains prohibited words',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const result = await updateProduct(product.id, {
        product_name: formData.product_name,
        starting_price: parseFloat(formData.starting_price),
        product_description: formData.product_description || null,
        thumbnail: formData.thumbnail || null,
<<<<<<< HEAD
      } as unknown);
=======
      } as ListingUpdate);
>>>>>>> a275e0e6fd466fe0415be180aa3be0c399054c93

      if (isFailure(result)) {
        throw result.error;
      }

      toast({
        title: 'Product updated',
        description: 'Your product has been successfully updated.',
      });

      onProductUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    setLoading(true);

    try {
      // Note: Using archive instead of hard delete for data preservation
      const result = await archiveProduct(product.id);

      if (isFailure(result)) {
        throw result.error;
      }

      toast({
        title: 'Product archived',
        description: 'Your product has been successfully archived.',
      });

      onProductUpdated();
      onClose();
    } catch (error) {
      console.error('Error archiving product:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive product. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      product_name: '',
      starting_price: '',
      product_description: '',
      thumbnail: '',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="product_name">Product Name *</Label>
            <Input
              id="product_name"
              value={formData.product_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, product_name: e.target.value }))}
              placeholder="Enter product name"
              required
              className={nameErrors.length > 0 ? 'border-destructive' : ''}
            />
            {nameErrors.length > 0 && (
              <div className="mt-2 flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>Prohibited words detected: {nameErrors.join(', ')}</span>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="starting_price">Starting Price (£) *</Label>
            <Input
              id="starting_price"
              type="number"
              min="0"
              step="0.01"
              value={formData.starting_price}
              onChange={(e) => setFormData((prev) => ({ ...prev, starting_price: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="product_description">Description</Label>
            <Textarea
              id="product_description"
              value={formData.product_description}
              onChange={(e) => setFormData((prev) => ({ ...prev, product_description: e.target.value }))}
              placeholder="Describe your product..."
              rows={3}
              className={descriptionErrors.length > 0 ? 'border-destructive' : ''}
            />
            {descriptionErrors.length > 0 && (
              <div className="mt-2 flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>Prohibited words detected: {descriptionErrors.join(', ')}</span>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="thumbnail">Image URL</Label>
            <Input
              id="thumbnail"
              type="url"
              value={formData.thumbnail}
              onChange={(e) => setFormData((prev) => ({ ...prev, thumbnail: e.target.value }))}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex justify-between gap-2">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
              Delete Product
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={loading || nameErrors.length > 0 || descriptionErrors.length > 0}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Updating...' : 'Update Product'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
