import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { uploadImageToStorage } from '@/lib/imageUtils';
import { fetchShopHeroImages, saveShopHeroImages, type ShopHeroImage } from '@/services/shop';
import { isFailure } from '@/types/api';
import { AdminLayout } from './AdminLayout';

export default function AdminShopHeroImagesPage() {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [localImages, setLocalImages] = useState<ShopHeroImage[]>([
    { id: '', image_url: '', title: '', link: '', button_text: '', display_order: 0 },
    { id: '', image_url: '', title: '', link: '', button_text: '', display_order: 1 },
    { id: '', image_url: '', title: '', link: '', button_text: '', display_order: 2 },
    { id: '', image_url: '', title: '', link: '', button_text: '', display_order: 3 },
    { id: '', image_url: '', title: '', link: '', button_text: '', display_order: 4 },
    { id: '', image_url: '', title: '', link: '', button_text: '', display_order: 5 },
  ]);
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  // Fetch shop hero images
  const { data: heroImages = [], isLoading } = useQuery({
    queryKey: ['shop-hero-images'],
    queryFn: async () => {
      const result = await fetchShopHeroImages();
      if (isFailure(result)) throw result.error;

      // Ensure we always have 6 slots (1 full-width at top, 2 in row 1, 3 in row 2)
      const images: ShopHeroImage[] = [];
      for (let i = 0; i <= 5; i++) {
        const existing = result.data.find((img) => img.display_order === i);
        images.push(
          existing || {
            id: '',
            image_url: '',
            title: '',
            link: '',
            button_text: '',
            display_order: i,
          },
        );
      }
      return images;
    },
  });

  // Update local state when hero images change
  useEffect(() => {
    if (heroImages && heroImages.length === 6) {
      setLocalImages(heroImages);
      setHasChanges(false);
    }
  }, [heroImages]);

  // Mutation to save all changes
  const saveMutation = useMutation({
    mutationFn: async (images: ShopHeroImage[]) => {
      const result = await saveShopHeroImages(images);
      if (isFailure(result)) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-hero-images'] });
      toast.success('Shop hero images saved successfully');
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast.error('Failed to save: ' + error.message);
    },
  });

  const handleImageUpload = async (index: number, file: File) => {
    setUploadingIndex(index);
    try {
      const publicUrl = await uploadImageToStorage(file, 'shop-hero');
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

  const handleUpdateField = (index: number, field: 'button_text' | 'link' | 'title', value: string) => {
    const updatedImages = [...localImages];
    updatedImages[index] = { ...updatedImages[index], [field]: value };
    setLocalImages(updatedImages);
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(localImages);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Shop Hero Images</h1>
            <p className="text-muted-foreground">
              Manage hero grid images on the main shop page (Top: 1 full-width, Row 1: 2 images, Row 2: 3 images)
            </p>
          </div>
          {hasChanges && (
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top: Full-width banner */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">Top Banner (Full Width)</h2>
              <Card className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Full Width Image</h3>

                {/* Image Upload */}
                <div className="mb-4">
                  <Label>Image</Label>
                  {localImages[0]?.image_url ? (
                    <div className="relative mt-2">
                      <img
                        src={localImages[0].image_url}
                        alt="Top banner"
                        className="h-48 w-full rounded-lg object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() => handleRemoveImage(0)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <label
                        htmlFor="image-upload-0"
                        className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed hover:bg-accent/5"
                      >
                        {uploadingIndex === 0 ? (
                          <Loader2 className="h-8 w-8 animate-spin" />
                        ) : (
                          <>
                            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Click to upload</span>
                          </>
                        )}
                      </label>
                      <input
                        id="image-upload-0"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(0, file);
                        }}
                        disabled={uploadingIndex === 0}
                      />
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="mb-4">
                  <Label htmlFor="title-0">Title</Label>
                  <Input
                    id="title-0"
                    value={localImages[0]?.title || ''}
                    onChange={(e) => handleUpdateField(0, 'title', e.target.value)}
                    placeholder="e.g., New Collection"
                    className="mt-1"
                  />
                </div>

                {/* Button Text */}
                <div className="mb-4">
                  <Label htmlFor="button-text-0">Button Text</Label>
                  <Input
                    id="button-text-0"
                    value={localImages[0]?.button_text || ''}
                    onChange={(e) => handleUpdateField(0, 'button_text', e.target.value)}
                    placeholder="e.g., Shop Now"
                    className="mt-1"
                  />
                </div>

                {/* Link */}
                <div>
                  <Label htmlFor="link-0">Link</Label>
                  <Input
                    id="link-0"
                    value={localImages[0]?.link || ''}
                    onChange={(e) => handleUpdateField(0, 'link', e.target.value)}
                    placeholder="e.g., /shop/mens/jackets"
                    className="mt-1"
                  />
                </div>
              </Card>
            </div>

            {/* Row 1: 2 columns */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">Row 1 (2 Images)</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {localImages.slice(1, 3).map((image, index) => (
                  <Card key={index + 1} className="p-6">
                    <h3 className="mb-4 text-lg font-semibold">Image {index + 2}</h3>

                    {/* Image Upload */}
                    <div className="mb-4">
                      <Label>Image</Label>
                      {image.image_url ? (
                        <div className="relative mt-2">
                          <img
                            src={image.image_url}
                            alt={`Hero image ${index + 2}`}
                            className="h-48 w-full rounded-lg object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute right-2 top-2"
                            onClick={() => handleRemoveImage(index + 1)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <label
                            htmlFor={`image-upload-${index + 1}`}
                            className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed hover:bg-accent/5"
                          >
                            {uploadingIndex === index + 1 ? (
                              <Loader2 className="h-8 w-8 animate-spin" />
                            ) : (
                              <>
                                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Click to upload</span>
                              </>
                            )}
                          </label>
                          <input
                            id={`image-upload-${index + 1}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(index + 1, file);
                            }}
                            disabled={uploadingIndex === index + 1}
                          />
                        </div>
                      )}
                    </div>

                    {/* Button Text */}
                    <div className="mb-4">
                      <Label htmlFor={`button-text-${index + 1}`}>Button Text</Label>
                      <Input
                        id={`button-text-${index + 1}`}
                        value={image.button_text}
                        onChange={(e) => handleUpdateField(index + 1, 'button_text', e.target.value)}
                        placeholder="e.g., Shop Now"
                        className="mt-1"
                      />
                    </div>

                    {/* Link */}
                    <div>
                      <Label htmlFor={`link-${index + 1}`}>Link</Label>
                      <Input
                        id={`link-${index + 1}`}
                        value={image.link}
                        onChange={(e) => handleUpdateField(index + 1, 'link', e.target.value)}
                        placeholder="e.g., /shop/mens/jackets"
                        className="mt-1"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Row 2: 3 columns */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">Row 2 (3 Images)</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {localImages.slice(3, 6).map((image, index) => (
                  <Card key={index + 3} className="p-6">
                    <h3 className="mb-4 text-lg font-semibold">Image {index + 4}</h3>

                    {/* Image Upload */}
                    <div className="mb-4">
                      <Label>Image</Label>
                      {image.image_url ? (
                        <div className="relative mt-2">
                          <img
                            src={image.image_url}
                            alt={`Hero image ${index + 4}`}
                            className="h-48 w-full rounded-lg object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute right-2 top-2"
                            onClick={() => handleRemoveImage(index + 3)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <label
                            htmlFor={`image-upload-${index + 3}`}
                            className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed hover:bg-accent/5"
                          >
                            {uploadingIndex === index + 3 ? (
                              <Loader2 className="h-8 w-8 animate-spin" />
                            ) : (
                              <>
                                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Click to upload</span>
                              </>
                            )}
                          </label>
                          <input
                            id={`image-upload-${index + 3}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(index + 3, file);
                            }}
                            disabled={uploadingIndex === index + 3}
                          />
                        </div>
                      )}
                    </div>

                    {/* Button Text */}
                    <div className="mb-4">
                      <Label htmlFor={`button-text-${index + 3}`}>Button Text</Label>
                      <Input
                        id={`button-text-${index + 3}`}
                        value={image.button_text}
                        onChange={(e) => handleUpdateField(index + 3, 'button_text', e.target.value)}
                        placeholder="e.g., Shop Now"
                        className="mt-1"
                      />
                    </div>

                    {/* Link */}
                    <div>
                      <Label htmlFor={`link-${index + 3}`}>Link</Label>
                      <Input
                        id={`link-${index + 3}`}
                        value={image.link}
                        onChange={(e) => handleUpdateField(index + 3, 'link', e.target.value)}
                        placeholder="e.g., /shop/mens/jackets"
                        className="mt-1"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
