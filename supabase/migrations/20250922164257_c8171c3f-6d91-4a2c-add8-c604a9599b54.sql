-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  stream_id TEXT NOT NULL,
  order_amount NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'completed',
  delivery_status TEXT NOT NULL DEFAULT 'processing',
  tracking_number TEXT,
  funds_available_at TIMESTAMP WITH TIME ZONE,
  funds_released BOOLEAN DEFAULT false,
  buyer_confirmed BOOLEAN DEFAULT false,
  issue_reported BOOLEAN DEFAULT false,
  issue_description TEXT DEFAULT NULL,
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'clearing', 'available', 'paid_out', 'on_hold')),
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add check constraint for valid delivery statuses
ALTER TABLE public.orders
ADD CONSTRAINT orders_delivery_status_check 
CHECK (delivery_status IN ('processing', 'shipped', 'delivered', 'cancelled'));

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Sellers can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = seller_id);

CREATE POLICY "Buyers can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = buyer_id);

CREATE POLICY "Users can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update their order status" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = seller_id);

-- Create trigger for updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_listing_seller ON public.orders(listing_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_payout_status ON public.orders(payout_status, funds_available_at);
CREATE INDEX IF NOT EXISTS idx_orders_seller_payout ON public.orders(seller_id, payout_status, funds_released);

-- Add some sample data for testing
INSERT INTO public.orders (listing_id, buyer_id, seller_id, stream_id, order_amount, quantity, status, order_date) VALUES
(gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), '1', 89.99, 1, 'completed', now() - interval '2 days'),
(gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), '1', 199.99, 1, 'completed', now() - interval '1 day'),
(gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), '2', 59.99, 2, 'completed', now() - interval '3 hours'),
(gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), '3', 129.99, 1, 'pending', now() - interval '1 hour');

COMMENT ON COLUMN public.orders.delivery_status IS 'Delivery status: processing, shipped, delivered, or cancelled';