import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { validateProductInput } from '@/lib/prohibitedWordsValidation';
import {
  createProduct,
  updateProductWithLock,
  fetchProductImages,
  fetchProductForConflictCheck,
} from '@/services/products';
import { checkAuctionExistsByListingId, createAuction, updateAuction } from '@/services/auctions';
import { checkSellerHasShippingOptions } from '@/services/shipping';
import { updateProductTags } from '@/services/tags';
import { isFailure } from '@/types/api';
import { useHiveModeration } from './useHiveModeration';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  discountedPrice: string;
  offersEnabled: boolean;
  categoryId: string;
  subcategoryId: string;
  subSubcategoryId: string;
  subSubSubcategoryId: string;
  itemType: string;
  stockQuantity: string;
  isMarketplaceListed: boolean;
  selectedTags: string[];
}

interface UseProductSubmissionProps {
  userId: string;
  isEditMode: boolean;
  productId?: string;
  formData: ProductFormData;
  dynamicAttributes: Record<string, unknown>;
  uploadImages: () => Promise<string[]>;
  saveAttributeValues: (productId: string, attributes: Record<string, unknown>) => Promise<void>;
  needsModeration?: boolean;
  listingType?: 'marketplace' | 'auction';
  auctionData?: {
    reservePrice: string;
    startingBid: string;
    duration: string;
  };
  existingImages?: string[]; // Add existing images for safe comparison
  originalUpdatedAt?: string | null; // For optimistic locking
  onConflict?: (conflictData: unknown) => void; // Callback for conflict handling
}

type SubmissionMode = 'publish' | 'draft' | 'private';

