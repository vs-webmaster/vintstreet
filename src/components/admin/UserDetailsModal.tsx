import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, MessageSquare, Package, DollarSign, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { fetchMessagesBetweenUsers, createMessage } from '@/services/messages';
import { fetchUserOrders } from '@/services/orders';
import { fetchSellerProfile, updateSellerProfile, fetchSystemSellerProfile } from '@/services/users';
import { isFailure } from '@/types/api';
import { SendMessageModal } from './SendMessageModal';

interface UserDetailsModalProps {
  userId: string | null;
  userName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserDetailsModal = ({ userId, userName, open, onOpenChange }: UserDetailsModalProps) => {
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const queryClient = useQueryClient();

  // Fetch user orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-user-orders', userId],
    queryFn: async () => {
      if (!userId) return [];

      const result = await fetchUserOrders(userId, 1, 1000);
      if (isFailure(result)) throw result.error;

      // Orders from service already include listing details
      return result.data.data.map((order: any) => ({
        ...order,
        listing: order.listings
          ? {
              id: order.listings.id,
              product_name: order.listings.product_name,
              thumbnail: order.listings.thumbnail,
            }
          : null,
      }));
    },
    enabled: !!userId && open,
  });

  // Fetch seller profile if available
  const { data: sellerProfile } = useQuery({
    queryKey: ['admin-user-seller-profile', userId],
    queryFn: async () => {
      if (!userId) return null;

      const result = await fetchSellerProfile(userId);
      if (isFailure(result)) {
        // If not found, return null (not an error)
        if (result.error.message?.includes('not found')) return null;
        throw result.error;
      }
      return result.data;
    },
    enabled: !!userId && open,
  });

  // Fetch message history with VintStreet (system seller)
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['admin-user-messages', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get system seller user_id (the account used for VintStreet official messages)
      const systemSellerResult = await fetchSystemSellerProfile();
      if (isFailure(systemSellerResult) || !systemSellerResult.data) {
        return [];
      }

      const messagesResult = await fetchMessagesBetweenUsers(userId, systemSellerResult.data.user_id);
      if (isFailure(messagesResult)) {
        throw messagesResult.error;
      }
      return messagesResult.data;
    },
    enabled: !!userId && open,
  });

  const handleSendMessage = async (messageText: string) => {
    if (!userId) return;

    // Get system seller user_id
    const systemSellerResult = await fetchSystemSellerProfile();
    if (isFailure(systemSellerResult) || !systemSellerResult.data) {
      toast.error('System seller not found');
      return;
    }

    const result = await createMessage(systemSellerResult.data.user_id, {
      recipient_id: userId,
      subject: 'Message from VintStreet',
      message: messageText,
    });

    if (isFailure(result)) {
      toast.error('Failed to send message');
      throw result.error;
    }

    toast.success('Message sent successfully');
    setMessageModalOpen(false);
  };

  const totalSpent = orders
    .filter((o) => o.buyer_id === userId)
    .reduce((sum, order) => sum + Number(order.order_amount), 0);

  const totalRevenue = orders
    .filter((o) => o.seller_id === userId)
    .reduce((sum, order) => sum + Number(order.order_amount), 0);

  // Suspend/Unsuspend shop mutation
  const suspendShopMutation = useMutation({
    mutationFn: async ({ suspend, reason }: { suspend: boolean; reason?: string }) => {
      if (!userId) throw new Error('No user ID');

      const updates = {
        is_suspended: suspend,
        suspended_at: suspend ? new Date().toISOString() : null,
        suspension_reason: suspend ? reason : null,
      };

      const result = await updateSellerProfile(userId, updates);
      if (isFailure(result)) {
        throw result.error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-seller-profile', userId] });
      toast.success(variables.suspend ? 'Shop suspended successfully' : 'Shop unsuspended successfully');
      setSuspendDialogOpen(false);
      setSuspensionReason('');
    },
    onError: (error) => {
      toast.error('Failed to update shop status');
      console.error(error);
    },
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>User Details: {userName}</span>
              <Button size="sm" onClick={() => setMessageModalOpen(true)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Message User
              </Button>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="orders" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="shop">Shop Info</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Purchases</p>
                      <p className="text-2xl font-bold">£{totalSpent.toFixed(2)}</p>
                    </div>
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Sales</p>
                      <p className="text-2xl font-bold">£{totalRevenue.toFixed(2)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-muted-foreground" />
                  </div>
                </Card>
              </div>

              {ordersLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No orders found</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {order.listing?.thumbnail && (
                                <img src={order.listing.thumbnail} alt="" className="h-8 w-8 rounded object-cover" />
                              )}
                              <span className="text-sm">{order.listing?.product_name || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={order.buyer_id === userId ? 'default' : 'secondary'}>
                              {order.buyer_id === userId ? 'Purchase' : 'Sale'}
                            </Badge>
                          </TableCell>
                          <TableCell>£{Number(order.order_amount).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.delivery_status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="shop" className="space-y-4">
              {sellerProfile ? (
                <>
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{sellerProfile.shop_name}</h3>
                            {sellerProfile.is_suspended && <Badge variant="destructive">Suspended</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{sellerProfile.shop_description}</p>
                        </div>
                        {sellerProfile.shop_logo_url && (
                          <img
                            src={sellerProfile.shop_logo_url}
                            alt="Shop logo"
                            className="h-16 w-16 rounded object-cover"
                          />
                        )}
                      </div>

                      {sellerProfile.business_name && (
                        <div>
                          <p className="text-sm font-medium">Business Name</p>
                          <p className="text-sm text-muted-foreground">{sellerProfile.business_name}</p>
                        </div>
                      )}

                      {sellerProfile.is_suspended && sellerProfile.suspension_reason && (
                        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                          <p className="mb-1 text-sm font-medium text-destructive">Suspension Reason</p>
                          <p className="text-sm text-muted-foreground">{sellerProfile.suspension_reason}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Suspended on {new Date(sellerProfile.suspended_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button asChild variant="outline" className="flex-1">
                          <Link to={`/seller/${userId}`} target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Shop Page
                          </Link>
                        </Button>

                        {sellerProfile.is_suspended ? (
                          <Button
                            variant="default"
                            className="flex-1"
                            onClick={() => suspendShopMutation.mutate({ suspend: false })}
                            disabled={suspendShopMutation.isPending}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Unsuspend Shop
                          </Button>
                        ) : (
                          <Button variant="destructive" className="flex-1" onClick={() => setSuspendDialogOpen(true)}>
                            <Ban className="mr-2 h-4 w-4" />
                            Suspend Shop
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <div className="py-8 text-center text-muted-foreground">This user does not have a seller profile</div>
              )}
            </TabsContent>

            <TabsContent value="messages" className="space-y-4">
              {messagesLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No message history with VintStreet</div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <Card key={message.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{message.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              From: {message.sender_id === userId ? userName : 'VintStreet'}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm">{message.message}</p>
                        <Badge variant={message.status === 'read' ? 'secondary' : 'default'} className="text-xs">
                          {message.status}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <SendMessageModal
        open={messageModalOpen}
        onOpenChange={setMessageModalOpen}
        onSend={handleSendMessage}
        recipientName={userName || 'User'}
      />

      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Shop</AlertDialogTitle>
            <AlertDialogDescription>
              This will suspend the shop and hide all their products from the marketplace. Please provide a reason for
              the suspension.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter suspension reason..."
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => suspendShopMutation.mutate({ suspend: true, reason: suspensionReason })}
              disabled={!suspensionReason.trim() || suspendShopMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Suspend Shop
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
