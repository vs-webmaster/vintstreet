// Checkout Account Creation Modal
// Non-dismissible modal for guest users to create an account

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUp } from '@/services/auth';
import { isFailure } from '@/types/api';

interface CheckoutAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountCreated: (email: string) => void;
  hasUser: boolean;
}

export const CheckoutAccountModal = ({ open, onOpenChange, onAccountCreated, hasUser }: CheckoutAccountModalProps) => {
  const navigate = useNavigate();
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountDetails, setAccountDetails] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  const handleCreateAccount = async () => {
    if (!accountDetails.email || !accountDetails.password || !accountDetails.fullName) {
      toast.error('Please fill in all fields');
      return;
    }

    if (accountDetails.password !== accountDetails.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (accountDetails.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setCreatingAccount(true);

    try {
      const redirectUrl = `${window.location.origin}/checkout`;

      const result = await signUp({
        email: accountDetails.email,
        password: accountDetails.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: accountDetails.fullName,
          },
        },
      });

      if (isFailure(result)) {
        const error = result.error;
        if (error.message?.includes('already registered')) {
          toast.error('This email is already registered. Please log in instead.');
        } else {
          toast.error(error.message || 'Failed to create account');
        }
        setCreatingAccount(false);
        return;
      }

      if (result.data.session) {
        toast.success('Account created! You can now complete your checkout.');
        onOpenChange(false);
        onAccountCreated(accountDetails.email);
      } else {
        toast.info('Account created! Please check your email to confirm your account, then you can log in.', {
          duration: 6000,
        });
        onOpenChange(false);
        onAccountCreated(accountDetails.email);
      }
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account. Please try again.');
    } finally {
      setCreatingAccount(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!hasUser) return;
        onOpenChange(newOpen);
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          if (!hasUser) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Create Your Account</DialogTitle>
          <DialogDescription>
            You must create an account to complete your checkout and track your order.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="modal-fullName">Full Name *</Label>
            <Input
              id="modal-fullName"
              value={accountDetails.fullName}
              onChange={(e) => setAccountDetails({ ...accountDetails, fullName: e.target.value })}
              placeholder="John Smith"
              required
            />
          </div>
          <div>
            <Label htmlFor="modal-email">Email Address *</Label>
            <Input
              id="modal-email"
              type="email"
              value={accountDetails.email}
              onChange={(e) => setAccountDetails({ ...accountDetails, email: e.target.value })}
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="modal-password">Password *</Label>
            <Input
              id="modal-password"
              type="password"
              value={accountDetails.password}
              onChange={(e) => setAccountDetails({ ...accountDetails, password: e.target.value })}
              placeholder="Minimum 6 characters"
              required
            />
          </div>
          <div>
            <Label htmlFor="modal-confirmPassword">Confirm Password *</Label>
            <Input
              id="modal-confirmPassword"
              type="password"
              value={accountDetails.confirmPassword}
              onChange={(e) => setAccountDetails({ ...accountDetails, confirmPassword: e.target.value })}
              placeholder="Re-enter your password"
              required
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/basket')} disabled={creatingAccount}>
            Back to Basket
          </Button>
          <Button className="flex-1" onClick={handleCreateAccount} disabled={creatingAccount}>
            {creatingAccount ? 'Creating...' : 'Create Account'}
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Button variant="link" className="h-auto p-0 text-xs" onClick={() => navigate('/auth?redirect=/checkout')}>
            Log in here
          </Button>
        </p>
      </DialogContent>
    </Dialog>
  );
};
