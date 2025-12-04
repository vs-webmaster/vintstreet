import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { updateOrdersByBuyerAndStatus } from '@/services/orders';
import { isFailure } from '@/types/api';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const updateOrders = async () => {
      if (!sessionId || !user) return;

      try {
        // Update orders from pending to completed
        // Note: Database trigger automatically updates listing status
        const result = await updateOrdersByBuyerAndStatus(user.id, 'pending', {
          status: 'completed',
          delivery_status: 'processing',
        });

        if (isFailure(result)) {
          console.error('Error updating orders:', result.error);
          return;
        }

        // Clear cart after successful payment
        clearCart();
      } catch (error) {
        console.error('Error in payment success:', error);
      }
    };

    updateOrders();
  }, [sessionId, user, clearCart]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <Card className="mx-auto max-w-2xl text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-3xl">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="mb-4 text-lg text-muted-foreground">
                Thank you for your purchase. Your order has been confirmed and is being processed.
              </p>
              <p className="text-sm text-muted-foreground">
                You'll receive an email confirmation shortly with your order details.
              </p>
            </div>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button onClick={() => navigate('/my-orders')} size="lg">
                View My Orders
              </Button>
              <Button onClick={() => navigate('/shop')} variant="outline" size="lg">
                Continue Shopping
              </Button>
            </div>

            {sessionId && <p className="text-xs text-muted-foreground">Payment Session: {sessionId}</p>}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccessPage;
