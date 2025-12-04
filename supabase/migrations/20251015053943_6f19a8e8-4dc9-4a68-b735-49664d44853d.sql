-- Create currency rates table
CREATE TABLE currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT DEFAULT 'GBP',
  target_currency TEXT NOT NULL,
  rate DECIMAL(12, 6) NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);

-- Enable RLS
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can read rates" ON currency_rates FOR SELECT USING (true);

-- Add preferred_currency to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'GBP';

-- Update orders table to track currency information
ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount_gbp DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS display_currency TEXT DEFAULT 'GBP';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS display_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS exchange_rate_used DECIMAL(12,6);