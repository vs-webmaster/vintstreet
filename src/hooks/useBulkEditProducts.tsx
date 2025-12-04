// Bulk Edit Products Hook
// Manages state and operations for bulk product editing

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { filterByCategoryId, filterBySubcategoryId, filterBySubSubcategoryId } from '@/lib/filterUtils';
import {
  fetchAllAttributesWithOptions,
  bulkInsertAttributeValues,
  bulkUpdateAttributeValues,
} from '@/services/attributes';
import {
  fetchAllSubcategories,
  fetchAllSubSubcategories,
  fetchAllSubSubSubcategories,
  fetchCategories,
} from '@/services/categories';
import { fetchBrands } from '@/services/brands';
import { fetchProductsByIdsForBulkEdit, bulkUpdateProducts } from '@/services/products';
import { fetchTags, fetchTagLinksForProducts, bulkUpdateProductTagsForProduct } from '@/services/tags';
import { isFailure } from '@/types/api';
import { Category } from '@/types/category';

export interface BulkEditProduct {
  id: string;
  product_name: string;
  thumbnail?: string;
  starting_price: number;
  discounted_price?: number;
  stock_quantity?: number;
  sku?: string;
  weight?: number;
  category_id?: string;
  subcategory_id?: string;
  sub_subcategory_id?: string;
  sub_sub_subcategory_id?: string;
  brand_id?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export const useBulkEditProducts = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [products, setProducts] = useState<BulkEditProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Reference data
  const [level1Categories, setLevel1Categories] = useState<Category[]>([]);
  const [level2Categories, setLevel2Categories] = useState<any[]>([]);
  const [level3Categories, setLevel3Categories] = useState<any[]>([]);
  const [level4Categories, setLevel4Categories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);

  // Attributes
  const [attributes, setAttributes] = useState<Map<string, any[]>>(new Map());
  const [productAttributes, setProductAttributes] = useState<Map<string, any[]>>(new Map());
  const [allUniqueAttributes, setAllUniqueAttributes] = useState<any[]>([]);
  const [allAvailableAttributes, setAllAvailableAttributes] = useState<any[]>([]);

  // Tags
  const [productTags, setProductTags] = useState<Map<string, string[]>>(new Map());
  const [initialProductTags, setInitialProductTags] = useState<Map<string, string[]>>(new Map());

  // Sorting
  const [sortField, setSortField] = useState<string>('default');

  // Unsaved changes tracking
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [initialProducts, setInitialProducts] = useState<BulkEditProduct[]>([]);
  const [initialProductAttributes, setInitialProductAttributes] = useState<Map<string, any[]>>(new Map());

