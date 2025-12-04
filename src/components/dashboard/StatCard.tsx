import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  iconColor = 'text-muted-foreground',
  actionLabel,
  actionHref,
  onAction,
}: StatCardProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      {actionLabel && (actionHref || onAction) && (
        <div className="mt-2">
          {actionHref ? (
            <Link to={actionHref}>
              <Button size="sm" variant="outline" className="w-full text-xs">
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button size="sm" variant="outline" className="w-full text-xs" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
