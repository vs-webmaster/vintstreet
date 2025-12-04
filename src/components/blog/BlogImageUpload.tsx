import { useState, useEffect } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadBlogImage } from '@/services/storage';
import { isFailure } from '@/types/api';

interface BlogImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  id: string;
  onUploadStateChange?: (isUploading: boolean) => void;
}

export function BlogImageUpload({ value, onChange, label, id, onUploadStateChange }: BlogImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value);

  // Sync previewUrl when value prop changes (important for edit mode)
  useEffect(() => {
    setPreviewUrl(value);
  }, [value]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    onUploadStateChange?.(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

      const result = await uploadBlogImage(file, fileName);

      if (isFailure(result)) {
        throw result.error;
      }

      setPreviewUrl(result.data.url);
      onChange(result.data.url);
      toast.success('Image uploaded successfully');
    } catch (error: unknown) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
      onUploadStateChange?.(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl('');
    onChange('');
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      {previewUrl ? (
        <div className="relative">
          <img src={previewUrl} alt="Preview" className="h-48 w-full rounded-lg border border-border object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
          <Input
            id={id}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <Label htmlFor={id} className="flex cursor-pointer flex-col items-center gap-2">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {uploading ? 'Uploading...' : 'Click to upload image'}
            </span>
            <span className="text-xs text-muted-foreground">Max size: 5MB</span>
          </Label>
        </div>
      )}
    </div>
  );
}
