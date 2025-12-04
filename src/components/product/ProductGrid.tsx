// ProductGrid Component
// Reusable grid layout for displaying products

import { memo } from 'react';
import { ProductCard } from './ProductCard';
import { ProductSkeleton } from './ProductSkeleton';
import type { Product } from '@/types/product';

export interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  skeletonCount?: number;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  showAddToCart?: boolean;
  showWishlist?: boolean;
  className?: string;
  emptyMessage?: string;
}

export const ProductGrid = memo(({
  products,
  isLoading = false,
  skeletonCount = 8,
  columns = { sm: 2, md: 3, lg: 4, xl: 5 },
  showAddToCart = true,
  showWishlist = true,
  className = '',
  emptyMessage = 'No products found',
}: ProductGridProps) => {
  // Generate grid column classes
  const gridClasses = [
    'grid gap-4',
    `grid-cols-${columns.sm || 2}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
    className,
  ].filter(Boolean).join(' ');

  // Show skeletons while loading
  if (isLoading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ProductSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  // Show empty state
  if (!products || products.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Render products
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          index={index}
          showAddToCart={showAddToCart}
          showWishlist={showWishlist}
        />
      ))}
    </div>
  );
});

ProductGrid.displayName = 'ProductGrid';
