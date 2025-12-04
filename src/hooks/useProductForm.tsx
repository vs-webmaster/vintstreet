import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { fetchProductAttributes } from '@/services/attributes';
import { fetchProductByIdOrSlug } from '@/services/products';
import { fetchProductTags } from '@/services/tags';
import { isFailure } from '@/types/api';

export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  discountedPrice: string;
  categoryId: string;
  subcategoryId: string;
  subSubcategoryId: string;
  subSubSubcategoryId: string;
  brand_id: string;
  productType: string;
  offersEnabled: boolean;
  itemType: string;
  stockQuantity: string;
  isMarketplaceListed: boolean;
  selectedTags: string[];
  auctionType: string | null;
}

export const useProductForm = (id?: string) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    discountedPrice: '',
    categoryId: '',
    subcategoryId: '',
    subSubcategoryId: '',
    subSubSubcategoryId: '',
    brand_id: '',
    productType: 'shop',
    offersEnabled: true,
    itemType: 'single',
    stockQuantity: '',
    isMarketplaceListed: true,
    selectedTags: [],
    auctionType: null,
  });
  const [dynamicAttributes, setDynamicAttributes] = useState<Record<string, string | number | boolean | string[] | null>>({});
  const [productImages, setProductImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(!!id);
  const [originalUpdatedAt, setOriginalUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const productResult = await fetchProductByIdOrSlug(id);

        if (isFailure(productResult)) {
          throw productResult.error;
        }

        const data = productResult.data;
        if (data) {
          // Store original updated_at for optimistic locking
          setOriginalUpdatedAt(data.updated_at);

          setFormData({
            name: data.product_name || '',
            description: data.product_description || '',
            price: data.starting_price?.toString() || '',
            discountedPrice: data.discounted_price?.toString() || '',
            categoryId: data.category_id || '',
            subcategoryId: data.subcategory_id || '',
            subSubcategoryId: data.sub_subcategory_id || '',
            subSubSubcategoryId: data.sub_sub_subcategory_id || '',
            brand_id: data.brand_id || '',
            productType: data.product_type || 'shop',
            offersEnabled: data.offers_enabled ?? true,
            itemType: data.stock_quantity ? 'multi' : 'single',
            stockQuantity: data.stock_quantity?.toString() || '',
            isMarketplaceListed: data.status === 'published',
            selectedTags: [],
            auctionType: data.auction_type || null,
          });

          // Set product images
          setProductImages(data.product_images || []);
        }

        // Fetch product tags
        const tagsResult = await fetchProductTags(id);
        if (!isFailure(tagsResult) && tagsResult.data) {
          setFormData((prev) => ({
            ...prev,
            selectedTags: tagsResult.data.map((t) => t.id),
          }));
        }

        // Fetch dynamic attribute values
        const attrsResult = await fetchProductAttributes(id);
        if (!isFailure(attrsResult) && attrsResult.data) {
          const attrValues: Record<string, string | number | boolean | string[] | null> = {};
          attrsResult.data.forEach((attr) => {
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
            } else if (attr.value_date) {
              attrValues[attr.attribute_id] = attr.value_date;
            }
          });
          setDynamicAttributes(attrValues);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const updateFormData = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateDynamicAttribute = (attributeId: string, value: unknown) => {
    setDynamicAttributes((prev) => ({ ...prev, [attributeId]: value }));
  };

  const resetDynamicAttributes = () => {
    setDynamicAttributes({});
  };

  return {
    formData,
    dynamicAttributes,
    productImages,
    isLoading,
    originalUpdatedAt,
    updateFormData,
    updateDynamicAttribute,
    resetDynamicAttributes,
  };
};
