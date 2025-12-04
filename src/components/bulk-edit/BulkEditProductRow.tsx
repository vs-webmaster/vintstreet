// Bulk Edit Product Row Component
// Memoized row for efficient rendering

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import type { Product } from '@/types/product';
import type { Subcategory, SubSubcategory, SubSubSubcategory } from '@/types/category';
import type { Attribute } from '@/services/attributes/attributeService';
import type { ProductAttributeValue } from '@/services/attributes/attributeService';

interface ProductRowProps {
  product: unknown;
  visibleColumns: Record<string, boolean>;
  brands: unknown[];
  level1Categories: unknown[];
  displayAttributes: unknown[];
  availableTags: unknown[];
  productTags: Map<string, string[]>;
  updateProduct: (productId: string, field: string, value: unknown) => void;
  updateAttributeValue: (productId: string, attributeId: string, field: string, value: unknown) => void;
  updateProductTags: (productId: string, tagIds: string[]) => void;
<<<<<<< HEAD
  getAttributeValue: (productId: string, attributeId: string) => unknown;
  getFilteredLevel2: (level1Id: string) => unknown[];
  getFilteredLevel3: (level2Id: string) => unknown[];
  getFilteredLevel4: (level3Id: string) => unknown[];
=======
  getAttributeValue: (productId: string, attributeId: string) => ProductAttributeValue | undefined;
  getFilteredLevel2: (level1Id: string) => Subcategory[];
  getFilteredLevel3: (level2Id: string) => SubSubcategory[];
  getFilteredLevel4: (level3Id: string) => SubSubSubcategory[];
>>>>>>> a275e0e6fd466fe0415be180aa3be0c399054c93
  isAttributeVisible: (attributeId: string, attributeName: string) => boolean;
}

