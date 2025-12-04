-- Create seller fees table
CREATE TABLE public.seller_fees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fee_type text NOT NULL CHECK (fee_type IN ('marketplace', 'auction')),
  percentage numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(fee_type)
);

-- Enable RLS
ALTER TABLE public.seller_fees ENABLE ROW LEVEL SECURITY;

-- Anyone can view seller fees
CREATE POLICY "Anyone can view seller fees"
ON public.seller_fees
FOR SELECT
USING (true);

-- Only admins can manage seller fees
CREATE POLICY "Admins can manage seller fees"
ON public.seller_fees
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_seller_fees_updated_at
BEFORE UPDATE ON public.seller_fees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default fee records
INSERT INTO public.seller_fees (fee_type, percentage) VALUES
('marketplace', 10),
('auction', 12);