-- Create buyer protection fees table for tiered pricing
CREATE TABLE public.buyer_protection_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_price NUMERIC NOT NULL DEFAULT 0,
  max_price NUMERIC,
  percentage NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.buyer_protection_fees ENABLE ROW LEVEL SECURITY;

-- Anyone can view fees
CREATE POLICY "Anyone can view buyer protection fees"
ON public.buyer_protection_fees
FOR SELECT
USING (true);

-- Only admins can manage fees
CREATE POLICY "Admins can manage buyer protection fees"
ON public.buyer_protection_fees
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Insert default tiers
INSERT INTO public.buyer_protection_fees (min_price, max_price, percentage) VALUES
(0, 10, 5),
(10.01, 30, 4),
(30.01, 100, 3),
(100.01, NULL, 2);