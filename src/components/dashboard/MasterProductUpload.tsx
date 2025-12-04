import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { escapeCsv } from '@/lib/csvUtils';
import { downloadCsv } from '@/lib/productExportUtils';
import {
  saveProductAttributeValues,
  fetchAttributeCategoriesByCategoryId,
  fetchAttributeSubcategoriesBySubcategoryIds,
  fetchAttributeSubSubcategoriesBySubSubcategoryIds,
} from '@/services/attributes';
import { fetchBrands } from '@/services/brands';
import { fetchSubcategories, fetchAllSubSubcategories, fetchAllSubSubSubcategories } from '@/services/categories';
import { createProduct } from '@/services/products/productService';
import { isFailure } from '@/types/api';

interface MasterProductUploadProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  systemSellerId?: string;
}

export const MasterProductUpload = ({ isOpen, onClose, categoryId, systemSellerId }: MasterProductUploadProps) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number } | null>(null);
  const [failedRows, setFailedRows] = useState<unknown[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const queryClient = useQueryClient();

  // Helper function to parse CSV
  const parseCsv = (text: string): unknown[] => {
    const lines = text.split('\n').filter((line) => line.trim() && !line.trim().startsWith('#'));
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows: unknown[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values: string[] = [];
      let currentValue = '';
      let insideQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const nextChar = line[j + 1];

        if (char === '"' && nextChar === '"') {
          currentValue += '"';
          j++; // Skip next quote
        } else if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      const row: unknown = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return rows;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResults(null);
    setFailedRows([]);
    setUploadProgress({ current: 0, total: 0 });

    try {
      // Read the CSV file
      const text = await file.text();
      const jsonData = parseCsv(text);

      if (jsonData.length === 0) {
        toast.error('The uploaded file contains no products');
        setIsUploading(false);
        return;
      }

      // Get seller ID (system seller or current user)
      if (!user) {
        toast.error('Please log in to upload products');
        setIsUploading(false);
        return;
      }

      const sellerId = systemSellerId || user.id;

      // Fetch reference data
      const [subcategoriesResult, subSubcategoriesResult, subSubSubcategoriesResult, brandsResult] = await Promise.all([
        fetchSubcategories(categoryId),
        fetchAllSubSubcategories(),
        fetchAllSubSubSubcategories(),
        fetchBrands(),
      ]);

      if (
        isFailure(subcategoriesResult) ||
        isFailure(subSubcategoriesResult) ||
        isFailure(subSubSubcategoriesResult) ||
        isFailure(brandsResult)
      ) {
        toast.error('Failed to fetch reference data');
        setIsUploading(false);
        return;
      }

      const subcategoriesRes = { data: subcategoriesResult.data || [] };
      const subSubcategoriesRes = { data: subSubcategoriesResult.data || [] };
      const subSubSubcategoriesRes = { data: subSubSubcategoriesResult.data || [] };
      const brandsRes = { data: brandsResult.data || [] };

      // Build subcategory map (category already filtered in query)
      const subcategoryMap = new Map((subcategoriesRes.data || []).map((s) => [s.name.toLowerCase().trim(), s.id]));

      // Build sub-subcategory map with parent validation
      const subSubcategoryMap = new Map<string, string>();
      (subSubcategoriesRes.data || []).forEach((s) => {
        const subcategory = (subcategoriesRes.data || []).find((sub) => sub.id === s.subcategory_id);
        if (subcategory) {
          // Store with composite key: "subcategory|sub_subcategory"
          const compositeKey = `${subcategory.name.toLowerCase().trim()}|${s.name.toLowerCase().trim()}`;
          subSubcategoryMap.set(compositeKey, s.id);
        }
      });

      // Build sub-sub-subcategory map with parent validation
      const subSubSubcategoryMap = new Map<string, string>();
      (subSubSubcategoriesRes.data || []).forEach((s) => {
        const subSubcategory = (subSubcategoriesRes.data || []).find((subsub) => subsub.id === s.sub_subcategory_id);
        if (subSubcategory) {
          const subcategory = (subcategoriesRes.data || []).find((sub) => sub.id === subSubcategory.subcategory_id);
          if (subcategory) {
            // Store with composite key: "subcategory|sub_subcategory|sub_sub_subcategory"
            const compositeKey = `${subcategory.name.toLowerCase().trim()}|${subSubcategory.name
              .toLowerCase()
              .trim()}|${s.name.toLowerCase().trim()}`;
            subSubSubcategoryMap.set(compositeKey, s.id);
          }
        }
      });

      const brandMap = new Map((brandsRes.data || []).map((b) => [b.name.toLowerCase().trim(), b.id]));

      // Fetch all attributes for categories, subcategories and sub-subcategories
      const attributesByCategory = new Map<string, unknown[]>();
      const attributesBySubcategory = new Map<string, unknown[]>();
      const attributesBySubSubcategory = new Map<string, unknown[]>();
      const attributeOptionsMap = new Map<string, Map<string, string>>();

      // Fetch attributes for the category (level 1)
      const catAttrResult = await fetchAttributeCategoriesByCategoryId(categoryId);
      if (isFailure(catAttrResult)) {
        toast.error('Failed to fetch category attributes');
        setIsUploading(false);
        return;
      }

      const catAttrs = (catAttrResult.data || []).map((link) => link.attributes).filter(Boolean);
      attributesByCategory.set(categoryId, catAttrs);

      // Build option maps for category attributes
      catAttrs.forEach((attr: unknown) => {
        if (!attributeOptionsMap.has(attr.id)) {
          const optionMap = new Map<string, string>();
          (attr.attribute_options || []).forEach((opt: unknown) => {
            optionMap.set(opt.value.toLowerCase().trim(), opt.id);
          });
          attributeOptionsMap.set(attr.id, optionMap);
        }
      });

      // Fetch attributes for all subcategories at once
      const subcategoryIds = (subcategoriesRes.data || []).map((s) => s.id);
      if (subcategoryIds.length > 0) {
        const subAttrResult = await fetchAttributeSubcategoriesBySubcategoryIds(subcategoryIds);
        if (isFailure(subAttrResult)) {
          toast.error('Failed to fetch subcategory attributes');
          setIsUploading(false);
          return;
        }

        // Group attributes by subcategory_id
        const subAttrMap = new Map<string, unknown[]>();
        (subAttrResult.data || []).forEach((link) => {
          if (link.attributes && link.subcategory_id) {
            if (!subAttrMap.has(link.subcategory_id)) {
              subAttrMap.set(link.subcategory_id, []);
            }
            subAttrMap.get(link.subcategory_id)!.push(link.attributes);
          }
        });

        subAttrMap.forEach((attrs, subId) => {
          attributesBySubcategory.set(subId, attrs);
          // Build option maps for this subcategory
          attrs.forEach((attr: unknown) => {
            const optionMap = new Map<string, string>();
            (attr.attribute_options || []).forEach((opt: unknown) => {
              optionMap.set(opt.value.toLowerCase().trim(), opt.id);
            });
            attributeOptionsMap.set(attr.id, optionMap);
          });
        });
      }

      // Fetch attributes for all sub-subcategories at once
      const subSubcategoryIds = (subSubcategoriesRes.data || []).map((s) => s.id);
      if (subSubcategoryIds.length > 0) {
        const subSubAttrResult = await fetchAttributeSubSubcategoriesBySubSubcategoryIds(subSubcategoryIds);
        if (isFailure(subSubAttrResult)) {
          toast.error('Failed to fetch sub-subcategory attributes');
          setIsUploading(false);
          return;
        }

        // Group attributes by sub_subcategory_id
        const subSubAttrMap = new Map<string, unknown[]>();
        (subSubAttrResult.data || []).forEach((link) => {
          if (link.attributes && link.sub_subcategory_id) {
            if (!subSubAttrMap.has(link.sub_subcategory_id)) {
              subSubAttrMap.set(link.sub_subcategory_id, []);
            }
            subSubAttrMap.get(link.sub_subcategory_id)!.push(link.attributes);
          }
        });

        subSubAttrMap.forEach((attrs, subSubId) => {
          attributesBySubSubcategory.set(subSubId, attrs);
          // Build option maps for these attributes as well
          attrs.forEach((attr: unknown) => {
            if (!attributeOptionsMap.has(attr.id)) {
              const optionMap = new Map<string, string>();
              (attr.attribute_options || []).forEach((opt: unknown) => {
                optionMap.set(opt.value.toLowerCase().trim(), opt.id);
              });
              attributeOptionsMap.set(attr.id, optionMap);
            }
          });
        });
      }

      let successCount = 0;
      let failedCount = 0;
      const failedItems: unknown[] = [];

      // Set total for progress tracking
      const totalRows = jsonData.length;
      setUploadProgress({ current: 0, total: totalRows });

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as unknown;
        try {
          // Skip example rows
          if (row.product_name === 'Example Product') continue;

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

          // Lookup IDs with parent hierarchy validation (subcategory is now optional)
          let subcategoryId = null;
          if (row.subcategory_name) {
            subcategoryId = subcategoryMap.get(row.subcategory_name.toLowerCase().trim());
            if (!subcategoryId) {
              failedItems.push({ ...row, error_reason: `Invalid subcategory: ${row.subcategory_name}` });
              failedCount++;
              continue;
            }
          }

          // Lookup sub-subcategory with parent hierarchy (only if subcategory exists)
          let subSubcategoryId = null;
          if (subcategoryId && row.sub_subcategory_name) {
            const compositeKey = `${row.subcategory_name.toLowerCase().trim()}|${row.sub_subcategory_name
              .toLowerCase()
              .trim()}`;
            subSubcategoryId = subSubcategoryMap.get(compositeKey);
          }

          // Lookup sub-sub-subcategory with full parent hierarchy (only if sub-subcategory exists)
          let subSubSubcategoryId = null;
          if (subcategoryId && subSubcategoryId && row.sub_subcategory_name && row.sub_sub_subcategory_name) {
            const compositeKey = `${row.subcategory_name.toLowerCase().trim()}|${row.sub_subcategory_name
              .toLowerCase()
              .trim()}|${row.sub_sub_subcategory_name.toLowerCase().trim()}`;
            subSubSubcategoryId = subSubSubcategoryMap.get(compositeKey);
          }

          const brandId = row.brand_name ? brandMap.get(row.brand_name.toLowerCase().trim()) : null;

          // Normalize and validate status
          const rawStatus = row.status?.trim().toLowerCase() || 'published';
          const validStatuses = ['published', 'draft', 'private'];
          const status = validStatuses.includes(rawStatus) ? rawStatus : 'published';

          const offersEnabled = row.offers_enabled?.toString().toUpperCase() !== 'FALSE';

          // Handle product images (support both semicolon and comma separators for flexibility)
          const thumbnail = row.thumbnail?.toString().trim() || null;
          const productImages = row.product_images
            ? row.product_images
                .toString()
                .split(/[;,]/)
                .map((url: string) => url.trim())
                .filter(Boolean)
            : [];

          // Helper matchers for flexible column detection
          const normalize = (s: unknown) =>
            String(s || '')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '');
          const getAttrAliases = (name: string) => {
            const base = normalize(name);
            const aliases = new Set<string>([base]);
            if (base.includes('colour') || base.includes('color')) {
              aliases.add('color');
              aliases.add('colour');
            }
            if (base.includes('regionofmanufacture')) {
              aliases.add('madein');
              aliases.add('countryoforigin');
              aliases.add('origin');
            }
            if (base.includes('material')) {
              aliases.add('material');
            }
            return Array.from(aliases);
          };

          // Allow multiple header variants for Level 4 category
          const level4Key = Object.keys(row).find((k) => {
            const nk = normalize(k);
            return nk === 'subsubsubcategoryname' || nk === 'level4category' || nk === 'levelfourcategory';
          });
          const level4Name = level4Key ? String(row[level4Key]) : null;
          // Create listing
          const productResult = await createProduct({
            product_name: row.product_name.trim(),
            starting_price: price,
            product_description: row.product_description?.trim() || null,
            excerpt: row.excerpt?.trim() || null,
            stock_quantity: row.stock_quantity ? parseInt(row.stock_quantity) : null,
            discounted_price: row.discounted_price ? parseFloat(row.discounted_price) : null,
            sku: row.sku ? String(row.sku).trim() : null,
            stock_id: row.stock_id ? String(row.stock_id).trim() : null,
            weight: row.weight ? parseFloat(row.weight) : null,
            length: row.length ? parseFloat(row.length) : null,
            width: row.width ? parseFloat(row.width) : null,
            height: row.height ? parseFloat(row.height) : null,
            meta_title: row.meta_title?.trim() || null,
            meta_description: row.meta_description?.trim() || null,
            thumbnail: thumbnail,
            product_images: productImages,
            slug: row.slug ? String(row.slug).trim() : null,
            category_id: categoryId,
            subcategory_id: subcategoryId,
            sub_subcategory_id: subSubcategoryId,
            sub_sub_subcategory_id: subSubSubcategoryId,
            brand_id: brandId,
            status: status,
            offers_enabled: offersEnabled,
            stream_id: 'master-catalog',
            seller_id: sellerId,
            product_type: 'shop',
          });

          if (isFailure(productResult)) {
            console.error('Error creating product:', productResult.error, row);
            failedItems.push({
              ...row,
              error_reason: `Database error: ${productResult.error.message || 'Unknown error'}`,
            });
            failedCount++;
            continue;
          }

          const listing = productResult.data;

          // Process dynamic attributes
          // Priority: sub-subcategory > subcategory > category
          const catAttrs = attributesByCategory.get(categoryId) || [];
          const subcatAttrs = subcategoryId ? attributesBySubcategory.get(subcategoryId) || [] : [];
          const subSubcatAttrs = subSubcategoryId ? attributesBySubSubcategory.get(subSubcategoryId) || [] : [];

          // Deduplicate by attribute id, prioritizing deeper levels
          const uniqueAttrMap = new Map<string, unknown>();
          [...catAttrs, ...subcatAttrs, ...subSubcatAttrs].forEach((a: unknown) => uniqueAttrMap.set(a.id, a));
          const attributes = Array.from(uniqueAttrMap.values());
          const attributeValues: unknown[] = [];

          attributes.forEach((attr: unknown) => {
            // Find column that matches the attribute name directly
            const columnKey = Object.keys(row).find(
              (key) => key.toLowerCase().trim() === attr.name.toLowerCase().trim(),
            );

            if (!columnKey || !row[columnKey]) return;

            const value = row[columnKey];

            // Skip null, undefined, or empty values
            if (value === null || value === undefined || value === '') return;

            const valueObj: unknown = {
              product_id: listing.id,
              attribute_id: attr.id,
              value_text: null,
              value_number: null,
              value_boolean: null,
              value_date: null,
            };

            switch (attr.data_type) {
              case 'multi-select':
                // Handle semicolon-separated values (since commas are CSV delimiters)
                const values = String(value)
                  .split(';')
                  .map((v: string) => v.trim())
                  .filter(Boolean);
                if (values.length > 0) {
                  valueObj.value_text = JSON.stringify(values);
                }
                break;
              case 'string':
              case 'textarea':
                // Safe string conversion with null check
                const strValue = String(value).trim();
                if (strValue) {
                  valueObj.value_text = strValue;
                }
                break;
              case 'number':
                const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                if (!isNaN(numValue)) {
                  valueObj.value_number = numValue;
                }
                break;
              case 'boolean':
                valueObj.value_boolean = String(value).toUpperCase() === 'TRUE';
                break;
              case 'date':
                valueObj.value_date = value;
                break;
            }

            // Only add if we have a valid value
            const hasValue =
              valueObj.value_text !== null ||
              valueObj.value_number !== null ||
              valueObj.value_boolean !== null ||
              valueObj.value_date !== null;

            if (hasValue) {
              attributeValues.push(valueObj);
            }
          });

          // Save attribute values
          if (attributeValues.length > 0) {
            const attrResult = await saveProductAttributeValues(listing.id, attributeValues);
            if (isFailure(attrResult)) {
              console.error('Error saving attributes:', attrResult.error);
              // Don't fail the product creation, just log the error
            }
          }

          successCount++;
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
        toast.success(
          `Successfully added ${successCount} product${successCount !== 1 ? 's' : ''}${
            failedCount > 0 ? `, ${failedCount} failed` : ''
          }`,
        );
        queryClient.invalidateQueries({ queryKey: ['master-products'] });
      } else {
        toast.error('No products were added. Please check your file and try again.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error("Failed to process file. Please ensure it's a valid CSV file.");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const downloadFailedItems = () => {
    if (failedRows.length === 0) return;

    // Create CSV content
    const headers = Object.keys(failedRows[0]);
    const csvRows = [headers.map(escapeCsv).join(',')];
    failedRows.forEach((row) => {
      csvRows.push(headers.map((h) => escapeCsv(row[h])).join(','));
    });

    const csvContent = csvRows.join('\n');
    downloadCsv(csvContent, `failed_products_${new Date().getTime()}.csv`);
    toast.success('Failed items downloaded');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Master Products</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Upload a completed template file to add products to the master catalog. Make sure you've downloaded and
              filled in the category-specific template.
            </AlertDescription>
          </Alert>

          <div className="relative">
            <Button variant="default" className="w-full" disabled={isUploading} asChild>
              <label className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload CSV File'}
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </Button>
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

          {uploadResults && (
            <Alert className={uploadResults.success > 0 ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}>
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
