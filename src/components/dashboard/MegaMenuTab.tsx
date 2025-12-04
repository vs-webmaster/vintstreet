import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Loader2, Eye, EyeOff, X, TrendingUp, Star, Crown, List, Plus, Edit2, Trash2 } from 'lucide-react';
import { filterByCategoryId } from '@/lib/filterUtils';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAllCategoryItems } from '@/hooks/queries/useAllCategoryItems';
import { buildAdminCategoryHierarchy } from '@/lib/categoryHierarchyUtils';
import { fetchBrands } from '@/services/brands';
import {
  fetchCategories,
  fetchAllSubcategories,
  fetchAllSubSubcategories,
  fetchAllSubSubSubcategories,
} from '@/services/categories';
import {
  fetchMegaMenuCategoryBrands,
  fetchMegaMenuTrendingItemsAdmin,
  fetchMegaMenuBestSellersAdmin,
  fetchMegaMenuLuxuryBrandsAdmin,
  toggleCategoryMegaMenuVisibility,
  addMegaMenuCategoryBrand,
  removeMegaMenuCategoryBrand,
  addMegaMenuTrendingItem,
  removeMegaMenuTrendingItem,
  addMegaMenuBestSeller,
  removeMegaMenuBestSeller,
  addMegaMenuLuxuryBrand,
  removeMegaMenuLuxuryBrand,
  fetchMegaMenuCustomLists,
  createMegaMenuCustomList,
  deleteMegaMenuCustomList,
  fetchMegaMenuCustomListItems,
  updateCategoryDisableMainLink,
  updateSubcategoryMegaMenuVisibility,
} from '@/services/megaMenu';
import { isFailure } from '@/types/api';
import { EditCustomListModal } from './EditCustomListModal';
import { MegaMenuLayoutTab } from './MegaMenuLayoutTab';
import {
  buildInsertDataFromItemData,
  getSelectedItemKeys,
  getAvailableItemsByLevel,
  getItemDisplayName,
  getLevelLabel,
} from './mega-menu/utils';
import { CategoryLevelSelectContent } from './mega-menu/CategoryLevelSelectContent';

interface Brand {
  id: string;
  name: string;
}

interface MegaCategoryBrand {
  id: string;
  brand_id: string;
  display_order: number;
  brands: Brand;
}

interface MegaMenuData {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    brands: MegaCategoryBrand[];
    subcategories: Array<{
      id: string;
      name: string;
      slug: string;
      show_in_mega_menu: boolean;
      sub_subcategories: Array<{
        id: string;
        name: string;
        slug: string;
        show_in_mega_menu: boolean;
        sub_sub_subcategories: Array<{
          id: string;
          name: string;
          slug: string;
          show_in_mega_menu: boolean;
        }>;
      }>;
    }>;
  }>;
}

