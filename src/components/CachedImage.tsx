import { ImgHTMLAttributes, forwardRef } from 'react';

interface CachedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: boolean;
}

export const CachedImage = forwardRef<HTMLImageElement, CachedImageProps>(
  ({ src, alt, priority = false, className, width, height, sizes, ...props }, ref) => {
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        width={width}
        height={height}
        sizes={sizes}
        {...props}
      />
    );
  },
);
