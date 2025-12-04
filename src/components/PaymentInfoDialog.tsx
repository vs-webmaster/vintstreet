import { useState } from 'react';
import { CreditCard, MapPin, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface PaymentInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PaymentInfoDialog = ({ open, onOpenChange }: PaymentInfoDialogProps) => {
  const [step, setStep] = useState<'payment' | 'address'>('payment');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  const [addressData, setAddressData] = useState({
    firstName: '',
    lastName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: 'UK',
  });

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('address');
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Payment and delivery information saved successfully!');
    onOpenChange(false);
    setStep('payment');
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep('payment');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'payment' ? (
              <>
                <CreditCard className="h-5 w-5 text-blue-600" />
                Add Payment Information
              </>
            ) : (
              <>
                <MapPin className="h-5 w-5 text-blue-600" />
                Delivery Address
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {step === 'payment' && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3">
              <Shield className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-800">Your payment details are encrypted and secure</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  value={paymentData.cardholderName}
                  onChange={(e) => setPaymentData((prev) => ({ ...prev, cardholderName: e.target.value }))}
                  placeholder="John Smith"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={paymentData.cardNumber}
                  onChange={(e) => setPaymentData((prev) => ({ ...prev, cardNumber: e.target.value }))}
                  placeholder="1234 5678 9012 3456"
                  required
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    value={paymentData.expiryDate}
                    onChange={(e) => setPaymentData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                    placeholder="MM/YY"
                    required
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    value={paymentData.cvv}
                    onChange={(e) => setPaymentData((prev) => ({ ...prev, cvv: e.target.value }))}
                    placeholder="123"
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Next: Address
              </Button>
            </div>
          </form>
        )}

        {step === 'address' && (
          <form onSubmit={handleAddressSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={addressData.firstName}
                    onChange={(e) => setAddressData((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={addressData.lastName}
                    onChange={(e) => setAddressData((prev) => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Smith"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  value={addressData.addressLine1}
                  onChange={(e) => setAddressData((prev) => ({ ...prev, addressLine1: e.target.value }))}
                  placeholder="123 High Street"
                  required
                />
              </div>

              <div>
                <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                <Input
                  id="addressLine2"
                  value={addressData.addressLine2}
                  onChange={(e) => setAddressData((prev) => ({ ...prev, addressLine2: e.target.value }))}
                  placeholder="Apt, suite, etc."
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={addressData.city}
                    onChange={(e) => setAddressData((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="London"
                    required
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={addressData.postalCode}
                    onChange={(e) => setAddressData((prev) => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="SW1A 1AA"
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep('payment')} className="flex-1">
                Back
              </Button>
              <Button type="submit" className="flex-1">
                Save Information
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
