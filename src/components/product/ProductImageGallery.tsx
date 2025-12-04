import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CachedImage } from '@/components/CachedImage';
import { Button } from '@/components/ui/button';

interface ProductImageGalleryProps {
  productName: string;
  productImages: string[] | null;
  productImageAlts?: string[] | null;
}

export const ProductImageGallery = ({ productName, productImages, productImageAlts }: ProductImageGalleryProps) => {
  // Merge main product image with product images array if not already present
  const allImages = (() => {
    // Start with empty array
    const images: string[] = [];

    // Add additional images if they exist and aren't duplicates
    if (productImages && productImages.length > 0) {
      productImages.forEach((img) => {
        const trimmedImg = img?.trim();
        if (trimmedImg && !images.includes(trimmedImg)) {
          images.push(trimmedImg);
        }
      });
    }

    return images;
  })();

  // Helper to get alt tag for an image
  const getAltTag = (index: number) => {
    const customAlt = productImageAlts?.[index];
    if (customAlt) return customAlt;
    return `${productName} ${index + 1} | VINT STREET`;
  };
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [lastPinchScale, setLastPinchScale] = useState(1);
  const totalImages = allImages.length;

  // Minimum swipe distance (in px) to trigger navigation
  const minSwipeDistance = 50;

  // Calculate distance between two touch points
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const goToPrevious = useCallback(() => {
    setSelectedImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  }, [totalImages]);

  const goToNext = useCallback(() => {
    setSelectedImageIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  }, [totalImages]);

  // Touch/swipe handlers for pinch-to-zoom and swipe navigation
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Two finger touch - prepare for pinch zoom
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      setInitialPinchDistance(distance);
      setLastPinchScale(zoomScale);
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      // Single finger touch - prepare for swipe or pan
      setTouchEnd(0);
      setTouchStart(e.touches[0].clientX);
      setIsDragging(false);

      if (zoomScale > 1) {
        // Start panning if zoomed
        setDragStart({
          x: e.touches[0].clientX - panPosition.x,
          y: e.touches[0].clientY - panPosition.y,
        });
      }
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance) {
      // Pinch zoom
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = (currentDistance / initialPinchDistance) * lastPinchScale;
      setZoomScale(Math.min(Math.max(1, scale), 4)); // Clamp between 1x and 4x
      setIsDragging(true);
    } else if (e.touches.length === 1) {
      if (zoomScale > 1) {
        // Pan while zoomed
        setPanPosition({
          x: e.touches[0].clientX - dragStart.x,
          y: e.touches[0].clientY - dragStart.y,
        });
      } else {
        // Track swipe for navigation
        setTouchEnd(e.touches[0].clientX);
      }
      setIsDragging(true);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (initialPinchDistance) {
      // End of pinch gesture
      setInitialPinchDistance(null);
      if (zoomScale <= 1.1) {
        // Reset zoom if very close to 1x
        setZoomScale(1);
        setPanPosition({ x: 0, y: 0 });
      }
      return;
    }

    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // Navigate if not zoomed and swiped
    if (zoomScale <= 1 && !isDragging && (isLeftSwipe || isRightSwipe)) {
      if (isLeftSwipe) {
        goToNext();
      }
      if (isRightSwipe) {
        goToPrevious();
      }
    }

    setIsDragging(false);
  };

  const handleZoomToggle = (clickX?: number, clickY?: number, containerWidth?: number, containerHeight?: number) => {
    if (zoomScale > 1) {
      // Zoom out
      setZoomScale(1);
      setPanPosition({ x: 0, y: 0 });
    } else {
      // Zoom in to 2x
      setZoomScale(2);
      if (clickX !== undefined && clickY !== undefined && containerWidth && containerHeight) {
        // Calculate pan to center on click position
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        const offsetX = (centerX - clickX) * 2;
        const offsetY = (centerY - clickY) * 2;
        setPanPosition({ x: offsetX, y: offsetY });
      } else {
        setPanPosition({ x: 0, y: 0 });
      }
    }
  };

  // Mouse drag handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomScale > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Click handler that zooms to cursor position
  const handleImageClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      handleZoomToggle(clickX, clickY, rect.width, rect.height);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (totalImages <= 1) return;
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalImages, goToPrevious, goToNext]);

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="group relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {allImages.length > 0 ? (
          <>
            <div
              className="h-[400px] w-full overflow-hidden rounded-lg md:h-[500px] lg:h-[600px]"
              style={{
                cursor: zoomScale <= 1 ? 'zoom-in' : isDragging ? 'grabbing' : 'grab',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onClick={handleImageClick}
            >
              <CachedImage
                src={allImages[selectedImageIndex]}
                alt={getAltTag(selectedImageIndex)}
                className="h-full w-full select-none object-cover transition-transform duration-300"
                style={{
                  transform:
                    zoomScale > 1
                      ? `scale(${zoomScale}) translate(${panPosition.x / zoomScale}px, ${panPosition.y / zoomScale}px)`
                      : 'scale(1)',
                  transformOrigin: 'center center',
                }}
                draggable={false}
                priority={true}
              />
            </div>

            {/* Navigation Arrows - Only show if multiple images and not zoomed */}
            {totalImages > 1 && zoomScale <= 1 && (
              <>
                {/* Left Arrow */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-background/80 opacity-0 backdrop-blur-sm transition-opacity hover:bg-background/90 group-hover:opacity-100"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>

                {/* Right Arrow */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-background/80 opacity-0 backdrop-blur-sm transition-opacity hover:bg-background/90 group-hover:opacity-100"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Image Counter and Zoom Indicator */}
            {totalImages > 1 && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-sm backdrop-blur-sm">
                <span>
                  {selectedImageIndex + 1} / {totalImages}
                </span>
                {zoomScale > 1 && <span className="text-primary">{Math.round(zoomScale * 100)}%</span>}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-[400px] w-full items-center justify-center rounded-lg bg-muted md:h-[500px] lg:h-[600px]">
            <span className="text-muted-foreground">No image available</span>
          </div>
        )}
      </div>

      {/* Thumbnail Images */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2 md:grid-cols-5">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                selectedImageIndex === index ? 'border-primary' : 'border-transparent hover:border-muted-foreground/50'
              }`}
            >
              <CachedImage
                src={image}
                alt={getAltTag(index)}
                className="h-full w-full object-cover"
                priority={index === 0}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
