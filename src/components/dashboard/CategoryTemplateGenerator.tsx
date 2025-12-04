/* eslint-disable @typescript-eslint/no-explicit-any */
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { escapeCsv } from '@/lib/csvUtils';
import { downloadCsv } from '@/lib/productExportUtils';
import {
  fetchAttributeCategoriesByCategoryId,
  fetchAttributeSubcategoriesBySubcategoryIds,
  fetchAttributeSubSubcategoriesBySubSubcategoryIds,
} from '@/services/attributes';
import { fetchBrands } from '@/services/brands';
import { fetchSubcategories, fetchAllSubSubcategories } from '@/services/categories';
import { isFailure } from '@/types/api';

interface CategoryTemplateGeneratorProps {
  categoryId: string;
  subcategoryId?: string;
  subSubcategoryId?: string;
  categoryName?: string;
  disabled?: boolean;
  onSuccess?: () => void;
}

export const CategoryTemplateGenerator = ({
  categoryId,
  subcategoryId,
  subSubcategoryId,
  categoryName,
  disabled,
  onSuccess,
}: CategoryTemplateGeneratorProps) => {
  const generateTemplate = async () => {
    if (!categoryId) return;

    try {
      toast.loading('Generating template...');

      // Fetch subcategories for this category (filtered if subcategoryId provided)
      const subcategoriesResult = await fetchSubcategories(categoryId);
      if (isFailure(subcategoriesResult)) throw subcategoriesResult.error;

      let subcategories = subcategoriesResult.data || [];
      if (subcategoryId) {
        subcategories = subcategories.filter((s) => s.id === subcategoryId);
      }
      subcategories.sort((a, b) => a.name.localeCompare(b.name));

      // Fetch sub-subcategories (filtered if subSubcategoryId provided)
      const allSubSubcategoriesResult = await fetchAllSubSubcategories();
      if (isFailure(allSubSubcategoriesResult)) throw allSubSubcategoriesResult.error;

      let subSubcategories = allSubSubcategoriesResult.data || [];
      if (subcategoryId) {
        subSubcategories = subSubcategories.filter((ss) => ss.subcategory_id === subcategoryId);
      }
      if (subSubcategoryId) {
        subSubcategories = subSubcategories.filter((ss) => ss.id === subSubcategoryId);
      }
      subSubcategories.sort((a, b) => a.name.localeCompare(b.name));

      // Fetch brands
      const brandsResult = await fetchBrands();
      if (isFailure(brandsResult)) throw brandsResult.error;
      const brands = brandsResult.data || [];

      // Fetch category-level attributes (Level 1)
      const categoryAttrResult = await fetchAttributeCategoriesByCategoryId(categoryId);
      if (isFailure(categoryAttrResult)) throw categoryAttrResult.error;

      const categoryLevelAttrs = (categoryAttrResult.data || [])
        .map((link) => link.attributes)
        .filter(Boolean)
        .sort((a: unknown, b: unknown) => (a.display_order || 0) - (b.display_order || 0));

      // For each subcategory, fetch its attributes
      const attributesBySubcategory = new Map<string, any[]>();
      const allAttributeOptions = new Map<string, any[]>();

      // Fetch attributes for all subcategories at once
      const subcategoryIds = subcategories.map((s) => s.id);
      if (subcategoryIds.length > 0) {
        const subAttrResult = await fetchAttributeSubcategoriesBySubcategoryIds(subcategoryIds);
        if (isFailure(subAttrResult)) throw subAttrResult.error;

        // Group attributes by subcategory_id
        const subAttrMap = new Map<string, any[]>();
        (subAttrResult.data || []).forEach((link) => {
          if (link.attributes && link.subcategory_id) {
            if (!subAttrMap.has(link.subcategory_id)) {
              subAttrMap.set(link.subcategory_id, []);
            }
            subAttrMap.get(link.subcategory_id)!.push(link.attributes);
          }
        });

        // Fetch attributes for all sub-subcategories at once
        const subSubcategoryIds = subSubcategories.map((ss) => ss.id);
        const subSubAttrMap = new Map<string, unknown[]>();
        if (subSubcategoryIds.length > 0) {
          const subSubAttrResult = await fetchAttributeSubSubcategoriesBySubSubcategoryIds(subSubcategoryIds);
          if (isFailure(subSubAttrResult)) throw subSubAttrResult.error;

          // Group attributes by sub_subcategory_id
          (subSubAttrResult.data || []).forEach((link) => {
            if (link.attributes && link.sub_subcategory_id) {
              if (!subSubAttrMap.has(link.sub_subcategory_id)) {
                subSubAttrMap.set(link.sub_subcategory_id, []);
              }
              subSubAttrMap.get(link.sub_subcategory_id)!.push(link.attributes);
            }
          });
        }

        for (const sub of subcategories) {
          // Get attributes linked to subcategory
          const attrs = (subAttrMap.get(sub.id) || [])
            .filter(Boolean)
            .sort((a: unknown, b: unknown) => (a.display_order || 0) - (b.display_order || 0));

          attributesBySubcategory.set(sub.id, attrs);

          // Fetch ALL sub-subcategories for this subcategory
          const subSubsForThisSubcat = subSubcategories.filter((ss) => ss.subcategory_id === sub.id);

          // Merge attributes from sub-subcategories
          for (const subSub of subSubsForThisSubcat) {
            const subSubAttrs = (subSubAttrMap.get(subSub.id) || [])
              .filter(Boolean)
              .sort((a: unknown, b: unknown) => (a.display_order || 0) - (b.display_order || 0));

            // Merge with existing attributes (avoid duplicates)
            const existingAttrIds = new Set(attrs.map((a: unknown) => a.id));
            subSubAttrs.forEach((attr: unknown) => {
              if (!existingAttrIds.has(attr.id)) {
                attrs.push(attr);
              }
            });
          }

          // Collect attribute options
          attrs.forEach((attr: unknown) => {
            if (attr.attribute_options && attr.attribute_options.length > 0) {
              const activeOptions = attr.attribute_options
                .filter((opt: unknown) => opt.is_active)
                .sort((a: unknown, b: unknown) => (a.display_order || 0) - (b.display_order || 0));
              allAttributeOptions.set(attr.id, activeOptions);
            }
          });
        }
      }

      // Build the Products sheet columns
      const productColumns: unknown = {
        product_name: 'Example Product',
        slug: 'example-product-url-slug',
        excerpt: 'Short product excerpt for listings (150-200 chars)',
        starting_price: 99.99,
        product_description: 'Detailed product description',
        stock_quantity: 10,
        discounted_price: '',
        sku: 'PROD-12345',
        stock_id: 'STOCK-67890',
        weight: 1.5,
        length: 10,
        width: 8,
        height: 5,
        meta_title: 'SEO optimized product title (50-60 chars)',
        meta_description: 'SEO optimized description for search engines (150-160 chars)',
        thumbnail: 'https://example.com/image.jpg',
        product_images: 'https://example.com/image1.jpg;https://example.com/image2.jpg',
        category_name: categoryName || 'Auto-filled from category',
        subcategory_name: 'Select from Subcategories sheet',
        sub_subcategory_name: 'Optional - select from Sub-Subcategories sheet',
        sub_sub_subcategory_name: 'Optional - Level 4 category if applicable',
        brand_name: 'Optional - select from Brands sheet',
        offers_enabled: 'TRUE',
        status: 'published',
      };

      // Collect attributes based on selection level
      const uniqueAttributes = new Map<string, any>();

      // Always include category-level attributes first
      categoryLevelAttrs.forEach((attr: unknown) => {
        if (!uniqueAttributes.has(attr.name)) {
          uniqueAttributes.set(attr.name, attr);
        }
        // Also collect attribute options for category-level attributes
        if (attr.attribute_options && attr.attribute_options.length > 0) {
          const activeOptions = attr.attribute_options
            .filter((opt: unknown) => opt.is_active)
            .sort((a: unknown, b: unknown) => (a.display_order || 0) - (b.display_order || 0));
          allAttributeOptions.set(attr.id, activeOptions);
        }
      });

      if (subSubcategoryId) {
        // If specific sub-subcategory selected, only include its attributes
        const selectedSubSub = subSubcategories?.find((ss: unknown) => ss.id === subSubcategoryId);
        if (selectedSubSub) {
          const attrs = attributesBySubcategory.get(selectedSubSub.subcategory_id) || [];
          attrs.forEach((attr: unknown) => {
            if (!uniqueAttributes.has(attr.name)) {
              uniqueAttributes.set(attr.name, attr);
            }
          });
        }
      } else if (subcategoryId) {
        // If specific subcategory selected, include its attributes + all its sub-subcategories' attributes
        const attrs = attributesBySubcategory.get(subcategoryId) || [];
        attrs.forEach((attr: unknown) => {
          if (!uniqueAttributes.has(attr.name)) {
            uniqueAttributes.set(attr.name, attr);
          }
        });
      } else {
        // If only category selected, include all subcategories' attributes
        (subcategories || []).forEach((sub) => {
          const attrs = attributesBySubcategory.get(sub.id) || [];
          attrs.forEach((attr: unknown) => {
            if (!uniqueAttributes.has(attr.name)) {
              uniqueAttributes.set(attr.name, attr);
            }
          });
        });
      }

      // Add columns for all unique attributes
      Array.from(uniqueAttributes.values())
        .sort((a: unknown, b: unknown) => (a.display_order || 0) - (b.display_order || 0))
        .forEach((attr: unknown) => {
          const hasOptions = allAttributeOptions.has(attr.id);

          let placeholder = '';
          if (hasOptions) {
            placeholder = `See ${attr.name}_Options sheet`;
          } else {
            switch (attr.data_type) {
              case 'string':
                placeholder = 'Text value';
                break;
              case 'textarea':
                placeholder = 'Multi-line text value';
                break;
              case 'number':
                placeholder = '0';
                break;
              case 'boolean':
                placeholder = 'TRUE or FALSE';
                break;
              case 'date':
                placeholder = 'YYYY-MM-DD';
                break;
              case 'multi-select':
                placeholder = 'Value1;Value2;Value3 (semicolon-separated)';
                break;
            }
          }

          productColumns[attr.name] = placeholder;
        });

      const templateData = [productColumns];

      // Create CSV content for products
      const headers = Object.keys(productColumns);
      const csvRows = [headers.map(escapeCsv).join(',')];
      csvRows.push(headers.map((h) => escapeCsv(productColumns[h])).join(','));

      // Add instructions as comments
      csvRows.push('');
      csvRows.push('# INSTRUCTIONS:');
      csvRows.push('# REQUIRED FIELDS: product_name and starting_price are required');
      csvRows.push(
        '# SLUG: URL-friendly product slug (lowercase, hyphens for spaces). Leave blank for auto-generation.',
      );
      csvRows.push('# EXCERPT: Short product summary (150-200 chars) for listings and shop pages');
      csvRows.push('# PRICES: Use numeric values only (e.g., 29.99)');
      csvRows.push(
        '# IMAGES: thumbnail for main thumbnail URL. For product_images, use semicolon-separated URLs (e.g., url1;url2)',
      );
      csvRows.push(
        '# CATEGORIES: category_name is auto-filled. Subcategory must match from reference data below. Other levels optional.',
      );
      csvRows.push('# ATTRIBUTES: Fill in applicable attributes - leave blank if not relevant to your subcategory');
      csvRows.push('# MULTI-SELECT: For multi-select attributes, use semicolon-separated values (e.g., Value1;Value2)');
      csvRows.push('# BOOLEANS: Use TRUE or FALSE (case insensitive)');
      csvRows.push('# DATES: Use YYYY-MM-DD format');
      csvRows.push('# OPTIONAL FIELDS: Leave empty if not applicable');
      csvRows.push('');

      // Add subcategories reference
      if ((subcategories || []).length > 0) {
        csvRows.push('# SUBCATEGORIES:');
        (subcategories || []).forEach((s) => {
          csvRows.push(`# ${s.name}`);
        });
        csvRows.push('');
      }

      // Add sub-subcategories reference
      if (subSubcategories && subSubcategories.length > 0) {
        csvRows.push('# SUB-SUBCATEGORIES:');
        subSubcategories.forEach((s: unknown) => {
          csvRows.push(`# ${s.name}`);
        });
        csvRows.push('');
      }

      // Add brands reference
      if (brands && brands.length > 0) {
        csvRows.push('# BRANDS:');
        brands.forEach((b) => {
          csvRows.push(`# ${b.name}`);
        });
        csvRows.push('');
      }

      // Add attribute options reference
      allAttributeOptions.forEach((options, attributeId) => {
        const attr = Array.from(attributesBySubcategory.values())
          .flat()
          .find((a: unknown) => a.id === attributeId);

        if (attr && options.length > 0) {
          csvRows.push(`# ${attr.name.toUpperCase()} OPTIONS:`);
          options.forEach((opt: unknown) => {
            csvRows.push(`# ${opt.value}`);
          });
          csvRows.push('');
        }
      });

      const csvContent = csvRows.join('\n');

      // Download CSV
      let fileName = categoryName || 'category';
      if (subcategoryId && subcategories && subcategories.length === 1) {
        fileName += `_${subcategories[0].name}`;
      }
      if (subSubcategoryId && subSubcategories && subSubcategories.length === 1) {
        fileName += `_${subSubcategories[0].name}`;
      }
      fileName = `${fileName}_template.csv`.replace(/[^a-z0-9_\-\.]/gi, '_');

      downloadCsv(csvContent, fileName);

      toast.dismiss();
      toast.success('Template downloaded successfully');
      onSuccess?.();
    } catch (error) {
      console.error('Error generating template:', error);
      toast.dismiss();
      toast.error('Failed to generate template');
    }
  };

  return (
    <Button onClick={generateTemplate} disabled={disabled} className="w-full">
      <Download className="mr-2 h-4 w-4" />
      Generate & Download
    </Button>
  );
};
