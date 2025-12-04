import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { streamImages, resolveThumbnail } from '@/lib/streamThumbnails';
import { followUser, unfollowUser } from '@/services/follows';
import { isFailure } from '@/types/api';

interface LiveStreamCardProps {
  id: string;
  title: string;
  streamerName: string;
  streamerAvatar: string;
  streamerId: string;
  thumbnail: string;
  viewerCount: number;
  isLive: boolean;
  isUpcoming?: boolean;
  startTime?: string;
  category: string;
  price?: string;
  isFollowing?: boolean; // Passed from parent to avoid N+1 queries
  onFollowToggle?: (streamerId: string, isCurrentlyFollowing: boolean) => void;
}

const LiveStreamCard = ({
  id,
  title,
  streamerName,
  streamerAvatar,
  streamerId,
  thumbnail,
  viewerCount,
  isLive,
  isUpcoming,
  startTime,
  category,
  price,
  isFollowing = false,
  onFollowToggle,
}: LiveStreamCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Use thumbnail from database with resolver or fallback to a random stream image
  const resolvedThumbnail = resolveThumbnail(thumbnail);
  const displayThumbnail =
    resolvedThumbnail ||
    streamImages[Math.abs(id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % streamImages.length];

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please sign in to follow streamers');
      return;
    }

    if (user.id === streamerId) {
      toast.error('You cannot follow yourself');
      return;
    }

    setIsFollowLoading(true);

    try {
      if (isFollowing) {
        const result = await unfollowUser(user.id, streamerId);
        if (isFailure(result)) {
          throw result.error;
        }
        toast.success(`Unfollowed ${streamerName}`);
      } else {
        const result = await followUser(user.id, streamerId);
        if (isFailure(result)) {
          throw result.error;
        }
        toast.success(`Now following ${streamerName}`);
      }

      // Notify parent and invalidate queries
      onFollowToggle?.(streamerId, isFollowing);
      queryClient.invalidateQueries({ queryKey: ['user-follows-homepage'] });
      queryClient.invalidateQueries({ queryKey: ['follow-status'] });
    } catch (error: unknown) {
      console.error('Error toggling follow:', error);
      toast.error(error?.message || 'Failed to update follow status');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const linkDestination = isUpcoming ? `/seller/${streamerId}` : `/stream/${id}`;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    navigate(linkDestination);
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden bg-card transition-all duration-300 hover:shadow-lg"
      onClick={handleCardClick}
    >
      <div className="relative">
        <div className="aspect-video h-60 w-full overflow-hidden">
          <img
            src={displayThumbnail}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Stream overlay */}
        <div className="absolute inset-0 bg-stream-overlay opacity-0 transition-opacity duration-300 group-hover:opacity-30" />

        {/* Live indicator */}
        {isLive && (
          <Badge className="absolute left-3 top-3 animate-pulse border-0 bg-live-indicator text-white">
            <div className="mr-2 h-2 w-2 rounded-full bg-white" />
            LIVE
          </Badge>
        )}

        {/* Upcoming stream indicator */}
        {isUpcoming && startTime && (
          <Badge className="absolute left-3 top-3 border-0 bg-blue-600 text-white">
            {format(new Date(startTime), 'MMM d • h:mm a')}
          </Badge>
        )}

        {/* Viewer count - only show for live streams */}
        {isLive && (
          <div className="absolute right-3 top-3 flex items-center rounded-full bg-black/50 px-2 py-1 text-xs text-white">
            <Eye className="mr-1 h-3 w-3" />
            {viewerCount.toLocaleString()}
          </div>
        )}

        {/* Category badge */}
        <Badge variant="secondary" className="absolute bottom-3 left-3">
          {category}
        </Badge>
      </div>

      <div className="p-4">
        <div className="flex items-start space-x-3">
          <Link to={`/seller/${streamerId}`} onClick={(e) => e.stopPropagation()}>
            <img
              src={streamerAvatar}
              alt={streamerName}
              className="h-10 w-10 rounded-full object-cover transition-all hover:ring-2 hover:ring-primary"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-live-indicator">
              {title}
            </h3>
            <Link
              to={`/seller/${streamerId}`}
              className="block truncate text-xs text-muted-foreground transition-colors hover:text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              {streamerName}
            </Link>
            <div className="mt-2 flex items-center justify-end">
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 hover:text-live-indicator ${isFollowing ? 'text-live-indicator' : ''}`}
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
              >
                <Heart className={`h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LiveStreamCard;
