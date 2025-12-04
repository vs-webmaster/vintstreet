-- Drop redundant status fields, keeping only status column
ALTER TABLE listings DROP COLUMN IF EXISTS is_active;
ALTER TABLE listings DROP COLUMN IF EXISTS is_marketplace_listed;