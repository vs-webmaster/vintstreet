import { Upload, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MOCK_SAVED_IMAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ThumbnailSelectorProps {
  thumbnailPreview: string;
  onThumbnailChange: (thumbnail: string) => void;
  showImageDialog: boolean;
  onShowImageDialogChange: (show: boolean) => void;
}

export const ThumbnailSelector = ({
  thumbnailPreview,
  onThumbnailChange,
  showImageDialog,
  onShowImageDialogChange,
}: ThumbnailSelectorProps) => {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onThumbnailChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectSavedImage = (imageUrl: string) => {
    onThumbnailChange(imageUrl);
    onShowImageDialogChange(false);
  };

  return (
    <Card className="p-6">
      <h2 className="mb-6 flex items-center text-xl font-semibold">
        <ImageIcon className="mr-2 h-5 w-5" />
        Stream Thumbnail
      </h2>

      <div className="space-y-4">
        {/* Selected Thumbnail Preview */}
        {thumbnailPreview && (
          <div>
            <Label className="mb-2 block text-sm font-medium">Selected Thumbnail</Label>
            <div className="relative mx-auto aspect-[1/2] w-32 overflow-hidden rounded-lg border">
              <img src={thumbnailPreview} alt="Selected thumbnail" className="h-full w-full object-cover" />
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div>
          <Label className="text-base font-medium">Upload New Image *</Label>
          <p className="mb-3 text-sm text-muted-foreground">PNG, JPG, GIF up to 10MB</p>

          <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-4">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="thumbnail-upload" />
            <label htmlFor="thumbnail-upload" className="cursor-pointer">
              <div className="flex flex-col items-center justify-center py-4">
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-center text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span>
                  <br />
                  or drag and drop
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Previously Uploaded Images Button */}
        <div>
          <Dialog open={showImageDialog} onOpenChange={onShowImageDialogChange}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <ImageIcon className="mr-2 h-4 w-4" />
                Select from Previous Images
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Select Previous Image</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-4 gap-4">
                {MOCK_SAVED_IMAGES.map((imageUrl, index) => (
                  <div
                    key={index}
                    className={cn(
                      'relative aspect-[1/2] cursor-pointer overflow-hidden rounded-md border-2 transition-all',
                      thumbnailPreview === imageUrl
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-muted hover:border-muted-foreground',
                    )}
                    onClick={() => selectSavedImage(imageUrl)}
                  >
                    <img src={imageUrl} alt={`Previous image ${index + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
};
