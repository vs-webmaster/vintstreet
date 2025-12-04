import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { fetchSubcategories } from '@/services/categories';
import {
  fetchProductLevel2Categories,
  addProductLevel2Category,
  removeProductLevel2Category,
} from '@/services/products';
import { isFailure } from '@/types/api';

interface MultiSelectLevel2CategoriesProps {
  productId?: string;
  primaryLevel2Id: string;
  categoryId: string;
  isEditMode: boolean;
}

export const MultiSelectLevel2Categories = ({
  productId,
  primaryLevel2Id,
  categoryId,
  isEditMode,
}: MultiSelectLevel2CategoriesProps) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch available Level 2 categories (subcategories) under the same Level 1 parent
  const { data: availableCategories = [] } = useQuery({
    queryKey: ['subcategories', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];

      const result = await fetchSubcategories(categoryId);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!categoryId,
  });

  // Fetch currently selected additional Level 2 categories
  const { data: existingSelections = [], refetch } = useQuery({
    queryKey: ['product-level2-categories', productId],
    queryFn: async () => {
      if (!productId) return [];

      const result = await fetchProductLevel2Categories(productId);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: isEditMode && !!productId,
  });

  // Initialize selected categories from existing data
  useEffect(() => {
    if (isEditMode && existingSelections.length > 0) {
      setSelectedCategories(existingSelections);
    }
  }, [existingSelections, isEditMode]);

  // Filter out the primary Level 2 category from available options
  const selectableCategories = availableCategories.filter((cat) => cat.id !== primaryLevel2Id);

  const handleToggle = async (categoryId: string) => {
    const isCurrentlySelected = selectedCategories.includes(categoryId);
    const newSelected = isCurrentlySelected
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];

    setSelectedCategories(newSelected);

    // If editing existing product, save immediately to database
    if (isEditMode && productId) {
      setIsSaving(true);
      try {
        if (isCurrentlySelected) {
          // Remove the category
          const result = await removeProductLevel2Category(productId, categoryId);
          if (isFailure(result)) throw result.error;
        } else {
          // Add the category
          const result = await addProductLevel2Category(productId, categoryId);
          if (isFailure(result)) throw result.error;
        }

        await refetch();
      } catch (error) {
        console.error('Error updating Level 2 categories:', error);
        toast.error('Failed to update category');
        // Revert the change
        setSelectedCategories(
          isCurrentlySelected
            ? [...selectedCategories, categoryId]
            : selectedCategories.filter((id) => id !== categoryId),
        );
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleRemove = (categoryId: string) => {
    handleToggle(categoryId);
  };

  if (!categoryId || selectableCategories.length === 0) {
    return null;
  }

  const selectedCategoryNames = availableCategories
    .filter((cat) => selectedCategories.includes(cat.id))
    .map((cat) => ({ id: cat.id, name: cat.name }));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Additional Level 2 Categories (Subcategories)</Label>
        <p className="mt-1 text-xs text-muted-foreground">Select additional subcategories this product belongs to</p>
      </div>

      {selectedCategoryNames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategoryNames.map((cat) => (
            <Badge key={cat.id} variant="secondary" className="gap-1">
              {cat.name}
              <button
                type="button"
                onClick={() => handleRemove(cat.id)}
                disabled={isSaving}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-md border p-4">
        {selectableCategories.map((category) => (
          <div key={category.id} className="flex items-center space-x-2">
            <Checkbox
              id={`level2-${category.id}`}
              checked={selectedCategories.includes(category.id)}
              onCheckedChange={() => handleToggle(category.id)}
              disabled={isSaving}
            />
            <label
              htmlFor={`level2-${category.id}`}
              className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {category.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export const getSelectedAdditionalLevel2Categories = (selectedIds: string[]) => {
  return selectedIds;
};
