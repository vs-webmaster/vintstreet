import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CachedImage } from '@/components/CachedImage';
import { Button } from '@/components/ui/button';
import { fetchShopHeroImages } from '@/services/shop';
import { isFailure } from '@/types/api';

interface HeroImage {
  id: string;
  image_url: string;
  title?: string | null;
  button_text?: string | null;
  link: string;
  display_order: number;
}

export const ShopHeroImagesSection = memo(() => {
  const navigate = useNavigate();

  const { data: heroImages = [] } = useQuery({
    queryKey: ['shop-hero-images'],
    queryFn: async () => {
      const result = await fetchShopHeroImages();
      if (isFailure(result)) throw result.error;
      return result.data || [];
    },
  });

  if (!heroImages || heroImages.length === 0) return null;

  const topImage = heroImages.find((img) => img.display_order === 0);
  const row1Images = heroImages.filter((img) => img.display_order >= 1 && img.display_order <= 2);
  const row2Images = heroImages.filter((img) => img.display_order >= 3 && img.display_order <= 5);

  return (
    <div className="w-full space-y-4 pb-2">
      {/* Top: Full-width banner with left-aligned title and button */}
      {topImage && topImage.image_url && (
        <div
          className="group relative w-full cursor-pointer overflow-hidden"
          style={{ height: '240px' }}
          onClick={() => navigate(topImage.link)}
        >
          <CachedImage
            src={topImage.image_url}
            alt={topImage.button_text || topImage.title || 'Hero image'}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex flex-col items-start justify-center px-8">
            {topImage.title && <h3 className="mb-4 text-4xl font-bold text-white drop-shadow-lg">{topImage.title}</h3>}
            {topImage.button_text && (
              <Button
                variant="outline"
                className="w-auto px-6 py-8 text-xl font-bold"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(topImage.link);
                }}
              >
                {topImage.button_text}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Row 1: 2 columns with centered button, reduced height, border radius */}
      {row1Images.length > 0 && (
        <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2">
          {row1Images.map((image) => (
            <div
              key={image.id}
              className="group relative cursor-pointer overflow-hidden rounded-lg"
              style={{ height: '350px' }}
              onClick={() => navigate(image.link)}
            >
              <CachedImage
                src={image.image_url}
                alt={image.button_text || image.title || 'Hero image'}
                className="h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {image.button_text && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="outline"
                    className="w-auto px-6 py-8 text-xl font-bold"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(image.link);
                    }}
                  >
                    {image.button_text}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Row 2: 3 columns with reduced height and border radius */}
      {row2Images.length > 0 && (
        <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-3">
          {row2Images.map((image) => (
            <div
              key={image.id}
              className="group relative cursor-pointer overflow-hidden rounded-lg"
              style={{ height: '300px' }}
              onClick={() => navigate(image.link)}
            >
              <CachedImage
                src={image.image_url}
                alt={image.button_text || image.title || 'Hero image'}
                className="h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {image.button_text && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="outline"
                    className="w-auto px-6 py-8 text-xl font-bold"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(image.link);
                    }}
                  >
                    {image.button_text}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

ShopHeroImagesSection.displayName = 'ShopHeroImagesSection';
