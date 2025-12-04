import { useQuery } from '@tanstack/react-query';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { groupByNameWithIds } from '@/lib/groupUtils';
import { fetchAttributeByName, fetchAttributeOptionsWithIdsByAttributeId } from '@/services/attributes';
import { fetchAllSubSubcategories, fetchAllSubSubSubcategories } from '@/services/categories';
import { isFailure } from '@/types/api';

interface AdminProductFiltersProps {
  selectedLevel3: string[];
  selectedLevel4: string[];
  selectedColors: string[];
  onLevel3Change: (values: string[]) => void;
  onLevel4Change: (values: string[]) => void;
  onColorsChange: (values: string[]) => void;
}

export const AdminProductFilters = ({
  selectedLevel3,
  selectedLevel4,
  selectedColors,
  onLevel3Change,
  onLevel4Change,
  onColorsChange,
}: AdminProductFiltersProps) => {
  // Fetch level 3 categories (sub_subcategories) - deduplicated by name
  const { data: level3Categories = [], isLoading: level3Loading } = useQuery({
    queryKey: ['admin-filter-level3'],
    staleTime: 300000, // Cache for 5 minutes
    queryFn: async () => {
      const result = await fetchAllSubSubcategories();
      if (isFailure(result)) throw result.error;
      return groupByNameWithIds((result.data || []).map((cat) => ({ id: cat.id, name: cat.name })));
    },
  });

  // Fetch level 4 categories (sub_sub_subcategories) - deduplicated by name
  const { data: level4Categories = [], isLoading: level4Loading } = useQuery({
    queryKey: ['admin-filter-level4'],
    staleTime: 300000, // Cache for 5 minutes
    queryFn: async () => {
      const result = await fetchAllSubSubSubcategories();
      if (isFailure(result)) throw result.error;
      return groupByNameWithIds((result.data || []).map((cat) => ({ id: cat.id, name: cat.name })));
    },
  });

  // Fetch color attribute options
  const { data: colors = [], isLoading: colorsLoading } = useQuery({
    queryKey: ['admin-filter-colors'],
    staleTime: 300000, // Cache for 5 minutes
    queryFn: async () => {
      // First get the colour/color attribute
      const attrResult = await fetchAttributeByName('Colour');
      if (isFailure(attrResult)) throw attrResult.error;
      if (!attrResult.data) return [];

      // Then get its options with IDs
      const optionsResult = await fetchAttributeOptionsWithIdsByAttributeId(attrResult.data.id);
      if (isFailure(optionsResult)) throw optionsResult.error;

      return optionsResult.data || [];
    },
  });

  const handleLevel3Toggle = (categoryIds: string[]) => {
    // Check if any of these IDs are already selected
    const hasAnySelected = categoryIds.some((id) => selectedLevel3.includes(id));

    if (hasAnySelected) {
      // Remove all IDs associated with this name
      onLevel3Change(selectedLevel3.filter((id) => !categoryIds.includes(id)));
    } else {
      // Add all IDs associated with this name
      onLevel3Change([...selectedLevel3, ...categoryIds]);
    }
  };

  const handleLevel4Toggle = (categoryIds: string[]) => {
    // Check if any of these IDs are already selected
    const hasAnySelected = categoryIds.some((id) => selectedLevel4.includes(id));

    if (hasAnySelected) {
      // Remove all IDs associated with this name
      onLevel4Change(selectedLevel4.filter((id) => !categoryIds.includes(id)));
    } else {
      // Add all IDs associated with this name
      onLevel4Change([...selectedLevel4, ...categoryIds]);
    }
  };

  const handleColorToggle = (colorValue: string) => {
    if (selectedColors.includes(colorValue)) {
      onColorsChange(selectedColors.filter((c) => c !== colorValue));
    } else {
      onColorsChange([...selectedColors, colorValue]);
    }
  };

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="sticky top-4 rounded-lg border bg-card p-3">
        <Accordion type="multiple" defaultValue={['level3', 'level4', 'colors']} className="w-full">
          {/* Level 3 Categories */}
          <AccordionItem value="level3">
            <AccordionTrigger className="text-sm font-medium">
              Category Level 3
              {selectedLevel3.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">({selectedLevel3.length})</span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              {level3Loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <ScrollArea className="h-[140px]">
                  <div className="space-y-0.5 pr-4">
                    {level3Categories.map((category: any) => (
                      <label
                        key={category.name}
                        className="flex cursor-pointer items-center gap-2 rounded p-1 hover:bg-accent/50"
                      >
                        <Checkbox
                          checked={category.ids.some((id: string) => selectedLevel3.includes(id))}
                          onCheckedChange={() => handleLevel3Toggle(category.ids)}
                        />
                        <span className="text-sm">{category.name}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Level 4 Categories */}
          <AccordionItem value="level4">
            <AccordionTrigger className="text-sm font-medium">
              Category Level 4
              {selectedLevel4.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">({selectedLevel4.length})</span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              {level4Loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <ScrollArea className="h-[140px]">
                  <div className="space-y-0.5 pr-4">
                    {level4Categories.map((category: any) => (
                      <label
                        key={category.name}
                        className="flex cursor-pointer items-center gap-2 rounded p-1 hover:bg-accent/50"
                      >
                        <Checkbox
                          checked={category.ids.some((id: string) => selectedLevel4.includes(id))}
                          onCheckedChange={() => handleLevel4Toggle(category.ids)}
                        />
                        <span className="text-sm">{category.name}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Colors */}
          <AccordionItem value="colors">
            <AccordionTrigger className="text-sm font-medium">
              Colours
              {selectedColors.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">({selectedColors.length})</span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              {colorsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <ScrollArea className="h-[140px]">
                  <div className="space-y-0.5 pr-4">
                    {colors.map((color) => (
                      <label
                        key={color.id}
                        className="flex cursor-pointer items-center gap-2 rounded p-1 hover:bg-accent/50"
                      >
                        <Checkbox
                          checked={selectedColors.includes(color.value)}
                          onCheckedChange={() => handleColorToggle(color.value)}
                        />
                        <span className="text-sm">{color.value}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </aside>
  );
};
