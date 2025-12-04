import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { fetchHomepageCardWithItems } from '@/services/homepage';
import { isFailure } from '@/types/api';

interface HomepageCard {
  id: string;
  title: string | null;
  description: string | null;
}

interface HomepageCardItem {
  id: string;
  image_url: string | null;
  link: string | null;
  overlay_text: string | null;
  button_text: string | null;
  button_link: string | null;
  display_order: number;
}

// Component to handle GIF playback
const GifImage = ({ src, alt, isActive }: { src: string; alt: string; isActive: boolean }) => {
  const [firstFrame, setFirstFrame] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      setFirstFrame(canvas.toDataURL());
    };
  }, [src]);

  if (!src.toLowerCase().endsWith('.gif')) {
    return <img src={src} alt={alt} className="h-full w-full object-cover" />;
  }

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {isActive ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : firstFrame ? (
        <img src={firstFrame} alt={alt} className="h-full w-full object-cover opacity-50" />
      ) : (
        <div className="h-full w-full bg-muted" />
      )}
    </>
  );
};

export const ShopFeaturesSection = () => {
  const [activeGifIndex, setActiveGifIndex] = useState(0);

  const { data: cardData, isLoading } = useQuery({
    queryKey: ['homepage-cards'],
    queryFn: async () => {
      const result = await fetchHomepageCardWithItems();
      if (isFailure(result)) throw result.error;
      if (!result.data) return null;

      return {
        card: result.data.card as HomepageCard,
        items: result.data.items as HomepageCardItem[],
      };
    },
  });

  const features = cardData?.items || [];

  const gifIndices = features
    .map((f, i) => (f.image_url?.toLowerCase().endsWith('.gif') ? i : -1))
    .filter((i) => i !== -1);

  // Cycle through GIFs every 5 seconds
  useEffect(() => {
    if (gifIndices.length === 0) return;

    const interval = setInterval(() => {
      setActiveGifIndex((prev) => {
        const currentIndexInGifArray = gifIndices.indexOf(prev);
        const nextIndexInGifArray = (currentIndexInGifArray + 1) % gifIndices.length;
        return gifIndices[nextIndexInGifArray];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [gifIndices]);

  if (isLoading) {
    return null;
  }

  const hasAnyImage = features.some((f) => f.image_url);

  if (!cardData?.card?.title && !hasAnyImage) {
    return null;
  }

  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">{cardData?.card?.title}</h2>
          {cardData?.card?.description && (
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{cardData.card.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => {
          if (!feature.image_url) return null;

          const isGif = feature.image_url.toLowerCase().endsWith('.gif');
          const isActiveGif = isGif && activeGifIndex === index;

          const content = (
            <>
              <GifImage src={feature.image_url} alt={`Feature ${index + 1}`} isActive={isActiveGif} />
              <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />
              {feature.overlay_text && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <h3 className="text-5xl font-bold text-white drop-shadow-2xl md:text-6xl lg:text-7xl">
                    {feature.overlay_text}
                  </h3>
                </div>
              )}
            </>
          );

          return (
            <div key={feature.id} className="flex flex-col gap-3 px-4 md:px-6">
              {feature.link ? (
                <Link
                  to={feature.link}
                  className="group relative overflow-hidden transition-transform hover:scale-105"
                  style={{ aspectRatio: '3/4' }}
                >
                  {content}
                </Link>
              ) : (
                <div className="group relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
                  {content}
                </div>
              )}
              {feature.button_text && feature.button_link && (
                <Link
                  to={feature.button_link}
                  className="rounded-md border-2 border-black bg-white px-4 py-2 text-center font-semibold text-black transition-colors hover:bg-gray-100"
                >
                  {feature.button_text}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
