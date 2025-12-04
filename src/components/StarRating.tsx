import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StarRating = ({ rating, maxStars = 5, size = 'md', className }: StarRatingProps) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const fillPercentage = Math.min(Math.max(rating - index, 0), 1);

    if (fillPercentage === 0) {
      // Empty star
      return <Star key={index} className={cn(sizeClasses[size], 'text-gray-300', className)} />;
    } else if (fillPercentage === 1) {
      // Full star
      return <Star key={index} className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400', className)} />;
    } else {
      // Half star using gradient
      return (
        <div key={index} className="relative">
          <Star className={cn(sizeClasses[size], 'text-gray-300', className)} />
          <div className="absolute left-0 top-0 overflow-hidden" style={{ width: `${fillPercentage * 100}%` }}>
            <Star className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400', className)} />
          </div>
        </div>
      );
    }
  };

  return <div className="flex items-center gap-1">{Array.from({ length: maxStars }).map((_, i) => renderStar(i))}</div>;
};
