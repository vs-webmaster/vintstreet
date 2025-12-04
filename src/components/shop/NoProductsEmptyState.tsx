import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { fetchNoProductsSettings } from '@/services/settings';
import { isSuccess } from '@/types/api';

interface NoProductsEmptyStateProps {
  onClearFilters: () => void;
}

export const NoProductsEmptyState = ({ onClearFilters }: NoProductsEmptyStateProps) => {
  const { data: settings } = useQuery({
    queryKey: ['no-products-settings'],
    queryFn: async () => {
      const result = await fetchNoProductsSettings();
      if (isSuccess(result)) {
        return result.data;
      }
      throw result.error;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="grid items-center gap-8 md:grid-cols-2">
          {/* Left Column - Image */}
          {settings?.image_url && (
            <div className="flex justify-center md:justify-end">
              <img
                src={settings.image_url}
                alt={settings.title || 'No products'}
                className="h-auto w-full max-w-md rounded-lg object-cover"
              />
            </div>
          )}

          {/* Right Column - Content */}
          <div className={`space-y-6 ${!settings?.image_url ? 'text-center md:col-span-2' : 'text-left'}`}>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">{settings?.title || 'No Products Found'}</h2>

              {settings?.content && (
                <div
                  className="prose prose-sm max-w-none text-lg text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(settings.content) }}
                />
              )}
            </div>

            <div className={`flex flex-col gap-3 sm:flex-row ${!settings?.image_url ? 'justify-center' : ''}`}>
              <Button onClick={onClearFilters} variant="outline">
                Clear Filters
              </Button>

              {settings?.cta_link && settings?.cta_text && (
                <Button asChild>
                  <Link to={settings.cta_link}>{settings.cta_text}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
