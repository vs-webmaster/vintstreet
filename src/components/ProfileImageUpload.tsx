import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Check, RotateCcw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import { uploadAvatarImage } from '@/services/storage';
import { updateProfile } from '@/services/users/userService';
import { isFailure } from '@/types/api';

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  userId: string;
  userInitials: string;
  onImageUpdate: (newUrl: string) => void;
}

export const ProfileImageUpload = ({
  currentImageUrl,
  userId,
  userInitials,
  onImageUpdate,
}: ProfileImageUploadProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 2MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCropData({ x: 0, y: 0, scale: 1, rotation: 0 });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const drawCircularCrop = () => {
    if (!canvasRef.current || !imageRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set canvas size
    const size = 200; // Final avatar size
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Save context
    ctx.save();

    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    // Apply transformations
    const img = imageRef.current;
    const { x, y, scale, rotation } = cropData;

    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Calculate image dimensions to fit in circle
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let drawWidth, drawHeight;

    if (imgAspect > 1) {
      // Landscape
      drawHeight = size;
      drawWidth = size * imgAspect;
    } else {
      // Portrait or square
      drawWidth = size;
      drawHeight = size / imgAspect;
    }

    ctx.drawImage(img, -drawWidth / 2 + x, -drawHeight / 2 + y, drawWidth, drawHeight);

    // Restore context
    ctx.restore();

    return canvas.toBlob((blob) => blob, 'image/jpeg', 0.9);
  };

  const handleUpload = async () => {
    if (!selectedFile || !canvasRef.current) return;

    setIsUploading(true);
    try {
      // Draw the cropped image to canvas and get blob
      const canvas = canvasRef.current;
      const croppedBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });

      if (!croppedBlob) {
        throw new Error('Failed to create cropped image');
      }

      // Upload avatar image
      const uploadResult = await uploadAvatarImage(croppedBlob, userId, `avatar-${Date.now()}.jpg`);

      if (isFailure(uploadResult)) {
        throw uploadResult.error;
      }

      const publicUrl = uploadResult.data.url;

      // Update profile
      const updateResult = await updateProfile(userId, { avatar_url: publicUrl });

      if (isFailure(updateResult)) {
        throw updateResult.error;
      }

      onImageUpdate(publicUrl);
      setIsOpen(false);
      setSelectedFile(null);
      setPreviewUrl('');

      toast({
        title: 'Profile photo updated',
        description: 'Your profile photo has been successfully updated.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to update profile photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetCrop = () => {
    setCropData({ x: 0, y: 0, scale: 1, rotation: 0 });
  };

  return (
    <>
      <div className="flex items-center gap-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src={currentImageUrl || ''} />
          <AvatarFallback className="text-xl">{userInitials}</AvatarFallback>
        </Avatar>
        <div>
          <Button variant="outline" className="gap-2" onClick={() => setIsOpen(true)}>
            <Camera className="h-4 w-4" />
            Change Photo
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">JPG, GIF or PNG. Max size of 2MB</p>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Profile Photo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedFile ? (
              <div
                className="cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-colors hover:border-muted-foreground/40"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drag & drop an image or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    ref={imageRef}
                    src={previewUrl}
                    alt="Preview"
                    className="hidden"
                    onLoad={() => drawCircularCrop()}
                  />
                  <canvas
                    ref={canvasRef}
                    className="mx-auto rounded-full border"
                    style={{
                      width: '200px',
                      height: '200px',
                      imageRendering: 'pixelated',
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Scale</label>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={cropData.scale}
                      onChange={(e) => {
                        setCropData((prev) => ({ ...prev, scale: parseFloat(e.target.value) }));
                        setTimeout(drawCircularCrop, 10);
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Position X</label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={cropData.x}
                      onChange={(e) => {
                        setCropData((prev) => ({ ...prev, x: parseInt(e.target.value) }));
                        setTimeout(drawCircularCrop, 10);
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Position Y</label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={cropData.y}
                      onChange={(e) => {
                        setCropData((prev) => ({ ...prev, y: parseInt(e.target.value) }));
                        setTimeout(drawCircularCrop, 10);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex justify-between gap-2">
                  <Button variant="outline" size="sm" onClick={resetCrop}>
                    <RotateCcw className="mr-1 h-4 w-4" />
                    Reset
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl('');
                      }}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={isUploading}>
                      <Check className="mr-1 h-4 w-4" />
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
