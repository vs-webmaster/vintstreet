// Category Create and Edit Dialogs
// Reusable dialogs for category management

import { useState } from 'react';
import { Plus, X, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProductCategory } from '@/hooks/useCategoryManagement';

interface CategoryCreateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCategory: (
    category: { name: string; description: string; icon: string },
    uploadingIcon: File | null
  ) => Promise<boolean>;
}

export const CategoryCreateDialog = ({
  isOpen,
  onOpenChange,
  onCreateCategory,
}: CategoryCreateDialogProps) => {
  const [newCategory, setNewCategory] = useState({ name: '', description: '', icon: '' });
  const [uploadingIcon, setUploadingIcon] = useState<File | null>(null);

  const handleCreate = async () => {
    const success = await onCreateCategory(newCategory, uploadingIcon);
    if (success) {
      setNewCategory({ name: '', description: '', icon: '' });
      setUploadingIcon(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="e.g., Clothing"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              placeholder="Category description"
            />
          </div>
          <div>
            <Label>Search Synonyms</Label>
            <p className="mb-2 text-xs text-muted-foreground">Alternative terms users might search for</p>
            <Input placeholder="Leave empty - will be generated after creation" disabled />
          </div>
          <div>
            <Label>Icon Image</Label>
            <div className="space-y-2">
              {uploadingIcon ? (
                <div className="relative h-24 w-24 overflow-hidden rounded-lg border">
                  <img
                    src={URL.createObjectURL(uploadingIcon)}
                    alt="Icon preview"
                    className="h-full w-full object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() => setUploadingIcon(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : newCategory.icon ? (
                <div className="relative h-24 w-24 overflow-hidden rounded-lg border">
                  <img src={newCategory.icon} alt="Current icon" className="h-full w-full object-cover" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() => setNewCategory({ ...newCategory, icon: '' })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setUploadingIcon(file);
                  }}
                  className="cursor-pointer"
                />
                <p className="mt-1 text-xs text-muted-foreground">Upload an icon image for this category</p>
              </div>
            </div>
          </div>
          <Button onClick={handleCreate} className="w-full">
            Create Category
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface CategoryEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: ProductCategory | null;
  setEditingCategory: (category: ProductCategory | null) => void;
  onUpdateCategory: (category: ProductCategory, uploadingIcon: File | null) => Promise<boolean>;
  onGenerateSynonyms: (categoryId: string, categoryName: string) => Promise<void>;
  generatingSynonyms: string | null;
}

export const CategoryEditDialog = ({
  isOpen,
  onOpenChange,
  editingCategory,
  setEditingCategory,
  onUpdateCategory,
  onGenerateSynonyms,
  generatingSynonyms,
}: CategoryEditDialogProps) => {
  const [editUploadingIcon, setEditUploadingIcon] = useState<File | null>(null);

  const handleUpdate = async () => {
    if (!editingCategory) return;
    const success = await onUpdateCategory(editingCategory, editUploadingIcon);
    if (success) {
      setEditingCategory(null);
      setEditUploadingIcon(null);
      onOpenChange(false);
    }
  };

  const handleAddSynonym = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && editingCategory) {
      const value = e.currentTarget.value.trim().toLowerCase();
      if (value && !editingCategory.synonyms?.includes(value)) {
        setEditingCategory({
          ...editingCategory,
          synonyms: [...(editingCategory.synonyms || []), value],
        });
        e.currentTarget.value = '';
      }
    }
  };

  const handleRemoveSynonym = (index: number) => {
    if (editingCategory) {
      const newSynonyms = [...(editingCategory.synonyms || [])];
      newSynonyms.splice(index, 1);
      setEditingCategory({ ...editingCategory, synonyms: newSynonyms });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        {editingCategory && (
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editingCategory.name}
                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={editingCategory.description}
                onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Search Synonyms</Label>
              <div className="space-y-2">
                <div className="flex min-h-[40px] flex-wrap gap-2 rounded-md border p-2">
                  {editingCategory.synonyms && editingCategory.synonyms.length > 0 ? (
                    editingCategory.synonyms.map((synonym, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {synonym}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => handleRemoveSynonym(idx)}
                        />
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No synonyms yet</span>
                  )}
                </div>
                <Input placeholder="Type synonym and press Enter..." onKeyDown={handleAddSynonym} />
                <Button
                  type="button"
                  onClick={() => onGenerateSynonyms(editingCategory.id, editingCategory.name)}
                  size="sm"
                  variant="outline"
                  disabled={generatingSynonyms === editingCategory.id}
                  className="w-full"
                >
                  {generatingSynonyms === editingCategory.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label>Icon Image</Label>
              <div className="space-y-2">
                {editUploadingIcon ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-lg border">
                    <img
                      src={URL.createObjectURL(editUploadingIcon)}
                      alt="Icon preview"
                      className="h-full w-full object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-6 w-6 p-0"
                      onClick={() => setEditUploadingIcon(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : editingCategory.icon ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-lg border">
                    <img src={editingCategory.icon} alt="Current icon" className="h-full w-full object-cover" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-6 w-6 p-0"
                      onClick={() => setEditingCategory({ ...editingCategory, icon: '' })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setEditUploadingIcon(file);
                    }}
                    className="cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Upload a new icon image</p>
                </div>
              </div>
            </div>
            <Button onClick={handleUpdate} className="w-full">
              Update Category
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
