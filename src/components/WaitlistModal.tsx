import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';
import { createWaitlistSignup } from '@/services/waitlist';
import { isFailure } from '@/types/api';

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WaitlistModal = ({ open, onOpenChange }: WaitlistModalProps) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createWaitlistSignup({ email: email.trim() });

      if (isFailure(result)) {
        throw result.error;
      }

      setEmail('');
      onOpenChange(false);
      toast({
        title: 'Success!',
        description: "You're on the waitlist! We'll be in touch soon.",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to join waitlist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Join the Waitlist</DialogTitle>
          <DialogDescription className="space-y-2 pt-2 text-base">
            <p className="font-semibold text-foreground">Get exclusive early access to Vint Street!</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>✨ Be first to discover surprise drops</li>
              <li>🎯 Early access to the best vintage finds</li>
              <li>💫 Buy and sell the things you love</li>
              <li>🌟 Join a community of sustainable shoppers</li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
            disabled={isSubmitting}
          />

          <Button type="submit" className="w-full bg-black text-white hover:bg-black/90" disabled={isSubmitting}>
            {isSubmitting ? 'Joining...' : 'Join the Waitlist'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
