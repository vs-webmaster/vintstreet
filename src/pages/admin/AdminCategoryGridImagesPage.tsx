import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadImageToStorage } from '@/lib/imageUtils';
import { fetchCategories } from '@/services/categories';
import { fetchCategoryGridImages, saveCategoryGridImages } from '@/services/shop';
import { isFailure } from '@/types/api';
import { AdminLayout } from './AdminLayout';

interface CategoryGridImage {
  id?: string;
  category_id: string;
  image_url: string;
  button_text: string;
  link: string;
  display_order: number;
}

export default function AdminCategoryGridImagesPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [localImages, setLocalImages] = useState<CategoryGridImage[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  // Fetch Level 1 categories
  const { data: categories = [] } = useQuery({
    queryKey: ['level1-categories'],
    queryFn: async () => {
      const result = await fetchCategories();
      if (isFailure(result)) throw result.error;
      return result.data.map((cat) => ({ id: cat.id, name: cat.name, slug: cat.slug }));
    },
  });

  // Fetch grid images for selected category
  const { data: gridImages = [], isLoading } = useQuery({
    queryKey: ['category-grid-images', selectedCategoryId],
    queryFn: async () => {
      if (!selectedCategoryId) return [];

      const result = await fetchCategoryGridImages(selectedCategoryId);
      if (isFailure(result)) throw result.error;

      // Ensure we always have 4 slots
      const images: CategoryGridImage[] = [];
      for (let i = 1; i <= 4; i++) {
        const existing = result.data.find((img) => img.display_order === i);
        images.push(
          existing || {
            category_id: selectedCategoryId,
            image_url: '',
            button_text: '',
            link: '',
            display_order: i,
          },
        );
      }
      return images;
    },
    enabled: !!selectedCategoryId,
  });

  // Update local state when grid images change
  useEffect(() => {
    setLocalImages(gridImages);
    setHasChanges(false);
  }, [gridImages]);

  // Mutation to save all changes
  const saveMutation = useMutation({
    mutationFn: async (images: CategoryGridImage[]) => {
      const result = await saveCategoryGridImages(images);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-grid-images', selectedCategoryId] });
      toast.success('Category grid images saved successfully');
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast.error('Failed to save: ' + error.message);
    },
  });

  const handleImageUpload = async (index: number, file: File) => {
    setUploadingIndex(index);
    try {
      const publicUrl = await uploadImageToStorage(file, `category-grid/${selectedCategoryId}`);
      const updatedImages = [...localImages];
      updatedImages[index] = { ...updatedImages[index], image_url: publicUrl };
      setLocalImages(updatedImages);
      setHasChanges(true);
    } catch (error: any) {
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = [...localImages];
    updatedImages[index] = { ...updatedImages[index], image_url: '' };
    setLocalImages(updatedImages);
    setHasChanges(true);
  };

  const handleUpdateField = (index: number, field: 'button_text' | 'link', value: string) => {
    const updatedImages = [...localImages];
    updatedImages[index] = { ...updatedImages[index], [field]: value };
    setLocalImages(updatedImages);
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(localImages);
  };

  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Category Grid Images</h1>
            <p className="text-muted-foreground">Manage promotional images for category pages</p>
          </div>
          {selectedCategoryId && hasChanges && (
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          )}
        </div>

        <div>
          <Label htmlFor="category-select">Select Category</Label>
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger id="category-select" className="mt-2 w-full max-w-md">
              <SelectValue placeholder="Choose a category..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCategoryId && (
          <>
            <h2 className="text-2xl font-bold">{selectedCategory?.name}</h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {localImages.map((image, index) => (
                  <Card key={index} className="p-6">
                    <h3 className="mb-4 text-lg font-semibold">Image {index + 1}</h3>

                    {/* Image Upload */}
                    <div className="mb-4">
                      <Label>Image</Label>
                      {image.image_url ? (
                        <div className="relative mt-2">
                          <img
                            src={image.image_url}
                            alt={`Grid image ${index + 1}`}
                            className="h-48 w-full rounded-lg object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute right-2 top-2"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <label
                            htmlFor={`image-upload-${index}`}
                            className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed hover:bg-accent/5"
                          >
                            {uploadingIndex === index ? (
                              <Loader2 className="h-8 w-8 animate-spin" />
                            ) : (
                              <>
                                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Click to upload</span>
                              </>
                            )}
                          </label>
                          <input
                            id={`image-upload-${index}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(index, file);
                            }}
                            disabled={uploadingIndex === index}
                          />
                        </div>
                      )}
                    </div>

                    {/* Button Text */}
                    <div className="mb-4">
                      <Label htmlFor={`button-text-${index}`}>Button Text</Label>
                      <Input
                        id={`button-text-${index}`}
                        value={image.button_text}
                        onChange={(e) => handleUpdateField(index, 'button_text', e.target.value)}
                        placeholder="e.g., Shop Now"
                        className="mt-1"
                      />
                    </div>

                    {/* Link */}
                    <div>
                      <Label htmlFor={`link-${index}`}>Link</Label>
                      <Input
                        id={`link-${index}`}
                        value={image.link}
                        onChange={(e) => handleUpdateField(index, 'link', e.target.value)}
                        placeholder="e.g., /shop/mens/jackets"
                        className="mt-1"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
