import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Video,
  ShoppingBag,
  Star,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Coins,
  HandHeart,
  Package,
  Headset,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSellerProfile } from '@/hooks/useSellerProfile';
import { cn } from '@/lib/utils';
import { getTabFromHash } from '@/lib/sellerTabUtils';
import { fetchUnreadCount } from '@/services/messages';
import { getPendingOfferCount } from '@/services/offers';
import { getPendingOrderCount } from '@/services/orders';
import { getUnrepliedReviewCount } from '@/services/reviews';
import { isSuccess } from '@/types/api';

interface SellerSidebarProps {
  forceCollapsed?: boolean;
}

const SellerSidebar = ({ forceCollapsed = false }: SellerSidebarProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(forceCollapsed);
  const location = useLocation();

  // Update collapsed state when forceCollapsed changes
  useEffect(() => {
    setIsCollapsed(forceCollapsed);
  }, [forceCollapsed]);

  // Check if seller has completed setup
  const { hasSellerProfile } = useSellerProfile();

  const currentTab = getTabFromHash(location.hash) || 'products';

  // Fetch counts for badges
  const { data: counts } = useQuery({
    queryKey: ['sidebar-counts', user?.id],
    queryFn: async () => {
      if (!user?.id) return { orders: 0, offers: 0, reviews: 0, messages: 0 };

      const [ordersResult, offersResult, messagesResult, reviewsResult] = await Promise.all([
        getPendingOrderCount(user.id),
        getPendingOfferCount(user.id),
        fetchUnreadCount(user.id),
        getUnrepliedReviewCount(user.id),
      ]);

      return {
        orders: isSuccess(ordersResult) ? ordersResult.data : 0,
        offers: isSuccess(offersResult) ? offersResult.data : 0,
        reviews: isSuccess(reviewsResult) ? reviewsResult.data : 0,
        messages: isSuccess(messagesResult) ? messagesResult.data : 0,
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const sidebarItems = [
    // Setup tab only shown if not complete
    ...(!hasSellerProfile
      ? [
          {
            id: 'setup',
            label: 'Setup',
            icon: Sparkles,
            href: '#setup',
            count: null,
          },
        ]
      : []),
    {
      id: 'products',
      label: 'My Listings',
      icon: Package,
      href: '#products',
      count: null,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      href: '#orders',
      count: counts?.orders || null,
    },
    {
      id: 'offers',
      label: 'Offers',
      icon: HandHeart,
      href: '#offers',
      count: counts?.offers || null,
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      href: '#messages',
      count: counts?.messages || null,
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: Star,
      href: '#reviews',
      count: counts?.reviews || null,
    },
    {
      id: 'streams',
      label: 'My Streams',
      icon: Video,
      href: '#streams',
      count: null,
    },
    {
      id: 'finances',
      label: 'Finances',
      icon: Coins,
      href: '#finances',
      count: null,
    },
    {
      id: 'settings',
      label: 'Shop Settings',
      icon: Settings,
      href: '#settings',
      count: null,
    },
  ];

  if (isMobile) {
    return (
      <div className="sticky top-[var(--header-height,64px)] z-30 border-b border-border bg-card lg:hidden">
        <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto px-4 py-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <Link
                key={item.id}
                to={item.href}
                className={cn(
                  'relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
                {item.count && item.count > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs font-semibold text-white">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'sticky top-0 flex h-screen flex-col border-r border-border bg-card transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Toggle Button */}
      <div className="border-b border-border p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full justify-center"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-2 overflow-y-auto p-4">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <Link
              key={item.id}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                isCollapsed && 'justify-center px-2',
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', isCollapsed && 'h-4 w-4')} />
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.count && item.count > 0 && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-semibold text-white">
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Contact Support Button */}
      <div className="border-t border-border p-4">
        <Button
          variant="outline"
          className={cn('w-full transition-all', isCollapsed ? 'justify-center px-2' : 'justify-start gap-3')}
          onClick={() => window.open('mailto:support@vintstreet.com', '_blank')}
        >
          <Headset className={cn('shrink-0', isCollapsed ? 'h-4 w-4' : 'h-5 w-5')} />
          {!isCollapsed && <span>Contact Support</span>}
        </Button>
      </div>
    </div>
  );
};

export default SellerSidebar;
