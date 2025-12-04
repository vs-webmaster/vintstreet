import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ImageRejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
  onOverride?: () => void;
  type?: 'rejected' | 'uncertain';
}

export const ImageRejectionDialog = ({
  open,
  onOpenChange,
  reason,
  onOverride,
  type = 'rejected',
}: ImageRejectionDialogProps) => {
  const handleOverride = () => {
    if (onOverride) {
      onOverride();
    }
    const message =
      type === 'uncertain'
        ? 'Image accepted. Please fill in product details manually.'
        : 'Your product will be submitted for moderation review before approval.';
    toast.info(message);
    onOpenChange(false);
  };

  const isUncertain = type === 'uncertain';
  const title = isUncertain ? 'Product Not Identified' : 'Image Not Suitable';
  const description = isUncertain
    ? "We couldn't identify this product automatically, but you can still use it."
    : "Looks like this image isn't right for Vint Street.";
  const actionText = isUncertain ? 'Use This Image' : 'This Image is OK';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-2 flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                isUncertain ? 'bg-amber-100 dark:bg-amber-950/20' : 'bg-destructive/10'
              }`}
            >
              <AlertCircle
                className={`h-6 w-6 ${isUncertain ? 'text-amber-600 dark:text-amber-500' : 'text-destructive'}`}
              />
            </div>
            <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 text-base">
            <p className="font-medium text-foreground">{description}</p>
            {reason && <p className="text-muted-foreground">{reason}</p>}
            {!isUncertain && (
              <p className="text-sm text-muted-foreground">
                Please upload an image of a product like clothing, footwear, accessories, collectibles, music, or games.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleOverride} className="w-full sm:w-auto">
            {actionText}
          </Button>
          <AlertDialogAction className="w-full sm:w-auto">Try Another Image</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
