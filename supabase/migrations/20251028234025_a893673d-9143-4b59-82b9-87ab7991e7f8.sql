-- Add display_label column to attributes table for user-friendly display
ALTER TABLE attributes ADD COLUMN IF NOT EXISTS display_label text;

-- Set display_label to name for existing attributes
UPDATE attributes SET display_label = name WHERE display_label IS NULL;