  const productIds: string[] = location.state?.productIds || [];

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('bulkEditVisibleColumns');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      price: true,
      salePrice: true,
      stock: false,
      sku: false,
      weight: true,
      brand: true,
      level1: true,
      level2: true,
      level3: true,
      level4: false,
      status: false,
      tags: true,
    };
  });

  // Save column visibility to localStorage
  useEffect(() => {
    localStorage.setItem('bulkEditVisibleColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const toggleColumn = useCallback((column: string) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  }, []);

  const toggleAttributeColumn = useCallback((attributeId: string) => {
    setVisibleColumns((prev) => ({ ...prev, [`attr_${attributeId}`]: !prev[`attr_${attributeId}`] }));
  }, []);

  const isAttributeVisible = useCallback(
    (attributeId: string, attributeName: string) => {
      const key = `attr_${attributeId}`;
      if (visibleColumns[key] === undefined) {
        return attributeName.toLowerCase().includes('colour') || attributeName.toLowerCase().includes('color');
      }
      return visibleColumns[key];
    },
    [visibleColumns],
  );

  const hasUnsavedChanges = useCallback(() => {
    if (initialProducts.length === 0) return false;
    const productsChanged = JSON.stringify(products) !== JSON.stringify(initialProducts);
    const currentAttrsString = JSON.stringify(Array.from(productAttributes));
    const initialAttrsString = JSON.stringify(Array.from(initialProductAttributes));
    const attributesChanged = currentAttrsString !== initialAttrsString;
    const currentTagsString = JSON.stringify(Array.from(productTags));
    const initialTagsString = JSON.stringify(Array.from(initialProductTags));
    const tagsChanged = currentTagsString !== initialTagsString;
    return productsChanged || attributesChanged || tagsChanged;
  }, [products, productAttributes, productTags, initialProducts, initialProductAttributes, initialProductTags]);

  const handleNavigateBack = useCallback(() => {
    if (hasUnsavedChanges() && !saving) {
      setShowUnsavedDialog(true);
    } else {
      navigate('/admin/products');
    }
  }, [hasUnsavedChanges, saving, navigate]);

  const handleConfirmClose = useCallback(() => {
    setShowUnsavedDialog(false);
    navigate('/admin/products');
  }, [navigate]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Merge all available attributes with unique attributes for display
  const displayAttributes = useMemo(() => {
    const attrMap = new Map<string, any>();
    allUniqueAttributes.forEach((attr) => attrMap.set(attr.id, attr));
    allAvailableAttributes.forEach((attr) => {
      const existing = attrMap.get(attr.id);
      if (existing) {
        attrMap.set(attr.id, {
          ...existing,
          attribute_options: existing.attribute_options || attr.attribute_options || [],
        });
      } else {
        attrMap.set(attr.id, attr);
      }
    });
    return Array.from(attrMap.values()).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [allUniqueAttributes, allAvailableAttributes]);

  // Initial data fetch
  useEffect(() => {
    if (productIds.length === 0) {
      toast.error('No products selected');
      navigate('/admin/products');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch products
        const productsResult = await fetchProductsByIdsForBulkEdit(productIds);
        if (isFailure(productsResult)) {
          throw productsResult.error;
        }
        setProducts(productsResult.data);
        setInitialProducts(JSON.parse(JSON.stringify(productsResult.data)));

        // Fetch ALL attributes for the dialog
        const allAttrsResult = await fetchAllAttributesWithOptions();
        if (!isFailure(allAttrsResult) && allAttrsResult.data) {
          setAllAvailableAttributes(allAttrsResult.data);
        }

        // Fetch reference data in parallel
        const [brandsResult, l1Result, l2Result, l3Result, tagsResult, tagLinksResult] = await Promise.all([
          fetchBrands({ isActive: true }),
          fetchCategories(),
          fetchAllSubcategories(),
          fetchAllSubSubcategories(),
          fetchTags({ isActive: true }),
          fetchTagLinksForProducts(productIds),
        ]);

        if (!isFailure(brandsResult)) setBrands(brandsResult.data);
        if (!isFailure(l1Result)) setLevel1Categories(l1Result.data);
        if (!isFailure(l2Result)) setLevel2Categories(l2Result.data);
        if (!isFailure(l3Result)) setLevel3Categories(l3Result.data);
        if (!isFailure(tagsResult)) setAvailableTags(tagsResult.data);

        // Group tag links by product
        if (!isFailure(tagLinksResult)) {
          const tagsByProduct = new Map<string, string[]>();
          tagLinksResult.data.forEach((link) => {
            const existing = tagsByProduct.get(link.product_id) || [];
            existing.push(link.tag_id);
            tagsByProduct.set(link.product_id, existing);
          });
          setProductTags(tagsByProduct);
          setInitialProductTags(new Map(JSON.parse(JSON.stringify(Array.from(tagsByProduct)))));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productIds, navigate]);

  // Lazy load level 4 categories when needed
  useEffect(() => {
    const loadLevel4 = async () => {
      if (visibleColumns.level4 && level4Categories.length === 0) {
        const result = await fetchAllSubSubSubcategories();
        if (!isFailure(result) && result.data) {
          setLevel4Categories(result.data);
        }
      }
    };
    if (!loading) loadLevel4();
  }, [visibleColumns.level4, loading, level4Categories.length]);

  const updateProduct = useCallback((productId: string, field: string, value: any) => {
    setProducts((prev) => prev.map((product) => (product.id === productId ? { ...product, [field]: value } : product)));
  }, []);

  const updateProductTags = useCallback((productId: string, tagIds: string[]) => {
    setProductTags((prev) => {
      const newMap = new Map(prev);
      newMap.set(productId, tagIds);
      return newMap;
    });
  }, []);

  const updateAttributeValue = useCallback((productId: string, attributeId: string, field: string, value: any) => {
    setProductAttributes((prev) => {
      const newMap = new Map(prev);
      const attrs = newMap.get(productId) || [];
      const attrIndex = attrs.findIndex((a) => a.attribute_id === attributeId);

      if (attrIndex >= 0) {
        attrs[attrIndex] = { ...attrs[attrIndex], [field]: value };
      } else {
        attrs.push({ attribute_id: attributeId, product_id: productId, [field]: value });
      }

      newMap.set(productId, attrs);
      return newMap;
    });
  }, []);

  const bulkUpdateField = useCallback((field: string, value: any) => {
    setProducts((prev) => prev.map((product) => ({ ...product, [field]: value })));
  }, []);

  const bulkUpdateAttribute = useCallback(
    (attributeId: string, field: string, value: any) => {
      setProductAttributes((prev) => {
        const newMap = new Map(prev);
        products.forEach((product) => {
          const attrs = newMap.get(product.id) || [];
          const attrIndex = attrs.findIndex((a) => a.attribute_id === attributeId);

          if (attrIndex >= 0) {
            attrs[attrIndex] = { ...attrs[attrIndex], [field]: value };
          } else {
            attrs.push({ attribute_id: attributeId, product_id: product.id, [field]: value });
          }

          newMap.set(product.id, attrs);
        });
        return newMap;
      });
    },
    [products],
  );

  const getAttributeValue = useCallback(
    (productId: string, attributeId: string) => {
      const attrs = productAttributes.get(productId) || [];
      return attrs.find((a) => a.attribute_id === attributeId);
    },
    [productAttributes],
  );

  const getFilteredLevel2 = useCallback(
    (level1Id: string) => {
      return filterByCategoryId(level2Categories, level1Id);
    },
    [level2Categories],
  );

  const getFilteredLevel3 = useCallback(
    (level2Id: string) => {
      return filterBySubcategoryId(level3Categories, level2Id);
    },
    [level3Categories],
  );

  const getFilteredLevel4 = useCallback(
    (level3Id: string) => {
      return filterBySubSubcategoryId(level4Categories, level3Id);
    },
    [level4Categories],
  );

  // Sorted products
  const sortedProducts = useMemo(() => {
    const productsToSort = [...products];
    if (sortField === 'default') return productsToSort;

    return productsToSort.sort((a, b) => {
      switch (sortField) {
        case 'name_asc':
          return (a.product_name || '').localeCompare(b.product_name || '');
        case 'name_desc':
          return (b.product_name || '').localeCompare(a.product_name || '');
        case 'created_asc':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'created_desc':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'updated_asc':
          return new Date(a.updated_at || 0).getTime() - new Date(b.updated_at || 0).getTime();
        case 'updated_desc':
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        case 'stock_asc':
          return (a.stock_quantity || 0) - (b.stock_quantity || 0);
        case 'stock_desc':
          return (b.stock_quantity || 0) - (a.stock_quantity || 0);
        case 'price_asc':
          return (a.starting_price || 0) - (b.starting_price || 0);
        case 'price_desc':
          return (b.starting_price || 0) - (a.starting_price || 0);
        case 'category_asc': {
          const aCat = level1Categories.find((c) => c.id === a.category_id)?.name || '';
          const bCat = level1Categories.find((c) => c.id === b.category_id)?.name || '';
          return aCat.localeCompare(bCat);
        }
        case 'category_desc': {
          const aCat = level1Categories.find((c) => c.id === a.category_id)?.name || '';
          const bCat = level1Categories.find((c) => c.id === b.category_id)?.name || '';
          return bCat.localeCompare(aCat);
        }
        case 'brand_asc': {
          const aBrand = brands.find((b) => b.id === a.brand_id)?.name || '';
          const bBrand = brands.find((b) => b.id === b.brand_id)?.name || '';
          return aBrand.localeCompare(bBrand);
        }
        case 'brand_desc': {
          const aBrand = brands.find((b) => b.id === a.brand_id)?.name || '';
          const bBrand = brands.find((b) => b.id === b.brand_id)?.name || '';
          return bBrand.localeCompare(aBrand);
        }
        default:
          return 0;
      }
    });
  }, [products, sortField, level1Categories, brands]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Handle product updates
      const productUpdates = products.map((product) => ({
        id: product.id,
        updates: {
          product_name: product.product_name,
          starting_price: parseFloat(String(product.starting_price)),
          discounted_price: product.discounted_price ? parseFloat(String(product.discounted_price)) : null,
          stock_quantity: product.stock_quantity ? parseInt(String(product.stock_quantity)) : null,
          sku: product.sku,
          weight: product.weight ? parseFloat(String(product.weight)) : null,
          category_id: product.category_id,
          subcategory_id: product.subcategory_id,
          sub_subcategory_id: product.sub_subcategory_id,
          sub_sub_subcategory_id: product.sub_sub_subcategory_id,
          brand_id: product.brand_id,
          status: product.status || 'published',
        },
      }));

      const productsUpdateResult = await bulkUpdateProducts(productUpdates);
      if (isFailure(productsUpdateResult)) {
        throw productsUpdateResult.error;
      }

      // Handle attribute updates
      const allAttributeUpdates: any[] = [];
      const allAttributeInserts: any[] = [];

      for (const product of products) {
        const attrs = productAttributes.get(product.id) || [];
        for (const attr of attrs) {
          const updateData: any = {
            product_id: product.id,
            attribute_id: attr.attribute_id,
            value_text: attr.value_text || null,
            value_number: attr.value_number || null,
            value_boolean: attr.value_boolean || null,
            value_date: attr.value_date || null,
          };

          if (attr.id) {
            allAttributeUpdates.push({ ...updateData, id: attr.id });
          } else {
            allAttributeInserts.push(updateData);
          }
        }
      }

      // Handle attribute inserts
      if (allAttributeInserts.length > 0) {
        const insertResult = await bulkInsertAttributeValues(allAttributeInserts);
        if (isFailure(insertResult)) {
          throw insertResult.error;
        }
      }

      // Handle attribute updates
      if (allAttributeUpdates.length > 0) {
        const updateData = allAttributeUpdates.map((attr) => ({
          id: attr.id,
          value_text: attr.value_text,
          value_number: attr.value_number,
          value_boolean: attr.value_boolean,
          value_date: attr.value_date,
        }));

        const updateResult = await bulkUpdateAttributeValues(updateData);
        if (isFailure(updateResult)) {
          throw updateResult.error;
        }
      }

      // SAFE TAG HANDLING: Only delete/insert what actually changed
      for (const product of products) {
        const currentTags = productTags.get(product.id) || [];
        const initialTags = initialProductTags.get(product.id) || [];

        const currentSet = new Set(currentTags);
        const initialSet = new Set(initialTags);

        // Find tags to remove (in initial but not in current)
        const tagsToRemove = initialTags.filter((t) => !currentSet.has(t));
        // Find tags to add (in current but not in initial)
        const tagsToAdd = currentTags.filter((t) => !initialSet.has(t));

        // Only make changes if there's something to change
        if (tagsToRemove.length > 0 || tagsToAdd.length > 0) {
          const tagUpdateResult = await bulkUpdateProductTagsForProduct(product.id, tagsToRemove, tagsToAdd);

          if (isFailure(tagUpdateResult)) {
            throw tagUpdateResult.error;
          }
        }
      }

      toast.success(`Successfully updated ${products.length} products`);
      queryClient.invalidateQueries({ queryKey: ['master-products'] });
      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving products:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return {
    // State
    products,
    sortedProducts,
    loading,
    saving,
    visibleColumns,
    sortField,
    showUnsavedDialog,

    // Reference data
    level1Categories,
    level2Categories,
    level3Categories,
    level4Categories,
    brands,
    availableTags,

    // Attributes
    displayAttributes,
    allUniqueAttributes,
    productAttributes,
    productTags,

    // Actions
    setSortField,
    setShowUnsavedDialog,
    toggleColumn,
    toggleAttributeColumn,
    isAttributeVisible,
    updateProduct,
    updateProductTags,
    updateAttributeValue,
    bulkUpdateField,
    bulkUpdateAttribute,
    getAttributeValue,
    getFilteredLevel2,
    getFilteredLevel3,
    getFilteredLevel4,
    handleNavigateBack,
    handleConfirmClose,
    handleSave,
  };
};
