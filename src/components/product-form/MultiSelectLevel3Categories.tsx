import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { fetchSubSubcategories } from '@/services/categories';
import {
  fetchProductLevel3Categories,
  addProductLevel3Category,
  removeProductLevel3Category,
} from '@/services/products';
import { isFailure } from '@/types/api';

interface MultiSelectLevel3CategoriesProps {
  productId?: string;
  primaryLevel3Id: string;
  subcategoryId: string;
  isEditMode: boolean;
}

export const MultiSelectLevel3Categories = ({
  productId,
  primaryLevel3Id,
  subcategoryId,
  isEditMode,
}: MultiSelectLevel3CategoriesProps) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch available Level 3 categories (sub_subcategories) under the same Level 2 parent
  const { data: availableCategories = [] } = useQuery({
    queryKey: ['sub-subcategories', subcategoryId],
    queryFn: async () => {
      if (!subcategoryId) return [];

      const result = await fetchSubSubcategories(subcategoryId);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!subcategoryId,
  });

  // Fetch currently selected additional Level 3 categories
  const { data: existingSelections = [], refetch } = useQuery({
    queryKey: ['product-level3-categories', productId],
    queryFn: async () => {
      if (!productId) return [];

      const result = await fetchProductLevel3Categories(productId);
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

  // Filter out the primary Level 3 category from available options
  const selectableCategories = availableCategories.filter((cat) => cat.id !== primaryLevel3Id);

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
          const result = await removeProductLevel3Category(productId, categoryId);
          if (isFailure(result)) throw result.error;
        } else {
          // Add the category
          const result = await addProductLevel3Category(productId, categoryId);
          if (isFailure(result)) throw result.error;
        }

        await refetch();
      } catch (error) {
        console.error('Error updating Level 3 categories:', error);
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

  if (!subcategoryId || selectableCategories.length === 0) {
    return null;
  }

  const selectedCategoryNames = availableCategories
    .filter((cat) => selectedCategories.includes(cat.id))
    .map((cat) => ({ id: cat.id, name: cat.name }));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Additional Level 3 Categories (Sub-subcategories)</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Select additional sub-subcategories this product belongs to
        </p>
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
              id={`level3-${category.id}`}
              checked={selectedCategories.includes(category.id)}
              onCheckedChange={() => handleToggle(category.id)}
              disabled={isSaving}
            />
            <label
              htmlFor={`level3-${category.id}`}
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

