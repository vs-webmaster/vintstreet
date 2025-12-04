import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { fetchSubSubSubcategories } from '@/services/categories';
import {
  fetchProductLevel4Categories,
  addProductLevel4Category,
  removeProductLevel4Category,
} from '@/services/products';
import { isFailure } from '@/types/api';

interface MultiSelectLevel4CategoriesProps {
  productId?: string;
  primaryLevel4Id: string;
  subSubcategoryId: string;
  isEditMode: boolean;
}

export const MultiSelectLevel4Categories = ({
  productId,
  primaryLevel4Id,
  subSubcategoryId,
  isEditMode,
}: MultiSelectLevel4CategoriesProps) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch available Level 4 categories under the same Level 3 parent
  const { data: availableCategories = [] } = useQuery({
    queryKey: ['sub-sub-subcategories', subSubcategoryId],
    queryFn: async () => {
      if (!subSubcategoryId) return [];

      const result = await fetchSubSubSubcategories(subSubcategoryId);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!subSubcategoryId,
  });

  // Fetch currently selected additional Level 4 categories
  const { data: existingSelections = [], refetch } = useQuery({
    queryKey: ['product-level4-categories', productId],
    queryFn: async () => {
      if (!productId) return [];

      const result = await fetchProductLevel4Categories(productId);
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

  // Filter out the primary Level 4 category from available options
  const selectableCategories = availableCategories.filter((cat) => cat.id !== primaryLevel4Id);

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
          const result = await removeProductLevel4Category(productId, categoryId);
          if (isFailure(result)) throw result.error;
        } else {
          // Add the category
          const result = await addProductLevel4Category(productId, categoryId);
          if (isFailure(result)) throw result.error;
        }

        await refetch();
      } catch (error) {
        console.error('Error updating Level 4 categories:', error);
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

  const handleRemove = async (categoryId: string) => {
    await handleToggle(categoryId);
  };

  if (!primaryLevel4Id || selectableCategories.length === 0) {
    return null;
  }

  const selectedCategoryObjects = availableCategories.filter((cat) => selectedCategories.includes(cat.id));

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">Additional Level 4 Categories (Optional)</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Select additional categories that also describe this product
        </p>
      </div>

      {selectedCategoryObjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategoryObjects.map((cat) => (
            <Badge key={cat.id} variant="secondary" className="gap-1 pr-1">
              {cat.name}
              <button
                type="button"
                onClick={() => handleRemove(cat.id)}
                className="ml-1 rounded-sm p-0.5 hover:bg-destructive/20"
                disabled={isSaving}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
        {selectableCategories.map((category) => (
          <div key={category.id} className="flex items-center space-x-2">
            <Checkbox
              id={`level4-${category.id}`}
              checked={selectedCategories.includes(category.id)}
              onCheckedChange={() => handleToggle(category.id)}
              disabled={isSaving}
            />
            <label htmlFor={`level4-${category.id}`} className="flex-1 cursor-pointer text-sm">
              {category.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

