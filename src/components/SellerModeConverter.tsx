import { useState } from 'react';
import { Store, Crown, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { updateProfile } from '@/services/users';
import { isFailure } from '@/types/api';

const SellerModeConverter = () => {
  const { user, profile, refetchProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const convertToSeller = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await updateProfile(user.id, { user_type: 'seller' });

      if (isFailure(result)) {
        throw result.error;
      }

      await refetchProfile();

      toast({
        title: 'Account upgraded!',
        description: 'You can now create streams and sell products',
      });
    } catch (error) {
      toast({
        title: 'Error upgrading account',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || profile?.user_type === 'seller') {
    return null;
  }

  return (
    <Card className="border-2 border-dashed border-muted">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Store className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">Upgrade to Seller Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-muted-foreground">
          Become a seller to create live streams and sell your products with live auctions
        </p>

        <div className="my-4 flex items-center justify-center gap-4">
          <div className="text-center">
            <Badge variant="secondary" className="mb-1">
              Current
            </Badge>
            <div className="text-sm text-muted-foreground">Buyer Account</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="text-center">
            <Badge className="mb-1 bg-live-indicator text-white">
              <Crown className="mr-1 h-3 w-3" />
              Upgrade
            </Badge>
            <div className="text-sm font-medium">Seller Account</div>
          </div>
        </div>

        <div className="rounded-lg bg-muted/30 p-3 text-left text-sm">
          <div className="mb-2 font-medium">Seller benefits:</div>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Create live streams</li>
            <li>• Sell products through auctions</li>
            <li>• Real-time bidding system</li>
            <li>• Direct interaction with buyers</li>
          </ul>
        </div>

        <Button
          onClick={convertToSeller}
          disabled={loading}
          className="w-full bg-live-indicator hover:bg-live-indicator/90"
        >
          {loading ? 'Upgrading...' : 'Upgrade to Seller'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SellerModeConverter;