export const useProductSubmission = ({
  userId,
  isEditMode,
  productId,
  formData,
  dynamicAttributes,
  uploadImages,
  saveAttributeValues,
  needsModeration = false,
  listingType = 'marketplace',
  auctionData,
  existingImages = [],
  originalUpdatedAt,
  onConflict,
}: UseProductSubmissionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { moderateText } = useHiveModeration();

  const submitProduct = async (e: React.FormEvent, mode: SubmissionMode = 'publish') => {
    e.preventDefault();

    if (!userId) {
      toast.error('You must be logged in to add products');
      return;
    }

    // Check if seller has shipping settings configured when publishing
    if (mode === 'publish') {
      const shippingResult = await checkSellerHasShippingOptions(userId);
      if (isFailure(shippingResult)) {
        console.error('Error checking shipping options:', shippingResult.error);
      }

      if (isFailure(shippingResult) || !shippingResult.data) {
        toast.error('Please set up your shipping settings before publishing products', {
          description: 'You can configure shipping in your seller dashboard',
          duration: 5000,
        });
        return;
      }
    }

    // Determine final status based on mode and marketplace toggle
    let finalStatus: string;
    if (mode === 'draft') {
      finalStatus = 'draft';
    } else if (mode === 'publish') {
      // If publishing, check marketplace toggle
      finalStatus = formData.isMarketplaceListed ? 'published' : 'private';
    } else {
      finalStatus = mode; // 'private'
    }

    // Only validate required fields for publishing (published or private)
    if (mode === 'publish') {
      if (!formData.name || !formData.price) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate for prohibited words only when publishing
      const validation = await validateProductInput(formData.name, formData.description);

      if (!validation.isValid) {
        toast.error(validation.message || 'Product contains prohibited words');
        return;
      }

      // Moderate product name and description with HIVE
      toast.loading('Checking content...', { id: 'content-mod' });

      const nameResult = await moderateText(formData.name);
      if (!nameResult.isApproved) {
        toast.error(`Product name rejected: ${nameResult.message}`, { id: 'content-mod' });
        return;
      }
      if (nameResult.requiresReview) {
        toast.warning('Product name flagged for review', { id: 'content-mod', duration: 3000 });
      }

      if (formData.description) {
        const descResult = await moderateText(formData.description);
        if (!descResult.isApproved) {
          toast.error(`Description rejected: ${descResult.message}`, { id: 'content-mod' });
          return;
        }
        if (descResult.requiresReview) {
          toast.warning('Description flagged for review', { id: 'content-mod', duration: 3000 });
        }
      }

      toast.dismiss('content-mod');
    }
    // For drafts, no validation required - can save incomplete products

    setIsSubmitting(true);

    try {
      // Upload images in parallel
      let imageUrls = await uploadImages();

      // SAFE IMAGE HANDLING: If upload returns empty but we had existing images, preserve them
      if (imageUrls.length === 0 && isEditMode && productId) {
        // Fetch current images from database to ensure we don't lose them
        const imagesResult = await fetchProductImages(productId);
        if (!isFailure(imagesResult) && imagesResult.data && imagesResult.data.length > 0) {
          imageUrls = imagesResult.data;
        }
      }

      let finalProductId: string;

      if (isEditMode && productId) {
        // OPTIMISTIC LOCKING: Check if product was modified by someone else
        if (originalUpdatedAt) {
          const conflictResult = await fetchProductForConflictCheck(productId);
          if (
            !isFailure(conflictResult) &&
            conflictResult.data &&
            conflictResult.data.updated_at !== originalUpdatedAt
          ) {
            toast.error('This product was modified by another user. Please refresh and try again.');
            if (onConflict) {
              onConflict(conflictResult.data);
            }
            setIsSubmitting(false);
            return;
          }
        }

        // SAFE: Only update product_images if we have valid images or this is a new product
        const updateData: unknown = {
          product_name: formData.name || 'Untitled Draft',
          product_description: formData.description || null,
          starting_price: formData.price ? parseFloat(formData.price) : null,
          discounted_price: formData.discountedPrice ? parseFloat(formData.discountedPrice) : null,
          offers_enabled: formData.offersEnabled,
          product_type: 'shop',
          auction_type: listingType === 'auction' ? 'timed' : null,
          category_id: formData.categoryId || null,
          subcategory_id: formData.subcategoryId || null,
          sub_subcategory_id: formData.subSubcategoryId || null,
          sub_sub_subcategory_id: formData.subSubSubcategoryId || null,
          stock_quantity:
            formData.itemType === 'multi' && formData.stockQuantity ? parseInt(formData.stockQuantity) : null,
          status: finalStatus,
          moderation_status: needsModeration ? 'pending' : 'approved',
          moderation_reason: needsModeration ? 'Image flagged by AI but seller confirmed validity' : null,
        };

        // SAFE: Only update images if we have valid image URLs
        if (imageUrls.length > 0) {
          updateData.thumbnail = imageUrls[0];
          updateData.product_images = imageUrls;
        }

        const updateResult = await updateProductWithLock(productId, updateData, originalUpdatedAt || null);
        if (isFailure(updateResult)) {
          console.error('Product update error:', updateResult.error);
          toast.error('Failed to update product');
          setIsSubmitting(false);
          return;
        }

        finalProductId = productId;
      } else {
        // Create new product
        const createResult = await createProduct({
          seller_id: userId,
          product_name: formData.name || 'Untitled Draft',
          product_description: formData.description || null,
          starting_price: formData.price ? parseFloat(formData.price) : null,
          discounted_price: formData.discountedPrice ? parseFloat(formData.discountedPrice) : null,
          product_image: imageUrls[0] || null,
          product_images: imageUrls,
          offers_enabled: formData.offersEnabled,
          product_type: 'shop',
          auction_type: listingType === 'auction' ? 'timed' : null,
          stream_id: 'shop',
          category_id: formData.categoryId || null,
          subcategory_id: formData.subcategoryId || null,
          sub_subcategory_id: formData.subSubcategoryId || null,
          sub_sub_subcategory_id: formData.subSubSubcategoryId || null,
          stock_quantity:
            formData.itemType === 'multi' && formData.stockQuantity ? parseInt(formData.stockQuantity) : null,
          status: finalStatus,
          moderation_status: needsModeration ? 'pending' : 'approved',
          moderation_reason: needsModeration ? 'Image flagged by AI but seller confirmed validity' : null,
        });

        if (isFailure(createResult)) {
          console.error('Product creation error:', createResult.error);
          toast.error('Failed to create product');
          setIsSubmitting(false);
          return;
        }

        finalProductId = createResult.data.id;
      }

      // Create auction record if it's an auction
      if (listingType === 'auction' && auctionData && mode === 'publish') {
        const duration = parseInt(auctionData.duration);
        const endTime = new Date();
        endTime.setDate(endTime.getDate() + duration);
        const startTime = new Date();

        // Check if auction already exists (for edits)
        const existingAuctionResult = await checkAuctionExistsByListingId(finalProductId);
        if (!isFailure(existingAuctionResult) && existingAuctionResult.data) {
          // Update existing auction
          const updateResult = await updateAuction(existingAuctionResult.data.id, {
            reserve_price: parseFloat(auctionData.reservePrice),
            starting_bid: auctionData.startingBid ? parseFloat(auctionData.startingBid) : 0,
            auction_duration: duration,
            end_time: endTime.toISOString(),
            start_time: startTime.toISOString(),
            status: 'active',
          });
          if (isFailure(updateResult)) {
            console.error('Failed to update auction:', updateResult.error);
          }
        } else {
          // Create new auction
          const createResult = await createAuction({
            listing_id: finalProductId,
            reserve_price: parseFloat(auctionData.reservePrice),
            starting_bid: auctionData.startingBid ? parseFloat(auctionData.startingBid) : 0,
            auction_duration: duration,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: 'active',
          });
          if (isFailure(createResult)) {
            console.error('Failed to create auction:', createResult.error);
          }
        }
      }

      // Save dynamic attributes
      try {
        await saveAttributeValues(finalProductId, dynamicAttributes);
      } catch (error) {
        console.error('Error saving attributes:', error);
        toast.error('Product saved but some attributes failed to save');
      }

      // SAFE TAG HANDLING: Use upsert pattern instead of delete-all
      try {
        if (formData.selectedTags && formData.selectedTags.length > 0) {
          const tagUpdateResult = await updateProductTags(finalProductId, formData.selectedTags);
          if (isFailure(tagUpdateResult)) {
            throw tagUpdateResult.error;
          }
        }
        // SAFE: If selectedTags is empty, don't delete all tags - user might not have loaded tags
        // Only clear tags if explicitly requested (would need a separate "clearAllTags" flag)
      } catch (error) {
        console.error('Error saving tags:', error);
        toast.error('Product saved but tags failed to save');
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['shop-products'] });
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });

      const message =
        mode === 'draft'
          ? isEditMode
            ? 'Draft updated successfully!'
            : 'Draft saved successfully!'
          : needsModeration
            ? 'Product submitted for moderation review. It will be published after approval.'
            : formData.isMarketplaceListed
              ? isEditMode
                ? 'Product updated successfully!'
                : 'Product published to marketplace!'
              : isEditMode
                ? 'Private product updated!'
                : 'Product saved to your shop!';

      toast.success(message);
      navigate('/seller#products');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitProduct, isSubmitting };
};
