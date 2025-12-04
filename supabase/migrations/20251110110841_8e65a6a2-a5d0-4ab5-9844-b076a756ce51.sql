-- Create shipping bands table
CREATE TABLE IF NOT EXISTS shipping_bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_weight NUMERIC NOT NULL,
  max_weight NUMERIC NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shipping provider prices table (links providers to shipping bands)
CREATE TABLE IF NOT EXISTS shipping_provider_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES shipping_providers(id) ON DELETE CASCADE,
  band_id UUID NOT NULL REFERENCES shipping_bands(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(provider_id, band_id)
);

-- Enable RLS
ALTER TABLE shipping_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_provider_prices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shipping_bands
CREATE POLICY "Shipping bands are viewable by everyone"
  ON shipping_bands FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage shipping bands"
  ON shipping_bands FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for shipping_provider_prices
CREATE POLICY "Provider prices are viewable by everyone"
  ON shipping_provider_prices FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage provider prices"
  ON shipping_provider_prices FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Insert default shipping bands
INSERT INTO shipping_bands (name, min_weight, max_weight, display_order) VALUES
('Small (0-0.5kg)', 0, 0.50, 1),
('Medium (0.51-1.5kg)', 0.51, 1.50, 2),
('Large (1.51-3kg)', 1.51, 3, 3);