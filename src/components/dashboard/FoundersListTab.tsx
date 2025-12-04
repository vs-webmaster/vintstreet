import { Mail, User, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { fetchAllFounders } from '@/services/founders';
import { isFailure } from '@/types/api';

export const FoundersListTab = () => {
  const { data: founders = [], isLoading } = useQuery({
    queryKey: ['founders-list'],
    queryFn: async () => {
      const result = await fetchAllFounders();

      if (isFailure(result)) {
        throw result.error;
      }

      return result.data;
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="py-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading founders...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Founders' List</h3>
            <p className="text-sm text-muted-foreground">
              {founders.length} founder{founders.length !== 1 ? 's' : ''} signed up
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {founders.map((founder) => (
            <Card key={founder.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{founder.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${founder.email}`} className="text-sm text-muted-foreground hover:text-primary">
                        {founder.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {new Date(founder.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {founder.intent && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">Intent:</span>
                      <Badge variant="secondary">{founder.intent}</Badge>
                    </div>
                  </div>
                )}

                {founder.interests && founder.interests.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Interests:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {founder.interests.map((interest) => (
                        <Badge key={interest} variant="outline">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {founder.price_range && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Price Range:</span>
                      <Badge variant="secondary">{founder.price_range}</Badge>
                    </div>
                  </div>
                )}

                {founder.selling_plans && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Selling Plans:</span>
                      <Badge variant="secondary">{founder.selling_plans}</Badge>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {founders.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <User className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No founders have signed up yet</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
