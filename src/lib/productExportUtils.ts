/* eslint-disable @typescript-eslint/no-explicit-any */
// Utility functions for product export operations

/**
 * Downloads content as a CSV file
 */
export function downloadCsv(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url); // Clean up memory
}

/**
 * Groups attribute values by product ID
 */
export function groupAttributesByProduct(attributeValues: unknown[]): Record<string, Record<string, any>> {
  return (attributeValues || []).reduce((acc: Record<string, Record<string, any>>, attr: unknown) => {
    if (!acc[attr.product_id]) {
      acc[attr.product_id] = {};
    }
    acc[attr.product_id][attr.attribute_id] = attr;
    return acc;
  }, {});
}

/**
 * Gets attribute value based on data type
 */
export function getAttributeValue(attr: unknown): string | number | boolean | null {
  const dataType = attr.attributes?.data_type;
  if (dataType === 'number') return attr.value_number;
  if (dataType === 'boolean') return attr.value_boolean ? 'TRUE' : 'FALSE';
  if (dataType === 'date') return attr.value_date;
  return attr.value_text || '';
}

/**
 * Formats a product for CSV/Excel export
 */
export function formatProductForExport(
  product: unknown,
  attrColumns: Record<string, any>
): Record<string, any> {
  return {
    product_name: product.product_name,
    thumbnail: product.thumbnail || '',
    product_images: product.product_images ? product.product_images.join(';') : '',
    starting_price: product.starting_price,
    discounted_price: product.discounted_price || '',
    product_description: product.product_description || '',
    excerpt: product.excerpt || '',
    stock_quantity: product.stock_quantity || '',
    sku: product.sku || '',
    stock_id: product.stock_id || '',
    slug: product.slug || '',
    weight: product.weight || '',
    length: product.length || '',
    width: product.width || '',
    height: product.height || '',
    meta_title: product.meta_title || '',
    meta_description: product.meta_description || '',
    category: product.product_categories?.name || '',
    subcategory: product.product_subcategories?.name || '',
    sub_subcategory: product.product_sub_subcategories?.name || '',
    sub_sub_subcategory: product.product_sub_sub_subcategories?.name || '',
    brand: product.brands?.name || '',
    offers_enabled: product.offers_enabled ? 'TRUE' : 'FALSE',
    status: product.status || '',
    ...attrColumns,
  };
}

/**
 * Builds attribute columns for a product
 */
export function buildAttributeColumns(
  productAttrs: Record<string, any>,
  attributes: unknown[]
): Record<string, any> {
  const attrColumns: Record<string, any> = {};
  attributes.forEach((attr: unknown) => {
    const attrName = attr.name;
    const productAttr = productAttrs[attr.id];
    const value = productAttr ? getAttributeValue(productAttr) : '';
    attrColumns[attrName] = value;
  });
  return attrColumns;
}
