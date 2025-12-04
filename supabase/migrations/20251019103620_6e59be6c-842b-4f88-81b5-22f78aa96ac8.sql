-- Drop foreign key columns from listings table
ALTER TABLE listings 
  DROP COLUMN IF EXISTS colour_id,
  DROP COLUMN IF EXISTS material_id,
  DROP COLUMN IF EXISTS condition_id;

-- Drop the bids table (empty table)
DROP TABLE IF EXISTS bids CASCADE;

-- Drop single attribute tables
DROP TABLE IF EXISTS condition_options CASCADE;
DROP TABLE IF EXISTS colour_options CASCADE;
DROP TABLE IF EXISTS material_options CASCADE;