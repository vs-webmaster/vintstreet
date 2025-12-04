import { useNavigate } from 'react-router-dom';
import { Eye, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product } from '@/hooks/useProductData';

interface ProductTabsProps {
  product: Product;
  productAttributes: unknown[];
  onContactSeller: () => void;
}

export const ProductTabs = ({ product, productAttributes, onContactSeller }: ProductTabsProps) => {
  const navigate = useNavigate();

  const renderAttributeValue = (attr: unknown) => {
    if (attr.attributes?.data_type === 'multi-select') {
      try {
        const values = typeof attr.value_text === 'string' ? JSON.parse(attr.value_text) : attr.value_text;
        return Array.isArray(values) ? values.join(', ') : attr.value_text || '-';
      } catch {
        return attr.value_text || '-';
      }
    } else if (attr.attributes?.data_type === 'string') {
      return attr.value_text || '-';
    } else if (attr.attributes?.data_type === 'number') {
      return attr.value_number?.toString() || '-';
    } else if (attr.attributes?.data_type === 'boolean') {
      return attr.value_boolean !== null ? (attr.value_boolean ? 'Yes' : 'No') : '-';
    } else if (attr.attributes?.data_type === 'date') {
      return attr.value_date
        ? new Date(attr.value_date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '-';
    }
    return '-';
  };

  // Sort attributes to group related measurements together
  const sortedAttributes = [...productAttributes].sort((a, b) => {
    const aName = a.attributes?.name?.toLowerCase().replace(/[_-]/g, ' ') || '';
    const bName = b.attributes?.name?.toLowerCase().replace(/[_-]/g, ' ') || '';

    // Define groupings (normalized with spaces)
    const shirtMeasurements = ['pit to pit', 'collar to hem'];
    const trouserMeasurements = ['length in', 'inside leg', 'waist womens', 'waist mens', 'size womens', 'size mens'];

    // Check if attributes belong to specific groups
    const aIsShirt = shirtMeasurements.some((m) => aName.includes(m));
    const bIsShirt = shirtMeasurements.some((m) => bName.includes(m));
    const aIsTrouser = trouserMeasurements.some((m) => aName.includes(m));
    const bIsTrouser = trouserMeasurements.some((m) => bName.includes(m));

    // Group shirt measurements together
    if (aIsShirt && bIsShirt) {
      return (
        shirtMeasurements.findIndex((m) => aName.includes(m)) - shirtMeasurements.findIndex((m) => bName.includes(m))
      );
    }

    // Group trouser measurements together
    if (aIsTrouser && bIsTrouser) {
      return (
        trouserMeasurements.findIndex((m) => aName.includes(m)) -
        trouserMeasurements.findIndex((m) => bName.includes(m))
      );
    }

    // Keep grouped items together in the list
    if (aIsShirt && !bIsShirt) return -1;
    if (!aIsShirt && bIsShirt) return 1;
    if (aIsTrouser && !bIsTrouser) return -1;
    if (!aIsTrouser && bIsTrouser) return 1;

    // Maintain original order for other attributes
    return 0;
  });

  const hasDescription = product.product_description && product.product_description.trim().length > 0;

  return (
    <Card>
      <CardContent className="p-0">
        <Tabs defaultValue={hasDescription ? 'description' : 'details'} className="w-full">
          <TabsList
            className={`grid w-full ${
              hasDescription ? 'grid-cols-3' : 'grid-cols-2'
            } h-auto rounded-none border-b bg-transparent p-0`}
          >
            {hasDescription && (
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Description
              </TabsTrigger>
            )}
            <TabsTrigger
              value="details"
              className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="seller"
              className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Seller
            </TabsTrigger>
          </TabsList>

          {hasDescription && (
            <TabsContent value="description" className="mt-0 p-6">
              <p className="whitespace-pre-wrap text-muted-foreground">{product.product_description}</p>
            </TabsContent>
          )}

          <TabsContent value="details" className="mt-0 p-6">
            {productAttributes.length > 0 || product.sku ? (
              <Table>
                <TableBody>
                  {sortedAttributes.map((attr: unknown) => (
                    <TableRow key={attr.id} className="border-b">
                      <TableCell className="w-1/3 py-1.5 font-medium">{attr.attributes?.name || 'Unknown'}</TableCell>
                      <TableCell className="py-1.5">{renderAttributeValue(attr)}</TableCell>
                    </TableRow>
                  ))}
                  {product.sku && (
                    <TableRow className="border-b-0">
                      <TableCell className="w-1/3 py-1.5 font-medium">SKU</TableCell>
                      <TableCell className="py-1.5">{product.sku}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            ) : (
              <p className="italic text-muted-foreground">No additional details available.</p>
            )}
          </TabsContent>

          <TabsContent value="seller" className="mt-0 p-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">
                    {product.seller_profiles?.shop_name?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-base font-semibold md:text-lg">
                    {product.seller_profiles?.shop_name || 'Seller'}
                  </h3>
                  <p className="text-xs text-muted-foreground md:text-sm">
                    Listed{' '}
                    {new Date(product.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/seller/${product.seller_id}`)}
                  className="w-full md:w-auto"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Shop
                </Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-3 text-sm font-semibold md:text-base">Contact Seller</h4>
                <Button className="w-full" onClick={onContactSeller}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
