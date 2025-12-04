import React, { useState } from 'react';
import { Download, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { fetchAllAttributesWithOptions, saveProductAttributeValues } from '@/services/attributes';
import { fetchBrands } from '@/services/brands';
import {
  fetchCategories,
  fetchAllSubcategories,
  fetchAllSubSubcategories,
  fetchAllSubSubSubcategories,
} from '@/services/categories';
import { createProduct } from '@/services/products';
import { isFailure } from '@/types/api';
import type { ExcelRowData, FailedRow } from '@/types/common';
import type { Attribute } from '@/services/attributes/attributeService';

interface BulkProductUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsAdded: () => void;
}

export const BulkProductUpload: React.FC<BulkProductUploadProps> = ({ isOpen, onClose, onProductsAdded }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number } | null>(null);
  const [failedRows, setFailedRows] = useState<FailedRow[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const downloadTemplate = async () => {
    try {
      // Fetch reference data for the template
      const [categoriesResult, brandsResult] = await Promise.all([fetchCategories(), fetchBrands({ isActive: true })]);

      if (isFailure(categoriesResult)) throw categoriesResult.error;
      if (isFailure(brandsResult)) throw brandsResult.error;

      const categoriesRes = { data: categoriesResult.data };
      const brandsRes = { data: brandsResult.data };

      // Create template data with instructions
      const templateData = [
        {
          product_name: 'Example Product Name',
          starting_price: 29.99,
          product_description: 'Example product description',
          excerpt: 'Short product excerpt for listings (150-200 chars)',
          stock_quantity: 10,
          sku: 'PROD-12345',
          stock_id: 'STOCK-67890',
          slug: 'example-product-name',
          weight: 1.5,
          length: 10,
          width: 8,
          height: 5,
          meta_title: 'SEO optimized product title (50-60 chars)',
          meta_description: 'SEO optimized description for search engines (150-160 chars)',
          category_name: 'Select from Categories sheet',
          brand_name: 'Select from Brands sheet (optional)',
          offers_enabled: 'TRUE or FALSE (default: TRUE)',
        },
      ];

      // Create reference sheets
      const categoriesData = (categoriesRes.data || []).map((c) => ({ category_name: c.name, category_id: c.id }));
      const brandsData = (brandsRes.data || []).map((b) => ({ brand_name: b.name, brand_id: b.id }));

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add main template sheet
      const ws = XLSX.utils.json_to_sheet(templateData);
      XLSX.utils.book_append_sheet(wb, ws, 'Products');

      // Add reference sheets
      if (categoriesData.length > 0) {
        const catSheet = XLSX.utils.json_to_sheet(categoriesData);
        XLSX.utils.book_append_sheet(wb, catSheet, 'Categories');
      }
      if (brandsData.length > 0) {
        const brandSheet = XLSX.utils.json_to_sheet(brandsData);
        XLSX.utils.book_append_sheet(wb, brandSheet, 'Brands');
      }

      // Download file
      XLSX.writeFile(wb, 'product_upload_template.xlsx');

      toast({
        title: 'Template downloaded',
        description: 'Fill in the template and upload it to add products in bulk',
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: 'Error',
        description: 'Failed to download template. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResults(null);
    setFailedRows([]);
    setUploadProgress({ current: 0, total: 0 });

    try {
      // Read the file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRowData[];

      if (jsonData.length === 0) {
        toast({
          title: 'Empty file',
          description: 'The uploaded file contains no products',
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }

      // Get current user
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to upload products',
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }

      // Fetch reference data for lookups
      const [
        categoriesResult,
        brandsResult,
        subcategoriesRes,
        subSubcategoriesRes,
        subSubSubcategoriesRes,
        attributesRes,
      ] = await Promise.all([
        fetchCategories(),
        fetchBrands({}),
        fetchAllSubcategories(),
        fetchAllSubSubcategories(),
        fetchAllSubSubSubcategories(),
        fetchAllAttributesWithOptions(),
      ]);

      if (isFailure(categoriesResult)) throw categoriesResult.error;
      if (isFailure(brandsResult)) throw brandsResult.error;

      const categories = categoriesResult.data || [];
      const brands = brandsResult.data || [];
      const subcategories = subcategoriesRes.success ? subcategoriesRes.data || [] : [];
      const subSubcategories = subSubcategoriesRes.success ? subSubcategoriesRes.data || [] : [];
      const subSubSubcategories = subSubSubcategoriesRes.success ? subSubSubcategoriesRes.data || [] : [];
      const attributes = attributesRes.success ? attributesRes.data || [] : [];

      // Build category map
      const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
      const brandMap = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]));

      // Build subcategory map with parent validation
      const subcategoryMap = new Map<string, { id: string; categoryId: string }>();
      subcategories.forEach((s) => {
        const categoryName = categories.find((c) => c.id === s.category_id)?.name?.toLowerCase();
        if (categoryName) {
          // Store with composite key: "category|subcategory"
          const compositeKey = `${categoryName}|${s.name.toLowerCase()}`;
          subcategoryMap.set(compositeKey, { id: s.id, categoryId: s.category_id });
        }
      });

      // Build sub-subcategory map with parent validation
      const subSubcategoryMap = new Map<string, { id: string; subcategoryId: string }>();
      subSubcategories.forEach((s) => {
        const subcategory = subcategories.find((sub) => sub.id === s.subcategory_id);
        if (subcategory) {
          const categoryName = categories.find((c) => c.id === subcategory.category_id)?.name?.toLowerCase();
          if (categoryName) {
            // Store with composite key: "category|subcategory|sub_subcategory"
            const compositeKey = `${categoryName}|${subcategory.name.toLowerCase()}|${s.name.toLowerCase()}`;
            subSubcategoryMap.set(compositeKey, { id: s.id, subcategoryId: s.subcategory_id });
          }
        }
      });

      // Build sub-sub-subcategory map with parent validation
      const subSubSubcategoryMap = new Map<string, { id: string; subSubcategoryId: string }>();
      subSubSubcategories.forEach((s) => {
        const subSubcategory = subSubcategories.find((subsub) => subsub.id === s.sub_subcategory_id);
        if (subSubcategory) {
          const subcategory = subcategories.find((sub) => sub.id === subSubcategory.subcategory_id);
          if (subcategory) {
            const categoryName = categories.find((c) => c.id === subcategory.category_id)?.name?.toLowerCase();
            if (categoryName) {
              // Store with composite key: "category|subcategory|sub_subcategory|sub_sub_subcategory"
              const compositeKey = `${categoryName}|${subcategory.name.toLowerCase()}|${subSubcategory.name.toLowerCase()}|${s.name.toLowerCase()}`;
              subSubSubcategoryMap.set(compositeKey, { id: s.id, subSubcategoryId: s.sub_subcategory_id });
            }
          }
        }
      });

      const attributesMap = new Map(attributes.map((a) => [a.name.toLowerCase(), a]));

      // Process each row
      let successCount = 0;
      let failedCount = 0;
      const failedItems: FailedRow[] = [];

      // Set total for progress tracking
      const totalRows = jsonData.length;
      setUploadProgress({ current: 0, total: totalRows });

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        try {
          // Skip example rows
          if (row.product_name === 'Example Product Name') continue;

          // Validate required fields
          if (!row.product_name || !row.starting_price) {
            failedItems.push({ ...row, error_reason: 'Missing required fields (product_name or starting_price)' });
            failedCount++;
            continue;
          }

          const price = parseFloat(row.starting_price);
          if (isNaN(price) || price <= 0) {
            failedItems.push({ ...row, error_reason: 'Invalid price value' });
            failedCount++;
            continue;
          }

          // Lookup IDs from names with parent hierarchy validation
          const categoryId = row.category_name ? categoryMap.get(row.category_name.toLowerCase()) : null;
          const brandId = row.brand_name ? brandMap.get(row.brand_name.toLowerCase()) : null;

          let subcategoryId = null;
          let subSubcategoryId = null;
          let subSubSubcategoryId = null;

          // Lookup subcategory with category parent
          if (row.category_name && row.subcategory_name) {
            const compositeKey = `${row.category_name.toLowerCase()}|${row.subcategory_name.toLowerCase()}`;
            const subcat = subcategoryMap.get(compositeKey);
            if (subcat) {
              subcategoryId = subcat.id;
            } else {
              failedItems.push({
                ...row,
                error_reason: `Subcategory "${row.subcategory_name}" not found under category "${row.category_name}"`,
              });
              failedCount++;
              continue;
            }
          }

          // Lookup sub-subcategory with full parent hierarchy
          if (row.category_name && row.subcategory_name && row.sub_subcategory_name) {
            const compositeKey = `${row.category_name.toLowerCase()}|${row.subcategory_name.toLowerCase()}|${row.sub_subcategory_name.toLowerCase()}`;
            const subsubcat = subSubcategoryMap.get(compositeKey);
            if (subsubcat) {
              subSubcategoryId = subsubcat.id;
            }
          }

          // Lookup sub-sub-subcategory with full parent hierarchy
          if (row.category_name && row.subcategory_name && row.sub_subcategory_name && row.sub_sub_subcategory_name) {
            const compositeKey = `${row.category_name.toLowerCase()}|${row.subcategory_name.toLowerCase()}|${row.sub_subcategory_name.toLowerCase()}|${row.sub_sub_subcategory_name.toLowerCase()}`;
            const subsubsubcat = subSubSubcategoryMap.get(compositeKey);
            if (subsubsubcat) {
              subSubSubcategoryId = subsubsubcat.id;
            }
          }

          // Parse boolean values
          const offersEnabled = row.offers_enabled?.toString().toUpperCase() !== 'FALSE';

          // Normalize and validate status
          const rawStatus = row.status?.trim().toLowerCase() || 'published';
          const validStatuses = ['published', 'draft', 'private'];
          const status = validStatuses.includes(rawStatus) ? rawStatus : 'published';

          // Create listing using service
          const productResult = await createProduct({
            product_name: row.product_name.trim(),
            starting_price: price,
            product_description: row.product_description?.trim() || null,
            excerpt: row.excerpt?.trim() || null,
            stock_quantity: row.stock_quantity ? parseInt(row.stock_quantity) : null,
            sku: row.sku ? String(row.sku).trim() : null,
            stock_id: row.stock_id ? String(row.stock_id).trim() : null,
            slug: row.slug ? String(row.slug).trim() : null,
            weight: row.weight ? parseFloat(row.weight) : null,
            length: row.length ? parseFloat(row.length) : null,
            width: row.width ? parseFloat(row.width) : null,
            height: row.height ? parseFloat(row.height) : null,
            meta_title: row.meta_title?.trim() || null,
            meta_description: row.meta_description?.trim() || null,
            category_id: categoryId || null,
            subcategory_id: subcategoryId,
            sub_subcategory_id: subSubcategoryId,
            sub_sub_subcategory_id: subSubSubcategoryId,
            brand_id: brandId || null,
            offers_enabled: offersEnabled,
            stream_id: 'bulk-upload',
            seller_id: user.id,
            product_type: 'shop',
            status: status,
          });

          if (isFailure(productResult)) {
            console.error('Error inserting product:', productResult.error, row);
            failedItems.push({ ...row, error_reason: `Database error: ${productResult.error.message}` });
            failedCount++;
          } else {
            const insertedProduct = productResult.data;
            // Save product attributes if any exist in the row
            const attributeValues: Array<{
              product_id: string;
              attribute_id: string;
              value_text: string | null;
              value_number: number | null;
              value_boolean: boolean | null;
              value_date: string | null;
            }> = [];

            for (const [key, value] of Object.entries(row)) {
              // Check if this column name matches an attribute
              const attribute = attributesMap.get(key.toLowerCase()) as Attribute | undefined;

              if (attribute && value !== null && value !== undefined && value !== '') {
                const valueObj: {
                  product_id: string;
                  attribute_id: string;
                  value_text: string | null;
                  value_number: number | null;
                  value_boolean: boolean | null;
                  value_date: string | null;
                } = {
                  product_id: insertedProduct.id,
                  attribute_id: attribute.id,
                  value_text: null,
                  value_number: null,
                  value_boolean: null,
                  value_date: null,
                };

                switch (attribute.data_type) {
                  case 'multi-select': {
                    // Handle comma-separated values for multi-select with safe conversion
                    const multiValues = String(value)
                      .split(',')
                      .map((v: string) => v.trim())
                      .filter(Boolean);
                    if (multiValues.length > 0) {
                      valueObj.value_text = JSON.stringify(multiValues);
                    }
                    break;
                  }
                  case 'string':
                  case 'textarea':
                    valueObj.value_text = String(value).trim();
                    break;
                  case 'number': {
                    const numValue = parseFloat(String(value));
                    if (!isNaN(numValue)) {
                      valueObj.value_number = numValue;
                    }
                    break;
                  }
                  case 'boolean':
                    valueObj.value_boolean = String(value).toUpperCase() === 'TRUE';
                    break;
                  case 'date':
                    valueObj.value_date = String(value);
                    break;
                }

                attributeValues.push(valueObj);
              }
            }

            // Insert all attribute values for this product
            if (attributeValues.length > 0) {
              const attrResult = await saveProductAttributeValues(insertedProduct.id, attributeValues);

              if (isFailure(attrResult)) {
                console.error('Error inserting attributes for product:', insertedProduct.id, attrResult.error);
              }
            }

            successCount++;
          }
        } catch (error) {
          console.error('Error processing row:', error, row);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          failedItems.push({ ...row, error_reason: `Processing error: ${errorMessage}` });
          failedCount++;
        }

        // Update progress after each row
        setUploadProgress({ current: i + 1, total: totalRows });
      }

      setFailedRows(failedItems);
      setUploadResults({ success: successCount, failed: failedCount });

      if (successCount > 0) {
        toast({
          title: 'Upload complete',
          description: `Successfully added ${successCount} product${successCount !== 1 ? 's' : ''}${
            failedCount > 0 ? `, ${failedCount} failed` : ''
          }`,
        });
        onProductsAdded();
      } else {
        toast({
          title: 'Upload failed',
          description: 'No products were added. Please check your file and try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: "Failed to process file. Please ensure it's a valid Excel file.",
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const downloadFailedItems = () => {
    if (failedRows.length === 0) return;

    // Create workbook with failed items
    const ws = XLSX.utils.json_to_sheet(failedRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Failed Items');

    // Download file
    XLSX.writeFile(wb, `failed_products_${new Date().getTime()}.xlsx`);
    toast({
      title: 'Download complete',
      description: 'Failed items have been downloaded',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Product Upload
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Download the template, fill in your products, then upload the completed file. Required fields:
              product_name and starting_price.
            </AlertDescription>
          </Alert>

          {/* Download Template */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Step 1: Download Template</h3>
            <Button onClick={downloadTemplate} variant="outline" className="w-full" disabled={isUploading}>
              <Download className="mr-2 h-4 w-4" />
              Download Excel Template
            </Button>
          </div>

          {/* Upload File */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Step 2: Upload Completed File</h3>
            <div className="relative">
              <Button variant="default" className="w-full" disabled={isUploading} asChild>
                <label className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Upload Excel File'}
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
          </div>

          {isUploading && uploadProgress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing products...</span>
                <span className="font-medium">
                  {uploadProgress.current} of {uploadProgress.total}
                </span>
              </div>
              <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
            </div>
          )}

          {/* Results */}
          {uploadResults && (
            <Alert
              className={
                uploadResults.success > 0 ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : ''
              }
            >
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Upload Results:</p>
                  <p className="text-sm">✓ Successfully added: {uploadResults.success} products</p>
                  {uploadResults.failed > 0 && (
                    <>
                      <p className="text-sm text-destructive">✗ Failed: {uploadResults.failed} products</p>
                      <Button onClick={downloadFailedItems} variant="outline" size="sm" className="mt-2">
                        <Download className="mr-2 h-4 w-4" />
                        Download Failed Items
                      </Button>
                    </>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Close Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
