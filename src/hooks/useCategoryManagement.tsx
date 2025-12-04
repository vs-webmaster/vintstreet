// Category Management Hook
// Handles CRUD operations for product categories

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { filterByCategoryId, filterBySubcategoryId, filterBySubSubcategoryId } from '@/lib/filterUtils';
import {
  fetchAllCategoriesAdmin,
  uploadCategoryIcon,
  createCategoryAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin,
  toggleCategoryActive,
  generateCategorySynonyms,
  bulkGenerateCategorySynonyms,
  reorderCategoryAdmin,
  fetchAllCategoryLevelsForExport,
} from '@/services/categories/categoryAdminService';
import { isFailure } from '@/types/api';

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  display_order: number;
  synonyms: string[] | null;
}

export const useCategoryManagement = () => {
  const { user } = useAuth();
  const [generatingSynonyms, setGeneratingSynonyms] = useState<string | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  const {
    data: categories = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['product-categories-admin'],
    queryFn: async () => {
      const result = await fetchAllCategoriesAdmin();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!user?.id,
  });

  const uploadIconImage = async (file: File): Promise<string> => {
    const result = await uploadCategoryIcon(file);
    if (isFailure(result)) throw result.error;
    return result.data;
  };

  const createCategory = async (
    newCategory: { name: string; description: string; icon: string },
    uploadingIcon: File | null,
  ) => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return false;
    }

    try {
      let iconUrl = newCategory.icon;

      if (uploadingIcon) {
        toast.loading('Uploading icon...', { id: 'icon-upload' });
        iconUrl = await uploadIconImage(uploadingIcon);
        toast.dismiss('icon-upload');
      }

      const maxOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.display_order)) : 0;

      const result = await createCategoryAdmin(
        {
          name: newCategory.name,
          description: newCategory.description,
          icon: iconUrl,
        },
        maxOrder,
      );

      if (isFailure(result)) throw result.error;

      toast.success('Category created successfully');
      refetch();
      return true;
    } catch (error: any) {
      toast.error(`Failed to create category: ${error.message}`);
      return false;
    }
  };

  const updateCategory = async (editingCategory: ProductCategory, editUploadingIcon: File | null) => {
    if (!editingCategory.name.trim()) {
      toast.error('Category name is required');
      return false;
    }

    try {
      let iconUrl = editingCategory.icon;

      if (editUploadingIcon) {
        toast.loading('Uploading icon...', { id: 'icon-upload' });
        iconUrl = await uploadIconImage(editUploadingIcon);
        toast.dismiss('icon-upload');
      }

      const result = await updateCategoryAdmin(editingCategory.id, {
        name: editingCategory.name,
        description: editingCategory.description,
        icon: iconUrl,
        synonyms: editingCategory.synonyms,
      });

      if (isFailure(result)) throw result.error;

      toast.success('Category updated successfully');
      refetch();
      return true;
    } catch (error: any) {
      toast.error(`Failed to update category: ${error.message}`);
      return false;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const result = await deleteCategoryAdmin(id);
      if (isFailure(result)) throw result.error;

      toast.success('Category deleted successfully');
      refetch();
    } catch (error: any) {
      toast.error(`Failed to delete category: ${error.message}`);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const result = await toggleCategoryActive(id, currentStatus);
      if (isFailure(result)) throw result.error;

      toast.success(`Category ${!currentStatus ? 'activated' : 'deactivated'}`);
      refetch();
    } catch (error: any) {
      toast.error('Failed to update category');
    }
  };

  const generateSynonyms = async (categoryId: string, categoryName: string) => {
    setGeneratingSynonyms(categoryId);
    try {
      const result = await generateCategorySynonyms(categoryId, categoryName);
      if (isFailure(result)) throw result.error;

      toast.success(`Generated ${result.data.length} synonyms for ${categoryName}`);
      refetch();
    } catch (error: any) {
      toast.error(`Failed to generate synonyms: ${error.message}`);
    } finally {
      setGeneratingSynonyms(null);
    }
  };

  const bulkGenerateSynonyms = async () => {
    setBulkGenerating(true);
    try {
      const result = await bulkGenerateCategorySynonyms(categories.map((c) => ({ id: c.id, name: c.name })));
      if (isFailure(result)) throw result.error;

      toast.success(
        `Generated synonyms for ${result.data.successCount} categories${
          result.data.errorCount > 0 ? `, ${result.data.errorCount} failed` : ''
        }`,
      );
      refetch();
    } catch (error: any) {
      toast.error(`Failed to generate synonyms: ${error.message}`);
    } finally {
      setBulkGenerating(false);
    }
  };

  const reorderCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex((c) => c.id === categoryId);
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === categories.length - 1) return;

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentCategory = categories[currentIndex];
    const swapCategory = categories[swapIndex];

    const currentOrder = currentCategory.display_order;
    const swapOrder = swapCategory.display_order;

    try {
      const result = await reorderCategoryAdmin(currentCategory.id, swapCategory.id, currentOrder, swapOrder);
      if (isFailure(result)) throw result.error;

      toast.success('Category order updated');
      await refetch();
    } catch (error: any) {
      console.error('Reorder error:', error);
      toast.error(`Failed to reorder category: ${error.message}`);
    }
  };

  const downloadCategories = async () => {
    try {
      toast.loading('Generating Excel file...', { id: 'download-categories' });

      const result = await fetchAllCategoryLevelsForExport();
      if (isFailure(result)) throw result.error;

      const {
        level1: level1Categories,
        level2: level2Categories,
        level3: level3Categories,
        level4: level4Categories,
      } = result.data;

      const rows: any[] = [];

      level1Categories?.forEach((l1) => {
        const l2Items = filterByCategoryId(level2Categories, l1.id);

        if (l2Items.length === 0) {
          rows.push({ 'Level 1': l1.name, 'Level 2': '', 'Level 3': '', 'Level 4': '' });
        } else {
          l2Items.forEach((l2) => {
            const l3Items = filterBySubcategoryId(level3Categories, l2.id);

            if (l3Items.length === 0) {
              rows.push({ 'Level 1': l1.name, 'Level 2': l2.name, 'Level 3': '', 'Level 4': '' });
            } else {
              l3Items.forEach((l3) => {
                const l4Items = filterBySubSubcategoryId(level4Categories, l3.id);

                if (l4Items.length === 0) {
                  rows.push({ 'Level 1': l1.name, 'Level 2': l2.name, 'Level 3': l3.name, 'Level 4': '' });
                } else {
                  l4Items.forEach((l4) => {
                    rows.push({ 'Level 1': l1.name, 'Level 2': l2.name, 'Level 3': l3.name, 'Level 4': l4.name });
                  });
                }
              });
            }
          });
        }
      });

      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories');
      XLSX.writeFile(workbook, `product-categories-${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.success('Categories downloaded successfully', { id: 'download-categories' });
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(`Failed to download categories: ${error.message}`, { id: 'download-categories' });
    }
  };

  return {
    categories,
    isLoading,
    generatingSynonyms,
    bulkGenerating,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleActive,
    generateSynonyms,
    bulkGenerateSynonyms,
    reorderCategory,
    downloadCategories,
  };
};
