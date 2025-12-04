import { useCallback } from 'react';

interface UseCategorySelectionProps {
  updateFormData: (field: string, value: unknown) => void;
  resetDynamicAttributes: () => void;
}

export const useCategorySelection = ({ updateFormData, resetDynamicAttributes }: UseCategorySelectionProps) => {
  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      updateFormData('categoryId', categoryId);
      updateFormData('subcategoryId', '');
      updateFormData('subSubcategoryId', '');
      updateFormData('subSubSubcategoryId', '');
      resetDynamicAttributes();
    },
    [updateFormData, resetDynamicAttributes],
  );

  const handleSubcategorySelect = useCallback(
    (subcategoryId: string) => {
      updateFormData('subcategoryId', subcategoryId);
      updateFormData('subSubcategoryId', '');
      updateFormData('subSubSubcategoryId', '');
      resetDynamicAttributes();
    },
    [updateFormData, resetDynamicAttributes],
  );

  const handleSubSubcategorySelect = useCallback(
    (subSubcategoryId: string) => {
      updateFormData('subSubcategoryId', subSubcategoryId);
      updateFormData('subSubSubcategoryId', '');
    },
    [updateFormData],
  );

  const handleSubSubSubcategorySelect = useCallback(
    (subSubSubcategoryId: string) => {
      updateFormData('subSubSubcategoryId', subSubSubcategoryId);
    },
    [updateFormData],
  );

  return {
    handleCategorySelect,
    handleSubcategorySelect,
    handleSubSubcategorySelect,
    handleSubSubSubcategorySelect,
  };
};
