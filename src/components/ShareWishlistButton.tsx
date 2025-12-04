import { useState } from 'react';
import { Share2, Copy, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWishlistShare } from '@/hooks/useWishlistShare';

export const ShareWishlistButton = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const { generateShareLink, getSharedWishlist, deactivateShare } = useWishlistShare();
  const existingShare = getSharedWishlist.data;
  const shareUrl = existingShare ? `${window.location.origin}/shared-wishlist/${existingShare.share_token}` : null;

  const handleGenerateLink = () => {
    generateShareLink.mutate(
      { name },
      {
        onSuccess: (data) => {
          const url = data.url || shareUrl;
          if (url) {
            navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard!');
          }
        },
      },
    );
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleDeactivate = () => {
    if (existingShare) {
      deactivateShare.mutate(existingShare.id);
      setName('');
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" size="sm">
        <Share2 className="mr-2 h-4 w-4" />
        Share Wishlist
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Wishlist</DialogTitle>
            <DialogDescription>Generate a public link to share your wishlist with others</DialogDescription>
          </DialogHeader>

          {!existingShare ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Wishlist Name (Optional)</Label>
                <Input
                  id="name"
                  placeholder="My Favorite Items"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <Button onClick={handleGenerateLink} className="w-full" disabled={generateShareLink.isPending}>
                {generateShareLink.isPending ? 'Generating...' : 'Generate Share Link'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {existingShare.name && (
                <div>
                  <Label className="text-sm text-muted-foreground">Name</Label>
                  <p className="text-sm font-medium">{existingShare.name}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input value={shareUrl || ''} readOnly className="flex-1" />
                  <Button onClick={handleCopyLink} size="icon" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Views: {existingShare.view_count || 0}</span>
              </div>

              <Button
                onClick={handleDeactivate}
                variant="destructive"
                className="w-full"
                disabled={deactivateShare.isPending}
              >
                <X className="mr-2 h-4 w-4" />
                {deactivateShare.isPending ? 'Deactivating...' : 'Deactivate Share Link'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
