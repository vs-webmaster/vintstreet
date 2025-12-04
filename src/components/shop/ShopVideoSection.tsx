import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CachedImage } from '@/components/CachedImage';
import { fetchShopVideoConfig } from '@/services/shop';
import { isFailure } from '@/types/api';

interface VideoConfig {
  id: string;
  title: string | null;
  subtitle: string | null;
  video_url: string | null;
  phone_mockup_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
  cta_bg_color: string | null;
  cta_text_color: string | null;
}

interface VideoFeature {
  id: string;
  image_url: string | null;
  text: string | null;
  link: string | null;
  display_order: number;
}

export const ShopVideoSection = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['shop-video-section'],
    queryFn: async () => {
      const result = await fetchShopVideoConfig();
      if (isFailure(result)) throw result.error;
      if (!result.data) return null;

      return {
        config: result.data.config as VideoConfig,
        features: result.data.features as VideoFeature[],
      };
    },
  });

  if (isLoading || !data) {
    return null;
  }

  const { config, features } = data;

  const hasAnyMedia = features.length > 0 || !!config.video_url || !!config.phone_mockup_url;
  const hasAnyText = !!config.title || !!config.subtitle || !!config.cta_text;

  if (!hasAnyMedia && !hasAnyText) {
    return null;
  }

  return (
    <section className="bg-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left Column - Phone Mockup with Video */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative w-full max-w-md lg:max-w-lg">
              {config.phone_mockup_url ? (
                <div className="relative">
                  <CachedImage src={config.phone_mockup_url} alt="Phone mockup" className="w-full" />
                  {config.video_url && (
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                      <video
                        src={config.video_url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="h-full w-full rounded-3xl object-cover"
                      />
                    </div>
                  )}
                </div>
              ) : config.video_url ? (
                <div className="relative aspect-[9/16] overflow-hidden rounded-3xl bg-card shadow-2xl">
                  <video
                    src={config.video_url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Column - Features Grid */}
          <div className="space-y-8">
            {config.title && (
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-foreground md:text-5xl">{config.title}</h2>
                {config.subtitle && <p className="text-lg text-muted-foreground">{config.subtitle}</p>}
                {config.cta_text && config.cta_link && (
                  <a
                    href={config.cta_link}
                    style={{
                      backgroundColor: config.cta_bg_color || '#000000',
                      color: config.cta_text_color || '#FFFFFF',
                    }}
                    className="inline-block rounded-md px-8 py-3 font-medium transition-opacity hover:opacity-90"
                  >
                    {config.cta_text}
                  </a>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              {features.map((feature) => {
                if (!feature.image_url) return null;

                const card = (
                  <div className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                    <CachedImage
                      src={feature.image_url}
                      alt={feature.text || `Feature`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    {feature.text && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-sm font-medium text-white">{feature.text}</p>
                      </div>
                    )}
                  </div>
                );

                return feature.link ? (
                  <Link key={feature.id} to={feature.link} className="block">
                    {card}
                  </Link>
                ) : (
                  <div key={feature.id}>{card}</div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
