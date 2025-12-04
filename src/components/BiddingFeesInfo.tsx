import { Shield, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface InfoDialogProps {
  triggerText: React.ReactNode;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const InfoDialog = ({ triggerText, title, icon, content }: InfoDialogProps) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
        {triggerText}
      </Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {icon}
          {title}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 text-sm text-muted-foreground">{content}</div>
    </DialogContent>
  </Dialog>
);

const FairFeesContent = () => (
  <p>
    At Vint Street we believe in fair fees. What's fairer than both paying a small portion rather than
    either buyer or seller paying the full whack.
  </p>
);

const BuyerProtectionContent = () => (
  <>
    <p className="mb-3">We've got you covered with our comprehensive buyer protection policy:</p>
    <ul className="list-inside list-disc space-y-2">
      <li>
        <strong>Damaged items:</strong> Full refund if items arrive damaged or not as described
      </li>
      <li>
        <strong>Counterfeit protection:</strong> Get your money back if items are proven to be fake
      </li>
      <li>
        <strong>Quality guarantee:</strong> Items must match the condition described during the stream
      </li>
      <li>
        <strong>Safe transactions:</strong> Your payment is secured until you confirm receipt
      </li>
    </ul>
    <p className="mt-3 text-xs">Report any issues within 48 hours of delivery for full protection coverage.</p>
  </>
);

const PostageOptionsContent = () => (
  <>
    <p className="mb-4">Choose your postage level. You can fit 2 items in your postage for no extra cost.</p>
    <div className="space-y-3">
      {[
        { name: 'Small', description: 'Up to 2kg, fits through letterbox', price: '£3.95' },
        { name: 'Medium', description: 'Up to 5kg, standard parcel', price: '£6.95' },
        { name: 'Large', description: 'Up to 10kg, large parcel', price: '£9.95' },
      ].map((option) => (
        <div key={option.name} className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <div className="font-medium text-foreground">{option.name}</div>
            <div className="text-xs">{option.description}</div>
          </div>
          <div className="font-semibold text-foreground">{option.price}</div>
        </div>
      ))}
    </div>
  </>
);

const dialogs: InfoDialogProps[] = [
  {
    triggerText: (
      <>
        <span className="mr-1 font-semibold">£</span>
        Split fees - 3.25%
      </>
    ),
    title: 'Fair Fees',
    icon: <span className="h-5 w-5 font-semibold text-blue-600" aria-hidden="true">£</span>,
    content: <FairFeesContent />,
  },
  {
    triggerText: (
      <>
        <Shield className="mr-1 h-3 w-3" aria-hidden="true" />
        Buyer Protection
      </>
    ),
    title: 'Buyer Protection',
    icon: <Shield className="h-5 w-5 text-green-600" aria-hidden="true" />,
    content: <BuyerProtectionContent />,
  },
  {
    triggerText: (
      <>
        <Package className="mr-1 h-3 w-3" aria-hidden="true" />
        Post: £3.95
      </>
    ),
    title: 'Postage Options',
    icon: <Package className="h-5 w-5 text-blue-600" aria-hidden="true" />,
    content: <PostageOptionsContent />,
  },
];

export const BiddingFeesInfo = () => (
  <div className="flex items-center justify-between gap-2">
    {dialogs.map((dialog, index) => (
      <InfoDialog key={index} {...dialog} />
    ))}
  </div>
);
