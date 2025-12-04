import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Wallet, Calendar, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useStripeConnect } from '@/hooks/useStripeConnect';
import { fetchOrders } from '@/services/orders';
import { fetchStripeTransactions, fetchStripePayouts } from '@/services/stripe';
import { isFailure } from '@/types/api';
import { StatCard } from './StatCard';

export const FinancesTab = () => {
  const { user } = useAuth();
  const { loading, connected, balance, balanceLoading, connectAccount, fetchBalance, requestPayout, checkConnection } =
    useStripeConnect();
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);

  // Fetch Stripe transactions
  const { data: transactions } = useQuery({
    queryKey: ['stripe-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const result = await fetchStripeTransactions(user.id);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!user?.id && connected,
  });

  // Fetch payout history
  const { data: payouts } = useQuery({
    queryKey: ['stripe-payouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const result = await fetchStripePayouts(user.id);
      if (isFailure(result)) throw result.error;
      return result.data;
    },
    enabled: !!user?.id && connected,
  });

  // Fetch seller orders to calculate available balance
  const { data: sellerOrders } = useQuery({
    queryKey: ['seller-orders-finances', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const result = await fetchOrders({ sellerId: user.id }, 1, 1000); // Fetch a large number to get all orders

      if (isFailure(result)) {
        throw result.error;
      }
      return result.data.data;
    },
    enabled: !!user?.id && connected,
  });

  useEffect(() => {
    if (user?.id) {
      checkConnection();
    }
  }, [user?.id]);

  useEffect(() => {
    if (connected && user?.id) {
      fetchBalance();
    }
  }, [connected, user?.id]);

  // Calculate available balance from cleared orders
  const availableFromOrders =
    sellerOrders?.reduce((sum, order) => {
      if (order.payout_status === 'available' && order.funds_released) {
        return sum + Number(order.order_amount);
      }
      return sum;
    }, 0) || 0;

  // Calculate clearing balance (funds in 2-day clearing period)
  const clearingBalance =
    sellerOrders?.reduce((sum, order) => {
      if (order.payout_status === 'clearing') {
        return sum + Number(order.order_amount);
      }
      return sum;
    }, 0) || 0;

  // Calculate this month's earnings
  const currentMonth = new Date().getMonth();
  const monthlyEarnings =
    transactions
      ?.filter((t) => {
        const txMonth = new Date(t.created_at).getMonth();
        return txMonth === currentMonth && t.status === 'succeeded';
      })
      .reduce((sum, t) => sum + Number(t.seller_net), 0) || 0;

  const handlePayoutRequest = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > availableFromOrders) {
      toast.error(`Maximum available: £${availableFromOrders.toFixed(2)}`);
      return;
    }

    const success = await requestPayout(amount);
    if (success) {
      setPayoutAmount('');
      setPayoutDialogOpen(false);
    }
  };

  if (!connected) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Connect Stripe</h2>
          <p className="text-muted-foreground">Connect your Stripe account to receive payments</p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to connect your Stripe account before you can receive payments from buyers. Stripe Connect allows
            us to securely split payments between you and the platform.
          </AlertDescription>
        </Alert>

        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">How it works:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Click "Connect Stripe Account" below</li>
              <li>• Complete the Stripe onboarding (takes ~5 minutes)</li>
              <li>• Once verified, you can start receiving payments</li>
              <li>• Platform automatically takes 10% fee from each transaction</li>
              <li>• Request payouts anytime to your bank account</li>
            </ul>
            <Button onClick={connectAccount} disabled={loading} className="w-full" size="lg">
              <CreditCard className="mr-2 h-4 w-4" />
              {loading ? 'Connecting...' : 'Connect Stripe Account'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Finances</h2>
          <p className="text-muted-foreground">Manage your earnings and withdrawals</p>
        </div>
        <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!balance?.accountStatus.payouts_enabled || availableFromOrders <= 0}>
              <Wallet className="mr-2 h-4 w-4" />
              Request Payout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>Enter the amount you'd like to withdraw to your bank account.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (£)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={availableFromOrders}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-sm text-muted-foreground">Available: £{availableFromOrders.toFixed(2)}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePayoutRequest}>Request Payout</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Account Status Alert */}
      {balance?.accountStatus && !balance.accountStatus.payouts_enabled && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Payouts are not enabled yet. Please complete your Stripe onboarding to enable withdrawals.
            <Button variant="link" onClick={connectAccount} className="ml-2 h-auto p-0">
              Complete Onboarding
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {balance?.accountStatus.payouts_enabled && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your Stripe account is fully set up and ready to receive payments!
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Available Balance" value={`£${availableFromOrders.toFixed(2)}`} icon={Wallet} />
        <StatCard title="Clearing Balance" value={`£${clearingBalance.toFixed(2)}`} icon={Clock} />
        <StatCard
          title="Total Lifetime Earnings"
          value={balanceLoading ? 'Loading...' : `£${(balance?.totalEarnings || 0).toFixed(2)}`}
          icon={TrendingUp}
        />
        <StatCard title="This Month's Earnings" value={`£${monthlyEarnings.toFixed(2)}`} icon={Calendar} />
      </div>

      {/* Recent Transactions */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Recent Transactions</h3>
        <div className="space-y-4">
          {transactions && transactions.length > 0 ? (
            transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between border-b py-3 last:border-0">
                <div>
                  <p className="font-medium">Transaction #{transaction.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">£{Number(transaction.seller_net).toFixed(2)}</p>
                  <p className="text-sm capitalize text-muted-foreground">{transaction.status}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-muted-foreground">No transactions yet</p>
          )}
        </div>
      </Card>

      {/* Payout History */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Payout History</h3>
        <div className="space-y-4">
          {payouts && payouts.length > 0 ? (
            payouts.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between border-b py-3 last:border-0">
                <div>
                  <p className="font-medium">Payout #{payout.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(payout.requested_at), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">£{Number(payout.amount).toFixed(2)}</p>
                  <p className="text-sm capitalize text-muted-foreground">{payout.status}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-muted-foreground">No payouts requested yet</p>
          )}
        </div>
      </Card>

      {/* Earnings Breakdown */}
      {balance && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Earnings Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Earnings</span>
              <span className="font-semibold">£{balance.totalEarnings.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform Fee (10%)</span>
              <span className="font-semibold text-destructive">-£{(balance.totalEarnings * 0.1).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="font-semibold">Net Earnings (After Fees)</span>
              <span className="font-semibold text-primary">£{(balance.totalEarnings * 0.9).toFixed(2)}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
