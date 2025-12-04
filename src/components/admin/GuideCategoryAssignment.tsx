import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  fetchCategoryList,
  fetchAllSubcategoriesWithCategoryName,
  fetchAllSubSubcategoriesForAssignments,
  fetchAllSubSubSubcategoriesForAssignments,
} from '@/services/categories';
import {
  fetchSizeGuideAssignments,
  fetchGradingGuideAssignments,
  saveSizeGuideAssignments,
  saveGradingGuideAssignments,
} from '@/services/guides';
import { isFailure } from '@/types/api';

interface GuideCategoryAssignmentProps {
  guideId: string;
  guideType: 'size' | 'grading';
}

const GuideCategoryAssignment = ({ guideId, guideType }: GuideCategoryAssignmentProps) => {
  const queryClient = useQueryClient();
  const [selectedCategories, setSelectedCategories] = useState<{
    level1: Set<string>;
    level2: Set<string>;
    level3: Set<string>;
    level4: Set<string>;
  }>({
    level1: new Set(),
    level2: new Set(),
    level3: new Set(),
    level4: new Set(),
  });

  const tablePrefix = guideType === 'size' ? 'size_guide' : 'grading_guide';

  // Fetch existing assignments
  const { data: existingAssignments } = useQuery({
    queryKey: [`${guideType}-guide-assignments`, guideId],
    queryFn: async () => {
      if (guideType === 'size') {
        const result = await fetchSizeGuideAssignments(guideId);
        if (isFailure(result)) throw result.error;
        return result.data;
      } else {
        const result = await fetchGradingGuideAssignments(guideId);
        if (isFailure(result)) throw result.error;
        return result.data;
      }
    },
  });

  useEffect(() => {
    if (existingAssignments) {
      setSelectedCategories(existingAssignments);
    }
  }, [existingAssignments]);

  // Fetch all categories for each level
  const { data: level1Categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const result = await fetchCategoryList();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const { data: level2Categories = [] } = useQuery({
    queryKey: ['product-subcategories'],
    queryFn: async () => {
      const result = await fetchAllSubcategoriesWithCategoryName();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const { data: level3Categories = [] } = useQuery({
    queryKey: ['product-sub-subcategories'],
    queryFn: async () => {
      const result = await fetchAllSubSubcategoriesForAssignments();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const { data: level4Categories = [] } = useQuery({
    queryKey: ['product-sub-sub-subcategories'],
    queryFn: async () => {
      const result = await fetchAllSubSubSubcategoriesForAssignments();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (guideType === 'size') {
        const result = await saveSizeGuideAssignments(guideId, selectedCategories);
        if (isFailure(result)) throw result.error;
      } else {
        const result = await saveGradingGuideAssignments(guideId, selectedCategories);
        if (isFailure(result)) throw result.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${guideType}-guide-assignments`] });
      toast.success('Category assignments saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save assignments: ${error.message}`);
    },
  });

  const toggleCategory = (level: keyof typeof selectedCategories, id: string) => {
    setSelectedCategories((prev) => {
      const newSet = new Set(prev[level]);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { ...prev, [level]: newSet };
    });
  };

  const getLevel3Label = (cat: any) => {
    const parent2 = level2Categories.find((p: any) => p.id === cat.subcategory_id);
    return `${parent2?.name ?? 'Unknown'} → ${cat.name}`;
  };

  const getLevel4Label = (cat: any) => {
    const parent3 = level3Categories.find((p: any) => p.id === cat.sub_subcategory_id);
    const parent2 = parent3 ? level2Categories.find((p: any) => p.id === parent3.subcategory_id) : undefined;
    return `${parent2?.name ?? 'Unknown'} → ${parent3?.name ?? 'Unknown'} → ${cat.name}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Assigned Categories</Label>
        <p className="mb-4 text-sm text-muted-foreground">Select which categories should display this guide</p>
      </div>

      <Tabs defaultValue="level1">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="level1">Level 1 ({selectedCategories.level1.size})</TabsTrigger>
          <TabsTrigger value="level2">Level 2 ({selectedCategories.level2.size})</TabsTrigger>
          <TabsTrigger value="level3">Level 3 ({selectedCategories.level3.size})</TabsTrigger>
          <TabsTrigger value="level4">Level 4 ({selectedCategories.level4.size})</TabsTrigger>
        </TabsList>

        <TabsContent value="level1">
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="space-y-2">
              {level1Categories.map((cat: any) => (
                <div key={cat.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`l1-${cat.id}`}
                    checked={selectedCategories.level1.has(cat.id)}
                    onCheckedChange={() => toggleCategory('level1', cat.id)}
                  />
                  <label htmlFor={`l1-${cat.id}`} className="cursor-pointer text-sm">
                    {cat.name}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="level2">
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="space-y-2">
              {level2Categories.map((cat: any) => (
                <div key={cat.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`l2-${cat.id}`}
                    checked={selectedCategories.level2.has(cat.id)}
                    onCheckedChange={() => toggleCategory('level2', cat.id)}
                  />
                  <label htmlFor={`l2-${cat.id}`} className="cursor-pointer text-sm">
                    {cat.product_categories?.name} → {cat.name}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="level3">
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="space-y-2">
              {level3Categories.map((cat: any) => (
                <div key={cat.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`l3-${cat.id}`}
                    checked={selectedCategories.level3.has(cat.id)}
                    onCheckedChange={() => toggleCategory('level3', cat.id)}
                  />
                  <label htmlFor={`l3-${cat.id}`} className="cursor-pointer text-sm">
                    {getLevel3Label(cat)}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="level4">
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="space-y-2">
              {level4Categories.map((cat: any) => (
                <div key={cat.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`l4-${cat.id}`}
                    checked={selectedCategories.level4.has(cat.id)}
                    onCheckedChange={() => toggleCategory('level4', cat.id)}
                  />
                  <label htmlFor={`l4-${cat.id}`} className="cursor-pointer text-sm">
                    {getLevel4Label(cat)}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
        {saveMutation.isPending ? 'Saving...' : 'Save Category Assignments'}
      </Button>
    </div>
  );
};

export default GuideCategoryAssignment;
