import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchShopBrandSectionItems } from '@/services/shop';
import { isFailure } from '@/types/api';

interface BrandItem {
  id: string;
  brand_name: string;
  brand_link: string;
  display_order: number;
}

export const ShopBrandSection = () => {
  const { data: brands, isLoading } = useQuery({
    queryKey: ['shop-brand-section-display'],
    queryFn: async () => {
      const result = await fetchShopBrandSectionItems();
      if (isFailure(result)) throw result.error;
      return result.data as BrandItem[];
    },
  });

  if (isLoading || !brands || brands.length === 0) {
    return null;
  }

  // Duplicate brands for seamless infinite scroll
  const duplicatedBrands = [...brands, ...brands, ...brands];

  return (
    <section className="overflow-hidden py-8">
      <div className="flex animate-scroll-brands gap-6 hover:[animation-play-state:paused]">
        {duplicatedBrands.map((brand, index) => (
          <Link key={`${brand.id}-${index}`} to={brand.brand_link} className="group flex-shrink-0">
            <span className="whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground">
              {brand.brand_name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};
