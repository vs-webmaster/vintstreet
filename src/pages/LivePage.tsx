import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LiveStreamCard from '@/components/LiveStreamCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { getSellerDisplayName } from '@/lib/sellerNameUtils';
import { fetchFollowing } from '@/services/follows';
import { fetchActiveStreamCategories, fetchStreamsWithProfiles } from '@/services/streams';
import { fetchFeaturedTagsWithCategories } from '@/services/tags';
import { isFailure } from '@/types/api';

const STREAMS_PER_PAGE = 9;

const LivePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('all'); // "all" or "following"
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch streams with pagination
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['streams-infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const result = await fetchStreamsWithProfiles(pageParam, STREAMS_PER_PAGE);

      if (isFailure(result)) {
        console.error('Error fetching streams:', result.error);
        return [];
      }

      // Transform data with seller info using lookups
      const transformedStreams = result.data.map((stream) => {
        const sellerProfile = stream.seller_profiles;

        const shopName = getSellerDisplayName(sellerProfile);

        const isLive = stream.status === 'live';
        const isUpcoming = stream.status === 'scheduled';

        return {
          id: stream.id,
          title: stream.title,
          streamerName: shopName,
          streamerId: stream.seller_id,
          streamerAvatar: sellerProfile?.shop_logo_url || `https://ui-avatars.com/api/?name=${shopName}&length=1`,
          thumbnail: stream.thumbnail,
          viewerCount: stream.viewer_count,
          isLive,
          isUpcoming,
          startTime: stream.start_time,
          category: stream.category,
          price: null,
        };
      });

      // Sort: live streams first, then upcoming streams by date
      const sortedStreams = transformedStreams.sort((a, b) => {
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        if (a.isLive && b.isLive) return 0;
        if (a.isUpcoming && b.isUpcoming) {
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        }
        return 0;
      });

      return sortedStreams;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === STREAMS_PER_PAGE ? allPages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 30000, // Cache for 30 seconds
  });

  const streams = data?.pages.flat() || [];

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Fetch user's follows
  const { data: userFollows = [] } = useQuery({
    queryKey: ['user-follows-homepage', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const result = await fetchFollowing(user.id);
      if (isFailure(result)) {
        console.error('Error fetching follows:', result.error);
        return [];
      }

      return result.data.map((f) => f.followed_user_id);
    },
    enabled: !!user?.id,
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch categories from database
  const { data: categories = [] } = useQuery({
    queryKey: ['stream-categories'],
    queryFn: async () => {
      const result = await fetchActiveStreamCategories();
      if (isFailure(result)) {
        console.error('Error fetching categories:', result.error);
        return [];
      }

      return result.data;
    },
    staleTime: 300000, // Cache for 5 minutes - categories rarely change
  });

  // Fetch featured tags with their category names
  const { data: featuredTags = [] } = useQuery({
    queryKey: ['featured-tags'],
    queryFn: async () => {
      const result = await fetchFeaturedTagsWithCategories();
      if (isFailure(result)) {
        console.error('Error fetching featured tags:', result.error);
        return [];
      }
      return result.data;
    },
    staleTime: 300000, // Cache for 5 minutes
  });

  // Filter streams based on who user is following
  const followingStreams = streams.filter((stream) => userFollows.includes(stream.streamerId));

  // Get base streams for category counts
  const getBaseStreams = () => {
    return viewMode === 'following' ? followingStreams : streams;
  };

  const getDisplayStreams = () => {
    const baseStreams = getBaseStreams();
    return activeTab === 'all' ? baseStreams : baseStreams.filter((stream) => stream.category === activeTab);
  };

  const filteredStreams = getDisplayStreams();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading streams...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Featured Tags Subnav */}
      {featuredTags.length > 0 && (
        <div className="border-b bg-card">
          <div className="container mx-auto px-4">
            <div className="scrollbar-hide flex gap-3 overflow-x-auto py-3">
              {featuredTags.map((tag) => (
                <Button
                  key={tag.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/shop?tag=${encodeURIComponent(tag.slug)}`)}
                  className="flex-shrink-0 whitespace-nowrap transition-all hover:scale-105"
                >
                  {tag.categoryName} {tag.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left Sidebar - Hidden on mobile, collapsible on tablet+ */}
          <div className="w-full lg:w-64 lg:flex-shrink-0">
            <div className="space-y-6 lg:sticky lg:top-8">
              {/* Mobile: Horizontal scroll for view toggle */}
              <div className="lg:block">
                <h3 className="mb-3 font-semibold">View</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:space-y-2 lg:pb-0">
                  <Button
                    variant={viewMode === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('all')}
                    className="flex-shrink-0 lg:w-full lg:justify-start"
                  >
                    All Streams
                  </Button>
                  <Button
                    variant={viewMode === 'following' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('following')}
                    className="flex-shrink-0 lg:w-full lg:justify-start"
                  >
                    Following
                  </Button>
                </div>
              </div>

              {/* Categories - Horizontal scroll on mobile */}
              <div className="lg:block">
                <h3 className="mb-3 font-semibold">Categories</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:space-y-2 lg:pb-0">
                  <Button
                    variant={activeTab === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('all')}
                    className="flex-shrink-0 lg:w-full lg:justify-start"
                  >
                    All Categories
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={activeTab === category ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab(category)}
                      className="flex-shrink-0 whitespace-nowrap lg:w-full lg:justify-between"
                    >
                      <span>{category}</span>
                      <Badge variant="secondary" className="ml-2 text-xs lg:ml-0">
                        {getBaseStreams().filter((s) => s.category === category).length}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground lg:text-2xl">Browse Streams</h2>
              <p className="text-muted-foreground">
                {viewMode === 'following' ? 'Streams from people you follow' : 'Discover live shopping streams'}
              </p>
            </div>

            {/* Live streams grid - Responsive grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
              {filteredStreams.map((stream) => (
                <LiveStreamCard key={stream.id} {...stream} isFollowing={userFollows.includes(stream.streamerId)} />
              ))}
            </div>

            {/* Loading skeletons */}
            {isFetchingNextPage && (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-video w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Intersection observer trigger */}
            {hasNextPage && !isFetchingNextPage && <div ref={loadMoreRef} className="h-20" />}

            {filteredStreams.length === 0 && !isLoading && (
              <div className="py-12 text-center">
                <p className="text-lg text-muted-foreground">
                  No streams found
                  {activeTab !== 'all' && ` in ${activeTab} category`}
                  {viewMode === 'following' && ' from people you follow'}.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveTab('all');
                    setViewMode('all');
                  }}
                  className="mt-4"
                >
                  View All Streams
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
export default LivePage;