export const BulkEditProductRow = memo(({
  product,
  visibleColumns,
  brands,
  level1Categories,
  displayAttributes,
  availableTags,
  productTags,
  updateProduct,
  updateAttributeValue,
  updateProductTags,
  getAttributeValue,
  getFilteredLevel2,
  getFilteredLevel3,
  getFilteredLevel4,
  isAttributeVisible,
}: ProductRowProps) => {
  return (
    <TableRow className="border-b hover:bg-muted/30">
      <TableCell className="sticky left-0 z-10 border-r bg-background py-1">
        <div className="flex items-center gap-3">
          {product.thumbnail && (
            <img
              src={product.thumbnail}
              alt={product.product_name}
              className="h-10 w-10 shrink-0 rounded object-cover"
            />
          )}
          <Input
            value={product.product_name}
            onChange={(e) => updateProduct(product.id, 'product_name', e.target.value)}
            className="min-w-[180px] font-medium"
          />
        </div>
      </TableCell>
      {visibleColumns.price && (
        <TableCell className="py-1">
          <Input
            type="number"
            step="0.01"
            value={product.starting_price}
            onChange={(e) => updateProduct(product.id, 'starting_price', e.target.value)}
            className="w-full"
          />
        </TableCell>
      )}
      {visibleColumns.salePrice && (
        <TableCell className="py-1">
          <Input
            type="number"
            step="0.01"
            value={product.discounted_price || ''}
            onChange={(e) => updateProduct(product.id, 'discounted_price', e.target.value)}
            placeholder="Optional"
            className="w-full"
          />
        </TableCell>
      )}
      {visibleColumns.stock && (
        <TableCell className="py-1">
          <Input
            type="number"
            value={product.stock_quantity || ''}
            onChange={(e) => updateProduct(product.id, 'stock_quantity', e.target.value)}
            placeholder="Unlimited"
            className="w-full"
          />
        </TableCell>
      )}
      {visibleColumns.sku && (
        <TableCell className="py-1">
          <Input
            value={product.sku || ''}
            onChange={(e) => updateProduct(product.id, 'sku', e.target.value)}
            placeholder="SKU"
            className="w-full"
          />
        </TableCell>
      )}
      {visibleColumns.weight && (
        <TableCell className="py-1">
          <Input
            type="number"
            step="0.01"
            value={product.weight || ''}
            onChange={(e) => updateProduct(product.id, 'weight', e.target.value)}
            placeholder="kg"
            className="w-full"
          />
        </TableCell>
      )}
      {visibleColumns.brand && (
        <TableCell className="py-1">
          <Select
            value={product.brand_id || 'none'}
            onValueChange={(value) => updateProduct(product.id, 'brand_id', value === 'none' ? null : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent className="z-[100] border bg-popover shadow-md">
              <SelectItem value="none">No Brand</SelectItem>
              {brands.map((brand: unknown) => (
                <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
      )}
      {visibleColumns.level1 && (
        <TableCell className="py-1">
          <Select
            value={product.category_id || 'none'}
            onValueChange={(value) => {
              const newValue = value === 'none' ? null : value;
              updateProduct(product.id, 'category_id', newValue);
              updateProduct(product.id, 'subcategory_id', null);
              updateProduct(product.id, 'sub_subcategory_id', null);
              updateProduct(product.id, 'sub_sub_subcategory_id', null);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Level 1" />
            </SelectTrigger>
            <SelectContent className="z-[100] border bg-popover shadow-md">
              <SelectItem value="none">None</SelectItem>
              {level1Categories.map((cat: unknown) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
      )}
      {visibleColumns.level2 && (
        <TableCell className="py-1">
          <Select
            value={product.subcategory_id || 'none'}
            onValueChange={(value) => {
              const newValue = value === 'none' ? null : value;
              updateProduct(product.id, 'subcategory_id', newValue);
              updateProduct(product.id, 'sub_subcategory_id', null);
              updateProduct(product.id, 'sub_sub_subcategory_id', null);
            }}
            disabled={!product.category_id}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Level 2" />
            </SelectTrigger>
            <SelectContent className="z-[100] border bg-popover shadow-md">
              <SelectItem value="none">None</SelectItem>
              {getFilteredLevel2(product.category_id).map((cat: unknown) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
      )}
      {visibleColumns.level3 && (
        <TableCell className="py-1">
          <Select
            value={product.sub_subcategory_id || 'none'}
            onValueChange={(value) => {
              const newValue = value === 'none' ? null : value;
              updateProduct(product.id, 'sub_subcategory_id', newValue);
              updateProduct(product.id, 'sub_sub_subcategory_id', null);
            }}
            disabled={!product.subcategory_id}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Level 3" />
            </SelectTrigger>
            <SelectContent className="z-[100] border bg-popover shadow-md">
              <SelectItem value="none">None</SelectItem>
              {getFilteredLevel3(product.subcategory_id).map((cat: unknown) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
      )}
      {visibleColumns.level4 && (
        <TableCell className="py-1">
          <Select
            value={product.sub_sub_subcategory_id || 'none'}
            onValueChange={(value) => updateProduct(product.id, 'sub_sub_subcategory_id', value === 'none' ? null : value)}
            disabled={!product.sub_subcategory_id}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Level 4" />
            </SelectTrigger>
            <SelectContent className="z-[100] border bg-popover shadow-md">
              <SelectItem value="none">None</SelectItem>
              {getFilteredLevel4(product.sub_subcategory_id).map((cat: unknown) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
      )}
      {/* Status column */}
      <TableCell className="py-1">
        <Select
          value={product.status || 'published'}
          onValueChange={(value) => updateProduct(product.id, 'status', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="z-[100] border bg-popover shadow-md">
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      {/* Tags column */}
      {visibleColumns.tags && (
        <TableCell className="py-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                {(productTags.get(product.id) || []).length > 0
                  ? `${(productTags.get(product.id) || []).length} tag${(productTags.get(product.id) || []).length !== 1 ? 's' : ''}`
                  : 'Select tags'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="z-[100] w-80 p-4" align="start">
              <div className="space-y-2">
                <Label>Select Tags</Label>
                <div className="max-h-[300px] space-y-2 overflow-auto">
                  {availableTags.map((tag: unknown) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${product.id}-${tag.id}`}
                        checked={(productTags.get(product.id) || []).includes(tag.id)}
                        onCheckedChange={(checked) => {
                          const currentTags = productTags.get(product.id) || [];
                          if (checked) {
                            updateProductTags(product.id, [...currentTags, tag.id]);
                          } else {
                            updateProductTags(product.id, currentTags.filter((id: string) => id !== tag.id));
                          }
                        }}
                      />
                      <Label htmlFor={`${product.id}-${tag.id}`} className="cursor-pointer font-normal">
                        {tag.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </TableCell>
      )}
      {/* Dynamic attribute values */}
      {displayAttributes?.map((attr: unknown) => {
        if (!isAttributeVisible(attr.id, attr.name)) return null;

        const attrValue = getAttributeValue(product.id, attr.id);
        const options = attr.attribute_options || [];
        const hasOptions = options.length > 0;

        if (hasOptions) {
          return (
            <TableCell key={attr.id} className="py-1">
              <Select
                value={attrValue?.value_text || 'none'}
                onValueChange={(value) =>
                  updateAttributeValue(product.id, attr.id, 'value_text', value === 'none' ? null : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Select ${attr.name}`} />
                </SelectTrigger>
                <SelectContent className="z-[100] max-h-[300px] overflow-auto border bg-popover shadow-md">
                  <SelectItem value="none">None</SelectItem>
                  {options.map((opt: unknown) => (
                    <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
          );
        }

        if (attr.data_type === 'number') {
          return (
            <TableCell key={attr.id} className="py-1">
              <Input
                type="number"
                step="0.01"
                value={attrValue?.value_number || ''}
                onChange={(e) => updateAttributeValue(product.id, attr.id, 'value_number', e.target.value)}
                placeholder={attr.name}
                className="w-full"
              />
            </TableCell>
          );
        }

        if (attr.data_type === 'boolean') {
          return (
            <TableCell key={attr.id} className="py-1">
              <Select
                value={attrValue?.value_boolean === true ? 'true' : attrValue?.value_boolean === false ? 'false' : 'none'}
                onValueChange={(value) =>
                  updateAttributeValue(product.id, attr.id, 'value_boolean', value === 'none' ? null : value === 'true')
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="z-[100] border bg-popover shadow-md">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
          );
        }

        if (attr.data_type === 'date') {
          return (
            <TableCell key={attr.id} className="py-1">
              <Input
                type="date"
                value={attrValue?.value_date ? new Date(attrValue.value_date).toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  updateAttributeValue(product.id, attr.id, 'value_date', e.target.value ? new Date(e.target.value).toISOString() : null)
                }
                className="w-full"
              />
            </TableCell>
          );
        }

        // Default to text input
        return (
          <TableCell key={attr.id} className="py-1">
            <Input
              value={attrValue?.value_text || ''}
              onChange={(e) => updateAttributeValue(product.id, attr.id, 'value_text', e.target.value)}
              placeholder={attr.name}
              className="w-full"
            />
          </TableCell>
        );
      })}
    </TableRow>
  );
});

BulkEditProductRow.displayName = 'BulkEditProductRow';
