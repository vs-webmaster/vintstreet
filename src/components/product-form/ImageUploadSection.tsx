import { Upload, X, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ImageUploadSectionProps {
  currentImages: string[];
  newImages: File[];
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onRemoveCurrentImage: (index: number) => void;
  mainImageIndex?: number;
  onSetMainImage?: (index: number) => void;
}

export const ImageUploadSection = ({
  currentImages,
  newImages,
  onImageUpload,
  onRemoveImage,
  onRemoveCurrentImage,
  mainImageIndex = 0,
  onSetMainImage,
}: ImageUploadSectionProps) => {
  const totalImages = [...currentImages, ...newImages];

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Product Images (Multiple)</h3>
      <div className="space-y-4">
        <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-center">
          <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 text-muted-foreground">Upload product images</p>
          <p className="mb-4 text-sm text-muted-foreground">Up to 10MB each, multiple images supported</p>
          <input type="file" accept="image/*" multiple onChange={onImageUpload} className="hidden" id="image-upload" />
          <Button type="button" variant="outline" onClick={() => document.getElementById('image-upload')?.click()}>
            Choose Images
          </Button>
        </div>

        {currentImages.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium">Current Images (Click star to set as main)</p>
            <div className="grid grid-cols-2 gap-4">
              {currentImages.map((url, index) => (
                <div key={`current-${index}`} className="relative w-full">
                  <img
                    src={url}
                    alt={`Current product ${index + 1}`}
                    className={`h-32 w-full rounded-lg border-2 object-cover ${
                      mainImageIndex === index ? 'border-primary' : 'border-gray-200'
                    }`}
                  />
                  {mainImageIndex === index && (
                    <Badge className="absolute left-2 top-2 bg-primary">
                      <Star className="mr-1 h-3 w-3 fill-current" />
                      Main
                    </Badge>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 bg-white/90 hover:bg-white"
                    onClick={() => onSetMainImage?.(index)}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        mainImageIndex === index ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                      }`}
                    />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6"
                    onClick={() => onRemoveCurrentImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {newImages.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {newImages.map((image, index) => {
              const actualIndex = currentImages.length + index;
              return (
                <div key={index} className="relative w-full">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Product preview ${index + 1}`}
                    className={`h-32 w-full rounded-lg border-2 object-cover ${
                      mainImageIndex === actualIndex ? 'border-primary' : 'border-gray-200'
                    }`}
                  />
                  {mainImageIndex === actualIndex && (
                    <Badge className="absolute left-2 top-2 bg-primary">
                      <Star className="mr-1 h-3 w-3 fill-current" />
                      Main
                    </Badge>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 bg-white/90 hover:bg-white"
                    onClick={() => onSetMainImage?.(actualIndex)}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        mainImageIndex === actualIndex ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                      }`}
                    />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6"
                    onClick={() => onRemoveImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};
