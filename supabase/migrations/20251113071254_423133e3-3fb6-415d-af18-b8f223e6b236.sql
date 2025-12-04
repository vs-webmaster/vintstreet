-- Add list_type column to mega_menu_custom_lists
ALTER TABLE mega_menu_custom_lists 
ADD COLUMN list_type text NOT NULL DEFAULT 'standard';

-- Add comment explaining the types
COMMENT ON COLUMN mega_menu_custom_lists.list_type IS 'Type of list: standard (title + custom links) or header-links (level 2 categories styled as headers)';