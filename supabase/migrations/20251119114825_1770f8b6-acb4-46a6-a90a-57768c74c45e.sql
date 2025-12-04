-- Create shipping_labels table to store shipping label data
CREATE TABLE IF NOT EXISTS public.shipping_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tracking_number TEXT,
  label_type TEXT NOT NULL CHECK (label_type IN ('ninja', 'voila')),
  label_uri TEXT,
  label_base64 TEXT,
  qr_code_uri TEXT,
  qr_code_base64 TEXT,
  barcode_base64 TEXT,
  label_data JSONB,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_shipping_labels_order_id ON public.shipping_labels(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_tracking_number ON public.shipping_labels(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_label_type ON public.shipping_labels(label_type);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_generated_at ON public.shipping_labels(generated_at);

-- Enable Row Level Security
ALTER TABLE public.shipping_labels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Sellers can view labels for their orders
CREATE POLICY "Sellers can view their order labels"
ON public.shipping_labels
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = shipping_labels.order_id
    AND orders.seller_id = auth.uid()
  )
);

-- Buyers can view labels for their orders
CREATE POLICY "Buyers can view their order labels"
ON public.shipping_labels
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = shipping_labels.order_id
    AND orders.buyer_id = auth.uid()
  )
);

-- Service role can insert/update labels (for webhooks and edge functions)
CREATE POLICY "Service role can manage labels"
ON public.shipping_labels
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_shipping_labels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shipping_labels_updated_at
BEFORE UPDATE ON public.shipping_labels
FOR EACH ROW
EXECUTE FUNCTION public.update_shipping_labels_updated_at();

-- Add comment
COMMENT ON TABLE public.shipping_labels IS 'Stores shipping label data for orders, supporting both Ninja (warehouse) and Voila (C2C) label types';

