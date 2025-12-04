import { useState } from 'react';
import { MapPin, Truck, User, Package, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateDeliveryStatus } from '@/services/orders';
import { isFailure } from '@/types/api';

interface AdminOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    order_amount: number;
    quantity: number;
    delivery_status?: string | null;
    order_date: string;
    listings?: {
      product_name: string;
      thumbnail: string;
    } | null;
    buyer_profile?: {
      full_name: string;
      username: string;
    } | null;
    seller_profile?: {
      full_name: string;
      username: string;
    } | null;
    buyer_details?: {
      shipping_first_name: string;
      shipping_last_name: string;
      shipping_address_line1: string;
      shipping_address_line2: string;
      shipping_city: string;
      shipping_state: string;
      shipping_postal_code: string;
      shipping_country: string;
      shipping_phone: string;
    } | null;
  };
  onStatusUpdate: () => void;
}

export const AdminOrderDetailsModal = ({ isOpen, onClose, order, onStatusUpdate }: AdminOrderDetailsModalProps) => {
  const [status, setStatus] = useState(order.delivery_status || 'pending');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const result = await updateDeliveryStatus(order.id, newStatus);

      if (isFailure(result)) {
        throw result.error;
      }

      setStatus(newStatus);
      toast.success('Order status updated');
      onStatusUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrintLabel = () => {
    // Generate a simple shipping label
    const labelContent = `
      <html>
        <head>
          <title>Shipping Label - Order #${order.id.slice(0, 8).toUpperCase()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .label { border: 2px solid #000; padding: 20px; max-width: 600px; }
            .header { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .section { margin: 15px 0; }
            .section-title { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
            .barcode { text-align: center; font-size: 32px; letter-spacing: 3px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="header">SHIPPING LABEL</div>
            <div class="barcode">*${order.id.slice(0, 8).toUpperCase()}*</div>
            
            <div class="section">
              <div class="section-title">SHIP TO:</div>
              <div>${buyerName}</div>
              ${
                order.buyer_details
                  ? `
                <div>${order.buyer_details.shipping_address_line1}</div>
                ${
                  order.buyer_details.shipping_address_line2
                    ? `<div>${order.buyer_details.shipping_address_line2}</div>`
                    : ''
                }
                <div>${order.buyer_details.shipping_city}, ${order.buyer_details.shipping_state} ${
                  order.buyer_details.shipping_postal_code
                }</div>
                <div>${order.buyer_details.shipping_country}</div>
                ${order.buyer_details.shipping_phone ? `<div>Phone: ${order.buyer_details.shipping_phone}</div>` : ''}
              `
                  : '<div>No address available</div>'
              }
            </div>
            
            <div class="section">
              <div class="section-title">ORDER DETAILS:</div>
              <div>Order #: ${order.id.slice(0, 8).toUpperCase()}</div>
              <div>Product: ${order.listings?.product_name || 'Unknown Product'}</div>
              <div>Quantity: ${order.quantity}</div>
              <div>Date: ${new Date(order.order_date).toLocaleDateString('en-GB')}</div>
            </div>
            
            ${
              trackingNumber
                ? `
              <div class="section">
                <div class="section-title">TRACKING NUMBER:</div>
                <div style="font-size: 18px; font-weight: bold;">${trackingNumber}</div>
              </div>
            `
                : ''
            }
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(labelContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const buyerName =
    order.buyer_details?.shipping_first_name && order.buyer_details?.shipping_last_name
      ? `${order.buyer_details.shipping_first_name} ${order.buyer_details.shipping_last_name}`
      : order.buyer_profile?.full_name || order.buyer_profile?.username || 'Unknown';

  const sellerName = order.seller_profile?.full_name || order.seller_profile?.username || 'Unknown';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-4 md:max-w-4xl md:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Order #{order.id.slice(0, 8).toUpperCase()}</DialogTitle>
            <Badge
              variant={
                status === 'delivered'
                  ? 'default'
                  : status === 'shipped'
                    ? 'secondary'
                    : status === 'cancelled'
                      ? 'destructive'
                      : 'outline'
              }
            >
              {status}
            </Badge>
          </div>
          <DialogDescription>
            Order placed on {new Date(order.order_date).toLocaleDateString('en-GB')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-3">
            {/* Product Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Product</h3>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                <img
                  src={order.listings?.thumbnail || '/placeholder.svg'}
                  alt={order.listings?.product_name || 'Product'}
                  className="h-12 w-12 rounded border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{order.listings?.product_name || 'Unknown Product'}</p>
                  <p className="text-xs text-muted-foreground">Qty: {order.quantity}</p>
                  <p className="text-sm font-semibold">£{order.order_amount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Buyer Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Buyer</h3>
              </div>
              <div className="space-y-1 pl-6">
                <p className="text-sm font-medium">{buyerName}</p>
                {order.buyer_details?.shipping_phone && (
                  <p className="text-xs text-muted-foreground">Phone: {order.buyer_details.shipping_phone}</p>
                )}
              </div>
            </div>

            {/* Seller Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Seller</h3>
              </div>
              <div className="pl-6">
                <p className="text-sm font-medium">{sellerName}</p>
              </div>
            </div>

            {/* Order Date */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Order Date</h3>
              <p className="pl-0 text-sm text-muted-foreground">
                {new Date(order.order_date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Shipping Address */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Shipping Address</h3>
              </div>
              <div className="space-y-1 pl-6">
                {order.buyer_details ? (
                  <>
                    <p className="text-sm">{order.buyer_details.shipping_address_line1}</p>
                    {order.buyer_details.shipping_address_line2 && (
                      <p className="text-sm">{order.buyer_details.shipping_address_line2}</p>
                    )}
                    <p className="text-sm">
                      {order.buyer_details.shipping_city}, {order.buyer_details.shipping_state}{' '}
                      {order.buyer_details.shipping_postal_code}
                    </p>
                    <p className="text-sm">{order.buyer_details.shipping_country}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No address available</p>
                )}
              </div>
            </div>

            {/* Order Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold">
                Delivery Status
              </Label>
              <Select value={status} onValueChange={handleStatusUpdate} disabled={isUpdating}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Delivery Tracking */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <Label htmlFor="tracking" className="text-sm font-semibold">
                  Tracking Number
                </Label>
              </div>
              <div className="space-y-2">
                <Input
                  id="tracking"
                  placeholder="Enter tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Add tracking info for customer notifications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t pt-4">
          <Button variant="default" onClick={handlePrintLabel} className="flex-1">
            <Printer className="mr-2 h-4 w-4" />
            Print Shipping Label
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
