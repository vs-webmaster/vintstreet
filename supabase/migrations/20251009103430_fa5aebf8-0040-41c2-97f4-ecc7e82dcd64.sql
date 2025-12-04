-- Create brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on brands table
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Brands are viewable by everyone
CREATE POLICY "Brands are viewable by everyone"
ON public.brands
FOR SELECT
USING (true);

-- Super admins can manage brands
CREATE POLICY "Super admins can insert brands"
ON public.brands
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update brands"
ON public.brands
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete brands"
ON public.brands
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_brands_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add new columns to listings table
ALTER TABLE public.listings
ADD COLUMN discounted_price NUMERIC,
ADD COLUMN brand_id UUID REFERENCES public.brands(id),
ADD COLUMN offers_enabled BOOLEAN DEFAULT true,
ADD COLUMN product_images TEXT[] DEFAULT '{}';

-- Create index for brand lookups
CREATE INDEX idx_listings_brand_id ON public.listings(brand_id);

-- Insert some default brands
INSERT INTO public.brands (name, description) VALUES
('Nike', 'Athletic footwear and apparel'),
('Adidas', 'Sports clothing and accessories'),
('Supreme', 'Streetwear and skateboarding brand'),
('Vintage', 'Vintage and retro items'),
('Unbranded', 'Generic or unbranded items');