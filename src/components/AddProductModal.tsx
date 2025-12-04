import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Upload, X, DollarSign, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { compressImage } from '@/lib/imageCompression';
import { validateProductInput } from '@/lib/prohibitedWordsValidation';
import { useProhibitedWordsValidation } from '@/hooks/useProhibitedWordsValidation';
import { fetchCategories, fetchSubcategories } from '@/services/categories';
import { createProduct } from '@/services/products';
import { uploadProductImage } from '@/services/storage';
import { isFailure } from '@/types/api';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamId: string;
  productType?: 'livestream' | 'shop';
  onProductAdded?: () => void;
}

interface ProductForm {
  name: string;
  fromPrice: string;
  description: string;
  image: File | null;
  categoryId: string;
  subcategoryId: string;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  streamId,
  productType = 'livestream',
  onProductAdded,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>({
    name: '',
    fromPrice: '',
    description: '',
    image: null,
    categoryId: '',
    subcategoryId: '',
  });

  const { nameErrors, descriptionErrors } = useProhibitedWordsValidation({
    productName: form.name,
    productDescription: form.description,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const result = await fetchCategories();
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
  });

  // Fetch subcategories for selected category
  const { data: subcategories = [] } = useQuery({
    queryKey: ['product-subcategories', form.categoryId],
    queryFn: async () => {
      if (!form.categoryId) return [];

      const result = await fetchSubcategories(form.categoryId);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!form.categoryId,
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB',
          variant: 'destructive',
        });
        return;
      }

      setForm((prev) => ({ ...prev, image: file }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.fromPrice.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in product name and from price',
        variant: 'destructive',
      });
      return;
    }

    const price = parseFloat(form.fromPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: 'Invalid price',
        description: 'Please enter a valid price greater than 0',
        variant: 'destructive',
      });
      return;
    }

    // Validate for prohibited words
    const validation = await validateProductInput(form.name, form.description);

    if (!validation.isValid) {
      toast({
        title: 'Prohibited words detected',
        description: validation.message || 'Product contains prohibited words',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;

      // Check authentication
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to add products',
          variant: 'destructive',
        });
        return;
      }

      // Compress and upload image if provided
      if (form.image) {
        toast({
          title: 'Compressing image...',
          description: 'Optimizing your image for faster loading',
        });

        const compressedImage = await compressImage(form.image, 1000, 1000, 0.85);

        const uploadResult = await uploadProductImage(compressedImage, user.id);

        if (isFailure(uploadResult)) {
          console.error('Image upload error:', uploadResult.error);
          toast({
            title: 'Image upload failed',
            description: 'Failed to upload product image. Please try again.',
            variant: 'destructive',
          });
          return;
        }

        imageUrl = uploadResult.data.url;
      }

      // Create listing
      const createResult = await createProduct({
        seller_id: user.id,
        stream_id: streamId,
        product_name: form.name.trim(),
        starting_price: price,
        product_description: form.description.trim() || null,
        product_image: imageUrl,
        product_type: productType,
        category_id: form.categoryId || null,
        subcategory_id: form.subcategoryId || null,
        status: 'draft',
      });

      if (isFailure(createResult)) {
        console.error('Error creating listing:', createResult.error);
        toast({
          title: 'Failed to add product',
          description: 'There was an error adding your product. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Product added successfully!',
        description: `${form.name} has been added to your stream`,
      });

      // Reset form
      setForm({
        name: '',
        fromPrice: '',
        description: '',
        image: null,
        categoryId: '',
        subcategoryId: '',
      });
      setImagePreview(null);

      onProductAdded?.();
      onClose();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Add {productType === 'shop' ? 'Shop' : 'Livestream'} Product
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="productName" className="text-sm font-medium">
              Product Name *
            </Label>
            <Input
              id="productName"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter product name"
              required
              disabled={isSubmitting}
              className={nameErrors.length > 0 ? 'w-full border-destructive' : 'w-full'}
            />
            {nameErrors.length > 0 && (
              <div className="mt-2 flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>Prohibited words detected: {nameErrors.join(', ')}</span>
              </div>
            )}
          </div>

          {/* From Price */}
          <div className="space-y-2">
            <Label htmlFor="fromPrice" className="text-sm font-medium">
              From Price *
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                id="fromPrice"
                type="number"
                step="0.01"
                min="0"
                value={form.fromPrice}
                onChange={(e) => setForm((prev) => ({ ...prev, fromPrice: e.target.value }))}
                placeholder="0.00"
                required
                disabled={isSubmitting}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category
            </Label>
            <select
              id="category"
              value={form.categoryId}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value, subcategoryId: '' }))}
              disabled={isSubmitting}
              className="w-full rounded-md border bg-background px-3 py-2"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Selection */}
          {form.categoryId && subcategories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="subcategory" className="text-sm font-medium">
                Subcategory
              </Label>
              <select
                id="subcategory"
                value={form.subcategoryId}
                onChange={(e) => setForm((prev) => ({ ...prev, subcategoryId: e.target.value }))}
                disabled={isSubmitting}
                className="w-full rounded-md border bg-background px-3 py-2"
              >
                <option value="">Select a subcategory</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Product Image */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Product Image</Label>

            {!imagePreview ? (
              <div className="relative rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center transition-colors hover:border-muted-foreground/50">
                <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">Click to upload product image</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
            ) : (
              <Card className="relative">
                <CardContent className="p-4">
                  <div className="relative">
                    <img src={imagePreview} alt="Product preview" className="h-32 w-full rounded-md object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute right-2 top-2 h-6 w-6 p-0"
                      onClick={removeImage}
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your product..."
              rows={3}
              disabled={isSubmitting}
              className={descriptionErrors.length > 0 ? 'resize-none border-destructive' : 'resize-none'}
            />
            {descriptionErrors.length > 0 && (
              <div className="mt-2 flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>Prohibited words detected: {descriptionErrors.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !form.name.trim() ||
                !form.fromPrice.trim() ||
                nameErrors.length > 0 ||
                descriptionErrors.length > 0
              }
              className="flex-1"
            >
              {isSubmitting ? 'Adding...' : 'Add Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
