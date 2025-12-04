// Product Skeleton Component
// Loading placeholder for product cards

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface ProductSkeletonProps {
  className?: string;
}

export const ProductSkeleton = ({ className = '' }: ProductSkeletonProps) => (
  <Card className={`overflow-hidden ${className}`}>
    <Skeleton className="aspect-[234/350] w-full" />
    <CardContent className="space-y-2 p-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-2 h-6 w-1/2" />
    </CardContent>
  </Card>
);

ProductSkeleton.displayName = 'ProductSkeleton';
