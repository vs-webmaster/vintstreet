import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, Play, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { Stream } from '@/types';
import { NextStreamCard } from './NextStreamCard';
import { updateStreamStatus } from '@/services/streams';
import { isFailure } from '@/types/api';

interface StreamsTabProps {
  upcomingStreams: Stream[];
  liveStream?: Stream;
  previousStreams: Stream[];
  onEndStream: (streamId: string) => void;
  onRefresh: () => void;
}

export const StreamsTab = ({
  upcomingStreams,
  liveStream,
  previousStreams,
  onEndStream,
  onRefresh,
}: StreamsTabProps) => {
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const { toast } = useToast();

  // Filter out overdue streams (more than 1 hour late)
  const now = new Date();
  const actualUpcomingStreams = upcomingStreams.filter((stream) => {
    const startTime = new Date(stream.start_time);
    const diffInMs = now.getTime() - startTime.getTime();
    return diffInMs <= 60 * 60 * 1000; // Not more than 1 hour overdue
  });

  // Countdown logic
  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns: Record<string, string> = {};

      actualUpcomingStreams.forEach((stream) => {
        const now = new Date();
        const startTime = new Date(stream.start_time);
        const diffInMs = startTime.getTime() - now.getTime();

        if (diffInMs > 0) {
          const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

          if (days > 0) {
            newCountdowns[stream.id] = `${days}d ${hours}h`;
          } else {
            newCountdowns[stream.id] = `${hours}h`;
          }
        }
      });

      setCountdowns(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [actualUpcomingStreams]);

  const handleCancelStream = async (streamId: string) => {
    try {
      const result = await updateStreamStatus(streamId, 'cancelled');

      if (isFailure(result)) {
        throw result.error;
      }

      toast({
        title: 'Stream cancelled',
        description: 'The stream has been cancelled.',
      });

      onRefresh();
    } catch (error: any) {
      console.error('Error cancelling stream:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to cancel stream. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: Stream['status']) => {
    switch (status) {
      case 'live':
        return 'bg-live-indicator text-white';
      case 'scheduled':
        return 'bg-blue-500 text-white';
      case 'ended':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const nextStream = actualUpcomingStreams[0];

  return (
    <div className="space-y-6">
      {/* Next Stream Card */}
      <NextStreamCard stream={nextStream} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column - Upcoming Streams */}
        <div className="space-y-6">
          {/* Next 3 Upcoming Streams */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {showAllUpcoming ? `All Upcoming Streams (${actualUpcomingStreams.length})` : 'Next 3 Upcoming Streams'}
              </h3>
              {actualUpcomingStreams.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {showAllUpcoming ? 'Show Less' : `Show All ${actualUpcomingStreams.length}`}
                </Button>
              )}
            </div>

            {actualUpcomingStreams.length === 0 ? (
              <Card className="p-6 text-center">
                <Play className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No upcoming streams</p>
                <Link to="/schedule-stream" className="mt-4 block">
                  <Button className="bg-green-600 text-white hover:bg-green-700">Schedule New Stream</Button>
                </Link>
              </Card>
            ) : (
              <div className="grid gap-3">
                {(showAllUpcoming ? actualUpcomingStreams : actualUpcomingStreams.slice(0, 3)).map((stream) => {
                  return (
                    <Card key={stream.id} className="p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="mb-1 font-medium text-foreground">{stream.title}</h4>
                          <p className="mb-2 text-sm text-muted-foreground">{stream.description}</p>
                          <div className="mb-2 flex items-center gap-2 text-xs">
                            <Badge className={getStatusColor(stream.status)}>{stream.status.toUpperCase()}</Badge>
                            <span className="text-muted-foreground">{stream.category}</span>
                            {countdowns[stream.id] && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs font-medium">{countdowns[stream.id]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <img
                          src={
                            stream.thumbnail ||
                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop'
                          }
                          alt={stream.title}
                          className="h-16 w-16 rounded object-cover"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {format(new Date(stream.start_time), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                        <div className="flex gap-2">
                          <Link to={`/schedule-stream?edit=${stream.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link to={`/start-stream/${stream.id}`}>
                            <Button size="sm" className="bg-green-600 text-white hover:bg-green-700">
                              Go Live
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Current Live Stream */}
          {liveStream && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Current Live Stream</h3>
              <Card className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className="animate-pulse bg-live-indicator text-white">
                        <div className="mr-2 h-2 w-2 rounded-full bg-white" />
                        LIVE NOW
                      </Badge>
                    </div>
                    <h4 className="mb-1 font-medium text-foreground">{liveStream.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {liveStream.viewer_count} viewers
                      </span>
                      <span>{liveStream.category}</span>
                    </div>
                  </div>
                  <img
                    src={
                      liveStream.thumbnail ||
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop'
                    }
                    alt={liveStream.title}
                    className="h-16 w-16 rounded object-cover"
                  />
                </div>

                <div className="flex gap-2">
                  <Link to={`/stream/${liveStream.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      View Stream
                    </Button>
                  </Link>
                  <Button variant="destructive" size="sm" onClick={() => onEndStream(liveStream.id)}>
                    End Stream
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Right Column - Previous Streams */}
        <div className="space-y-4">
          {/* Previous Streams */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Previous Streams</h3>
          </div>

          <Card className="p-4">
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {previousStreams.length === 0 ? (
                <div className="py-8 text-center">
                  <Play className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No previous streams yet</p>
                  <p className="text-xs text-muted-foreground">Your completed streams will appear here</p>
                </div>
              ) : (
                previousStreams.map((stream) => (
                  <div key={stream.id} className="flex items-center justify-between border-b py-3 last:border-0">
                    <div className="flex items-start space-x-3">
                      <img
                        src={
                          stream.thumbnail ||
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=40&h=40&fit=crop'
                        }
                        alt={stream.title}
                        className="h-10 w-10 rounded object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{stream.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(stream.start_time), 'MMM d, yyyy')} • {stream.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{stream.viewer_count} views</p>
                      <Badge variant="secondary" className="text-xs">
                        {stream.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
