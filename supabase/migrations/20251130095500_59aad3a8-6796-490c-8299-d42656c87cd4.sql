-- Add show_in_top_line column to category_attribute_filters table
ALTER TABLE category_attribute_filters
ADD COLUMN show_in_top_line boolean DEFAULT false;

-- Add comment explaining the column
COMMENT ON COLUMN category_attribute_filters.show_in_top_line IS 'When true, this filter appears on the top filter line. When false, it appears in More Filters.';
