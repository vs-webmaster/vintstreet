import { useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CachedImage } from '@/components/CachedImage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchNoProductsSettings, updateNoProductsSettings } from '@/services/settings';
import { uploadMegaMenuImage } from '@/services/storage';
import { isSuccess } from '@/types/api';

export const NoProductsSettingsTab = () => {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['no-products-settings'],
    queryFn: async () => {
      const result = await fetchNoProductsSettings();
      if (isSuccess(result)) {
        if (result.data?.content) {
          setContent(result.data.content);
        }
        return result.data;
      }
      throw result.error;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: {
      title?: string;
      content?: string;
      cta_text?: string;
      cta_link?: string;
      image_url?: string | null;
    }) => {
      const result = await updateNoProductsSettings(updates);
      if (!isSuccess(result)) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['no-products-settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(error?.message || 'Failed to update settings');
      console.error('Error updating settings:', error);
    },
  });

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `no-products-${Date.now()}.${fileExt}`;
      const uploadResult = await uploadMegaMenuImage(file, fileName);

      if (!isSuccess(uploadResult)) {
        throw uploadResult.error;
      }

      await updateMutation.mutateAsync({ image_url: uploadResult.data.url });
      setImageFile(null);
      toast.success('Image uploaded successfully');
    } catch (error: unknown) {
      console.error('Error uploading image:', error);
      toast.error(error?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    await updateMutation.mutateAsync({ image_url: null });
  };

  const handleTextUpdate = async (field: 'title' | 'content' | 'cta_text' | 'cta_link', value: string) => {
    await updateMutation.mutateAsync({ [field]: value });
  };

  const handleContentSave = () => {
    handleTextUpdate('content', content);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">No Products Found Settings</h2>
        <p className="mt-1 text-muted-foreground">Customize the message and image shown when no products are found</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empty State Image</CardTitle>
          <CardDescription>Upload an image to display when there are no products</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.image_url && (
            <div className="space-y-4">
              <CachedImage
                src={settings.image_url}
                alt="No products"
                className="h-auto w-full max-w-md rounded-lg border"
              />
              <Button variant="destructive" size="sm" onClick={handleRemoveImage} disabled={updateMutation.isPending}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Image
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="image-upload">Upload New Image</Label>
            <div className="flex gap-2">
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setImageFile(file);
                }}
              />
              <Button onClick={() => imageFile && handleImageUpload(imageFile)} disabled={!imageFile || uploading}>
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Title & Content</CardTitle>
          <CardDescription>Customize the heading and description text shown in the empty state</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              ref={titleInputRef}
              defaultValue={settings?.title || ''}
              placeholder="e.g., No Products Found"
              onBlur={(e) => {
                if (e.target.value !== settings?.title) {
                  handleTextUpdate('title', e.target.value);
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content (Rich Text)</Label>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              className="bg-background"
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['link'],
                  ['clean'],
                ],
              }}
            />
            <Button
              onClick={handleContentSave}
              disabled={updateMutation.isPending || content === settings?.content}
              size="sm"
              className="mt-2"
            >
              Save Content
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Call to Action</CardTitle>
          <CardDescription>Customize the button text and link shown in the empty state</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cta-text">Button Text</Label>
            <Input
              id="cta-text"
              defaultValue={settings?.cta_text || ''}
              placeholder="e.g., Become a Seller"
              onBlur={(e) => {
                if (e.target.value !== settings?.cta_text) {
                  handleTextUpdate('cta_text', e.target.value);
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta-link">Button Link</Label>
            <Input
              id="cta-link"
              defaultValue={settings?.cta_link || ''}
              placeholder="e.g., /become-seller"
              onBlur={(e) => {
                if (e.target.value !== settings?.cta_link) {
                  handleTextUpdate('cta_link', e.target.value);
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
