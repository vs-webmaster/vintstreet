-- Create shipping_options table
CREATE TABLE public.shipping_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.seller_profiles(user_id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.shipping_providers(id) ON DELETE CASCADE,
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_options ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own shipping options
CREATE POLICY "Sellers can view their own shipping options"
  ON public.shipping_options
  FOR SELECT
  USING (auth.uid() = seller_id);

-- Sellers can create their own shipping options
CREATE POLICY "Sellers can create their own shipping options"
  ON public.shipping_options
  FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own shipping options
CREATE POLICY "Sellers can update their own shipping options"
  ON public.shipping_options
  FOR UPDATE
  USING (auth.uid() = seller_id);

-- Sellers can delete their own shipping options
CREATE POLICY "Sellers can delete their own shipping options"
  ON public.shipping_options
  FOR DELETE
  USING (auth.uid() = seller_id);

-- Buyers can view active shipping options for checkout
CREATE POLICY "Everyone can view active shipping options"
  ON public.shipping_options
  FOR SELECT
  USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_shipping_options_updated_at
  BEFORE UPDATE ON public.shipping_options
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default shipping options for existing sellers
INSERT INTO public.shipping_options (seller_id, name, description, estimated_days_min, estimated_days_max)
SELECT DISTINCT seller_id, 'Standard Shipping', 'Standard delivery', 3, 5
FROM public.listings
WHERE seller_id IS NOT NULL
ON CONFLICT DO NOTHING;