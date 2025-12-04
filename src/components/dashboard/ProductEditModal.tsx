import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Plus, Trash2, Upload, Star, Tag, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { BrandSelector } from '@/components/BrandSelector';
import { MultiSelectAttribute } from '@/components/MultiSelectAttribute';
import { MultiSelectLevel4Categories } from '@/components/product-form/MultiSelectLevel4Categories';
import { MultiSelectLevel2Categories } from '@/components/product-form/MultiSelectLevel2Categories';
import { MultiSelectLevel3Categories } from '@/components/product-form/MultiSelectLevel3Categories';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDynamicAttributes } from '@/hooks/useDynamicAttributes';
import { useImageUpload } from '@/hooks/useImageUpload';
import { analyzeAttribute } from '@/lib/attributeUtils';
import { compressImage } from '@/lib/imageCompression';
import { fetchAttributesByIds, fetchProductAttributes } from '@/services/attributes/attributeService';
import { createAuction, updateAuction, fetchAuctionByListingId, cancelAuctionByListingId } from '@/services/auctions';
import { fetchBrands } from '@/services/brands';
import {
  fetchCategories,
  fetchSubcategories,
  fetchSubSubcategories,
  fetchSubSubSubcategories,
} from '@/services/categories';
import { invokeEdgeFunction } from '@/services/functions/edgeFunctionService';
import { createProduct, updateProduct } from '@/services/products/productService';
import { uploadFile } from '@/services/storage';
import { fetchTags, fetchProductTags } from '@/services/tags';
import { isFailure } from '@/types/api';

interface ProductEditModalProps {
  product?: unknown;
  sellerId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const ProductEditModal = ({ product, sellerId, isOpen, onClose, onSave }: ProductEditModalProps) => {
  const [loading, setLoading] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [initialFormData, setInitialFormData] = useState<any>(null);
  const [initialDynamicAttributes, setInitialDynamicAttributes] = useState<Record<string, any>>({});
  const [initialSelectedTags, setInitialSelectedTags] = useState<string[]>([]);
  const [initialImages, setInitialImagesState] = useState<string[]>([]);
  const isInitialLoadRef = useRef(false);

  const [formData, setFormData] = useState({
    product_name: '',
    slug: '',
    excerpt: '',
    product_description: '',
    starting_price: '',
    discounted_price: '',
    category_id: '',
    subcategory_id: '',
    sub_subcategory_id: '',
    sub_sub_subcategory_id: '',
    brand_id: '',
    stock_quantity: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    sku: '',
    thumbnail: '',
    showcase_image: '',
    showcase_image_file: null as File | null,
    status: 'published',
    offers_enabled: true,
    meta_title: '',
    meta_description: '',
    listing_type: 'marketplace' as 'marketplace' | 'auction',
    reserve_price: '',
    starting_bid: '',
    auction_duration: '7',
  });
  const [dynamicAttributes, setDynamicAttributes] = useState<Record<string, any>>({});
  const [oldAttributes, setOldAttributes] = useState<any[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageAltTags, setImageAltTags] = useState<Record<number, string>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string; color: string }>>([]);

  const {
    images,
    currentImages,
    mainImageIndex,
    addImages,
    removeImage,
    removeCurrentImage,
    setInitialImages,
    setMainImageIndex,
    uploadImages,
  } = useImageUpload(product?.seller_id || sellerId || '');

  const { attributes, saveAttributeValues } = useDynamicAttributes(
    formData.category_id,
    formData.subcategory_id,
    formData.sub_subcategory_id,
  );

