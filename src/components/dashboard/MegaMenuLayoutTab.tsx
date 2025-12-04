import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchCategories } from '@/services/categories';
import {
  fetchMegaMenuLayouts,
  upsertMegaMenuLayout,
  fetchMegaMenuImages,
  createMegaMenuImage,
  updateMegaMenuImage,
  deleteMegaMenuImage,
  fetchMegaMenuCustomLists,
} from '@/services/megaMenu';
import { uploadFile } from '@/services/storage';
import { isFailure } from '@/types/api';

interface MegaMenuLayout {
  id: string;
  category_id: string;
  template_type: string;
  columns: Array<{ items: Array<{ type: string; label: string }> }>;
  image_url: string | null;
  image_alt: string | null;
  image_link: string | null;
  image_column_start: number | null;
  image_column_span: number | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const TEMPLATE_OPTIONS = [
  { value: 'all-text-5col', label: 'All Text - 5 Columns', textCols: 5, imageCols: 0 },
  { value: 'text-1-image-4', label: '1 Text Column + Image (4 cols)', textCols: 1, imageCols: 4 },
  { value: 'text-2-image-3', label: '2 Text Columns + Image (3 cols)', textCols: 2, imageCols: 3 },
  { value: 'text-3-image-2', label: '3 Text Columns + Image (2 cols)', textCols: 3, imageCols: 2 },
  { value: 'text-4-image-1', label: '4 Text Columns + Image (1 col)', textCols: 4, imageCols: 1 },
];

const COLUMN_TYPES = [
  { value: 'popular_brands', label: 'Popular Brands' },
  { value: 'categories', label: 'Categories' },
  { value: 'trending', label: 'Trending' },
  { value: 'best_sellers', label: 'Best Sellers' },
  { value: 'luxury_brands', label: 'Luxury Brands' },
  { value: 'custom', label: 'Custom List' },
];

export const MegaMenuLayoutTab = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['categories-for-layout'],
    queryFn: async () => {
      const result = await fetchCategories();
      if (isFailure(result)) throw result.error;
      return (result.data || []).map((cat) => ({ id: cat.id, name: cat.name, slug: cat.slug })) as Category[];
    },
  });

  const { data: layouts } = useQuery({
    queryKey: ['mega-menu-layouts'],
    queryFn: async () => {
      const result = await fetchMegaMenuLayouts();
      if (isFailure(result)) throw result.error;
      return result.data || [];
    },
  });

  const { data: customLists } = useQuery({
    queryKey: ['mega-menu-custom-lists-for-layout'],
    queryFn: async () => {
      const result = await fetchMegaMenuCustomLists();
      if (isFailure(result)) throw result.error;
      return result.data || [];
    },
  });

  const { data: menuImages } = useQuery({
    queryKey: ['mega-menu-images', selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return [];
      const layoutId = layouts?.find((l) => l.category_id === selectedCategory)?.id;
      if (!layoutId) return [];

      const result = await fetchMegaMenuImages(layoutId);
      if (isFailure(result)) throw result.error;
      return result.data || [];
    },
    enabled: !!selectedCategory,
  });

  const currentLayout = layouts?.find((l) => l.category_id === selectedCategory);
  const selectedTemplate =
    TEMPLATE_OPTIONS.find((t) => t.value === currentLayout?.template_type) || TEMPLATE_OPTIONS[0];

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<MegaMenuLayout>) => {
      if (!selectedCategory) throw new Error('No category selected');

      const result = await upsertMegaMenuLayout(selectedCategory, data);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mega-menu-layouts'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
      toast.success('Mega menu layout saved');
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const handleTemplateChange = (templateType: string) => {
    const template = TEMPLATE_OPTIONS.find((t) => t.value === templateType);
    if (!template) return;

    const columns = Array.from({ length: template.textCols }, (_, i) => ({
      items: [
        {
          type: COLUMN_TYPES[i]?.value || 'categories',
          label: COLUMN_TYPES[i]?.label || 'Categories',
        },
      ],
    }));

    saveMutation.mutate({
      template_type: templateType,
      columns,
      image_column_start: template.imageCols > 0 ? template.textCols + 1 : null,
      image_column_span: template.imageCols > 0 ? template.imageCols : null,
    });
  };

  const handleColumnTypeChange = (colIndex: number, itemIndex: number, type: string) => {
    if (!currentLayout) return;

    const newColumns = [...currentLayout.columns];
    const newItems = [...newColumns[colIndex].items];

    if (type === 'custom') {
      newItems[itemIndex] = {
        type: 'custom',
        label: '',
      };
    } else {
      newItems[itemIndex] = {
        type,
        label: COLUMN_TYPES.find((ct) => ct.value === type)?.label || type,
      };
    }

    newColumns[colIndex] = { items: newItems };

    saveMutation.mutate({
      template_type: currentLayout.template_type,
      columns: newColumns,
      image_url: currentLayout.image_url,
      image_alt: currentLayout.image_alt,
      image_link: currentLayout.image_link,
      image_column_start: currentLayout.image_column_start,
      image_column_span: currentLayout.image_column_span,
    });
  };

  const handleCustomListChange = (colIndex: number, itemIndex: number, listName: string) => {
    if (!currentLayout) return;

    if (!listName || listName.trim() === '') {
      toast.error('Please select a valid custom list');
      return;
    }

    const newColumns = [...currentLayout.columns];
    const newItems = [...newColumns[colIndex].items];
    newItems[itemIndex] = {
      type: 'custom',
      label: listName, // This should be the system_name
    };
    newColumns[colIndex] = { items: newItems };

    saveMutation.mutate({
      template_type: currentLayout.template_type,
      columns: newColumns,
      image_url: currentLayout.image_url,
      image_alt: currentLayout.image_alt,
      image_link: currentLayout.image_link,
      image_column_start: currentLayout.image_column_start,
      image_column_span: currentLayout.image_column_span,
    });
  };

  const handleAddItem = (colIndex: number) => {
    if (!currentLayout) return;

    const newColumns = [...currentLayout.columns];
    if (newColumns[colIndex].items.length >= 2) {
      toast.error('Maximum 2 lists per column');
      return;
    }

    newColumns[colIndex].items.push({
      type: 'categories',
      label: 'Categories',
    });

    saveMutation.mutate({
      template_type: currentLayout.template_type,
      columns: newColumns,
      image_url: currentLayout.image_url,
      image_alt: currentLayout.image_alt,
      image_link: currentLayout.image_link,
      image_column_start: currentLayout.image_column_start,
      image_column_span: currentLayout.image_column_span,
    });
  };

  const handleRemoveItem = (colIndex: number, itemIndex: number) => {
    if (!currentLayout) return;

    const newColumns = [...currentLayout.columns];
    if (newColumns[colIndex].items.length <= 1) {
      toast.error('Must have at least 1 list per column');
      return;
    }

    newColumns[colIndex].items.splice(itemIndex, 1);

    saveMutation.mutate({
      template_type: currentLayout.template_type,
      columns: newColumns,
      image_url: currentLayout.image_url,
      image_alt: currentLayout.image_alt,
      image_link: currentLayout.image_link,
      image_column_start: currentLayout.image_column_start,
      image_column_span: currentLayout.image_column_span,
    });
  };

  const addImageMutation = useMutation({
    mutationFn: async (imageData: { image_url: string; image_alt?: string; image_link?: string }) => {
      if (!currentLayout) throw new Error('No layout selected');

      const result = await createMegaMenuImage({
        layout_id: currentLayout.id,
        ...imageData,
        display_order: menuImages?.length || 0,
      });

      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mega-menu-images'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
      toast.success('Image added');
    },
    onError: (error) => {
      toast.error(`Failed to add image: ${error.message}`);
    },
  });

  const updateImageMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const result = await updateMegaMenuImage(id, data);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mega-menu-images'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
      toast.success('Image updated');
    },
    onError: (error) => {
      toast.error(`Failed to update image: ${error.message}`);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteMegaMenuImage(id);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mega-menu-images'] });
      queryClient.invalidateQueries({ queryKey: ['mega-menu-categories'] });
      toast.success('Image deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete image: ${error.message}`);
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, imageId?: string) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCategory || !currentLayout) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedCategory}-${Date.now()}.${fileExt}`;
      const result = await uploadFile(file, {
        bucket: 'mega-menu-images',
        fileName,
        upsert: true,
        contentType: file.type,
      });

      if (isFailure(result)) {
        throw result.error;
      }

      const publicUrl = result.data.url;

      if (imageId) {
        await updateImageMutation.mutateAsync({ id: imageId, image_url: publicUrl });
      } else {
        await addImageMutation.mutateAsync({ image_url: publicUrl });
      }

      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const getRecommendedImageSize = () => {
    if (!selectedTemplate) return null;
    const span = selectedTemplate.imageCols;
    const width = span * 200;
    return {
      width,
      height: 450,
      display: `${width}x450px`,
    };
  };

  const recommendedSize = getRecommendedImageSize();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mega Menu Layout Configuration</CardTitle>
          <CardDescription>Configure the layout template for each category's mega menu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Select Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a category..." />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCategory && (
            <>
              <div className="space-y-2">
                <Label>Template Layout</Label>
                <Select value={currentLayout?.template_type || 'all-text-5col'} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_OPTIONS.map((template) => (
                      <SelectItem key={template.value} value={template.value}>
                        {template.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentLayout && (
                <>
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Text Columns</Label>
                    {currentLayout.columns.map((col, colIndex) => (
                      <Card key={colIndex} className="space-y-3 p-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Column {colIndex + 1}</Label>
                          {col.items.length < 2 && (
                            <Button size="sm" variant="outline" onClick={() => handleAddItem(colIndex)}>
                              <Plus className="mr-1 h-3 w-3" />
                              Add List
                            </Button>
                          )}
                        </div>

                        {col.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="space-y-2 rounded-lg border bg-muted/20 p-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-muted-foreground">List {itemIndex + 1}</Label>
                              {col.items.length > 1 && (
                                <Button size="sm" variant="ghost" onClick={() => handleRemoveItem(colIndex, itemIndex)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>

                            <Select
                              value={item.type}
                              onValueChange={(value) => handleColumnTypeChange(colIndex, itemIndex, value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {COLUMN_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {item.type === 'custom' && (
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Select Custom List</Label>
                                <Select
                                  value={item.label || undefined}
                                  onValueChange={(value) => handleCustomListChange(colIndex, itemIndex, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose a custom list..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {customLists && customLists.length > 0 ? (
                                      customLists.map((list: any) => (
                                        <SelectItem key={list.id} value={list.system_name}>
                                          {list.name} ({list.system_name})
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <div className="p-2 text-xs text-muted-foreground">
                                        No custom lists created yet. Go to Custom Lists tab to create one.
                                      </div>
                                    )}
                                  </SelectContent>
                                </Select>
                                {item.label && (
                                  <p className="text-xs text-muted-foreground">
                                    Selected:{' '}
                                    {customLists?.find((l: any) => l.system_name === item.label)?.name || item.label}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </Card>
                    ))}
                  </div>

                  {selectedTemplate.imageCols > 0 && (
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">
                          Image Section (Spans {selectedTemplate.imageCols} column
                          {selectedTemplate.imageCols > 1 ? 's' : ''})
                        </Label>
                        {(!menuImages || menuImages.length < 3) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addImageMutation.mutate({ image_url: '' })}
                            disabled={addImageMutation.isPending}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add Image
                          </Button>
                        )}
                      </div>

                      {recommendedSize && (
                        <Alert>
                          <ImageIcon className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Recommended image size:</strong> {recommendedSize.display}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              Width: {recommendedSize.width}px, Height: 150px each (max 3 images stacked)
                            </span>
                          </AlertDescription>
                        </Alert>
                      )}

                      {menuImages && menuImages.length > 0 ? (
                        <div className="space-y-4">
                          {menuImages.map((image: any, index: number) => (
                            <Card key={image.id} className="space-y-3 p-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Image {index + 1}</Label>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteImageMutation.mutate(image.id)}
                                  disabled={deleteImageMutation.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">Upload Image</Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, image.id)}
                                    disabled={uploading}
                                    className="flex-1"
                                  />
                                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                                </div>
                              </div>

                              {image.image_url && (
                                <div className="space-y-2">
                                  <Label className="text-xs">Preview</Label>
                                  <div className="rounded-lg border bg-muted/20 p-2">
                                    <img
                                      src={image.image_url}
                                      alt="Preview"
                                      className="h-auto max-h-32 w-full object-contain"
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="space-y-2">
                                <Label className="text-xs">Or Enter Image URL</Label>
                                <Input
                                  value={image.image_url || ''}
                                  onChange={(e) =>
                                    updateImageMutation.mutate({ id: image.id, image_url: e.target.value })
                                  }
                                  placeholder="https://..."
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">Image Alt Text</Label>
                                <Input
                                  value={image.image_alt || ''}
                                  onChange={(e) =>
                                    updateImageMutation.mutate({ id: image.id, image_alt: e.target.value })
                                  }
                                  placeholder="Descriptive alt text"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs">Image Link URL</Label>
                                <Input
                                  value={image.image_link || ''}
                                  onChange={(e) =>
                                    updateImageMutation.mutate({ id: image.id, image_link: e.target.value })
                                  }
                                  placeholder="/shop/category or https://..."
                                />
                                <p className="text-xs text-muted-foreground">
                                  Where the image should link when clicked.
                                </p>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          No images added yet. Click "Add Image" to add up to 3 images that will appear stacked.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