export const MegaMenuTab = () => {
  const [updating, setUpdating] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mega-menu-management'],
    queryFn: async () => {
      const [catsResult, subsResult, subSubsResult, subSubSubsResult, categoryBrandsResult] = await Promise.all([
        fetchCategories(),
        fetchAllSubcategories(),
        fetchAllSubSubcategories(),
        fetchAllSubSubSubcategories(),
        fetchMegaMenuCategoryBrands(),
      ]);

      if (isFailure(catsResult)) throw catsResult.error;
      if (isFailure(subsResult)) throw subsResult.error;
      if (isFailure(subSubsResult)) throw subSubsResult.error;
      if (isFailure(subSubSubsResult)) throw subSubSubsResult.error;
      if (isFailure(categoryBrandsResult)) throw categoryBrandsResult.error;

      const cats = { data: catsResult.data || [] };
      const subs = { data: subsResult.data || [] };
      const subSubs = { data: subSubsResult.data || [] };
      const subSubSubs = { data: subSubSubsResult.data || [] };
      const categoryBrands = { data: categoryBrandsResult.data || [] };

      // Build hierarchy
      const categories = (cats.data || []).map((cat) => ({
        ...cat,
        brands: filterByCategoryId(categoryBrands.data as any, cat.id).map((cb: unknown) => ({
          id: cb.id,
          brand_id: cb.brand_id,
          display_order: cb.display_order,
          brands: cb.brands as Brand,
        })),
        subcategories: buildAdminCategoryHierarchy(cat.id, subs.data || [], subSubs.data || [], subSubSubs.data || []),
      }));

      return { categories } as MegaMenuData;
    },
  });

  // Fetch all available brands
  const { data: allBrands } = useQuery({
    queryKey: ['all-brands'],
    queryFn: async () => {
      const result = await fetchBrands({ isActive: true });
      if (isFailure(result)) throw result.error;
      return result.data.map((b) => ({ id: b.id, name: b.name }));
    },
  });

  const toggleVisibility = async (
    id: string,
    table: 'product_subcategories' | 'product_sub_subcategories' | 'product_sub_sub_subcategories',
    currentValue: boolean,
  ) => {
    setUpdating(id);
    try {
      const result = await toggleCategoryMegaMenuVisibility(id, table, currentValue);
      if (isFailure(result)) throw result.error;

      toast.success(!currentValue ? 'Now visible in mega menu' : 'Hidden from mega menu');

      // Invalidate both admin and public mega menu queries
      queryClient.invalidateQueries({ queryKey: ['mega-menu-management'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });

      refetch();
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    } finally {
      setUpdating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const categories = data?.categories || [];
  const brands = allBrands || [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="layouts" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="layouts">Layout</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="bestsellers">Best Sellers</TabsTrigger>
          <TabsTrigger value="luxury">Luxury</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="layouts" className="mt-6">
          <MegaMenuLayoutTab />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoryLinkToggle categories={categories} refetch={refetch} />
          <div className="mt-6">
            <CategoryVisibilityManagement categories={categories} refetch={refetch} />
          </div>
        </TabsContent>

        <TabsContent value="brands" className="mt-6">
          <BrandManagement categories={categories} brands={brands} />
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <TrendingManagement categories={categories} />
        </TabsContent>

        <TabsContent value="bestsellers" className="mt-6">
          <BestSellersManagement categories={categories} />
        </TabsContent>

        <TabsContent value="luxury" className="mt-6">
          <LuxuryBrandsManagement categories={categories} brands={brands} />
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <CustomListsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Brand Management Component (moved from inline)
function BrandManagement({ categories, brands }: { categories: unknown[]; brands: Brand[] }) {
  const queryClient = useQueryClient();
  const [addingBrand, setAddingBrand] = useState<string | null>(null);

  const addBrandToCategory = async (categoryId: string, brandId: string) => {
    setAddingBrand(categoryId);
    try {
      const result = await addMegaMenuCategoryBrand(categoryId, brandId);
      if (isFailure(result)) throw result.error;

      toast.success('Brand added to mega menu');
      queryClient.invalidateQueries({ queryKey: ['mega-menu-management'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
    } catch (error) {
      console.error('Error adding brand:', error);
      toast.error('Failed to add brand');
    } finally {
      setAddingBrand(null);
    }
  };

  const removeBrandFromCategory = async (linkId: string) => {
    try {
      const result = await removeMegaMenuCategoryBrand(linkId);
      if (isFailure(result)) throw result.error;

      toast.success('Brand removed from mega menu');
      queryClient.invalidateQueries({ queryKey: ['mega-menu-management'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
    } catch (error) {
      console.error('Error removing brand:', error);
      toast.error('Failed to remove brand');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Brands</CardTitle>
        <CardDescription>Manage brands shown in each category's mega menu</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {categories.map((category) => {
            const categoryBrandIds = category.brands.map((b: unknown) => b.brand_id);
            const availableBrands = brands.filter((b) => !categoryBrandIds.includes(b.id));

            return (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger>{category.name}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {availableBrands.length > 0 && (
                      <Select
                        onValueChange={(brandId) => addBrandToCategory(category.id, brandId)}
                        disabled={addingBrand === category.id}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Add brand..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableBrands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {category.brands.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {category.brands.map((categoryBrand: unknown) => (
                          <Badge key={categoryBrand.id} variant="secondary" className="gap-1">
                            {categoryBrand.brands.name}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => removeBrandFromCategory(categoryBrand.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No brands selected</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

// Trending Management Component
function TrendingManagement({ categories }: { categories: unknown[] }) {
  const queryClient = useQueryClient();
  const [addingItem, setAddingItem] = useState<string | null>(null);

  const { data: trendingItems = [] } = useQuery({
    queryKey: ['mega-menu-trending'],
    queryFn: async () => {
      const result = await fetchMegaMenuTrendingItemsAdmin();
      if (isFailure(result)) throw result.error;
      return result.data || [];
    },
  });

  // Use shared hook for all category items
  const { data: allCategoryItems = [] } = useAllCategoryItems();

  const addTrendingItem = async (categoryId: string, itemData: string) => {
    setAddingItem(categoryId);
    try {
      const insertData = buildInsertDataFromItemData(categoryId, itemData);
      const result = await addMegaMenuTrendingItem(insertData);
      if (isFailure(result)) throw result.error;

      toast.success('Trending item added');
      queryClient.invalidateQueries({ queryKey: ['mega-menu-trending'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
    } catch (error) {
      console.error('Error adding trending item:', error);
      toast.error('Failed to add trending item');
    } finally {
      setAddingItem(null);
    }
  };

  const removeTrendingItem = async (itemId: string) => {
    try {
      const result = await removeMegaMenuTrendingItem(itemId);
      if (isFailure(result)) throw result.error;

      toast.success('Trending item removed');
      queryClient.invalidateQueries({ queryKey: ['mega-menu-trending'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
    } catch (error) {
      console.error('Error removing trending item:', error);
      toast.error('Failed to remove trending item');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Items
        </CardTitle>
        <CardDescription>Manage trending categories (all levels) shown in each category's mega menu</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {categories.map((category) => {
            const selectedItemKeys = getSelectedItemKeys(trendingItems, category.id);
            const { availableItemsByLevel, hasAvailableItems } = getAvailableItemsByLevel(
              allCategoryItems,
              category.id,
              selectedItemKeys,
            );
            const selectedItems = trendingItems.filter((item: unknown) => item.category_id === category.id);

            return (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger>{category.name}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {hasAvailableItems && (
                      <Select
                        onValueChange={(itemData) => addTrendingItem(category.id, itemData)}
                        disabled={addingItem === category.id}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Add category..." />
                        </SelectTrigger>
                        <CategoryLevelSelectContent availableItemsByLevel={availableItemsByLevel} />
                      </Select>
                    )}
                    {selectedItems.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedItems.map((item: unknown) => (
                          <Badge key={item.id} variant="secondary" className="gap-1">
                            <span className="text-xs opacity-70">[{getLevelLabel(item.item_level)}]</span>{' '}
                            {getItemDisplayName(item)}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => removeTrendingItem(item.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No trending items selected</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

// Best Sellers Management Component
function BestSellersManagement({ categories }: { categories: unknown[] }) {
  const queryClient = useQueryClient();
  const [addingItem, setAddingItem] = useState<string | null>(null);

  const { data: bestSellers = [] } = useQuery({
    queryKey: ['mega-menu-best-sellers'],
    queryFn: async () => {
      const result = await fetchMegaMenuBestSellersAdmin();
      if (isFailure(result)) throw result.error;
      return result.data || [];
    },
  });

  // Use shared hook for all category items
  const { data: allCategoryItems = [] } = useAllCategoryItems();

  const addBestSeller = async (categoryId: string, itemData: string) => {
    setAddingItem(categoryId);
    try {
      const insertData = buildInsertDataFromItemData(categoryId, itemData);
      const result = await addMegaMenuBestSeller(insertData);
      if (isFailure(result)) throw result.error;

      toast.success('Best seller added');
      queryClient.invalidateQueries({ queryKey: ['mega-menu-best-sellers'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
    } catch (error) {
      console.error('Error adding best seller:', error);
      toast.error('Failed to add best seller');
    } finally {
      setAddingItem(null);
    }
  };

  const removeBestSeller = async (itemId: string) => {
    try {
      const result = await removeMegaMenuBestSeller(itemId);
      if (isFailure(result)) throw result.error;

      toast.success('Best seller removed');
      queryClient.invalidateQueries({ queryKey: ['mega-menu-best-sellers'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
    } catch (error) {
      console.error('Error removing best seller:', error);
      toast.error('Failed to remove best seller');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Best Sellers
        </CardTitle>
        <CardDescription>
          Manage best selling categories (all levels) shown in each category's mega menu
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {categories.map((category) => {
            const selectedItemKeys = getSelectedItemKeys(bestSellers, category.id);
            const { availableItemsByLevel, hasAvailableItems } = getAvailableItemsByLevel(
              allCategoryItems,
              category.id,
              selectedItemKeys,
            );
            const selectedItems = bestSellers.filter((item: unknown) => item.category_id === category.id);

            return (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger>{category.name}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {hasAvailableItems && (
                      <Select
                        onValueChange={(itemData) => addBestSeller(category.id, itemData)}
                        disabled={addingItem === category.id}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Add category..." />
                        </SelectTrigger>
                        <CategoryLevelSelectContent availableItemsByLevel={availableItemsByLevel} />
                      </Select>
                    )}
                    {selectedItems.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedItems.map((item: unknown) => (
                          <Badge key={item.id} variant="secondary" className="gap-1">
                            <span className="text-xs opacity-70">[{getLevelLabel(item.item_level)}]</span>{' '}
                            {getItemDisplayName(item)}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => removeBestSeller(item.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No best sellers selected</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

// Luxury Brands Management Component
function LuxuryBrandsManagement({ categories, brands }: { categories: unknown[]; brands: Brand[] }) {
  const queryClient = useQueryClient();
  const [addingBrand, setAddingBrand] = useState<string | null>(null);

  const { data: luxuryBrands = [] } = useQuery({
    queryKey: ['mega-menu-luxury-brands'],
    queryFn: async () => {
      const result = await fetchMegaMenuLuxuryBrandsAdmin();
      if (isFailure(result)) throw result.error;
      return result.data || [];
    },
  });

  const addLuxuryBrand = async (categoryId: string, brandId: string) => {
    setAddingBrand(categoryId);
    try {
      const result = await addMegaMenuLuxuryBrand(categoryId, brandId);
      if (isFailure(result)) throw result.error;

      toast.success('Luxury brand added to mega menu');
      queryClient.invalidateQueries({ queryKey: ['mega-menu-luxury-brands'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
    } catch (error) {
      console.error('Error adding luxury brand:', error);
      toast.error('Failed to add luxury brand');
    } finally {
      setAddingBrand(null);
    }
  };

  const removeLuxuryBrand = async (linkId: string) => {
    try {
      const result = await removeMegaMenuLuxuryBrand(linkId);
      if (isFailure(result)) throw result.error;

      toast.success('Luxury brand removed from mega menu');
      queryClient.invalidateQueries({ queryKey: ['mega-menu-luxury-brands'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
    } catch (error) {
      console.error('Error removing luxury brand:', error);
      toast.error('Failed to remove luxury brand');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Luxury Brands
        </CardTitle>
        <CardDescription>Manage luxury brands shown in each category's mega menu</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {categories.map((category) => {
            const categoryLuxuryBrandIds = luxuryBrands
              .filter((item: unknown) => item.category_id === category.id)
              .map((item: unknown) => item.brand_id);

            const availableBrands = brands.filter((b) => !categoryLuxuryBrandIds.includes(b.id));

            const selectedBrands = luxuryBrands.filter((item: unknown) => item.category_id === category.id);

            return (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger>{category.name}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {availableBrands.length > 0 && (
                      <Select
                        onValueChange={(brandId) => addLuxuryBrand(category.id, brandId)}
                        disabled={addingBrand === category.id}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Add luxury brand..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableBrands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {selectedBrands.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedBrands.map((luxuryBrand: unknown) => (
                          <Badge key={luxuryBrand.id} variant="secondary" className="gap-1">
                            {luxuryBrand.brands?.name}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => removeLuxuryBrand(luxuryBrand.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No luxury brands selected</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

// Custom Lists Management Component
function CustomListsManagement() {
  const queryClient = useQueryClient();
  const [newListName, setNewListName] = useState('');
  const [newSystemName, setNewSystemName] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);

  const { data: customLists = [] } = useQuery({
    queryKey: ['mega-menu-custom-lists'],
    queryFn: async () => {
      const result = await fetchMegaMenuCustomLists();
      if (isFailure(result)) throw result.error;
      return result.data || [];
    },
  });

  const { data: customItems = [] } = useQuery({
    queryKey: ['mega-menu-custom-list-items'],
    queryFn: async () => {
      const result = await fetchMegaMenuCustomListItems();
      if (isFailure(result)) throw result.error;
      return result.data || [];
    },
  });

  const [newListType, setNewListType] = useState<'standard' | 'header-links'>('standard');

  const createListMutation = useMutation({
    mutationFn: async ({ name, systemName, listType }: { name: string; systemName: string; listType: string }) => {
      const result = await createMegaMenuCustomList({
        name,
        system_name: systemName,
        list_type: listType,
        is_active: true,
      });
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mega-menu-custom-lists'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-custom-lists-for-layout'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
      toast.success('Custom list created');
      setNewListName('');
      setNewSystemName('');
    },
    onError: (error: unknown) => {
      toast.error(`Failed to create list: ${error.message}`);
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteMegaMenuCustomList(id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mega-menu-custom-lists'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-custom-lists-for-layout'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
      toast.success('List deleted');
    },
    onError: (error: unknown) => {
      toast.error(`Failed to delete list: ${error.message}`);
    },
  });

  // Get item count for each list
  const getItemCount = (listId: string) => {
    return customItems.filter((item: unknown) => item.list_id === listId).length;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Custom Lists
          </CardTitle>
          <CardDescription>
            Create custom lists with links. Assign them to categories when building the mega menu layout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create New List */}
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <h3 className="text-sm font-semibold">Create New List</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="system-name">System Name (unique identifier)</Label>
                  <Input
                    id="system-name"
                    placeholder="e.g., 'shop_by_style'"
                    value={newSystemName}
                    onChange={(e) => setNewSystemName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="display-name">Display Title</Label>
                  <Input
                    id="display-name"
                    placeholder="e.g., 'Shop By Style'"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="listType"
                    value="standard"
                    checked={newListType === 'standard'}
                    onChange={(e) => setNewListType(e.target.value as 'standard' | 'header-links')}
                    className="cursor-pointer"
                  />
                  <span className="text-sm">Standard (title + custom links)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="listType"
                    value="header-links"
                    checked={newListType === 'header-links'}
                    onChange={(e) => setNewListType(e.target.value as 'standard' | 'header-links')}
                    className="cursor-pointer"
                  />
                  <span className="text-sm">Header Links (Level 2 categories)</span>
                </label>
              </div>
              <Button
                onClick={() => {
                  if (newListName.trim() && newSystemName.trim()) {
                    createListMutation.mutate({
                      name: newListName.trim(),
                      systemName: newSystemName.trim(),
                      listType: newListType,
                    });
                    setNewListName('');
                    setNewSystemName('');
                    setNewListType('standard');
                  }
                }}
                disabled={!newListName.trim() || !newSystemName.trim() || createListMutation.isPending}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create List
              </Button>
            </div>
          </div>

          {/* Custom Lists Overview */}
          {customLists.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Your Custom Lists</h3>
              <div className="space-y-2">
                {customLists.map((list: unknown) => {
                  const itemCount = getItemCount(list.id);

                  return (
                    <div
                      key={list.id}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/20"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{list.name}</h4>
                            <Badge
                              variant={list.list_type === 'header-links' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {list.list_type === 'header-links' ? 'Header Links' : 'Standard'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {itemCount} {itemCount === 1 ? 'item' : 'items'} • ID: {list.system_name}
                          </p>
                        </div>
                        {itemCount === 0 && (
                          <Badge variant="outline" className="text-xs">
                            Empty
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingListId(list.id)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Delete "${list.name}" and all its items?`)) {
                              deleteListMutation.mutate(list.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>No custom lists yet. Create your first list above.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <EditCustomListModal
        listId={editingListId}
        open={!!editingListId}
        onOpenChange={(open) => {
          if (!open) setEditingListId(null);
        }}
      />
    </div>
  );
}

// Category Link Toggle Component
function CategoryLinkToggle({ categories, refetch }: { categories: unknown[]; refetch: () => void }) {
  const [updating, setUpdating] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const toggleCategoryLink = async (id: string, currentValue: boolean) => {
    setUpdating(id);
    try {
      const result = await updateCategoryDisableMainLink(id, !currentValue);
      if (isFailure(result)) throw result.error;

      toast.success(!currentValue ? 'Category link disabled' : 'Category link enabled');

      queryClient.invalidateQueries({ queryKey: ['mega-menu-management'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
      refetch();
    } catch (error) {
      console.error('Error updating category link:', error);
      toast.error('Failed to update category link');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Main Menu Links</CardTitle>
        <CardDescription>
          Control whether main category names (Men's, Women's, etc.) are clickable links or just hover triggers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{category.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {!category.disable_main_link ? (
                  <Badge variant="secondary" className="text-xs">
                    Clickable Link
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Hover Only
                  </Badge>
                )}
                <Switch
                  checked={!(category.disable_main_link ?? false)}
                  onCheckedChange={() => toggleCategoryLink(category.id, category.disable_main_link ?? false)}
                  disabled={updating === category.id}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Category Visibility Management Component
function CategoryVisibilityManagement({ categories, refetch }: { categories: unknown[]; refetch: () => void }) {
  const [updating, setUpdating] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const toggleSubcategoryVisibility = async (
    id: string,
    table: 'product_subcategories' | 'product_sub_subcategories',
    currentValue: boolean,
  ) => {
    setUpdating(id);
    try {
      const result = await updateSubcategoryMegaMenuVisibility(id, table, !currentValue);
      if (isFailure(result)) throw result.error;

      toast.success(!currentValue ? 'Now visible in mega menu' : 'Hidden from mega menu');

      queryClient.invalidateQueries({ queryKey: ['mega-menu-management'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
      refetch();
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories Column</CardTitle>
        <CardDescription>
          Control which subcategories appear in the Categories column of each mega menu dropdown
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {categories.map((category) => (
            <AccordionItem key={category.id} value={category.id}>
              <AccordionTrigger>{category.name}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  {category.subcategories && category.subcategories.length > 0 ? (
                    <div className="space-y-3">
                      {category.subcategories.map((subcategory: unknown) => (
                        <div key={subcategory.id} className="space-y-2">
                          {/* Level 2 - Subcategories */}
                          <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{subcategory.name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {subcategory.show_in_mega_menu ? (
                                <Badge variant="secondary" className="text-xs">
                                  <Eye className="mr-1 h-3 w-3" />
                                  Visible
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  <EyeOff className="mr-1 h-3 w-3" />
                                  Hidden
                                </Badge>
                              )}
                              <Switch
                                checked={subcategory.show_in_mega_menu ?? true}
                                onCheckedChange={() =>
                                  toggleSubcategoryVisibility(
                                    subcategory.id,
                                    'product_subcategories',
                                    subcategory.show_in_mega_menu ?? true,
                                  )
                                }
                                disabled={updating === subcategory.id}
                              />
                            </div>
                          </div>

                          {/* Level 3 - Sub-subcategories */}
                          {subcategory.sub_subcategories && subcategory.sub_subcategories.length > 0 && (
                            <div className="ml-6 space-y-2">
                              {subcategory.sub_subcategories.map((subSub: unknown) => (
                                <div
                                  key={subSub.id}
                                  className="flex items-center justify-between rounded border bg-muted/30 p-2"
                                >
                                  <p className="text-sm text-muted-foreground">{subSub.name}</p>
                                  <div className="flex items-center gap-2">
                                    {subSub.show_in_mega_menu ? (
                                      <Badge variant="secondary" className="text-xs">
                                        <Eye className="mr-1 h-3 w-3" />
                                        Visible
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs">
                                        <EyeOff className="mr-1 h-3 w-3" />
                                        Hidden
                                      </Badge>
                                    )}
                                    <Switch
                                      checked={subSub.show_in_mega_menu ?? true}
                                      onCheckedChange={() =>
                                        toggleSubcategoryVisibility(
                                          subSub.id,
                                          'product_sub_subcategories',
                                          subSub.show_in_mega_menu ?? true,
                                        )
                                      }
                                      disabled={updating === subSub.id}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No subcategories for this category</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
