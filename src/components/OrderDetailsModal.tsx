import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MapPin, Truck, MessageSquare, Printer, Calendar, Package } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { updateOrder } from '@/services/orders';
import { isFailure } from '@/types/api';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order:
    | {
        id: string;
        orderNumber: string;
        orderDate?: string | Date;
        trackingNumber?: string;
        buyer?: {
          name?: string;
          email?: string;
          phone?: string;
          shippingAddress?: {
            line1?: string;
            line2?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
          };
        };
        product?: {
          name?: string;
          thumbnail?: string;
        };
        shippingMethod?: string;
        totalAmount?: number;
        status?: string;
        quantity?: number;
      }
    | null
    | undefined;
  onMessageBuyer: () => void;
  onStatusUpdate: () => void;
}

export const OrderDetailsModal = ({
  isOpen,
  onClose,
  order,
  onMessageBuyer,
  onStatusUpdate,
}: OrderDetailsModalProps) => {
  const [status, setStatus] = useState(order?.status || 'pending');
  const [trackingNumber, setTrackingNumber] = useState(order?.trackingNumber || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const queryClient = useQueryClient();

  // Update state when order prop changes
  useEffect(() => {
    if (order) {
      setStatus(order.status || 'pending');
      setTrackingNumber(order.trackingNumber || '');
    }
  }, [order]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order?.id) return;

    setIsUpdating(true);
    try {
      const result = await updateOrder(order.id, { delivery_status: newStatus });

      if (isFailure(result)) {
        throw result.error;
      }

      setStatus(newStatus);
      toast.success('Order status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onStatusUpdate();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error?.message || 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveTrackingNumber = async () => {
    if (!order?.id) return;

    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    setIsSavingTracking(true);
    try {
      const result = await updateOrder(order.id, { tracking_number: trackingNumber.trim() });

      if (isFailure(result)) {
        throw result.error;
      }

      toast.success('Tracking number saved successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onStatusUpdate();
    } catch (error: any) {
      console.error('Error saving tracking number:', error);
      toast.error(error?.message || 'Failed to save tracking number');
    } finally {
      setIsSavingTracking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      case 'shipped':
        return 'bg-purple-500';
      case 'delivered':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handlePrintLabel = () => {
    const labelHtml = `
      <html>
        <head>
          <title>Shipping Label - Order ${order?.orderNumber || 'N/A'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .label { border: 2px solid #000; padding: 20px; max-width: 600px; }
            .header { text-align: center; font-size: 22px; font-weight: bold; margin-bottom: 16px; }
            .section { margin: 12px 0; }
            .section-title { font-weight: bold; font-size: 13px; margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="header">SHIPPING LABEL</div>
            <div class="section">
              <div class="section-title">SHIP TO:</div>
              <div>${order.buyer?.name || 'N/A'}</div>
              <div>${order.buyer?.shippingAddress?.line1 || 'N/A'}</div>
              ${order.buyer?.shippingAddress?.line2 ? `<div>${order.buyer.shippingAddress.line2}</div>` : ''}
              <div>${order.buyer?.shippingAddress?.city || 'N/A'}, ${order.buyer?.shippingAddress?.state || 'N/A'} ${
                order.buyer?.shippingAddress?.postalCode || 'N/A'
              }</div>
              <div>${order.buyer?.shippingAddress?.country || 'N/A'}</div>
              ${order.buyer?.phone ? `<div>Phone: ${order.buyer.phone}</div>` : ''}
            </div>
            <div class="section">
              <div class="section-title">ORDER:</div>
              <div>Order #: ${order?.orderNumber || 'N/A'}</div>
              <div>Product: ${order?.product?.name || 'Unknown Product'}</div>
              <div>Quantity: ${order?.quantity || 0}</div>
              <div>Total: £${(order?.totalAmount || 0).toFixed(2)}</div>
            </div>
          </div>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(labelHtml);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 150);
    }
  };

  if (!order) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-4 md:max-w-4xl md:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Order Details - {order?.orderNumber || 'N/A'}</DialogTitle>
          <DialogDescription>Review order info and print a shipping label.</DialogDescription>
        </DialogHeader>

        {/* Order Status, Total Items, and Order Date */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Total Items */}
          <div className="rounded-lg bg-muted/30 p-4">
            <h3 className="mb-2 text-sm font-semibold">Total Items</h3>
            <p className="text-2xl font-bold">{order?.quantity || 0}</p>
          </div>

          {/* Order Date */}
          <div className="rounded-lg bg-muted/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Order Date</h3>
            </div>
            {order?.orderDate ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">{format(new Date(order.orderDate), 'do MMM yyyy')}</p>
                <p className="text-xs text-muted-foreground">
                  ({formatDistanceToNow(new Date(order.orderDate), { addSuffix: true })})
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not available</p>
            )}
          </div>

          {/* Order Status */}
          <div className="rounded-lg bg-muted/30 p-4">
            <h3 className="mb-2 text-sm font-semibold">Order Status</h3>
            <Select value={status} onValueChange={handleStatusUpdate} disabled={isUpdating}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor('pending')}`} />
                    Pending
                  </div>
                </SelectItem>
                <SelectItem value="processing">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor('processing')}`} />
                    Processing
                  </div>
                </SelectItem>
                <SelectItem value="shipped">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor('shipped')}`} />
                    Shipped
                  </div>
                </SelectItem>
                <SelectItem value="delivered">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor('delivered')}`} />
                    Delivered
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor('cancelled')}`} />
                    Cancelled
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Left column */}
          <div className="space-y-4">
            {/* Product Info */}
            <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
              <img
                src={order.product?.thumbnail || '/placeholder.svg'}
                alt={order.product?.name || 'Product'}
                className="h-14 w-14 rounded border object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{order.product?.name || 'Unknown Product'}</p>
                <div className="mt-1 text-xs text-muted-foreground">
                  Qty: {order.quantity || 0} • Total: £{(order.totalAmount || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Delivery Address */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Delivery Address</h3>
              </div>
              <div className="space-y-0.5 pl-6 text-sm">
                <p className="font-medium">{order.buyer?.name || 'N/A'}</p>
                <p className="text-muted-foreground">{order.buyer?.shippingAddress?.line1 || 'N/A'}</p>
                {order.buyer?.shippingAddress?.line2 && (
                  <p className="text-muted-foreground">{order.buyer.shippingAddress.line2}</p>
                )}
                <p className="text-muted-foreground">
                  {order.buyer?.shippingAddress?.city || 'N/A'}, {order.buyer?.shippingAddress?.state || 'N/A'}{' '}
                  {order.buyer?.shippingAddress?.postalCode || 'N/A'}
                </p>
                <p className="text-muted-foreground">{order.buyer?.shippingAddress?.country || 'N/A'}</p>
              </div>
            </div>

            {/* Shipping Method */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Shipping Method</h3>
              </div>
              <div className="pl-6">
                <p className="text-sm">{order.shippingMethod || 'Standard Shipping'}</p>
              </div>
            </div>

            {/* Tracking Number */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Tracking Number</h3>
              </div>
              <div className="space-y-2 pl-6">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSaveTrackingNumber}
                    disabled={isSavingTracking || !trackingNumber.trim()}
                    size="sm"
                  >
                    {isSavingTracking ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                {order.trackingNumber && (
                  <p className="text-xs text-muted-foreground">Current: {order.trackingNumber}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row">
          <Button onClick={handlePrintLabel} className="flex-1">
            <Printer className="mr-2 h-4 w-4" />
            Print Shipping Label
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onMessageBuyer();
              onClose();
            }}
            className="flex-1"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Message Buyer
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
