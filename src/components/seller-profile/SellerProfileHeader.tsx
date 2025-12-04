import { MessageSquare, User } from 'lucide-react';
import { StarRating } from '@/components/StarRating';
import { Button } from '@/components/ui/button';
import { getSellerDisplayName } from '@/lib/sellerNameUtils';

interface SellerProfileHeaderProps {
  sellerProfile: unknown;
  averageRating: number;
  reviewCount: number;
  isFollowing: boolean;
  onFollowToggle: () => void;
  onMessageClick: () => void;
  isFollowPending: boolean;
}

export const SellerProfileHeader = ({
  sellerProfile,
  averageRating,
  reviewCount,
  isFollowing,
  onFollowToggle,
  onMessageClick,
  isFollowPending,
}: SellerProfileHeaderProps) => {
  const logoUrl =
    sellerProfile.shop_logo_url || sellerProfile.profile?.avatar_url || sellerProfile.profiles?.avatar_url;
  const shopName = getSellerDisplayName(sellerProfile);
  const tagline = sellerProfile.shop_tagline || 'Seller on Vintstreet';

  // Truncate shop name for mobile
  const truncatedName = shopName.length > 18 ? shopName.substring(0, 18) + '...' : shopName;

  return (
    <div className="mb-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Shop Logo"
              className="h-20 w-20 flex-shrink-0 rounded-full border-2 border-primary/20 object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <User className="h-10 w-10 text-primary" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-foreground sm:text-3xl">
              <span className="sm:hidden">{truncatedName}</span>
              <span className="hidden sm:inline">{shopName}</span>
            </h1>
            <p className="mt-1 text-muted-foreground">{tagline}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <StarRating rating={averageRating} size="md" />
                <span className="ml-2 text-sm text-muted-foreground">
                  {averageRating.toFixed(1)} ({reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full items-center gap-3 sm:w-auto sm:flex-shrink-0">
          <Button
            variant={isFollowing ? 'outline' : 'default'}
            onClick={onFollowToggle}
            disabled={isFollowPending}
            className="flex-1 sm:flex-none"
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
          <Button variant="outline" onClick={onMessageClick} className="flex-1 sm:flex-none">
            <MessageSquare className="mr-2 h-4 w-4" />
            Message
          </Button>
        </div>
      </div>
    </div>
  );
};
