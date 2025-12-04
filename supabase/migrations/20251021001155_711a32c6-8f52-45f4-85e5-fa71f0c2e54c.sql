-- Create shipping providers table for system-wide shipping options
CREATE TABLE IF NOT EXISTS public.shipping_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_providers ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active shipping providers
CREATE POLICY "Everyone can view active shipping providers"
  ON public.shipping_providers
  FOR SELECT
  USING (is_active = true);

-- Policy: Super admins can view all providers
CREATE POLICY "Super admins can view all providers"
  ON public.shipping_providers
  FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Policy: Super admins can manage shipping providers
CREATE POLICY "Super admins can manage shipping providers"
  ON public.shipping_providers
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Add provider_id to shipping_options table
ALTER TABLE public.shipping_options 
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.shipping_providers(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_shipping_options_provider_id ON public.shipping_options(provider_id);
CREATE INDEX IF NOT EXISTS idx_shipping_providers_active ON public.shipping_providers(is_active);

-- Insert initial shipping providers
INSERT INTO public.shipping_providers (name, description, display_order)
VALUES 
  ('DPD', 'Fast and reliable parcel delivery service', 1),
  ('Yodel', 'Flexible delivery options with local service', 2),
  ('Evri', 'Convenient delivery to lockers and stores', 3)
ON CONFLICT (name) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_shipping_providers_updated_at
  BEFORE UPDATE ON public.shipping_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();