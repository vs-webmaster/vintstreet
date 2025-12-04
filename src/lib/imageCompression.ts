/**
 * Compresses an image file to optimize loading performance
 * @param file - The image file to compress
 * @param maxWidth - Maximum width in pixels (default: 1200)
 * @param maxHeight - Maximum height in pixels (default: 1200)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Promise<File> - The compressed image file
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 1.0,
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Determine if we should preserve transparency (PNG)
        const isPng = file.type === 'image/png';
        const outputType = isPng ? 'image/png' : 'image/jpeg';
        const outputQuality = isPng ? 1.0 : quality; // PNG doesn't use quality parameter

        // For PNG with transparency, don't fill background
        // Canvas is transparent by default, so we don't need to fill it

        // Use better image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create new file from blob
            const compressedFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          outputType,
          outputQuality,
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Compresses multiple images
 * @param files - Array of image files to compress
 * @param onProgress - Optional callback for progress updates
 * @returns Promise<File[]> - Array of compressed image files
 */
export const compressImages = async (
  files: File[],
  onProgress?: (current: number, total: number) => void,
): Promise<File[]> => {
  const compressed: File[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Skip compression for very small images
    if (file.size < 100 * 1024) {
      // Less than 100KB
      compressed.push(file);
    } else {
      const compressedFile = await compressImage(file);
      compressed.push(compressedFile);
    }

    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }

  return compressed;
};
