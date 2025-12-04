import { ChevronRight, AlertCircle } from 'lucide-react';
import { CategorySelector } from '@/components/CategorySelector';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { MultiSelectLevel4Categories } from './MultiSelectLevel4Categories';

interface CategorySelectionFormProps {
  categories: unknown[];
  subcategories: unknown[];
  subSubcategories: unknown[];
  subSubSubcategories: unknown[];
  selectedCategoryId: string;
  selectedSubcategoryId: string;
  selectedSubSubcategoryId: string;
  selectedSubSubSubcategoryId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCategorySelect: (id: string) => void;
  onSubcategorySelect: (id: string) => void;
  onSubSubcategorySelect: (id: string) => void;
  onSubSubSubcategorySelect: (id: string) => void;
  onComplete: () => void;
  aiSuggestedCategoryId?: string;
  aiSuggestedSubcategoryId?: string;
  aiSuggestedSubSubcategoryId?: string;
  aiSuggestedSubSubSubcategoryId?: string;
  productId?: string;
  isEditMode?: boolean;
}

export const CategorySelectionForm = ({
  categories,
  subcategories,
  subSubcategories,
  subSubSubcategories,
  selectedCategoryId,
  selectedSubcategoryId,
  selectedSubSubcategoryId,
  selectedSubSubSubcategoryId,
  isOpen,
  onOpenChange,
  onCategorySelect,
  onSubcategorySelect,
  onSubSubcategorySelect,
  onSubSubSubcategorySelect,
  onComplete,
  aiSuggestedCategoryId,
  aiSuggestedSubcategoryId,
  aiSuggestedSubSubcategoryId,
  aiSuggestedSubSubSubcategoryId,
  productId,
  isEditMode = false,
}: CategorySelectionFormProps) => {
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedSubcategory = subcategories.find((s) => s.id === selectedSubcategoryId);
  const selectedSubSubcategory = subSubcategories.find((s) => s.id === selectedSubSubcategoryId);
  const selectedSubSubSubcategory = subSubSubcategories.find((s) => s.id === selectedSubSubSubcategoryId);

  return (
    <div>
      <Label>Category *</Label>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="flex w-full items-center justify-between rounded-md border border-input bg-background p-3 transition-colors hover:bg-accent"
      >
        <span className={cn('text-sm', !selectedCategoryId && 'text-muted-foreground')}>
          {selectedCategoryId ? (
            <div className="flex flex-col items-start gap-1">
              <span className="font-medium">{selectedCategory?.name}</span>
              {selectedSubcategory && (
                <span className="text-xs text-muted-foreground">
                  {selectedSubcategory.name}
                  {selectedSubSubcategory && ` › ${selectedSubSubcategory.name}`}
                  {selectedSubSubSubcategory && ` › ${selectedSubSubSubcategory.name}`}
                </span>
              )}
            </div>
          ) : (
            'Select category'
          )}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
      {!selectedCategoryId && (
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          Select a category to view specific attributes
        </p>
      )}

      <CategorySelector
        open={isOpen}
        onOpenChange={onOpenChange}
        categories={categories}
        subcategories={subcategories}
        subSubcategories={subSubcategories}
        subSubSubcategories={subSubSubcategories}
        selectedCategoryId={selectedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        selectedSubSubcategoryId={selectedSubSubcategoryId}
        selectedSubSubSubcategoryId={selectedSubSubSubcategoryId}
        onCategorySelect={onCategorySelect}
        onSubcategorySelect={onSubcategorySelect}
        onSubSubcategorySelect={onSubSubcategorySelect}
        onSubSubSubcategorySelect={onSubSubSubcategorySelect}
        onComplete={onComplete}
        aiSuggestedCategoryId={aiSuggestedCategoryId}
        aiSuggestedSubcategoryId={aiSuggestedSubcategoryId}
        aiSuggestedSubSubcategoryId={aiSuggestedSubSubcategoryId}
        aiSuggestedSubSubSubcategoryId={aiSuggestedSubSubSubcategoryId}
      />

      {selectedSubSubSubcategoryId && (
        <MultiSelectLevel4Categories
          productId={productId}
          primaryLevel4Id={selectedSubSubSubcategoryId}
          subSubcategoryId={selectedSubSubcategoryId}
          isEditMode={isEditMode}
        />
      )}
    </div>
  );
};
