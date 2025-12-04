-- Add columns to support default filter management
ALTER TABLE category_attribute_filters
ADD COLUMN filter_type text DEFAULT 'attribute' CHECK (filter_type IN ('attribute', 'default')),
ADD COLUMN filter_name text;

-- Make attribute_id nullable since default filters won't have an attribute_id
ALTER TABLE category_attribute_filters
ALTER COLUMN attribute_id DROP NOT NULL;

-- Add constraint to ensure either attribute_id or filter_name is set
ALTER TABLE category_attribute_filters
ADD CONSTRAINT check_filter_identifier CHECK (
  (filter_type = 'attribute' AND attribute_id IS NOT NULL AND filter_name IS NULL) OR
  (filter_type = 'default' AND filter_name IS NOT NULL AND attribute_id IS NULL)
);

COMMENT ON COLUMN category_attribute_filters.filter_type IS 'Type of filter: attribute (dynamic product attribute) or default (built-in filter like Brand, Colour, etc)';
COMMENT ON COLUMN category_attribute_filters.filter_name IS 'Name of default filter (categories, brand, colour, size) - only used when filter_type is default';