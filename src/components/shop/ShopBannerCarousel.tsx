import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fetchShopBanners } from '@/services/shop';
import { isFailure } from '@/types/api';

interface ShopBanner {
  id: string;
  title: string;
  description: string | null;
  button_text: string | null;
  button_link: string | null;
  image_url: string;
  display_order: number;
  rotation_interval: number;
  button_bg_color: string;
  button_text_color: string;
}

export const ShopBannerCarousel = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['active-shop-banners'],
    queryFn: async () => {
      const result = await fetchShopBanners();
      if (isFailure(result)) {
        console.error('Error fetching banners:', result.error);
        throw result.error;
      }
      return result.data as ShopBanner[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Auto-rotate banners every X seconds based on first banner's rotation_interval
  useEffect(() => {
    if (banners.length <= 1) return;

    const rotationInterval = (banners[0]?.rotation_interval || 6) * 1000;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [banners.length, banners]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handleButtonClick = (link: string) => {
    navigate(link);
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center bg-muted/20 md:h-[500px]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (banners.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="relative h-[400px] md:h-[500px]">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-700 ease-in-out',
              index === currentIndex ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            <div
              className={cn(
                'absolute inset-0 bg-cover bg-center',
                banner.button_link && !banner.button_text && 'cursor-pointer',
              )}
              style={{ backgroundImage: `url(${banner.image_url})` }}
              onClick={() => banner.button_link && !banner.button_text && handleButtonClick(banner.button_link)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
            </div>

            <div className="container relative mx-auto flex h-full items-center px-16 md:px-20">
              <div className="max-w-2xl space-y-6 text-white">
                <h1 className="text-4xl font-bold leading-tight md:text-6xl">{banner.title}</h1>
                {banner.description && <p className="text-lg text-white/90 md:text-xl">{banner.description}</p>}
                {banner.button_text && banner.button_link && (
                  <Button
                    size="lg"
                    onClick={() => handleButtonClick(banner.button_link!)}
                    className="h-auto px-8 py-6 text-lg font-semibold shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                    style={{
                      backgroundColor: banner.button_bg_color,
                      color: banner.button_text_color,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    {banner.button_text}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {banners.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 h-12 w-12 -translate-y-1/2 transition-opacity hover:opacity-80"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-8 w-8 text-white" strokeWidth={3} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 h-12 w-12 -translate-y-1/2 transition-opacity hover:opacity-80"
              onClick={goToNext}
            >
              <ChevronRight className="h-8 w-8 text-white" strokeWidth={3} />
            </Button>

            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    'h-2 w-2 rounded-full transition-all duration-300',
                    index === currentIndex ? 'w-8 bg-white' : 'bg-white/50 hover:bg-white/75',
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
