import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Filter, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  fetchCategoryList,
  fetchSubcategoriesMinimal,
  fetchSubSubcategoriesMinimal,
  fetchSubSubSubcategoriesMinimal,
} from '@/services/categories';
import {
  fetchCategoryFilters,
  fetchAvailableAttributesForCategory,
  saveCategoryFilters,
} from '@/services/categoryFilters';
import { isFailure } from '@/types/api';
import { AdminLayout } from './AdminLayout';

const AdminCategoryFiltersPage = () => {
  const queryClient = useQueryClient();
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | 4>(1);
  const [selectedLevel1, setSelectedLevel1] = useState<string>('');
  const [selectedLevel2, setSelectedLevel2] = useState<string>('');
  const [selectedLevel3, setSelectedLevel3] = useState<string>('');
  const [selectedLevel4, setSelectedLevel4] = useState<string>('');

  // Fetch categories
  const { data: level1Categories = [] } = useQuery({
    queryKey: ['level1-categories'],
    queryFn: async () => {
      const result = await fetchCategoryList();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const { data: level2Categories = [] } = useQuery({
    queryKey: ['level2-categories', selectedLevel1],
    queryFn: async () => {
      if (!selectedLevel1) return [];
      const result = await fetchSubcategoriesMinimal(selectedLevel1);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!selectedLevel1 && selectedLevel >= 2,
  });

  const { data: level3Categories = [] } = useQuery({
    queryKey: ['level3-categories', selectedLevel2],
    queryFn: async () => {
      if (!selectedLevel2) return [];
      const result = await fetchSubSubcategoriesMinimal(selectedLevel2);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!selectedLevel2 && selectedLevel >= 3,
  });

  const { data: level4Categories = [] } = useQuery({
    queryKey: ['level4-categories', selectedLevel3],
    queryFn: async () => {
      if (!selectedLevel3) return [];
      const result = await fetchSubSubSubcategoriesMinimal(selectedLevel3);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!selectedLevel3 && selectedLevel >= 4,
  });

  // Get current category IDs based on level
  const getCurrentCategoryIds = () => {
    const ids: any = {
      category_id: null,
      subcategory_id: null,
      sub_subcategory_id: null,
      sub_sub_subcategory_id: null,
    };

    if (selectedLevel === 1 && selectedLevel1) {
      ids.category_id = selectedLevel1;
    } else if (selectedLevel === 2 && selectedLevel2) {
      ids.category_id = selectedLevel1;
      ids.subcategory_id = selectedLevel2;
    } else if (selectedLevel === 3 && selectedLevel3) {
      ids.category_id = selectedLevel1;
      ids.subcategory_id = selectedLevel2;
      ids.sub_subcategory_id = selectedLevel3;
    } else if (selectedLevel === 4 && selectedLevel4) {
      ids.category_id = selectedLevel1;
      ids.subcategory_id = selectedLevel2;
      ids.sub_subcategory_id = selectedLevel3;
      ids.sub_sub_subcategory_id = selectedLevel4;
    }

    return ids;
  };

  // Define default filters
  const defaultFilters = [
    { id: 'default-categories', name: 'Categories', display_label: 'Categories', type: 'default' },
    { id: 'default-brand', name: 'Brand', display_label: 'Brand', type: 'default' },
    { id: 'default-colour', name: 'Colour', display_label: 'Colour', type: 'default' },
    { id: 'default-size', name: 'Size', display_label: 'Size', type: 'default' },
  ];

  // Fetch available attributes with options for the selected category
  const { data: availableAttributes = [] } = useQuery({
    queryKey: [
      'category-available-attributes',
      selectedLevel,
      selectedLevel1,
      selectedLevel2,
      selectedLevel3,
      selectedLevel4,
    ],
    queryFn: async () => {
      const ids = getCurrentCategoryIds();
      if (!ids.category_id && !ids.subcategory_id && !ids.sub_subcategory_id && !ids.sub_sub_subcategory_id) {
        return [];
      }

      const result = await fetchAvailableAttributesForCategory({
        category_id: ids.category_id || null,
        subcategory_id: ids.subcategory_id || null,
        sub_subcategory_id: ids.sub_subcategory_id || null,
      });

      if (isFailure(result)) throw result.error;

      return result.data.map((attr) => ({
        ...attr,
        type: 'attribute',
      }));
    },
    enabled: !!(
      (selectedLevel === 1 && selectedLevel1) ||
      (selectedLevel === 2 && selectedLevel2) ||
      (selectedLevel === 3 && selectedLevel3) ||
      (selectedLevel === 4 && selectedLevel4)
    ),
  });

  // Combine default filters with attribute filters
  const allFilters = [...defaultFilters, ...availableAttributes];

  // Fetch currently enabled filter attributes and default filters
  const { data: enabledFilters = [] } = useQuery({
    queryKey: [
      'category-enabled-filters',
      selectedLevel,
      selectedLevel1,
      selectedLevel2,
      selectedLevel3,
      selectedLevel4,
    ],
    queryFn: async () => {
      const ids = getCurrentCategoryIds();
      if (!ids.category_id && !ids.subcategory_id && !ids.sub_subcategory_id && !ids.sub_sub_subcategory_id) {
        return [];
      }

      const result = await fetchCategoryFilters({
        category_id: ids.category_id || null,
        subcategory_id: ids.subcategory_id || null,
        sub_subcategory_id: ids.sub_subcategory_id || null,
        sub_sub_subcategory_id: ids.sub_sub_subcategory_id || null,
      });

      if (isFailure(result)) throw result.error;

      return result.data;
    },
    enabled: !!(
      (selectedLevel === 1 && selectedLevel1) ||
      (selectedLevel === 2 && selectedLevel2) ||
      (selectedLevel === 3 && selectedLevel3) ||
      (selectedLevel === 4 && selectedLevel4)
    ),
  });

  // Track which attributes are enabled locally
  const [enabledAttributeIds, setEnabledAttributeIds] = useState<Set<string>>(new Set());
  const [topLineAttributeIds, setTopLineAttributeIds] = useState<Set<string>>(new Set());

  // Update local state when enabled filters change
  useEffect(() => {
    if (enabledFilters) {
      const enabledIds = new Set<string>();
      const topLineIds = new Set<string>();

      enabledFilters.forEach((f: any) => {
        const id = f.filter_type === 'default' ? f.filter_name : f.attribute_id;
        if (id) {
          enabledIds.add(id);
          if (f.show_in_top_line) topLineIds.add(id);
        }
      });

      setEnabledAttributeIds(enabledIds);
      setTopLineAttributeIds(topLineIds);
    }
  }, [enabledFilters]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const ids = getCurrentCategoryIds();

      const result = await saveCategoryFilters(
        {
          category_id: ids.category_id || null,
          subcategory_id: ids.subcategory_id || null,
          sub_subcategory_id: ids.sub_subcategory_id || null,
          sub_sub_subcategory_id: ids.sub_sub_subcategory_id || null,
        },
        Array.from(enabledAttributeIds),
        topLineAttributeIds,
      );

      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-enabled-filters'] });
      queryClient.invalidateQueries({ queryKey: ['category-available-attributes'] });
      toast.success('Filter settings saved successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const canSave =
    (selectedLevel === 1 && selectedLevel1) ||
    (selectedLevel === 2 && selectedLevel2) ||
    (selectedLevel === 3 && selectedLevel3) ||
    (selectedLevel === 4 && selectedLevel4);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Filter className="h-6 w-6" />
              Category Filter Settings
            </h1>
            <p className="mt-1 text-muted-foreground">Configure which filters are shown for each category level</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Category</CardTitle>
            <CardDescription>Choose the category level and specific category to configure filters for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Category Level</Label>
              <Select
                value={selectedLevel.toString()}
                onValueChange={(value) => {
                  setSelectedLevel(Number(value) as 1 | 2 | 3 | 4);
                  setSelectedLevel2('');
                  setSelectedLevel3('');
                  setSelectedLevel4('');
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1 (Main Category)</SelectItem>
                  <SelectItem value="2">Level 2 (Subcategory)</SelectItem>
                  <SelectItem value="3">Level 3 (Sub-subcategory)</SelectItem>
                  <SelectItem value="4">Level 4 (Sub-sub-subcategory)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedLevel >= 1 && (
              <div className="space-y-2">
                <Label>Level 1 Category</Label>
                <Select value={selectedLevel1} onValueChange={setSelectedLevel1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select main category..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {level1Categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedLevel >= 2 && selectedLevel1 && (
              <div className="space-y-2">
                <Label>Level 2 Subcategory</Label>
                <Select value={selectedLevel2} onValueChange={setSelectedLevel2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {level2Categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedLevel >= 3 && selectedLevel2 && (
              <div className="space-y-2">
                <Label>Level 3 Sub-subcategory</Label>
                <Select value={selectedLevel3} onValueChange={setSelectedLevel3}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-subcategory..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {level3Categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedLevel >= 4 && selectedLevel3 && (
              <div className="space-y-2">
                <Label>Level 4 Sub-sub-subcategory</Label>
                <Select value={selectedLevel4} onValueChange={setSelectedLevel4}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-sub-subcategory..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {level4Categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {canSave && allFilters.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Available Product Filters</CardTitle>
              <CardDescription>
                Toggle which filters should be available on the shop page for this category. Default filters
                (Categories, Brand, Colour, Size) and attribute-based filters can be enabled and configured to show on
                the top line or in "More Filters". Price and Sort always remain on the top line.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {allFilters.map((attr: any) => (
                <div key={attr.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex-1 space-y-0.5">
                    <Label>
                      {attr.display_label || attr.name}
                      {attr.type === 'default' && (
                        <span className="ml-2 text-xs text-muted-foreground">(Default Filter)</span>
                      )}
                    </Label>
                    {attr.type === 'attribute' && !attr.hasOptions && (
                      <p className="text-xs text-muted-foreground">No preset options - won't function as filter</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {enabledAttributeIds.has(attr.id) && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Show on top line</Label>
                        <Switch
                          checked={topLineAttributeIds.has(attr.id)}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(topLineAttributeIds);
                            if (checked) {
                              newSet.add(attr.id);
                            } else {
                              newSet.delete(attr.id);
                            }
                            setTopLineAttributeIds(newSet);
                          }}
                        />
                      </div>
                    )}
                    <Switch
                      checked={enabledAttributeIds.has(attr.id)}
                      onCheckedChange={(checked) => {
                        const newSet = new Set(enabledAttributeIds);
                        if (checked) {
                          newSet.add(attr.id);
                        } else {
                          newSet.delete(attr.id);
                          // Also remove from top line if disabled
                          const newTopLineSet = new Set(topLineAttributeIds);
                          newTopLineSet.delete(attr.id);
                          setTopLineAttributeIds(newTopLineSet);
                        }
                        setEnabledAttributeIds(newSet);
                      }}
                    />
                  </div>
                </div>
              ))}

              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {saveMutation.isPending ? 'Saving...' : 'Save Filter Settings'}
              </Button>
            </CardContent>
          </Card>
        )}

        {canSave && allFilters.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No attributes found for this category combination.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCategoryFiltersPage;
