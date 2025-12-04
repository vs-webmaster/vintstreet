import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Stream {
  id: string;
  title: string;
  start_time: string;
  category: string;
  thumbnail?: string;
}

interface SellerShowsTabProps {
  streams: Stream[];
}

export const SellerShowsTab = ({ streams }: SellerShowsTabProps) => {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium">Upcoming Shows</h3>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>

      {streams.length === 0 ? (
        <div className="py-8 text-center">
          <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No upcoming shows</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {streams.map((stream) => (
            <div
              key={stream.id}
              className="group cursor-pointer overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg"
            >
              <div className="relative">
                <img
                  src={
                    stream.thumbnail ||
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop'
                  }
                  alt={stream.title}
                  className="h-40 w-full object-cover"
                />
                <div className="absolute left-2 top-2">
                  <Badge className="bg-blue-500 text-white">SCHEDULED</Badge>
                </div>
              </div>
              <div className="p-4">
                <h4 className="mb-2 line-clamp-2 font-medium text-foreground">{stream.title}</h4>
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(stream.start_time).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="rounded-full bg-secondary px-2 py-1 text-xs">{stream.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
