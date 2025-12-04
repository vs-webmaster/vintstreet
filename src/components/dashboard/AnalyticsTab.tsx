import { Eye, Star, MessageSquare, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { MOCK_MESSAGES } from '@/lib/constants';
import { Stream } from '@/types';

interface AnalyticsTabProps {
  streams: Stream[];
  stats: {
    totalViewers: number;
    totalOrders: number;
  };
}

export const AnalyticsTab = ({ streams, stats }: AnalyticsTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalViewers.toLocaleString()}</p>
            </div>
            <Eye className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
              <p className="text-2xl font-bold text-foreground">4.8</p>
            </div>
            <Star className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">New Messages</p>
              <p className="text-2xl font-bold text-foreground">
                {MOCK_MESSAGES.filter((m) => m.status === 'new').length}
              </p>
            </div>
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalViewers > 0 ? ((stats.totalOrders / stats.totalViewers) * 100).toFixed(1) : '0.0'}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Performance Insights</h3>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between rounded bg-muted/50 p-3">
            <span>Most Popular Stream Category</span>
            <span className="font-medium">
              {streams.length > 0
                ? (streams.reduce(
                    (acc, stream) => {
                      acc[stream.category] = (acc[stream.category] || 0) + stream.viewer_count;
                      return acc;
                    },
                    {} as Record<string, number>,
                  ) &&
                    Object.entries(
                      streams.reduce(
                        (acc, stream) => {
                          acc[stream.category] = (acc[stream.category] || 0) + stream.viewer_count;
                          return acc;
                        },
                        {} as Record<string, number>,
                      ),
                    ).sort(([, a], [, b]) => b - a)[0]?.[0]) ||
                  'None'
                : 'None'}
            </span>
          </div>

          <div className="flex justify-between rounded bg-muted/50 p-3">
            <span>Total Streaming Hours</span>
            <span className="font-medium">
              {streams
                .filter((s) => s.end_time)
                .reduce((total, stream) => {
                  const start = new Date(stream.start_time);
                  const end = new Date(stream.end_time!);
                  return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                }, 0)
                .toFixed(1)}{' '}
              hours
            </span>
          </div>

          <div className="flex justify-between rounded bg-muted/50 p-3">
            <span>Average Viewers Per Stream</span>
            <span className="font-medium">
              {streams.length > 0
                ? (streams.reduce((sum, stream) => sum + stream.viewer_count, 0) / streams.length).toFixed(0)
                : '0'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
