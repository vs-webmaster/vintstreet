import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Edit, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Stream } from '@/types';

interface NextStreamCardProps {
  stream?: Stream;
}

export const NextStreamCard = ({ stream }: NextStreamCardProps) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (!stream) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const streamTime = new Date(stream.start_time).getTime();
      const difference = streamTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (days > 0) {
          setCountdown(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setCountdown(`${minutes}m ${seconds}s`);
        }
      } else {
        setCountdown('Starting now!');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [stream]);

  if (!stream) {
    return (
      <Card className="p-6 text-center">
        <Video className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold text-foreground">No Upcoming Stream</h3>
        <p className="mb-4 text-muted-foreground">Schedule your next stream to start selling live.</p>
        <Link to="/schedule-stream">
          <Button className="bg-green-600 text-white hover:bg-green-700">Schedule Stream</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50 p-6">
      <div className="mb-6 flex items-start justify-between">
        <h3 className="text-lg font-semibold text-foreground">Next Stream</h3>
        <Button variant="outline" size="sm" onClick={() => navigate(`/schedule-stream?edit=${stream.id}`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <div className="flex items-start space-x-4">
        <img
          src={stream.thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&h=320&fit=crop'}
          alt={stream.title}
          className="h-40 w-20 rounded-lg border-2 border-green-300 object-cover"
        />

        <div className="flex-1 space-y-4">
          <div>
            <h4 className="mb-2 font-medium text-foreground">{stream.title}</h4>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Badge className="bg-green-500 text-white">SCHEDULED</Badge>
              <span>{stream.category}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-2xl font-bold text-green-600">{countdown}</div>
            <Link to={`/start-stream/${stream.id}`} className="block">
              <Button className="w-full bg-green-600 text-white hover:bg-green-700">Go Live</Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};
