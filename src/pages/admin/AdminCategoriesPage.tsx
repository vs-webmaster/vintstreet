// Admin Categories Page
// Manages product categories with CRUD operations

import { useState } from 'react';
import { Download } from 'lucide-react';
import CategoryHierarchyManager from '@/components/admin/CategoryHierarchyManager';
import { CategoryCreateDialog, CategoryEditDialog } from '@/components/admin/CategoryDialogs';
import { CategoryTable } from '@/components/admin/CategoryTable';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCategoryManagement, type ProductCategory } from '@/hooks/useCategoryManagement';
import { AdminLayout } from './AdminLayout';

const AdminCategoriesPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [manageCategory, setManageCategory] = useState<ProductCategory | null>(null);

  const {
    categories,
    isLoading,
    generatingSynonyms,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleActive,
    generateSynonyms,
    reorderCategory,
    downloadCategories,
  } = useCategoryManagement();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Product Categories</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage categories and their search synonyms</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadCategories}>
              <Download className="mr-2 h-4 w-4" />
              Download Categories
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = '/admin/size-guides')}>
              Size Guides
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = '/admin/grading-guides')}>
              Grading Guides
            </Button>
            <CategoryCreateDialog
              isOpen={isCreateOpen}
              onOpenChange={setIsCreateOpen}
              onCreateCategory={createCategory}
            />
          </div>
        </div>

        <Card className="p-6">
          <CategoryTable
            categories={categories}
            isLoading={isLoading}
            onReorder={reorderCategory}
            onToggleActive={toggleActive}
            onManageSubcategories={(category) => {
              setManageCategory(category);
              setIsManageOpen(true);
            }}
            onEdit={(category) => {
              setEditingCategory(category);
              setIsEditOpen(true);
            }}
            onDelete={deleteCategory}
          />
        </Card>
      </div>

      <CategoryEditDialog
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        editingCategory={editingCategory}
        setEditingCategory={setEditingCategory}
        onUpdateCategory={updateCategory}
        onGenerateSynonyms={generateSynonyms}
        generatingSynonyms={generatingSynonyms}
      />

      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Manage Subcategories {manageCategory ? `- ${manageCategory.name}` : ''}</DialogTitle>
          </DialogHeader>
          {manageCategory && (
            <CategoryHierarchyManager category={{ id: manageCategory.id, name: manageCategory.name }} />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCategoriesPage;
