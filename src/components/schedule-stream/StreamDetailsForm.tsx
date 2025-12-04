import { Camera, Upload, ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MOCK_SAVED_IMAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { StreamFormData } from '@/types';

interface StreamDetailsFormProps {
  streamData: StreamFormData;
  categories: string[];
  onStreamDataChange: (data: StreamFormData) => void;
  thumbnailPreview: string;
  onThumbnailChange: (thumbnail: string) => void;
  showImageDialog: boolean;
  onShowImageDialogChange: (show: boolean) => void;
}

export const StreamDetailsForm = ({
  streamData,
  categories,
  onStreamDataChange,
  thumbnailPreview,
  onThumbnailChange,
  showImageDialog,
  onShowImageDialogChange,
}: StreamDetailsFormProps) => {
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
        <Camera className="mr-2 h-5 w-5" />
        Stream Details
      </h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stream Info Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-base font-medium">
              Stream Title *
            </Label>
            <Input
              id="title"
              placeholder="Enter an engaging title for your stream..."
              value={streamData.title}
              onChange={(e) => onStreamDataChange({ ...streamData, title: e.target.value })}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="category" className="text-base font-medium">
              Category *
            </Label>
            <Select
              value={streamData.category}
              onValueChange={(value) => onStreamDataChange({ ...streamData, category: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a category for your stream" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Thumbnail Section */}
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block flex items-center text-base font-medium">
              <ImageIcon className="mr-2 h-4 w-4" />
              Stream Thumbnail *
            </Label>

            {/* Thumbnail Selection Layout - Side by side */}
            <div className="flex items-start gap-4">
              {/* Selected Thumbnail Preview */}
              {thumbnailPreview && (
                <div className="flex-shrink-0">
                  <div className="relative aspect-[1/2] w-16 overflow-hidden rounded-lg border">
                    <img src={thumbnailPreview} alt="Selected thumbnail" className="h-full w-full object-cover" />
                  </div>
                </div>
              )}

              {/* Upload and Select Buttons */}
              <div className="flex-1 space-y-2">
                {/* Upload Section */}
                <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label htmlFor="thumbnail-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center py-2">
                      <Upload className="mb-1 h-5 w-5 text-muted-foreground" />
                      <p className="text-center text-xs text-muted-foreground">
                        <span className="font-semibold">Click to upload</span>
                        <br />
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </label>
                </div>

                {/* Previously Uploaded Images Button */}
                <Dialog open={showImageDialog} onOpenChange={onShowImageDialogChange}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Select from Previous
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
                          <img
                            src={imageUrl}
                            alt={`Previous image ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
