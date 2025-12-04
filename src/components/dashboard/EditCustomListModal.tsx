import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  fetchCategoriesMinimal,
  fetchSubcategoriesMinimal,
  fetchSubSubcategoriesMinimal,
  fetchSubSubSubcategoriesMinimal,
  fetchCategoryByIdAndLevel,
} from '@/services/categories';
import {
  fetchMegaMenuCustomListById,
  fetchMegaMenuCustomListItemsByListId,
  updateMegaMenuCustomList,
  createMegaMenuCustomListItem,
  updateMegaMenuCustomListItem,
  deleteMegaMenuCustomListItem,
} from '@/services/megaMenu';
import { isFailure } from '@/types/api';

interface EditCustomListModalProps {
  listId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditCustomListModal = ({ listId, open, onOpenChange }: EditCustomListModalProps) => {
  const queryClient = useQueryClient();
  const [editingListName, setEditingListName] = useState('');
  const [editingSystemName, setEditingSystemName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [itemType, setItemType] = useState<'url' | 'category'>('url');
  const [selectedLevel1, setSelectedLevel1] = useState<string>('');
  const [selectedLevel2, setSelectedLevel2] = useState<string>('');
  const [selectedLevel3, setSelectedLevel3] = useState<string>('');
  const [selectedLevel4, setSelectedLevel4] = useState<string>('');
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data: list } = useQuery({
    queryKey: ['mega-menu-custom-list', listId],
    queryFn: async () => {
      if (!listId) return null;
      const result = await fetchMegaMenuCustomListById(listId);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!listId && open,
  });

  const listType = list?.list_type || 'standard';

  const { data: items = [] } = useQuery({
    queryKey: ['mega-menu-custom-list-items', listId],
    queryFn: async () => {
      if (!listId) return [];
      const result = await fetchMegaMenuCustomListItemsByListId(listId);
      if (isFailure(result)) throw result.error;

      // Fetch category names for items with category_id
      const itemsWithCategories = await Promise.all(
        (result.data || []).map(async (item: any) => {
          if (item.category_id && item.category_level) {
            const catResult = await fetchCategoryByIdAndLevel(item.category_id, item.category_level);
            if (isFailure(catResult)) {
              console.error('Failed to fetch category:', catResult.error);
              return { ...item, category: null };
            }
            return { ...item, category: catResult.data };
          }
          return item;
        }),
      );

      return itemsWithCategories;
    },
    enabled: !!listId && open,
  });

  const { data: level1Categories = [] } = useQuery({
    queryKey: ['level1-categories'],
    queryFn: async () => {
      const result = await fetchCategoriesMinimal();
      if (isFailure(result)) throw result.error;
      return result.data || [];
    },
    enabled: open,
  });

  const { data: level2Categories = [] } = useQuery({
    queryKey: ['level2-categories', selectedLevel1],
    queryFn: async () => {
      if (!selectedLevel1) return [];
      const result = await fetchSubcategoriesMinimal(selectedLevel1);
      if (isFailure(result)) throw result.error;
      return result.data || [];
    },
    enabled: open && !!selectedLevel1,
  });

  const { data: level3Categories = [] } = useQuery({
    queryKey: ['level3-categories', selectedLevel2],
    queryFn: async () => {
      if (!selectedLevel2) return [];
      const result = await fetchSubSubcategoriesMinimal(selectedLevel2);
      if (isFailure(result)) throw result.error;
      return result.data || [];
    },
    enabled: open && !!selectedLevel2,
  });

  const { data: level4Categories = [] } = useQuery({
    queryKey: ['level4-categories', selectedLevel3],
    queryFn: async () => {
      if (!selectedLevel3) return [];
      const result = await fetchSubSubSubcategoriesMinimal(selectedLevel3);
      if (isFailure(result)) throw result.error;
      return result.data || [];
    },
    enabled: open && !!selectedLevel3,
  });

  const updateListMutation = useMutation({
    mutationFn: async ({ name, systemName }: { name: string; systemName: string }) => {
      if (!listId) throw new Error('No list ID');
      const result = await updateMegaMenuCustomList(listId, { name, system_name: systemName });
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mega-menu-custom-lists'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-custom-lists-for-layout'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-custom-list', listId] });
      toast.success('List name updated');
      setIsEditingName(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to update list: ${error.message}`);
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async ({
      name,
      url,
      categoryId,
      categoryLevel,
    }: {
      name: string;
      url?: string;
      categoryId?: string;
      categoryLevel?: number;
    }) => {
      if (!listId) throw new Error('No list ID');
      const result = await createMegaMenuCustomListItem({
        list_id: listId,
        name,
        url: url || null,
        category_id: categoryId || null,
        category_level: categoryLevel || null,
        is_active: true,
      });
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mega-menu-custom-list-items', listId] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
      toast.success('Item added');
      setNewItemName('');
      setNewItemUrl('');
      setSelectedLevel1('');
      setSelectedLevel2('');
      setSelectedLevel3('');
      setSelectedLevel4('');
    },
    onError: (error: any) => {
      toast.error(`Failed to add item: ${error.message}`);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      url,
      categoryId,
      categoryLevel,
    }: {
      id: string;
      name: string;
      url?: string;
      categoryId?: string;
      categoryLevel?: number;
    }) => {
      const result = await updateMegaMenuCustomListItem(id, {
        name,
        url: url || null,
        category_id: categoryId || null,
        category_level: categoryLevel || null,
      });
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mega-menu-custom-list-items', listId] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
      toast.success('Item updated');
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to update item: ${error.message}`);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteMegaMenuCustomListItem(id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mega-menu-custom-list-items', listId] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
      toast.success('Item deleted');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete item: ${error.message}`);
    },
  });

  const handleUpdateListName = () => {
    if (editingListName.trim() && editingSystemName.trim()) {
      updateListMutation.mutate({
        name: editingListName.trim(),
        systemName: editingSystemName.trim(),
      });
    }
  };

  if (!list) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditingName ? (
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Label className="min-w-[100px] text-sm">System Name:</Label>
                  <Input
                    value={editingSystemName}
                    onChange={(e) => setEditingSystemName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="min-w-[100px] text-sm">Display Title:</Label>
                  <Input
                    value={editingListName}
                    onChange={(e) => setEditingListName(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdateListName}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingName(false);
                      setEditingListName('');
                      setEditingSystemName('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center gap-2">
                <div className="flex-1">
                  <div className="font-semibold">{list.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">ID: {list.system_name}</div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingListName(list.name);
                    setEditingSystemName(list.system_name);
                    setIsEditingName(true);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            {listType === 'header-links'
              ? 'Header-style list: Add Level 2 categories that will be styled as header links (larger text).'
              : 'Manage items in this custom list. These items will appear in the mega menu when this list is selected in a column.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Item */}
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <Label className="text-sm font-semibold">
              {listType === 'header-links' ? 'Add Level 2 Category' : 'Add New Item'}
            </Label>

            {listType === 'standard' && (
              <RadioGroup value={itemType} onValueChange={(value: any) => setItemType(value)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="url" id="type-url" />
                  <Label htmlFor="type-url" className="cursor-pointer">
                    URL
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="category" id="type-category" />
                  <Label htmlFor="type-category" className="cursor-pointer">
                    Category
                  </Label>
                </div>
              </RadioGroup>
            )}

            <div className="space-y-2">
              {listType === 'standard' && (
                <Input placeholder="Item name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
              )}

              {listType === 'standard' && itemType === 'url' ? (
                <Input
                  placeholder="URL (e.g., /shop/category)"
                  value={newItemUrl}
                  onChange={(e) => setNewItemUrl(e.target.value)}
                />
              ) : (
                <div className="space-y-2">
                  <Select
                    value={selectedLevel1}
                    onValueChange={(value) => {
                      setSelectedLevel1(value);
                      setSelectedLevel2('');
                      setSelectedLevel3('');
                      setSelectedLevel4('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="1. Select Level 1 Category" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-background">
                      {level1Categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedLevel1 && (
                    <>
                      <Select
                        value={selectedLevel2}
                        onValueChange={(value) => {
                          setSelectedLevel2(value);
                          if (listType === 'header-links') {
                            // For header-links, we stop at level 2
                            setSelectedLevel3('');
                            setSelectedLevel4('');
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="2. Select Level 2 Category" />
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-background">
                          {level2Categories.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {level2Categories.length === 0 && (
                        <div className="text-xs text-muted-foreground">
                          No Level 2 categories found for this category.
                        </div>
                      )}
                    </>
                  )}

                  {listType === 'standard' && selectedLevel2 && (
                    <>
                      <Select
                        value={selectedLevel3}
                        onValueChange={(value) => {
                          setSelectedLevel3(value);
                          setSelectedLevel4('');
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="3. Select Level 3 Category" />
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-background">
                          {level3Categories.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {level3Categories.length === 0 && (
                        <div className="text-xs text-muted-foreground">
                          No Level 3 categories found for this subcategory.
                        </div>
                      )}
                    </>
                  )}

                  {listType === 'standard' && selectedLevel3 && level4Categories.length > 0 && (
                    <Select value={selectedLevel4} onValueChange={setSelectedLevel4}>
                      <SelectTrigger>
                        <SelectValue placeholder="4. Select Level 4 Category (optional)" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-background">
                        {level4Categories.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {listType === 'standard' && selectedLevel3 && level4Categories.length === 0 && (
                    <div className="text-xs text-muted-foreground">
                      No Level 4 categories for this Level 3; the item will link to Level 3.
                    </div>
                  )}
                </div>
              )}

              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  if (listType === 'header-links') {
                    // For header-links, only use level 2 categories
                    if (selectedLevel2) {
                      // Find the category name to use as the item name
                      const level2Cat = level2Categories.find((cat: any) => cat.id === selectedLevel2);
                      if (level2Cat) {
                        addItemMutation.mutate({
                          name: level2Cat.name,
                          categoryId: selectedLevel2,
                          categoryLevel: 2,
                        });
                      }
                    }
                  } else if (newItemName.trim()) {
                    if (itemType === 'url' && newItemUrl.trim()) {
                      addItemMutation.mutate({
                        name: newItemName.trim(),
                        url: newItemUrl.trim(),
                      });
                    } else if (itemType === 'category') {
                      // Use Level 4 if selected, otherwise Level 3
                      const categoryId = selectedLevel4 || selectedLevel3;
                      const categoryLevel = selectedLevel4 ? 4 : 3;
                      if (categoryId) {
                        addItemMutation.mutate({
                          name: newItemName.trim(),
                          categoryId: categoryId,
                          categoryLevel: categoryLevel,
                        });
                      }
                    }
                  }
                }}
                disabled={
                  listType === 'header-links'
                    ? !selectedLevel2 || addItemMutation.isPending
                    : !newItemName.trim() ||
                      (itemType === 'url' && !newItemUrl.trim()) ||
                      (itemType === 'category' && !selectedLevel3) ||
                      addItemMutation.isPending
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Items List */}
          {items.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">List Items ({items.length})</Label>
              {items.map((item: any) => {
                const isEditing = editingItem?.id === item.id;
                const isUrlItem = item.url != null;

                return (
                  <div key={item.id} className="flex items-center gap-2 rounded border bg-muted/50 p-3">
                    {isEditing ? (
                      <>
                        <div className="flex-1 space-y-2">
                          <Input
                            value={editingItem.name}
                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                            placeholder="Item name"
                          />
                          {editingItem.isUrlItem ? (
                            <Input
                              value={editingItem.url || ''}
                              onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                              placeholder="URL"
                            />
                          ) : (
                            <div className="rounded bg-muted p-2 text-sm text-muted-foreground">
                              Category: {item.category?.name || 'Unknown'} (Level {item.category_level})
                              <div className="mt-1 text-xs">
                                To change the category, delete this item and create a new one
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (editingItem.isUrlItem) {
                              updateItemMutation.mutate({
                                id: item.id,
                                name: editingItem.name,
                                url: editingItem.url,
                              });
                            } else {
                              // For category items, only update the name
                              updateItemMutation.mutate({
                                id: item.id,
                                name: editingItem.name,
                                categoryId: item.category_id,
                                categoryLevel: item.category_level,
                              });
                            }
                          }}
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.url || (item.category ? `Category: ${item.category.name}` : 'N/A')}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setEditingItem({ ...item, isUrlItem })}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Delete this item?')) {
                              deleteItemMutation.mutate(item.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>No items yet. Add your first item above.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
