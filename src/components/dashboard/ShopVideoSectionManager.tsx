import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fetchShopVideoConfigAdmin, saveShopVideoConfig, type ShopVideoFeature } from '@/services/shop';
import { uploadFile } from '@/services/storage';
import { isFailure } from '@/types/api';

export const ShopVideoSectionManager = () => {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState({
    title: '',
    subtitle: '',
    video_url: '',
    phone_mockup_url: '',
    cta_text: '',
    cta_link: '',
    cta_bg_color: '#000000',
    cta_text_color: '#FFFFFF',
  });
  const [features, setFeatures] = useState<Partial<ShopVideoFeature>[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['shop-video-config-admin'],
    queryFn: async () => {
      const result = await fetchShopVideoConfigAdmin();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  useEffect(() => {
    if (data) {
      setConfig({
        title: data.config?.title || '',
        subtitle: data.config?.subtitle || '',
        video_url: data.config?.video_url || '',
        phone_mockup_url: data.config?.phone_mockup_url || '',
        cta_text: data.config?.cta_text || '',
        cta_link: data.config?.cta_link || '',
        cta_bg_color: data.config?.cta_bg_color || '#000000',
        cta_text_color: data.config?.cta_text_color || '#FFFFFF',
      });
      setFeatures(data.features.length > 0 ? data.features : [createEmptyFeature(0)]);
    }
  }, [data]);

  const createEmptyFeature = (order: number): Partial<ShopVideoFeature> => ({
    image_url: '',
    text: '',
    link: '',
    display_order: order,
    is_active: true,
  });

  const handleImageUpload = async (field: string, file: File, index?: number) => {
    setUploading(index !== undefined ? `feature-${index}` : field);
    try {
      const result = await uploadFile(file, {
        bucket: 'product-images',
        pathPrefix: 'shop-video',
      });

      if (isFailure(result)) {
        throw result.error;
      }

      const publicUrl = result.data.url;

      if (index !== undefined) {
        const newFeatures = [...features];
        newFeatures[index] = { ...newFeatures[index], image_url: publicUrl };
        setFeatures(newFeatures);
      } else {
        setConfig({ ...config, [field]: publicUrl });
      }
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(null);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const featuresToInsert = features
        .filter((f) => f.image_url)
        .map((f, index) => ({
          image_url: f.image_url!,
          text: f.text || null,
          link: f.link || null,
          display_order: index,
          is_active: true,
        }));

      const result = await saveShopVideoConfig({
        title: config.title || null,
        subtitle: config.subtitle || null,
        video_url: config.video_url || null,
        phone_mockup_url: config.phone_mockup_url || null,
        cta_text: config.cta_text || null,
        cta_link: config.cta_link || null,
        cta_bg_color: config.cta_bg_color,
        cta_text_color: config.cta_text_color,
        is_active: true,
        features: featuresToInsert,
      });

      if (isFailure(result)) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-video-config-admin'] });
      queryClient.invalidateQueries({ queryKey: ['shop-video-section'] });
      toast.success('Video section saved successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const addFeature = () => {
    setFeatures([...features, createEmptyFeature(features.length)]);
  };

  const removeFeature = (index: number) => {
    if (features.length <= 1) return;
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, field: keyof ShopVideoFeature, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setFeatures(newFeatures);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shop Video Section</CardTitle>
        <CardDescription>
          Manage the video showcase section on the shop page. Add unlimited feature images.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Header Content */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Section Title</Label>
            <Input
              id="title"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              placeholder="Personal shopping that never sleeps"
            />
          </div>
          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Textarea
              id="subtitle"
              value={config.subtitle}
              onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
              placeholder="Ditch the baskets, shop what you want in real time."
            />
          </div>
        </div>

        {/* CTA Button */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold">Call-to-Action Button</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="cta_text">Button Text</Label>
              <Input
                id="cta_text"
                value={config.cta_text}
                onChange={(e) => setConfig({ ...config, cta_text: e.target.value })}
                placeholder="Shop Now"
              />
            </div>
            <div>
              <Label htmlFor="cta_link">Button Link</Label>
              <Input
                id="cta_link"
                value={config.cta_link}
                onChange={(e) => setConfig({ ...config, cta_link: e.target.value })}
                placeholder="/shop"
              />
            </div>
            <div>
              <Label htmlFor="cta_bg_color">Button Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="cta_bg_color"
                  type="color"
                  value={config.cta_bg_color}
                  onChange={(e) => setConfig({ ...config, cta_bg_color: e.target.value })}
                  className="w-20"
                />
                <Input
                  value={config.cta_bg_color}
                  onChange={(e) => setConfig({ ...config, cta_bg_color: e.target.value })}
                  placeholder="#000000"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cta_text_color">Button Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="cta_text_color"
                  type="color"
                  value={config.cta_text_color}
                  onChange={(e) => setConfig({ ...config, cta_text_color: e.target.value })}
                  className="w-20"
                />
                <Input
                  value={config.cta_text_color}
                  onChange={(e) => setConfig({ ...config, cta_text_color: e.target.value })}
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Video Section */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold">Video & Phone Mockup</h3>
          <div>
            <Label htmlFor="video_url">Video URL</Label>
            <Input
              id="video_url"
              value={config.video_url}
              onChange={(e) => setConfig({ ...config, video_url: e.target.value })}
              placeholder="https://example.com/video.mp4"
            />
          </div>
          <div>
            <Label htmlFor="phone_mockup">Phone Mockup Image (Optional)</Label>
            <Input
              id="phone_mockup"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload('phone_mockup_url', file);
              }}
              disabled={uploading === 'phone_mockup_url'}
            />
            {config.phone_mockup_url && (
              <img src={config.phone_mockup_url} alt="Phone mockup" className="mt-2 h-32 object-contain" />
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Feature Cards</h3>
            <Button onClick={addFeature} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Feature
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                      <span className="text-sm font-medium">Feature {index + 1}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFeature(index)}
                      disabled={features.length <= 1}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <Label className="text-xs">Image</Label>
                    <div className="mt-1 flex items-center gap-2">
                      {feature.image_url && (
                        <img
                          src={feature.image_url}
                          alt={`Feature ${index + 1}`}
                          className="h-16 w-16 rounded object-cover"
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload('image_url', file, index);
                        }}
                        className="text-xs"
                        disabled={uploading === `feature-${index}`}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Text</Label>
                    <Input
                      value={feature.text || ''}
                      onChange={(e) => updateFeature(index, 'text', e.target.value)}
                      placeholder="Feature text"
                      className="h-8 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Link</Label>
                    <Input
                      value={feature.link || ''}
                      onChange={(e) => updateFeature(index, 'link', e.target.value)}
                      placeholder="/shop"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