  const attributeKeysWithValues = useMemo(() => {
    return Object.keys(dynamicAttributes).filter((attrId) => {
      const value = dynamicAttributes[attrId];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'boolean') return true;
      if (typeof value === 'number') return true;
      return value != null;
    });
  }, [dynamicAttributes]);

  // Track old attributes when category changes
  useEffect(() => {
    // Don't process during initial load or if no attributes
    if (!attributes || attributes.length === 0 || isInitialLoadRef.current) return;

    const currentAttributeIds = new Set(attributes.map((attr: unknown) => attr.id));

    // ONLY show in "Old Attributes" if they have values AND are NOT in current attributes
    // If an attribute overlaps between old and new category, it shows in main "Attributes" only
    const orphanedAttributeIds = attributeKeysWithValues.filter((attrId) => !currentAttributeIds.has(attrId));

    if (orphanedAttributeIds.length > 0) {
      // Fetch full details for orphaned attributes
      const fetchOldAttributes = async () => {
        const result = await fetchAttributesByIds(orphanedAttributeIds);
        if (result.success && result.data) {
          setOldAttributes(result.data);
        }
      };
      fetchOldAttributes();
    } else {
      setOldAttributes([]);
    }
  }, [attributes, attributeKeysWithValues, formData.category_id, formData.subcategory_id, formData.sub_subcategory_id]);

  // Fetch categories, subcategories, brands
  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const result = await fetchCategories();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories', formData.category_id],
    queryFn: async () => {
      if (!formData.category_id) return [];
      const result = await fetchSubcategories(formData.category_id);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!formData.category_id,
  });

  // Fetch available tags
  useEffect(() => {
    const fetchTagsAsync = async () => {
      const result = await fetchTags({ isActive: true });
      if (result.success && result.data) {
        setAvailableTags(result.data.map((tag) => ({ id: tag.id, name: tag.name, color: tag.color || null })));
      }
    };
    fetchTagsAsync();
  }, []);

  const { data: subSubcategories = [] } = useQuery({
    queryKey: ['sub-subcategories', formData.subcategory_id],
    queryFn: async () => {
      if (!formData.subcategory_id) return [];
      const result = await fetchSubSubcategories(formData.subcategory_id);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!formData.subcategory_id,
  });

  const { data: subSubSubcategories = [] } = useQuery({
    queryKey: ['sub-sub-subcategories', formData.sub_subcategory_id],
    queryFn: async () => {
      if (!formData.sub_subcategory_id) return [];
      const result = await fetchSubSubSubcategories(formData.sub_subcategory_id);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!formData.sub_subcategory_id,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const result = await fetchBrands({ isActive: true });
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  useEffect(() => {
    if (product) {
      isInitialLoadRef.current = true;
      const isAuction = product.auction_type === 'timed';
      const auction = product.auctions?.[0];

      const initialData = {
        product_name: product.product_name || '',
        slug: product.slug || '',
        excerpt: product.excerpt || '',
        product_description: product.product_description || '',
        starting_price: product.starting_price?.toString() || '',
        discounted_price: product.discounted_price?.toString() || '',
        category_id: product.category_id || '',
        subcategory_id: product.subcategory_id || '',
        sub_subcategory_id: product.sub_subcategory_id || '',
        sub_sub_subcategory_id: product.sub_sub_subcategory_id || '',
        brand_id: product.brand_id || '',
        stock_quantity: product.stock_quantity?.toString() || '',
        weight: product.weight?.toString() || '',
        length: product.length?.toString() || '',
        width: product.width?.toString() || '',
        height: product.height?.toString() || '',
        sku: product.sku || '',
        thumbnail: product.thumbnail || '',
        showcase_image: product.showcase_image || '',
        showcase_image_file: null,
        status: product.status || 'published',
        offers_enabled: product.offers_enabled ?? true,
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        listing_type: isAuction ? ('auction' as const) : ('marketplace' as const),
        reserve_price: auction?.reserve_price?.toString() || '',
        starting_bid: auction?.starting_bid?.toString() || '',
        auction_duration: auction?.auction_duration?.toString() || '7',
      };

      setFormData(initialData);
      setInitialFormData(initialData);

      // Load product images array
      const productImagesArray = product.product_images || [];
      const filteredImages = Array.isArray(productImagesArray) ? productImagesArray.filter(Boolean) : [];
      setInitialImages(filteredImages);
      setInitialImagesState(filteredImages);

      // Load alt tags - pre-populate with auto-generated values if custom ones don't exist
      const altTagsArray = product.product_image_alts || [];
      const altTagsObj: Record<number, string> = {};
      productImagesArray.forEach((_: string, index: number) => {
        // Use custom alt tag if exists, otherwise generate default
        altTagsObj[index] = altTagsArray[index] || `${product.product_name} ${index + 1} | VINT STREET`;
      });
      setImageAltTags(altTagsObj);

      // Fetch existing attributes
      const fetchAttributes = async () => {
        const result = await fetchProductAttributes(product.id);
        if (result.success && result.data) {
          const attrValues: Record<string, any> = {};
          result.data.forEach((attr) => {
            const dataType = attr.attributes?.data_type;

            if (dataType === 'multi-select' && attr.value_text) {
              try {
                attrValues[attr.attribute_id] = JSON.parse(attr.value_text);
              } catch {
                attrValues[attr.attribute_id] = attr.value_text.split(',').map((v: string) => v.trim());
              }
            } else if (attr.value_text) {
              attrValues[attr.attribute_id] = attr.value_text;
            } else if (attr.value_number !== null) {
              attrValues[attr.attribute_id] = attr.value_number.toString();
            } else if (attr.value_boolean !== null) {
              attrValues[attr.attribute_id] = attr.value_boolean;
            }
          });
          setDynamicAttributes(attrValues);
          setInitialDynamicAttributes(attrValues);
        }
      };

      fetchAttributes();

      // Fetch product tags
      const fetchProductTagsAsync = async () => {
        const result = await fetchProductTags(product.id);
        if (result.success && result.data) {
          const tagIds = result.data.map((tag) => tag.id);
          setSelectedTags(tagIds);
          setInitialSelectedTags(tagIds);
        }
      };
      fetchProductTagsAsync();

      // Allow old attributes useEffect to run after initial load
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
    }
  }, [product]);

  const handleSave = async () => {
    if (!formData.product_name) {
      toast.error('Product name is required');
      throw new Error('Validation failed');
    }

    if (formData.listing_type === 'marketplace' && !formData.starting_price) {
      toast.error('Price is required for marketplace listings');
      throw new Error('Validation failed');
    }

    if (formData.listing_type === 'auction' && !formData.reserve_price) {
      toast.error('Reserve price is required for auctions');
      throw new Error('Validation failed');
    }

    setLoading(true);
    try {
      // Upload any new images (with compression) and get complete array
      const uploadResult = await uploadImages();
      const allImages: string[] =
        typeof uploadResult === 'object' && uploadResult && 'images' in uploadResult
          ? (uploadResult.images as string[])
          : Array.isArray(uploadResult)
            ? uploadResult
            : [];

      // Set main image based on mainImageIndex
      const mainImage = allImages[mainImageIndex] || formData.thumbnail || allImages[0];

      // Handle showcase image upload if file is provided
      let showcaseImageUrl = formData.showcase_image;
      if (formData.showcase_image_file) {
        const compressedFile = await compressImage(formData.showcase_image_file);

        const fileName = `${Date.now()}-${formData.showcase_image_file.name}`;
        const uploadResult = await uploadFile(compressedFile, {
          bucket: 'product-images',
          fileName,
        });

        if (isFailure(uploadResult)) {
          console.error('[ProductEditModal] Showcase image upload failed', uploadResult.error);
          toast.error(`Failed to upload showcase image: ${uploadResult.error.message}`);
          throw uploadResult.error;
        }

        const publicUrl = uploadResult.data.url;

        showcaseImageUrl = publicUrl;
      }

      // Convert imageAltTags object to array matching allImages
      const altTagsArray = allImages.map((_, index) => imageAltTags[index] || '');

      // Calculate auction end time if needed
      let auctionEndTime = null;
      if (formData.listing_type === 'auction') {
        const durationDays = parseInt(formData.auction_duration);
        const endTime = new Date();
        endTime.setDate(endTime.getDate() + durationDays);
        auctionEndTime = endTime.toISOString();
      }

      // For marketplace, use the entered price. For auctions, fall back to reserve price
      const startingPrice =
        formData.listing_type === 'auction'
          ? formData.reserve_price
            ? parseFloat(formData.reserve_price)
            : NaN
          : formData.starting_price
            ? parseFloat(formData.starting_price)
            : NaN;

      // SAFE IMAGE HANDLING: If allImages is empty but we had initial images, preserve them
      let finalImages = allImages;
      if (allImages.length === 0 && initialImages.length > 0) {
        finalImages = initialImages;
      }
      const finalMainImage = finalImages[mainImageIndex] || formData.thumbnail || finalImages[0];
      const finalAltTags = finalImages.map((_, index) => imageAltTags[index] || '');

      const productData: unknown = {
        product_name: formData.product_name,
        slug: formData.slug || null,
        excerpt: formData.excerpt || null,
        product_description: formData.product_description,
        starting_price: startingPrice,
        discounted_price: formData.discounted_price ? parseFloat(formData.discounted_price) : null,
        category_id: formData.category_id || null,
        subcategory_id: formData.subcategory_id || null,
        sub_subcategory_id: formData.sub_subcategory_id || null,
        sub_sub_subcategory_id: formData.sub_sub_subcategory_id || null,
        brand_id: formData.brand_id || null,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        length: formData.length ? parseFloat(formData.length) : null,
        width: formData.width ? parseFloat(formData.width) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        sku: formData.sku || null,
        thumbnail: finalMainImage,
        product_images: finalImages,
        product_image_alts: finalAltTags,
        showcase_image: showcaseImageUrl || null,
        status: formData.status,
        offers_enabled: formData.offers_enabled,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        auction_end_time: formData.listing_type === 'auction' ? auctionEndTime : null,
        product_type: 'shop',
        auction_type: formData.listing_type === 'auction' ? 'timed' : null,
      };

      let productId = product?.id;

      if (product) {
        // Update existing product

        const updateResult = await updateProduct(product.id, {
          ...productData,
          updated_at: new Date().toISOString(),
        });

        if (isFailure(updateResult)) {
          console.error('[ProductEditModal] Listing update failed', updateResult.error);
          toast.error(`Failed to update listing: ${updateResult.error.message}`);
          throw updateResult.error;
        }
      } else {
        // Create new product

        const createResult = await createProduct({
          ...productData,
          seller_id: sellerId || '',
          stream_id: 'master-catalog',
        });

        if (isFailure(createResult)) {
          console.error('[ProductEditModal] Listing creation failed', createResult.error);
          toast.error(`Failed to create listing: ${createResult.error.message}`);
          throw createResult.error;
        }
        productId = createResult.data.id;
      }

      // Save dynamic attributes
      if (productId) {
        try {
          await saveAttributeValues(productId, dynamicAttributes);
        } catch (attrError: unknown) {
          console.error('[ProductEditModal] Attribute save failed', attrError);
          toast.error(`Failed to save attributes: ${attrError.message || 'Unknown error'}`);
          throw attrError;
        }

        // SAFE TAG HANDLING: Only delete/insert what actually changed

        const initialTagSet = new Set(initialSelectedTags);
        const currentTagSet = new Set(selectedTags);

        // Update tags using bulk update service
        const { bulkUpdateProductTags } = await import('@/services/tags');
        const { isFailure } = await import('@/types/api');
        const tagsResult = await bulkUpdateProductTags(productId, selectedTags);

        if (isFailure(tagsResult)) {
          console.error('[ProductEditModal] Failed to update tags', tagsResult.error);
          toast.error(`Failed to update tags: ${tagsResult.error.message}`);
          throw tagsResult.error;
        }

        // Handle auction creation/update
        if (formData.listing_type === 'auction') {
          const reservePrice = parseFloat(formData.reserve_price);
          const startingBid = formData.starting_bid ? parseFloat(formData.starting_bid) : null;
          const durationDays = parseInt(formData.auction_duration);

          if (isNaN(reservePrice) || reservePrice <= 0) {
            toast.error('Invalid reserve price for auction');
            throw new Error('Invalid reserve price for auction');
          }

          if (startingBid && startingBid >= reservePrice) {
            toast.error('Starting bid must be less than reserve price');
            throw new Error('Starting bid must be less than reserve price');
          }

          const endTime = new Date();
          endTime.setDate(endTime.getDate() + durationDays);

          // Check if auction already exists
          const existingAuctionResult = await fetchAuctionByListingId(productId);
          if (isFailure(existingAuctionResult)) {
            console.error('[ProductEditModal] Error checking existing auction', existingAuctionResult.error);
            toast.error(`Failed to check auction: ${existingAuctionResult.error.message}`);
            throw existingAuctionResult.error;
          }

          const existingAuction = existingAuctionResult.data;

          if (existingAuction) {
            // Update existing auction

            const updateResult = await updateAuction(existingAuction.id, {
              reserve_price: reservePrice,
              starting_bid: startingBid,
              auction_duration: durationDays,
              start_time: new Date().toISOString(),
              end_time: endTime.toISOString(),
            });

            if (isFailure(updateResult)) {
              console.error('[ProductEditModal] Auction update failed', updateResult.error);
              toast.error(`Failed to update auction: ${updateResult.error.message}`);
              throw updateResult.error;
            }
          } else {
            // Create new auction

            const now = new Date().toISOString();
            const createResult = await createAuction({
              listing_id: productId,
              reserve_price: reservePrice,
              starting_bid: startingBid,
              current_bid: startingBid || 0,
              auction_duration: durationDays,
              start_time: now,
              end_time: endTime.toISOString(),
              status: 'active',
            });

            if (isFailure(createResult)) {
              console.error('[ProductEditModal] Auction creation failed', createResult.error);
              toast.error(`Failed to create auction: ${createResult.error.message}`);
              throw createResult.error;
            }
          }
        } else if (product?.auction_type === 'auction') {
          // If changing from auction to marketplace, end the auction

          const cancelResult = await cancelAuctionByListingId(productId);

          if (isFailure(cancelResult)) {
            console.error('[ProductEditModal] Failed to cancel auction', cancelResult.error);
            toast.error(`Failed to cancel auction: ${cancelResult.error.message}`);
            throw cancelResult.error;
          }
        }
      }

      toast.success(product ? 'Product updated successfully' : 'Product created successfully');
      onSave();
    } catch (error: unknown) {
      console.error('[ProductEditModal] Error saving product:', error);
      // Only show generic error if we haven't already shown a specific one
      if (!error?.message?.includes('Validation failed')) {
        const errorMessage = error?.message || 'Unknown error';
        toast.error(
          product ? `Failed to update product: ${errorMessage}` : `Failed to create product: ${errorMessage}`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Reset child categories when parent changes (but keep attribute data)
      if (field === 'category_id') {
        updated.subcategory_id = '';
        updated.sub_subcategory_id = '';
        updated.sub_sub_subcategory_id = '';
      } else if (field === 'subcategory_id') {
        updated.sub_subcategory_id = '';
        updated.sub_sub_subcategory_id = '';
      } else if (field === 'sub_subcategory_id') {
        updated.sub_sub_subcategory_id = '';
      }

      return updated;
    });
  };

  const updateAttribute = (attributeId: string, value: unknown) => {
    setDynamicAttributes((prev) => ({ ...prev, [attributeId]: value }));
  };

  const hasUnsavedChanges = () => {
    if (!initialFormData) return false;

    // Check form data changes
    const formDataChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData);

    // Check dynamic attributes changes
    const attributesChanged = JSON.stringify(dynamicAttributes) !== JSON.stringify(initialDynamicAttributes);

    // Check tags changes
    const tagsChanged = JSON.stringify(selectedTags.sort()) !== JSON.stringify(initialSelectedTags.sort());

    // Check images changes
    const imagesChanged = JSON.stringify(currentImages) !== JSON.stringify(initialImages) || images.length > 0;

    return formDataChanged || attributesChanged || tagsChanged || imagesChanged;
  };

  const handleClose = () => {
    if (hasUnsavedChanges() && !loading) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedDialog(false);
    onClose();
  };

  const handleSaveAndClose = async () => {
    setShowUnsavedDialog(false);
    setLoading(true);

    try {
      // Call handleSave without awaiting so it uses its own error handling
      await handleSave();
      // If save was successful, close the modal
      onClose();
    } catch (error) {
      // Error is already handled in handleSave
      setLoading(false);
    }
  };

  const addImageUrl = () => {
    if (newImageUrl.trim()) {
      const newIndex = currentImages.length;
      setInitialImages([...currentImages, newImageUrl.trim()]);
      // Auto-generate alt tag for new image
      setImageAltTags((prev) => ({
        ...prev,
        [newIndex]: `${formData.product_name || 'product'}-vintstreet-${newIndex + 1}`,
      }));
      setNewImageUrl('');
      toast.success('Image URL added');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.error('Please upload image files only');
      return;
    }

    // Auto-generate alt tags for new images
    const startIndex = currentImages.length + images.length;
    const newAltTags: Record<number, string> = {};
    imageFiles.forEach((_, index) => {
      const imageIndex = startIndex + index;
      newAltTags[imageIndex] = `${formData.product_name || 'product'} ${imageIndex + 1} | VINT STREET`;
    });
    setImageAltTags((prev) => ({ ...prev, ...newAltTags }));

    addImages(imageFiles);
    toast.success(`${imageFiles.length} image(s) added. They will be compressed and uploaded when you save.`);

    // Reset input
    e.target.value = '';
  };

  const handleSetMainImage = (index: number) => {
    setMainImageIndex(index);
    toast.success('Main thumbnail updated');
  };

  // Get all images for display (existing + pending uploads)
  const allDisplayImages = [...currentImages];
  const totalImages = allDisplayImages.length + images.length;

  const updateImageAlt = (index: number, alt: string) => {
    setImageAltTags((prev) => ({ ...prev, [index]: alt }));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden [&>button]:hidden">
          <Tabs defaultValue="product" className="flex h-full w-full flex-col">
            <DialogHeader className="shrink-0 flex-row items-center justify-between space-y-0 pb-4">
              <DialogTitle>Edit Product</DialogTitle>
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="product">Product Data</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="tags">Tags</TabsTrigger>
                <TabsTrigger value="meta">Meta Data</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Button onClick={handleSave} disabled={loading} size="sm">
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={handleClose} disabled={loading} size="sm">
                  Close
                </Button>
              </div>
            </DialogHeader>

            <TabsContent value="product" className="flex-1 overflow-hidden">
              <div className="grid h-full grid-cols-[300px_1fr] gap-6 overflow-hidden">
                {/* Left Column - Settings (Sticky) */}
                <div className="sticky top-0 space-y-4 self-start">
                  {/* Main Image Preview */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Main Image</Label>
                    {currentImages.length > 0 || images.length > 0 || formData.thumbnail ? (
                      <div className="relative aspect-square overflow-hidden rounded-lg border">
                        <img
                          src={
                            currentImages[mainImageIndex] ||
                            formData.thumbnail ||
                            (images[0] ? URL.createObjectURL(images[0]) : '')
                          }
                          alt="Main product image"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute left-2 top-2">
                          <div className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                            <Star className="h-3 w-3 fill-current" />
                            Main
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                        <div className="text-center">
                          <Upload className="mx-auto mb-2 h-8 w-8 opacity-50" />
                          <p className="text-xs">No image</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <Label htmlFor="offers_enabled">Enable Offers</Label>
                    <Switch
                      id="offers_enabled"
                      checked={formData.offers_enabled}
                      onCheckedChange={(checked) => updateField('offers_enabled', checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => updateField('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-popover">
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Right Column - Product Details */}
                <div className="space-y-6 overflow-y-auto pb-8 pr-2" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                  <div className="space-y-2">
                    <Label htmlFor="product_name">Product Name *</Label>
                    <Input
                      id="product_name"
                      value={formData.product_name}
                      onChange={(e) => updateField('product_name', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="slug">Product Slug</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => updateField('slug', e.target.value)}
                        placeholder="product-slug-url"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brand_id">Brand</Label>
                      <BrandSelector
                        selectedBrandId={formData.brand_id}
                        onSelectBrand={(brandId) => updateField('brand_id', brandId)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product_description">Description</Label>
                    <Textarea
                      id="product_description"
                      value={formData.product_description}
                      onChange={(e) => updateField('product_description', e.target.value)}
                      rows={3}
                      placeholder="Product description..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => updateField('excerpt', e.target.value)}
                      rows={2}
                      placeholder="Short excerpt or summary..."
                    />
                  </div>

                  {/* SKU and Stock */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input id="sku" value={formData.sku} onChange={(e) => updateField('sku', e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stock_quantity">Stock</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => updateField('stock_quantity', e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Listing Type Selection */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Listing Type</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        onClick={() => updateField('listing_type', 'marketplace')}
                        className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                          formData.listing_type === 'marketplace'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <h4 className="mb-1 font-semibold">Marketplace</h4>
                        <p className="text-xs text-muted-foreground">Standard fixed-price listing</p>
                      </div>
                      <div
                        onClick={() => updateField('listing_type', 'auction')}
                        className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                          formData.listing_type === 'auction'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <h4 className="mb-1 font-semibold">Auction</h4>
                        <p className="text-xs text-muted-foreground">Time-limited bidding</p>
                      </div>
                    </div>

                    {formData.listing_type === 'marketplace' && (
                      <div className="mt-4 space-y-4 rounded-lg bg-muted/30 p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="starting_price">Price (£) *</Label>
                            <Input
                              id="starting_price"
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={formData.starting_price}
                              onChange={(e) => updateField('starting_price', e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="discounted_price">Sale Price (£)</Label>
                            <Input
                              id="discounted_price"
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={formData.discounted_price}
                              onChange={(e) => updateField('discounted_price', e.target.value)}
                              placeholder="Optional"
                            />
                            <p className="text-xs text-muted-foreground">Leave empty for no discount</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.listing_type === 'auction' && (
                      <div className="mt-4 space-y-4 rounded-lg bg-muted/30 p-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="reserve_price">Reserve Price (£) *</Label>
                            <Input
                              id="reserve_price"
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={formData.reserve_price}
                              onChange={(e) => updateField('reserve_price', e.target.value)}
                              placeholder="Minimum price"
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Minimum price to sell (not visible to bidders)
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="starting_bid">Starting Bid (£)</Label>
                            <Input
                              id="starting_bid"
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={formData.starting_bid}
                              onChange={(e) => updateField('starting_bid', e.target.value)}
                              placeholder="Optional"
                            />
                            <p className="text-xs text-muted-foreground">Initial bid amount (optional)</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="auction_duration">Duration</Label>
                            <Select
                              value={formData.auction_duration}
                              onValueChange={(value) => updateField('auction_duration', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[100] bg-popover">
                                <SelectItem value="1">1 Day</SelectItem>
                                <SelectItem value="3">3 Days</SelectItem>
                                <SelectItem value="5">5 Days</SelectItem>
                                <SelectItem value="7">7 Days</SelectItem>
                                <SelectItem value="10">10 Days</SelectItem>
                                <SelectItem value="14">14 Days</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />
                  <div>
                    <h3 className="mb-3 text-sm font-semibold">Categories</h3>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="category_id">Level 1</Label>
                        <Select
                          value={formData.category_id}
                          onValueChange={(value) => updateField('category_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="z-[100] bg-popover">
                            {categories.map((cat: unknown) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subcategory_id">Level 2</Label>
                        <Select
                          value={formData.subcategory_id}
                          onValueChange={(value) => updateField('subcategory_id', value)}
                          disabled={!formData.category_id}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="z-[100] bg-popover">
                            {subcategories.map((sub: unknown) => (
                              <SelectItem key={sub.id} value={sub.id}>
                                {sub.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sub_subcategory_id">Level 3</Label>
                        <Select
                          value={formData.sub_subcategory_id}
                          onValueChange={(value) => updateField('sub_subcategory_id', value)}
                          disabled={!formData.subcategory_id}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="z-[100] bg-popover">
                            {subSubcategories.map((sub: unknown) => (
                              <SelectItem key={sub.id} value={sub.id}>
                                {sub.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sub_sub_subcategory_id">Level 4 (Primary)</Label>
                        <Select
                          value={formData.sub_sub_subcategory_id}
                          onValueChange={(value) => updateField('sub_sub_subcategory_id', value)}
                          disabled={!formData.sub_subcategory_id}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="z-[100] bg-popover">
                            {subSubSubcategories.map((sub: unknown) => (
                              <SelectItem key={sub.id} value={sub.id}>
                                {sub.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Additional Level 2 Categories */}
                    {formData.subcategory_id && (
                      <div className="mt-4">
                        <MultiSelectLevel2Categories
                          productId={product?.id}
                          primaryLevel2Id={formData.subcategory_id}
                          categoryId={formData.category_id}
                          isEditMode={true}
                        />
                      </div>
                    )}

                    {/* Additional Level 3 Categories */}
                    {formData.sub_subcategory_id && (
                      <div className="mt-4">
                        <MultiSelectLevel3Categories
                          productId={product?.id}
                          primaryLevel3Id={formData.sub_subcategory_id}
                          subcategoryId={formData.subcategory_id}
                          isEditMode={true}
                        />
                      </div>
                    )}

                    {/* Additional Level 4 Categories */}
                    {formData.sub_sub_subcategory_id && (
                      <div className="mt-4">
                        <MultiSelectLevel4Categories
                          productId={product?.id}
                          primaryLevel4Id={formData.sub_sub_subcategory_id}
                          subSubcategoryId={formData.sub_subcategory_id}
                          isEditMode={true}
                        />
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Attributes in 4 columns */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold">Attributes</h3>
                    {attributes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No attributes available. Please select a subcategory.
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 gap-3">
                        {attributes.map((attr: unknown) => {
                          const currentValue = dynamicAttributes[attr.id];
                          const { options, hasOptions, isCustomValue } = analyzeAttribute(attr, currentValue);
                          const selectedValues = dynamicAttributes[attr.id] || [];

                          return (
                            <div key={attr.id} className="space-y-2">
                              <Label htmlFor={attr.id} className="block truncate text-xs">
                                {attr.name} {attr.is_required && <span className="text-destructive">*</span>}
                              </Label>
                              {attr.data_type === 'multi-select' && hasOptions ? (
                                <MultiSelectAttribute
                                  attribute={attr}
                                  selectedValues={Array.isArray(selectedValues) ? selectedValues : []}
                                  onChange={(values) => updateAttribute(attr.id, values)}
                                />
                              ) : hasOptions ? (
                                <>
                                  <Select
                                    value={dynamicAttributes[attr.id] || ''}
                                    onValueChange={(value) => updateAttribute(attr.id, value)}
                                  >
                                    <SelectTrigger className={isCustomValue ? 'border-destructive' : ''}>
                                      <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent className="z-[100] bg-popover">
                                      {options
                                        .filter((opt: unknown) => opt.is_active)
                                        .sort((a: unknown, b: unknown) => a.display_order - b.display_order)
                                        .map((option: unknown) => (
                                          <SelectItem key={option.id} value={option.value}>
                                            {option.value}
                                          </SelectItem>
                                        ))}
                                      {/* Add custom value if it exists but not in options */}
                                      {isCustomValue && (
                                        <SelectItem key="custom-value" value={currentValue}>
                                          <div className="flex items-center gap-2">
                                            {currentValue}
                                            <Badge
                                              variant="outline"
                                              className="border-destructive/20 bg-destructive/10 text-[10px] text-destructive"
                                            >
                                              Custom
                                            </Badge>
                                          </div>
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                  {isCustomValue && (
                                    <p className="text-[10px] text-destructive">Not in approved options</p>
                                  )}
                                </>
                              ) : attr.data_type === 'number' ? (
                                <Input
                                  id={attr.id}
                                  type="number"
                                  value={dynamicAttributes[attr.id] || ''}
                                  onChange={(e) => updateAttribute(attr.id, e.target.value)}
                                />
                              ) : (
                                <Input
                                  id={attr.id}
                                  value={dynamicAttributes[attr.id] || ''}
                                  onChange={(e) => updateAttribute(attr.id, e.target.value)}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Old Attributes Section */}
                    {oldAttributes.length > 0 && (
                      <div className="mt-6 border-t border-border pt-6">
                        <div className="mb-3 flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-muted-foreground">Old Attributes</h3>
                          <Badge variant="outline" className="text-[10px]">
                            From previous category
                          </Badge>
                        </div>
                        <p className="mb-3 text-xs text-muted-foreground">
                          These attributes are from a previous category selection and will be saved.
                        </p>
                        <div className="grid grid-cols-4 gap-3">
                          {oldAttributes.map((attr: unknown) => {
                            const currentValue = dynamicAttributes[attr.id];
                            const { options, hasOptions, isCustomValue } = analyzeAttribute(attr, currentValue);
                            const selectedValues = dynamicAttributes[attr.id] || [];

                            return (
                              <div key={attr.id} className="space-y-2">
                                <Label htmlFor={`old-${attr.id}`} className="block truncate text-xs">
                                  {attr.name}
                                </Label>
                                {attr.data_type === 'multi-select' && hasOptions ? (
                                  <MultiSelectAttribute
                                    attribute={attr}
                                    selectedValues={Array.isArray(selectedValues) ? selectedValues : []}
                                    onChange={(values) => updateAttribute(attr.id, values)}
                                  />
                                ) : hasOptions ? (
                                  <>
                                    <Select
                                      value={dynamicAttributes[attr.id] || ''}
                                      onValueChange={(value) => updateAttribute(attr.id, value)}
                                    >
                                      <SelectTrigger className={isCustomValue ? 'border-destructive' : ''}>
                                        <SelectValue placeholder="Select..." />
                                      </SelectTrigger>
                                      <SelectContent className="z-[100] bg-popover">
                                        {options
                                          .filter((opt: unknown) => opt.is_active)
                                          .sort((a: unknown, b: unknown) => a.display_order - b.display_order)
                                          .map((option: unknown) => (
                                            <SelectItem key={option.id} value={option.value}>
                                              {option.value}
                                            </SelectItem>
                                          ))}
                                        {isCustomValue && (
                                          <SelectItem key="custom-value" value={currentValue}>
                                            <div className="flex items-center gap-2">
                                              {currentValue}
                                              <Badge
                                                variant="outline"
                                                className="border-destructive/20 bg-destructive/10 text-[10px] text-destructive"
                                              >
                                                Custom
                                              </Badge>
                                            </div>
                                          </SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                    {isCustomValue && (
                                      <p className="text-[10px] text-destructive">Not in approved options</p>
                                    )}
                                  </>
                                ) : attr.data_type === 'number' ? (
                                  <Input
                                    id={`old-${attr.id}`}
                                    type="number"
                                    value={dynamicAttributes[attr.id] || ''}
                                    onChange={(e) => updateAttribute(attr.id, e.target.value)}
                                  />
                                ) : (
                                  <Input
                                    id={`old-${attr.id}`}
                                    value={dynamicAttributes[attr.id] || ''}
                                    onChange={(e) => updateAttribute(attr.id, e.target.value)}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Shipping on one line */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold">Shipping</h3>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.01"
                          value={formData.weight}
                          onChange={(e) => updateField('weight', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="length">Length (cm)</Label>
                        <Input
                          id="length"
                          type="number"
                          step="0.1"
                          value={formData.length}
                          onChange={(e) => updateField('length', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="width">Width (cm)</Label>
                        <Input
                          id="width"
                          type="number"
                          step="0.1"
                          value={formData.width}
                          onChange={(e) => updateField('width', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="height">Height (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          step="0.1"
                          value={formData.height}
                          onChange={(e) => updateField('height', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="images"
              className="flex-1 overflow-y-auto pb-8"
              style={{ maxHeight: 'calc(90vh - 140px)' }}
            >
              <div className="space-y-6 pt-4">
                {/* Gallery Images - Moved to Top */}
                <div>
                  <Label className="text-base font-semibold">Gallery Images ({totalImages})</Label>
                  <ScrollArea className="mt-3 h-[500px] rounded-lg border p-4">
                    {totalImages === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">
                        <Upload className="mx-auto mb-3 h-12 w-12 opacity-50" />
                        <p>No gallery images yet</p>
                        <p className="mt-1 text-xs">Upload or add images below</p>
                      </div>
                    ) : (
                      <div className="inline-grid grid-cols-4 gap-4">
                        {/* Existing/URL images */}
                        {currentImages.map((imageUrl, index) => (
                          <div key={`current-${index}`} className="space-y-2">
                            <div className="group relative">
                              <img
                                src={imageUrl}
                                alt={imageAltTags[index] || `Gallery ${index + 1}`}
                                className="aspect-square w-full rounded-lg object-cover"
                              />
                              {mainImageIndex === index && (
                                <div className="absolute left-2 top-2">
                                  <div className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                                    <Star className="h-3 w-3 fill-current" />
                                    Main
                                  </div>
                                </div>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                {mainImageIndex !== index && (
                                  <Button size="sm" variant="secondary" onClick={() => handleSetMainImage(index)}>
                                    Set as Main
                                  </Button>
                                )}
                                <Button size="sm" variant="destructive" onClick={() => removeCurrentImage(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <Input
                              placeholder="Alt text (optional)"
                              value={imageAltTags[index] || ''}
                              onChange={(e) => updateImageAlt(index, e.target.value)}
                              className="text-xs"
                            />
                          </div>
                        ))}

                        {/* Pending file uploads (will be compressed on save) */}
                        {images.map((file, index) => (
                          <div key={`pending-${index}`} className="space-y-2">
                            <div className="group relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Pending ${index + 1}`}
                                className="aspect-square w-full rounded-lg object-cover opacity-75"
                              />
                              <div className="absolute left-2 top-2">
                                <div className="rounded bg-yellow-500 px-2 py-1 text-xs font-medium text-black">
                                  Pending Upload
                                </div>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                <Button size="sm" variant="destructive" onClick={() => removeImage(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <Input
                              placeholder="Alt text (optional)"
                              value={imageAltTags[currentImages.length + index] || ''}
                              onChange={(e) => updateImageAlt(currentImages.length + index, e.target.value)}
                              className="text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  {images.length > 0 && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="text-yellow-500">⚡</span>
                      {images.length} image(s) will be compressed and uploaded when you save
                    </p>
                  )}
                </div>

                <Separator />

                {/* Upload and URL Side by Side */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Upload Images</Label>
                    <div className="mt-2">
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="flex h-[140px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary">
                          <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to upload</p>
                          <p className="mt-1 text-xs text-muted-foreground">Multiple files supported</p>
                        </div>
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Add Image URL</Label>
                    <div className="mt-2 space-y-2">
                      <Input
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        onKeyDown={(e) => e.key === 'Enter' && addImageUrl()}
                      />
                      <Button onClick={addImageUrl} type="button" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add URL
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Main Thumbnail */}
                <div className="max-w-md">
                  <Label>Main Thumbnail</Label>
                  <div className="mt-2 rounded-lg border bg-muted/30 p-4">
                    {currentImages[mainImageIndex] || formData.thumbnail ? (
                      <div className="flex items-center gap-4">
                        <img
                          src={currentImages[mainImageIndex] || formData.thumbnail}
                          alt="Thumbnail"
                          className="h-20 w-20 rounded object-cover"
                        />
                        <div className="text-sm">
                          <p className="font-medium">Main product thumbnail</p>
                          <p className="text-muted-foreground">
                            Image {mainImageIndex + 1} of {currentImages.length}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No thumbnail set. Upload or add images above.</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Showcase Image */}
                <div>
                  <Label>Showcase Image (Optional)</Label>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Upload a special image for the showcase page. If not provided, the main product image will be used.
                  </p>

                  {formData.showcase_image ? (
                    <div className="space-y-3">
                      <div className="relative w-full max-w-md">
                        <img
                          src={formData.showcase_image}
                          alt="Showcase preview"
                          className="h-64 w-full rounded-lg border-2 border-primary object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -right-2 -top-2 h-8 w-8"
                          onClick={() => updateField('showcase_image', '')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid max-w-2xl grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="showcase-upload" className="cursor-pointer">
                          <div className="flex h-[140px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary">
                            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click to upload showcase image</p>
                          </div>
                        </label>
                        <input
                          id="showcase-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Create a temporary preview
                              const objectUrl = URL.createObjectURL(file);
                              updateField('showcase_image', objectUrl);
                              updateField('showcase_image_file', file);
                            }
                          }}
                        />
                      </div>

                      <div>
                        <div className="space-y-2">
                          <Input
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            placeholder="https://example.com/showcase.jpg"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateField('showcase_image', newImageUrl);
                                setNewImageUrl('');
                              }
                            }}
                          />
                          <Button
                            onClick={() => {
                              if (newImageUrl) {
                                updateField('showcase_image', newImageUrl);
                                setNewImageUrl('');
                              }
                            }}
                            type="button"
                            className="w-full"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Showcase URL
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tags" className="flex-1 overflow-hidden">
              <div className="grid h-full grid-cols-[300px_1fr] gap-6 overflow-hidden">
                {/* Left Column - Main Image Preview (Sticky) */}
                <div className="sticky top-0 space-y-4 self-start">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Main Image</Label>
                    {currentImages.length > 0 || images.length > 0 ? (
                      <div className="relative aspect-square overflow-hidden rounded-lg border">
                        <img
                          src={currentImages[mainImageIndex] || (images[0] ? URL.createObjectURL(images[0]) : '')}
                          alt="Main product image"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute left-2 top-2">
                          <div className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                            <Star className="h-3 w-3 fill-current" />
                            Main
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                        <div className="text-center">
                          <Upload className="mx-auto mb-2 h-8 w-8 opacity-50" />
                          <p className="text-xs">No image</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Tags Content */}
                <div className="space-y-4 overflow-y-auto pb-8 pr-2 pt-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                  <div>
                    <Label className="text-base">Product Tags</Label>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Select tags to categorize this product (e.g., Halloween, Summer Sale)
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.id);
                      return (
                        <Badge
                          key={tag.id}
                          variant={isSelected ? 'default' : 'outline'}
                          className="cursor-pointer transition-all hover:scale-105"
                          style={
                            isSelected
                              ? { backgroundColor: tag.color, borderColor: tag.color }
                              : { borderColor: tag.color, color: tag.color }
                          }
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTags(selectedTags.filter((id) => id !== tag.id));
                            } else {
                              setSelectedTags([...selectedTags, tag.id]);
                            }
                          }}
                        >
                          <Tag className="mr-1 h-3 w-3" />
                          {tag.name}
                        </Badge>
                      );
                    })}
                  </div>

                  {availableTags.length === 0 && (
                    <p className="rounded-lg border py-8 text-center text-sm text-muted-foreground">
                      No tags available. Create tags in the Tags tab first.
                    </p>
                  )}

                  {selectedTags.length > 0 && (
                    <div className="mt-4 rounded-lg border bg-accent/50 p-4">
                      <p className="mb-2 text-sm font-medium">Selected Tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tagId) => {
                          const tag = availableTags.find((t) => t.id === tagId);
                          return tag ? (
                            <Badge key={tagId} style={{ backgroundColor: tag.color }}>
                              {tag.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="meta" className="flex-1 overflow-hidden">
              <div className="grid h-full grid-cols-[300px_1fr] gap-6 overflow-hidden">
                {/* Left Column - Main Image Preview (Sticky) */}
                <div className="sticky top-0 space-y-4 self-start">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Main Image</Label>
                    {currentImages.length > 0 || images.length > 0 ? (
                      <div className="relative aspect-square overflow-hidden rounded-lg border">
                        <img
                          src={currentImages[mainImageIndex] || (images[0] ? URL.createObjectURL(images[0]) : '')}
                          alt="Main product image"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute left-2 top-2">
                          <div className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                            <Star className="h-3 w-3 fill-current" />
                            Main
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                        <div className="text-center">
                          <Upload className="mx-auto mb-2 h-8 w-8 opacity-50" />
                          <p className="text-xs">No image</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Meta Content */}
                <div className="space-y-4 overflow-y-auto pb-8 pr-2 pt-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          setLoading(true);
                          const result = await invokeEdgeFunction<{
                            metaTitle?: string;
                            metaDescription?: string;
                          }>({
                            functionName: 'generate-product-meta',
                            body: {
                              productTitle: formData.product_name,
                              productDescription: formData.product_description,
                              productExcerpt: formData.excerpt,
                              attributes: dynamicAttributes,
                            },
                          });

                          if (isFailure(result)) {
                            throw result.error;
                          }

                          if (result.data?.metaTitle) {
                            updateField('meta_title', result.data.metaTitle);
                          }
                          if (result.data?.metaDescription) {
                            updateField('meta_description', result.data.metaDescription);
                          }

                          toast.success('Meta tags generated successfully!');
                        } catch (error: unknown) {
                          console.error('Error generating meta tags:', error);
                          toast.error(`Failed to generate meta tags: ${error?.message || 'Please try again.'}`);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading || !formData.product_name}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate with AI
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_title">Meta Title</Label>
                    <Input
                      id="meta_title"
                      value={formData.meta_title}
                      onChange={(e) => updateField('meta_title', e.target.value)}
                      placeholder="SEO title for search engines"
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground">{formData.meta_title.length}/60 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <Textarea
                      id="meta_description"
                      value={formData.meta_description}
                      onChange={(e) => updateField('meta_description', e.target.value)}
                      placeholder="SEO description for search engines"
                      rows={4}
                      maxLength={160}
                    />
                    <p className="text-xs text-muted-foreground">{formData.meta_description.length}/160 characters</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save them before closing?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClose}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Close Without Saving
            </AlertDialogAction>
            <AlertDialogAction onClick={handleSaveAndClose}>Save and Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
