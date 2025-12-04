import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { createMessage } from '@/services/messages';
import { isFailure } from '@/types/api';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  productName?: string;
  orderId?: string;
  mode?: 'buyer' | 'seller'; // To determine the UI text
}

export const ContactModal = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  productName,
  orderId,
  mode = 'buyer',
}: ContactModalProps) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to send a message');
      return;
    }

    if (!recipientId || recipientId.trim() === '') {
      console.error('Invalid recipient ID:', recipientId);
      toast.error('Invalid recipient. Please try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createMessage(user.id, {
        recipient_id: recipientId,
        subject: subject.trim(),
        message: message.trim(),
        order_id: orderId || undefined,
      });

      if (isFailure(result)) {
        throw result.error;
      }

      // Invalidate messages queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['messages'] });

      toast.success(`Message sent to ${recipientName}!`);
      onClose();
      setSubject('');
      setMessage('');
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      const errorMessage = error?.message || 'Failed to send message. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = mode === 'seller' ? 'Message Buyer' : 'Contact Seller';
  const modalDescription =
    mode === 'seller'
      ? `Send a message to ${recipientName}${productName ? ` about ${productName}` : ''}`
      : `Send a message to ${recipientName}${productName ? ` about ${productName}` : ''}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {modalTitle}
          </DialogTitle>
          <DialogDescription>{modalDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Reference */}
          {orderId && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">Order #{orderId.slice(-8)}</p>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Product Inquiry">Product Inquiry</SelectItem>
                <SelectItem value="Shipping Question">Shipping Question</SelectItem>
                <SelectItem value="Payment Issue">Payment Issue</SelectItem>
                <SelectItem value="Product Condition">Product Condition</SelectItem>
                <SelectItem value="Return Request">Return Request</SelectItem>
                <SelectItem value="Order Update">Order Update</SelectItem>
                <SelectItem value="General Question">General Question</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={5}
              maxLength={1000}
            />
            <p className="text-right text-xs text-muted-foreground">{message.length}/1000 characters</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !subject.trim() || !message.trim()}>
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
