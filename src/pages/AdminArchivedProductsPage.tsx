import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { MasterProductsTable } from '@/components/dashboard/MasterProductsTable';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { fetchAttributesByCategoryLevels } from '@/lib/attributeUtils';
import { fetchArchivedProducts, fetchProductAttributeValues } from '@/services/listings';
import { fetchSystemSellerProfile } from '@/services/users';
import { isFailure } from '@/types/api';

const AdminArchivedProductsPage = () => {
  const navigate = useNavigate();

  // Fetch system seller profile
  const { data: systemSeller } = useQuery({
    queryKey: ['system-seller'],
    queryFn: async () => {
      const result = await fetchSystemSellerProfile();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const handleDownloadArchivedProducts = async () => {
    try {
      toast.info('Preparing archived products for download...');

      const productsResult = await fetchArchivedProducts();
      if (isFailure(productsResult)) throw productsResult.error;
      const products = productsResult.data;

      // Fetch ALL attributes linked to the categories (level 2 and level 3)
      const uniqueSubcategoryIds = [
        ...new Set(products?.map((p) => p.subcategory_id).filter(Boolean) || []),
      ] as string[];
      const uniqueSubSubcategoryIds = [
        ...new Set(products?.map((p) => p.sub_subcategory_id).filter(Boolean) || []),
      ] as string[];

      const uniqueAttributes = await fetchAttributesByCategoryLevels(uniqueSubcategoryIds, uniqueSubSubcategoryIds);

      // Fetch product attribute values in batches
      const productIds = products?.map((p) => p.id) || [];
      const attributeValuesResult = await fetchProductAttributeValues(productIds);
      if (isFailure(attributeValuesResult)) throw attributeValuesResult.error;
      const allAttributeValues = attributeValuesResult.data;

      const attributesByProduct = new Map();
      allAttributeValues?.forEach((attr: unknown) => {
        if (!attributesByProduct.has(attr.product_id)) {
          attributesByProduct.set(attr.product_id, {});
        }
        attributesByProduct.get(attr.product_id)[attr.attribute_id] = attr;
      });

      const excelData =
        products?.map((product: unknown) => {
          const productAttrs = attributesByProduct.get(product.id) || {};
          const attributeObj: unknown = {};

          // Add columns for ALL attributes (even if empty) - no prefix for re-upload compatibility
          uniqueAttributes.forEach((attr: unknown) => {
            const attrName = attr.name;
            const productAttr = productAttrs[attr.id];
            let value = '';

            if (productAttr) {
              const dataType = attr.data_type;
              if (dataType === 'number') value = productAttr.value_number || '';
              else if (dataType === 'boolean') value = productAttr.value_boolean ? 'TRUE' : 'FALSE';
              else if (dataType === 'date') value = productAttr.value_date || '';
              else value = productAttr.value_text || '';
            }

            attributeObj[attrName] = value;
          });

          return {
            'Product Name': product.product_name,
            Description: product.product_description,
            Price: product.starting_price,
            'Discounted Price': product.discounted_price,
            Status: product.status,
            Stock: product.stock_quantity,
            SKU: product.sku,
            Category: product.product_categories?.name,
            Subcategory: product.product_subcategories?.name,
            'Sub-Subcategory': product.product_sub_subcategories?.name,
            'Sub-Sub-Subcategory': product.product_sub_sub_subcategories?.name,
            Brand: product.brands?.name,
            Created: new Date(product.created_at).toLocaleDateString(),
            Updated: new Date(product.updated_at).toLocaleDateString(),
            ...attributeObj,
          };
        }) || [];

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Archived Products');

      const fileName = `archived_products_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success(`Downloaded ${products?.length || 0} archived products with all attributes`);
    } catch (error: unknown) {
      console.error('Error downloading products:', error);
      toast.error(`Failed to download products: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6 p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/products')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Button>
            <h1 className="text-2xl font-bold">Archived Products</h1>
            <Button onClick={handleDownloadArchivedProducts} className="gap-2">
              <Download className="h-4 w-4" />
              Download All
            </Button>
          </div>
        </Card>

        <MasterProductsTable systemSellerId={systemSeller?.user_id} showArchivedProducts={true} />
      </main>
    </div>
  );
};

export default AdminArchivedProductsPage;
