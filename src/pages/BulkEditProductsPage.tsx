// Bulk Edit Products Page
// Allows editing multiple products at once

import { ArrowLeft, Save, Plus, EyeOff } from 'lucide-react';
import Header from '@/components/Header';
import { BulkEditProductRow } from '@/components/bulk-edit';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBulkEditProducts } from '@/hooks/useBulkEditProducts';
import { useState } from 'react';

const BulkEditProductsPage = () => {
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);

  const {
    sortedProducts,
    loading,
    saving,
    visibleColumns,
    sortField,
    showUnsavedDialog,
    level1Categories,
    brands,
    availableTags,
    displayAttributes,
    allUniqueAttributes,
    productAttributes,
    productTags,
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
  } = useBulkEditProducts();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center">Loading products...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleNavigateBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Bulk Edit Products</h1>
              <p className="text-muted-foreground">Editing {sortedProducts.length} products</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="sort-select" className="text-sm font-medium">Sort by:</Label>
              <Select value={sortField} onValueChange={setSortField}>
                <SelectTrigger id="sort-select" className="w-[200px]">
                  <SelectValue placeholder="Default order" />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  <SelectItem value="default">Default order</SelectItem>
                  <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                  <SelectItem value="created_asc">Created (Oldest)</SelectItem>
                  <SelectItem value="created_desc">Created (Newest)</SelectItem>
                  <SelectItem value="updated_asc">Updated (Oldest)</SelectItem>
                  <SelectItem value="updated_desc">Updated (Newest)</SelectItem>
                  <SelectItem value="stock_asc">Stock (Low to High)</SelectItem>
                  <SelectItem value="stock_desc">Stock (High to Low)</SelectItem>
                  <SelectItem value="price_asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price_desc">Price (High to Low)</SelectItem>
                  <SelectItem value="category_asc">Category (A-Z)</SelectItem>
                  <SelectItem value="category_desc">Category (Z-A)</SelectItem>
                  <SelectItem value="brand_asc">Brand (A-Z)</SelectItem>
                  <SelectItem value="brand_desc">Brand (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <div className="overflow-hidden rounded-lg border">
            <div className="max-h-[calc(100vh-250px)] overflow-x-auto overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 border-b bg-background">
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="sticky left-0 z-20 min-w-[250px] border-r bg-background font-semibold">
                      Product
                    </TableHead>
                    {visibleColumns.price && (
                      <TableHead className="min-w-[120px] font-semibold">
                        <div className="flex items-center justify-between gap-2">
                          <span>Price (£)</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleColumn('price')}>
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableHead>
                    )}
                    {visibleColumns.salePrice && (
                      <TableHead className="min-w-[120px] font-semibold">
                        <div className="flex items-center justify-between gap-2">
                          <span>Sale Price</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleColumn('salePrice')}>
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableHead>
                    )}
                    {visibleColumns.stock && (
                      <TableHead className="min-w-[100px] font-semibold">
                        <div className="flex items-center justify-between gap-2">
                          <span>Stock</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleColumn('stock')}>
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableHead>
                    )}
                    {visibleColumns.sku && (
                      <TableHead className="min-w-[120px] font-semibold">
                        <div className="flex items-center justify-between gap-2">
                          <span>SKU</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleColumn('sku')}>
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableHead>
                    )}
                    {visibleColumns.weight && (
                      <TableHead className="min-w-[100px] font-semibold">
                        <div className="flex items-center justify-between gap-2">
                          <span>Weight (kg)</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleColumn('weight')}>
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableHead>
                    )}
                    {visibleColumns.brand && (
                      <TableHead className="min-w-[150px] font-semibold">
                        <div className="flex items-center justify-between gap-2">
                          <span>Brand</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleColumn('brand')}>
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableHead>
                    )}
                    {visibleColumns.level1 && (
                      <TableHead className="min-w-[150px] font-semibold">
                        <div className="flex items-center justify-between gap-2">
                          <span>Level 1</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleColumn('level1')}>
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableHead>
                    )}
                    {visibleColumns.level2 && (
                      <TableHead className="min-w-[150px] font-semibold">
                        <div className="flex items-center justify-between gap-2">
                          <span>Level 2</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleColumn('level2')}>
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableHead>
                    )}
                    {visibleColumns.level3 && (
                      <TableHead className="min-w-[150px] font-semibold">
                        <div className="flex items-center justify-between gap-2">
                          <span>Level 3</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleColumn('level3')}>
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableHead>
                    )}
                    {visibleColumns.level4 && (
                      <TableHead className="min-w-[150px] font-semibold">
                        <div className="flex items-center justify-between gap-2">
                          <span>Level 4</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleColumn('level4')}>
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableHead>
                    )}
                    <TableHead className="min-w-[120px] font-semibold">Status</TableHead>
                    {visibleColumns.tags && (
                      <TableHead className="min-w-[150px] font-semibold">
                        <div className="flex items-center justify-between gap-2">
                          <span>Tags</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleColumn('tags')}>
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableHead>
                    )}
                    {displayAttributes.map((attr: unknown) => {
                      if (!isAttributeVisible(attr.id, attr.name)) return null;
                      return (
                        <TableHead key={attr.id} className="min-w-[150px] font-semibold">
                          <div className="flex items-center justify-between gap-2">
                            <span>{attr.name}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleAttributeColumn(attr.id)}>
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableHead>
                      );
                    })}
                    <TableHead className="min-w-[120px]">
                      <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Column
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Manage Columns</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4 py-4 md:grid-cols-3">
                            {['price', 'salePrice', 'stock', 'sku', 'weight', 'brand', 'level1', 'level2', 'level3', 'level4', 'tags'].map((col) => (
                              <div key={col} className="flex items-center space-x-2">
                                <Switch
                                  id={`col-${col}`}
                                  checked={visibleColumns[col]}
                                  onCheckedChange={() => toggleColumn(col)}
                                />
                                <Label htmlFor={`col-${col}`} className="cursor-pointer capitalize">
                                  {col === 'salePrice' ? 'Sale Price' : col.replace('level', 'Level ')}
                                </Label>
                              </div>
                            ))}
                            <div className="flex items-center space-x-2">
                              <Switch id="col-status" checked={true} disabled={true} />
                              <Label htmlFor="col-status" className="cursor-pointer text-muted-foreground">
                                Status (Always Visible)
                              </Label>
                            </div>
                            {allUniqueAttributes.map((attr: unknown) => (
                              <div key={attr.id} className="flex items-center space-x-2">
                                <Switch
                                  id={`col-attr-${attr.id}`}
                                  checked={isAttributeVisible(attr.id, attr.name)}
                                  onCheckedChange={() => toggleAttributeColumn(attr.id)}
                                />
                                <Label htmlFor={`col-attr-${attr.id}`} className="cursor-pointer">
                                  {attr.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableHead>
                  </TableRow>
                  {/* Bulk edit row */}
                  <TableRow className="bg-muted/50 hover:bg-transparent">
                    <TableHead className="sticky left-0 z-20 min-w-[250px] border-r bg-muted/50 py-2 text-xs text-muted-foreground">
                      Change All
                    </TableHead>
                    {visibleColumns.price && (
                      <TableHead className="py-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Set all"
                          onChange={(e) => e.target.value && bulkUpdateField('starting_price', e.target.value)}
                          className="h-8 w-full text-xs"
                        />
                      </TableHead>
                    )}
                    {visibleColumns.salePrice && (
                      <TableHead className="py-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Set all"
                          onChange={(e) => e.target.value && bulkUpdateField('discounted_price', e.target.value)}
                          className="h-8 w-full text-xs"
                        />
                      </TableHead>
                    )}
                    {visibleColumns.stock && (
                      <TableHead className="py-2">
                        <Input
                          type="number"
                          placeholder="Set all"
                          onChange={(e) => e.target.value && bulkUpdateField('stock_quantity', e.target.value)}
                          className="h-8 w-full text-xs"
                        />
                      </TableHead>
                    )}
                    {visibleColumns.sku && (
                      <TableHead className="py-2">
                        <Input
                          placeholder="Set all"
                          onChange={(e) => e.target.value && bulkUpdateField('sku', e.target.value)}
                          className="h-8 w-full text-xs"
                        />
                      </TableHead>
                    )}
                    {visibleColumns.weight && (
                      <TableHead className="py-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Set all"
                          onChange={(e) => e.target.value && bulkUpdateField('weight', e.target.value)}
                          className="h-8 w-full text-xs"
                        />
                      </TableHead>
                    )}
                    {visibleColumns.brand && (
                      <TableHead className="py-2">
                        <Select onValueChange={(value) => bulkUpdateField('brand_id', value === 'none' ? null : value)}>
                          <SelectTrigger className="h-8 w-full text-xs">
                            <SelectValue placeholder="Set all" />
                          </SelectTrigger>
                          <SelectContent className="z-[100] border bg-popover shadow-md">
                            <SelectItem value="none">No Brand</SelectItem>
                            {brands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableHead>
                    )}
                    {visibleColumns.level1 && (
                      <TableHead className="py-2">
                        <Select
                          onValueChange={(value) => {
                            const newValue = value === 'none' ? null : value;
                            bulkUpdateField('category_id', newValue);
                            bulkUpdateField('subcategory_id', null);
                            bulkUpdateField('sub_subcategory_id', null);
                            bulkUpdateField('sub_sub_subcategory_id', null);
                          }}
                        >
                          <SelectTrigger className="h-8 w-full text-xs">
                            <SelectValue placeholder="Set all" />
                          </SelectTrigger>
                          <SelectContent className="z-[100] border bg-popover shadow-md">
                            <SelectItem value="none">None</SelectItem>
                            {level1Categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableHead>
                    )}
                    {visibleColumns.level2 && <TableHead className="py-2" />}
                    {visibleColumns.level3 && <TableHead className="py-2" />}
                    {visibleColumns.level4 && <TableHead className="py-2" />}
                    <TableHead className="py-2">
                      <Select onValueChange={(value) => bulkUpdateField('status', value)}>
                        <SelectTrigger className="h-8 w-full text-xs">
                          <SelectValue placeholder="Set all" />
                        </SelectTrigger>
                        <SelectContent className="z-[100] border bg-popover shadow-md">
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableHead>
                    {visibleColumns.tags && <TableHead className="py-2" />}
                    {displayAttributes.map((attr: unknown) => {
                      if (!isAttributeVisible(attr.id, attr.name)) return null;
                      const options = attr.attribute_options || [];
                      const hasOptions = options.length > 0;

                      if (hasOptions) {
                        return (
                          <TableHead key={attr.id} className="py-2">
                            <Select onValueChange={(value) => bulkUpdateAttribute(attr.id, 'value_text', value === 'none' ? null : value)}>
                              <SelectTrigger className="h-8 w-full text-xs">
                                <SelectValue placeholder="Set all" />
                              </SelectTrigger>
                              <SelectContent className="z-[100] max-h-[300px] overflow-auto border bg-popover shadow-md">
                                <SelectItem value="none">None</SelectItem>
                                {options.map((opt: unknown) => (
                                  <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableHead>
                        );
                      }

                      if (attr.data_type === 'number') {
                        return (
                          <TableHead key={attr.id} className="py-2">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Set all"
                              onChange={(e) => e.target.value && bulkUpdateAttribute(attr.id, 'value_number', e.target.value)}
                              className="h-8 w-full text-xs"
                            />
                          </TableHead>
                        );
                      }

                      if (attr.data_type === 'boolean') {
                        return (
                          <TableHead key={attr.id} className="py-2">
                            <Select onValueChange={(value) => bulkUpdateAttribute(attr.id, 'value_boolean', value === 'none' ? null : value === 'true')}>
                              <SelectTrigger className="h-8 w-full text-xs">
                                <SelectValue placeholder="Set all" />
                              </SelectTrigger>
                              <SelectContent className="z-[100] border bg-popover shadow-md">
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableHead>
                        );
                      }

                      return (
                        <TableHead key={attr.id} className="py-2">
                          <Input
                            placeholder="Set all"
                            onChange={(e) => e.target.value && bulkUpdateAttribute(attr.id, 'value_text', e.target.value)}
                            className="h-8 w-full text-xs"
                          />
                        </TableHead>
                      );
                    })}
                    <TableHead className="py-2" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProducts.map((product) => (
                    <BulkEditProductRow
                      key={product.id}
                      product={product}
                      visibleColumns={visibleColumns}
                      brands={brands}
                      level1Categories={level1Categories}
                      displayAttributes={displayAttributes}
                      availableTags={availableTags}
                      productTags={productTags}
                      updateProduct={updateProduct}
                      updateAttributeValue={updateAttributeValue}
                      updateProductTags={updateProductTags}
                      getAttributeValue={getAttributeValue}
                      getFilteredLevel2={getFilteredLevel2}
                      getFilteredLevel3={getFilteredLevel3}
                      getFilteredLevel4={getFilteredLevel4}
                      isAttributeVisible={isAttributeVisible}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      </main>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>Leave Without Saving</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BulkEditProductsPage;
