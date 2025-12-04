-- Add system_name column to mega_menu_custom_lists
ALTER TABLE mega_menu_custom_lists 
ADD COLUMN system_name text;

-- Populate existing records with system_name based on current name (slugified)
UPDATE mega_menu_custom_lists 
SET system_name = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '_', 'g'));

-- Make system_name required and unique
ALTER TABLE mega_menu_custom_lists 
ALTER COLUMN system_name SET NOT NULL,
ADD CONSTRAINT mega_menu_custom_lists_system_name_unique UNIQUE (system_name);