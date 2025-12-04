import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { invokeEdgeFunction } from '@/services/functions';
import { fetchStripeConnectedAccount } from '@/services/stripe';
import { isFailure } from '@/types/api';

export interface StripeBalance {
  available: number;
  pending: number;
  totalEarnings: number;
  currency: string;
  accountStatus: {
    charges_enabled: boolean;
    payouts_enabled: boolean;
    onboarding_complete: boolean;
  };
}

export const useStripeConnect = () => {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState<StripeBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    checkConnection();
  }, [user?.id]);

  const checkConnection = async () => {
    if (!user?.id) return;

    try {
      const result = await fetchStripeConnectedAccount(user.id);

      if (!isFailure(result) && result.data) {
        setConnected(result.data.onboarding_complete && result.data.charges_enabled);
      }
    } catch (error) {
      console.error('Error checking Stripe connection:', error);
    }
  };

  const connectAccount = async () => {
    if (!user) {
      toast.error('Please log in to connect your Stripe account');
      return;
    }

    setLoading(true);
    try {
      const result = await invokeEdgeFunction<{ url?: string }>({
        functionName: 'create-connect-account',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: { platform: 'web' },
      });

      if (isFailure(result)) throw result.error;

      // Open Stripe onboarding in new window
      if (result.data?.url) {
        window.open(result.data.url, '_blank');
        toast.success('Opening Stripe Connect onboarding...');
      }
    } catch (error: unknown) {
      console.error('Error connecting Stripe account:', error);
      toast.error(error.message || 'Failed to connect Stripe account');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    if (!user) return;

    setBalanceLoading(true);
    try {
      const result = await invokeEdgeFunction<StripeBalance>({
        functionName: 'get-seller-balance',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (isFailure(result)) throw result.error;

      setBalance(result.data);
      setConnected(result.data.accountStatus.onboarding_complete && result.data.accountStatus.charges_enabled);
    } catch (error: unknown) {
      console.error('Error fetching balance:', error);
      if (!error.message?.includes('No Stripe account found')) {
        toast.error(error.message || 'Failed to fetch balance');
      }
    } finally {
      setBalanceLoading(false);
    }
  };

  const requestPayout = async (amount: number) => {
    if (!user) {
      toast.error('Please log in to request a payout');
      return false;
    }

    if (!balance?.accountStatus.payouts_enabled) {
      toast.error('Payouts are not enabled. Please complete Stripe onboarding.');
      return false;
    }

    if (amount > (balance?.available || 0)) {
      toast.error('Insufficient balance for this payout');
      return false;
    }

    try {
      const result = await invokeEdgeFunction({
        functionName: 'create-payout',
        body: { amount, currency: balance?.currency || 'gbp' },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (isFailure(result)) throw result.error;

      toast.success('Payout requested successfully!');
      await fetchBalance(); // Refresh balance
      return true;
    } catch (error: unknown) {
      console.error('Error requesting payout:', error);
      toast.error(error.message || 'Failed to request payout');
      return false;
    }
  };

  return {
    loading,
    connected,
    balance,
    balanceLoading,
    connectAccount,
    fetchBalance,
    requestPayout,
    checkConnection,
  };
};
