import { AlertTriangle, RefreshCw, Save, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ConcurrentEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onForceOverwrite: () => void;
  conflictData?: {
    product_name?: string;
    updated_at?: string;
  };
}

export const ConcurrentEditDialog = ({
  isOpen,
  onClose,
  onRefresh,
  onForceOverwrite,
  conflictData,
}: ConcurrentEditDialogProps) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Concurrent Edit Detected
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This product has been modified by another user or in another browser tab since you started
              editing.
            </p>
            {conflictData && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p>
                  <strong>Product:</strong> {conflictData.product_name}
                </p>
                <p>
                  <strong>Last modified:</strong> {formatDate(conflictData.updated_at)}
                </p>
              </div>
            )}
            <p className="text-muted-foreground">Choose how to proceed:</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button variant="outline" className="w-full justify-start gap-2" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh and review changes
          </Button>
          <Button
            variant="destructive"
            className="w-full justify-start gap-2"
            onClick={onForceOverwrite}
          >
            <Save className="h-4 w-4" />
            Force save my changes (overwrites)
          </Button>
          <AlertDialogCancel asChild>
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={onClose}>
              <X className="h-4 w-4" />
              Cancel and keep editing
            </Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
