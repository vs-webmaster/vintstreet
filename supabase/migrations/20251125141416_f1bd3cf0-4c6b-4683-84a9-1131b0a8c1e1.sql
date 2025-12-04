-- Add weight columns to shipping_provider_prices to make them provider-specific
ALTER TABLE shipping_provider_prices 
ADD COLUMN IF NOT EXISTS min_weight NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_weight NUMERIC DEFAULT 0;

-- Add name column to identify weight bands per provider
ALTER TABLE shipping_provider_prices
ADD COLUMN IF NOT EXISTS band_name TEXT;

-- Update existing records to copy weights from their linked bands
UPDATE shipping_provider_prices spp
SET 
  min_weight = sb.min_weight,
  max_weight = sb.max_weight,
  band_name = sb.name
FROM shipping_bands sb
WHERE spp.band_id = sb.id AND (spp.min_weight IS NULL OR spp.min_weight = 0);

-- Make band_id nullable since we'll use provider-specific weights now
ALTER TABLE shipping_provider_prices 
ALTER COLUMN band_id DROP NOT NULL;