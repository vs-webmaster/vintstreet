/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, Upload, Package, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollToTopButtom } from '@/components/ScrollToTopButtom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchAttributesByCategoryLevels } from '@/lib/attributeUtils';
import { escapeCsv } from '@/lib/csvUtils';
import {
  groupAttributesByProduct,
  buildAttributeColumns,
  formatProductForExport,
  downloadCsv,
} from '@/lib/productExportUtils';
import {
  fetchAttributeValuesForProducts,
  fetchAttributeSubcategoriesBySubcategoryIds,
  fetchAttributeSubSubcategoriesBySubSubcategoryIds,
} from '@/services/attributes';
import { fetchCategories, fetchSubcategories, fetchSubSubcategories } from '@/services/categories';
import { fetchProductCountByStatus, fetchSoldProductsCount, fetchProductsForExport } from '@/services/products';
import { fetchSellerProfilesByShopNames } from '@/services/users';
import { isFailure } from '@/types/api';
import { CategoryTemplateGenerator } from './CategoryTemplateGenerator';
import { MasterProductsTable } from './MasterProductsTable';
import { MasterProductUpload } from './MasterProductUpload';
import { ProductEditModal } from './ProductEditModal';

export const MasterListingsTab = () => {
  const navigate = useNavigate();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [templateCategoryId, setTemplateCategoryId] = useState<string>('');
  const [templateSubcategoryId, setTemplateSubcategoryId] = useState<string>('');
  const [templateSubSubcategoryId, setTemplateSubSubcategoryId] = useState<string>('');
  const [uploadCategoryId, setUploadCategoryId] = useState<string>('');
  const [downloadCategoryId, setDownloadCategoryId] = useState<string>('');
  const [downloadSubcategoryId, setDownloadSubcategoryId] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const result = await fetchCategories();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  // Fetch subcategories based on selected category
  const { data: subcategories = [] } = useQuery({
    queryKey: ['product-subcategories', templateCategoryId],
    queryFn: async () => {
      if (!templateCategoryId) return [];
      const result = await fetchSubcategories(templateCategoryId);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!templateCategoryId,
  });

  // Fetch sub-subcategories based on selected subcategory
  const { data: subSubcategories = [] } = useQuery({
    queryKey: ['product-sub-subcategories', templateSubcategoryId],
    queryFn: async () => {
      if (!templateSubcategoryId || templateSubcategoryId === '__all__') return [];
      const result = await fetchSubSubcategories(templateSubcategoryId);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!templateSubcategoryId && templateSubcategoryId !== '__all__',
  });

  // Fetch system seller profile
  const { data: systemSeller } = useQuery({
    queryKey: ['system-seller'],
    queryFn: async () => {
      const result = await fetchSellerProfilesByShopNames(['VintStreet System']);
      if (isFailure(result)) throw result.error;
      return result.data.find((s) => s.shop_name === 'VintStreet System') || null;
    },
  });

  // Fetch product counts by status
  const { data: publishedCount = 0 } = useQuery({
    queryKey: ['listings-count-published'],
    queryFn: async () => {
      const result = await fetchProductCountByStatus('published');
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    staleTime: 0,
  });

  const { data: privateCount = 0 } = useQuery({
    queryKey: ['listings-count-private'],
    queryFn: async () => {
      const result = await fetchProductCountByStatus('private');
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    staleTime: 0,
  });

  const { data: draftCount = 0 } = useQuery({
    queryKey: ['listings-count-draft'],
    queryFn: async () => {
      const result = await fetchProductCountByStatus('draft');
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    staleTime: 0,
  });

  const { data: missingImagesCount = 0 } = useQuery({
    queryKey: ['listings-count-missing-images-all'],
    queryFn: async () => {
      const result = await fetchProductCountByStatus('missing-images');
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    staleTime: 0,
  });

  const { data: soldCount = 0 } = useQuery({
    queryKey: ['listings-count-sold'],
    queryFn: async () => {
      const result = await fetchSoldProductsCount();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    staleTime: 0,
  });

  // Fetch download subcategories
  const { data: downloadSubcategories = [] } = useQuery({
    queryKey: ['download-subcategories', downloadCategoryId],
    queryFn: async () => {
      if (!downloadCategoryId) return [];
      const result = await fetchSubcategories(downloadCategoryId);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!downloadCategoryId,
  });

  const templateCategory = categories.find((c) => c.id === templateCategoryId);

  // Helper function to convert data to CSV
  const convertToCSV = (data: unknown[]): string => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.map(escapeCsv).join(',')];
    data.forEach((row) => {
      csvRows.push(headers.map((h) => escapeCsv(row[h])).join(','));
    });

    return csvRows.join('\n');
  };

  const handleDownloadProducts = async () => {
    if (!downloadCategoryId) {
      toast.error('Please select a category');
      return;
    }

    setIsDownloading(true);
    try {
      // Fetch products
      const productsResult = await fetchProductsForExport({
        categoryId: downloadCategoryId,
        subcategoryId: downloadSubcategoryId,
      });

      if (isFailure(productsResult)) throw productsResult.error;
      const products = productsResult.data;

      if (!products || products.length === 0) {
        toast.error('No products found for this category');
        setIsDownloading(false);
        return;
      }

      // Fetch ALL attributes linked to the categories (level 2 and level 3)
      const uniqueSubcategoryIds = [...new Set(products.map((p) => p.subcategory_id).filter(Boolean))] as string[];
      const uniqueSubSubcategoryIds = [
        ...new Set(products.map((p) => p.sub_subcategory_id).filter(Boolean)),
      ] as string[];

      const uniqueAttributes = await fetchAttributesByCategoryLevels(uniqueSubcategoryIds, uniqueSubSubcategoryIds);

      // Fetch all product attribute values in batches to avoid query limits
      const productIds = products.map((p) => p.id);
      let attributeValues: unknown[] = [];

      // Batch size for .in() queries (Supabase limit is around 1000)
      const batchSize = 500;
      for (let i = 0; i < productIds.length; i += batchSize) {
        const batchIds = productIds.slice(i, i + batchSize);
        const attrResult = await fetchAttributeValuesForProducts(batchIds, 50000);

        if (isFailure(attrResult)) throw attrResult.error;
        if (attrResult.data) {
          attributeValues.push(...attrResult.data);
        }
      }

      // Group attributes by product
      const attributesByProduct = groupAttributesByProduct(attributeValues);

      // Format products for Excel
      const excelData = products.map((product) => {
        const productAttrs = attributesByProduct[product.id] || {};
        const attrColumns = buildAttributeColumns(productAttrs, uniqueAttributes);
        return formatProductForExport(product, attrColumns);
      });

      // Download as CSV
      const csvContent = convertToCSV(excelData);
      const categoryName = categories.find((c) => c.id === downloadCategoryId)?.name || 'category';
      const fileName = `products_${categoryName.toLowerCase().replace(/\s+/g, '_')}_${
        new Date().toISOString().split('T')[0]
      }.csv`;
      downloadCsv(csvContent, fileName);

      toast.success(`Downloaded ${products.length} products`);
      setIsDownloadDialogOpen(false);
      setDownloadCategoryId('');
      setDownloadSubcategoryId('');
    } catch (error: unknown) {
      console.error('Error downloading products:', error);
      toast.error('Failed to download products: ' + error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAllProducts = async () => {
    setIsDownloadingAll(true);
    try {
      // Fetch all products in batches
      const batchSize = 1000;
      let allProducts: unknown[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const batchResult = await fetchProductsForExport({
          limit: batchSize,
          offset,
        });

        if (isFailure(batchResult)) throw batchResult.error;
        const batch = batchResult.data;

        if (batch && batch.length > 0) {
          allProducts.push(...batch);
          offset += batchSize;
          hasMore = batch.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      if (allProducts.length === 0) {
        toast.error('No products found');
        setIsDownloadingAll(false);
        return;
      }

      // Fetch ALL attributes linked to all categories (level 2 and level 3)
      const uniqueSubcategoryIds = [...new Set(allProducts.map((p) => p.subcategory_id).filter(Boolean))];
      const uniqueSubSubcategoryIds = [...new Set(allProducts.map((p) => p.sub_subcategory_id).filter(Boolean))];

      let allAttributes: unknown[] = [];

      // Fetch level 3 attributes
      if (uniqueSubSubcategoryIds.length > 0) {
        const level3Result = await fetchAttributeSubSubcategoriesBySubSubcategoryIds(uniqueSubSubcategoryIds);
        if (isFailure(level3Result)) throw level3Result.error;
        if (level3Result.data) {
          allAttributes.push(...level3Result.data);
        }
      }

      // Fetch level 2 attributes
      if (uniqueSubcategoryIds.length > 0) {
        const level2Result = await fetchAttributeSubcategoriesBySubcategoryIds(uniqueSubcategoryIds);
        if (isFailure(level2Result)) throw level2Result.error;
        if (level2Result.data) {
          allAttributes.push(...level2Result.data);
        }
      }

      // Create a map of subcategory/sub-subcategory to their attributes
      const attributesByCategory: unknown = {};
      allAttributes.forEach((item: unknown) => {
        const categoryKey = item.sub_subcategory_id || item.subcategory_id;
        if (!attributesByCategory[categoryKey]) {
          attributesByCategory[categoryKey] = [];
        }
        if (item.attributes) {
          attributesByCategory[categoryKey].push(item.attributes);
        }
      });

      // Fetch all product attribute values for all products in batches
      const productIds = allProducts.map((p) => p.id);
      let attributeValues: unknown[] = [];

      // Batch size for .in() queries (Supabase limit is around 1000)
      const attrBatchSize = 500;
      for (let i = 0; i < productIds.length; i += attrBatchSize) {
        const batchIds = productIds.slice(i, i + attrBatchSize);
        const attrResult = await fetchAttributeValuesForProducts(batchIds, 50000);

        if (isFailure(attrResult)) throw attrResult.error;
        if (attrResult.data) {
          attributeValues.push(...attrResult.data);
        }
      }

      // Group attributes by product
      const attributesByProduct = groupAttributesByProduct(attributeValues);

      // Group products by subcategory
      const productsBySubcategory = allProducts.reduce((acc: unknown, product) => {
        const subcategoryName = product.product_subcategories?.name || 'Uncategorized';
        if (!acc[subcategoryName]) {
          acc[subcategoryName] = [];
        }
        acc[subcategoryName].push(product);
        return acc;
      }, {});

      // Create separate CSV files for each subcategory (combined into one with section headers)
      const products = allProducts;
      const csvSections: string[] = [];

      Object.entries(productsBySubcategory).forEach(([subcategoryName, products]: [string, any]) => {
        // Get all attributes for this group of products
        const relevantAttributes: unknown[] = [];
        const attributeMap = new Map();

        products.forEach((product: unknown) => {
          // Check level 3 first, then level 2
          const categoryKey = product.sub_subcategory_id || product.subcategory_id;
          const attrs = attributesByCategory[categoryKey] || [];
          attrs.forEach((attr: unknown) => {
            if (!attributeMap.has(attr.id)) {
              attributeMap.set(attr.id, attr);
              relevantAttributes.push(attr);
            }
          });
        });

        // Sort attributes by display_order
        relevantAttributes.sort((a: unknown, b: unknown) => (a.display_order || 0) - (b.display_order || 0));

        // Format products for CSV
        const excelData = products.map((product: unknown) => {
          const productAttrs = attributesByProduct[product.id] || {};
          const attrColumns = buildAttributeColumns(productAttrs, relevantAttributes);
          return formatProductForExport(product, attrColumns);
        });

        // Add section header and CSV data
        csvSections.push(`# SUBCATEGORY: ${subcategoryName}`);
        csvSections.push(convertToCSV(excelData));
        csvSections.push('');
      });

      // Combine all sections
      const csvContent = csvSections.join('\n');
      const fileName = `all_products_by_subcategory_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCsv(csvContent, fileName);

      toast.success(
        `Downloaded ${products.length} products across ${Object.keys(productsBySubcategory).length} subcategories`,
      );
    } catch (error: unknown) {
      console.error('Error downloading all products:', error);
      toast.error('Failed to download products: ' + error.message);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-3">
        <div className="flex items-center justify-end gap-2">
          <Button onClick={() => navigate('/admin/products/published')} variant="outline" size="sm">
            Published ({publishedCount})
          </Button>
          <Button onClick={() => navigate('/admin/products/sold')} variant="outline" size="sm">
            Sold ({soldCount})
          </Button>
          <Button onClick={() => navigate('/admin/products/draft')} variant="outline" size="sm">
            Draft ({draftCount})
          </Button>
          <Button onClick={() => navigate('/admin/products/private')} variant="outline" size="sm">
            Private ({privateCount})
          </Button>
          <Button onClick={() => navigate('/admin/products/missing-images')} variant="outline" size="sm">
            Missing Images ({missingImagesCount})
          </Button>
          <Button onClick={() => navigate('/admin/products/archived')} variant="outline" size="sm">
            Archived
          </Button>
          <Button onClick={() => setIsDownloadDialogOpen(true)} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download by Category
          </Button>
          <Button onClick={handleDownloadAllProducts} variant="outline" size="sm" disabled={isDownloadingAll}>
            <Download className="mr-2 h-4 w-4" />
            {isDownloadingAll ? 'Downloading...' : 'Download All Products'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Products
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsAddProductModalOpen(true)}>
                <Package className="mr-2 h-4 w-4" />
                Add Single Product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsTemplateDialogOpen(true)}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsUploadModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Products
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {!systemSeller && (
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-950">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              <strong>Note:</strong> System seller profile not found. Products will be created under your account.
            </p>
          </div>
        )}
      </Card>

      {/* Template Dialog */}
      <Dialog
        open={isTemplateDialogOpen}
        onOpenChange={(open) => {
          setIsTemplateDialogOpen(open);
          if (!open) {
            setTemplateCategoryId('');
            setTemplateSubcategoryId('');
            setTemplateSubSubcategoryId('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Download Product Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category *</label>
              <Select
                value={templateCategoryId}
                onValueChange={(value) => {
                  setTemplateCategoryId(value);
                  setTemplateSubcategoryId('');
                  setTemplateSubSubcategoryId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {templateCategoryId && subcategories.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Subcategory (Optional)</label>
                <Select
                  value={templateSubcategoryId}
                  onValueChange={(value) => {
                    setTemplateSubcategoryId(value);
                    setTemplateSubSubcategoryId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All subcategories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Subcategories</SelectItem>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {templateSubcategoryId && templateSubcategoryId !== '__all__' && subSubcategories.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Sub-Subcategory (Optional)</label>
                <Select value={templateSubSubcategoryId} onValueChange={setTemplateSubSubcategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All sub-subcategories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Sub-Subcategories</SelectItem>
                    {subSubcategories.map((subSub) => (
                      <SelectItem key={subSub.id} value={subSub.id}>
                        {subSub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <CategoryTemplateGenerator
                categoryId={templateCategoryId}
                subcategoryId={templateSubcategoryId === '__all__' ? undefined : templateSubcategoryId}
                subSubcategoryId={templateSubSubcategoryId === '__all__' ? undefined : templateSubSubcategoryId}
                categoryName={templateCategory?.name}
                disabled={!templateCategoryId}
                onSuccess={() => {
                  setIsTemplateDialogOpen(false);
                  setTemplateCategoryId('');
                  setTemplateSubcategoryId('');
                  setTemplateSubSubcategoryId('');
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog
        open={isUploadModalOpen}
        onOpenChange={(open) => {
          setIsUploadModalOpen(open);
          if (!open) setUploadCategoryId('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Category for Upload</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Category</label>
              <Select value={uploadCategoryId} onValueChange={setUploadCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setIsUploadModalOpen(false)} disabled={!uploadCategoryId} className="w-full">
              Continue to Upload
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MasterProductsTable systemSellerId={systemSeller?.user_id} />

      {uploadCategoryId && (
        <MasterProductUpload
          isOpen={!isUploadModalOpen && !!uploadCategoryId}
          onClose={() => setUploadCategoryId('')}
          categoryId={uploadCategoryId}
          systemSellerId={systemSeller?.user_id}
        />
      )}

      <ProductEditModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onSave={() => {
          setIsAddProductModalOpen(false);
        }}
        sellerId={systemSeller?.user_id}
      />

      {/* Download Products Dialog */}
      <Dialog
        open={isDownloadDialogOpen}
        onOpenChange={(open) => {
          setIsDownloadDialogOpen(open);
          if (!open) {
            setDownloadCategoryId('');
            setDownloadSubcategoryId('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Download Products by Category</DialogTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Select a category to download all products with their attributes as an Excel file.
            </p>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Category (Level 1) *</Label>
              <Select
                value={downloadCategoryId || undefined}
                onValueChange={(value) => {
                  setDownloadCategoryId(value);
                  setDownloadSubcategoryId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories && categories.length > 0 ? (
                    categories.map((cat: unknown) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">No categories available</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {downloadCategoryId && downloadSubcategories && downloadSubcategories.length > 0 && (
              <div>
                <Label>Subcategory (Level 2) - Optional</Label>
                <Select
                  value={downloadSubcategoryId || undefined}
                  onValueChange={(value) => setDownloadSubcategoryId(value || '')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All subcategories" />
                  </SelectTrigger>
                  <SelectContent>
                    {downloadSubcategories.map((subcat: unknown) => (
                      <SelectItem key={subcat.id} value={subcat.id}>
                        {subcat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDownloadDialogOpen(false);
                  setDownloadCategoryId('');
                  setDownloadSubcategoryId('');
                }}
                disabled={isDownloading}
              >
                Cancel
              </Button>
              <Button onClick={handleDownloadProducts} disabled={!downloadCategoryId || isDownloading}>
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? 'Downloading...' : 'Download'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ScrollToTopButtom />
    </div>
  );
};
