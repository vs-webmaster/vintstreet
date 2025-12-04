
-- Enable default filters (Categories, Brand, Colour, Size) for Men's, Women's, and Footwear categories

-- Men's category filters
INSERT INTO category_attribute_filters (category_id, filter_type, filter_name, is_active, display_order, show_in_top_line)
VALUES
  ('3e865df9-3752-4773-be32-b52cc53bcd34', 'default', 'categories', true, 0, true),
  ('3e865df9-3752-4773-be32-b52cc53bcd34', 'default', 'brand', true, 1, true),
  ('3e865df9-3752-4773-be32-b52cc53bcd34', 'default', 'colour', true, 2, true),
  ('3e865df9-3752-4773-be32-b52cc53bcd34', 'default', 'size', true, 3, true)
ON CONFLICT DO NOTHING;

-- Women's category filters
INSERT INTO category_attribute_filters (category_id, filter_type, filter_name, is_active, display_order, show_in_top_line)
VALUES
  ('819da29a-d308-4df2-9978-c73016a0edaa', 'default', 'categories', true, 0, true),
  ('819da29a-d308-4df2-9978-c73016a0edaa', 'default', 'brand', true, 1, true),
  ('819da29a-d308-4df2-9978-c73016a0edaa', 'default', 'colour', true, 2, true),
  ('819da29a-d308-4df2-9978-c73016a0edaa', 'default', 'size', true, 3, true)
ON CONFLICT DO NOTHING;

-- Footwear category filters
INSERT INTO category_attribute_filters (category_id, filter_type, filter_name, is_active, display_order, show_in_top_line)
VALUES
  ('087ba342-52b1-4447-9c1b-69f92d58aca4', 'default', 'categories', true, 0, true),
  ('087ba342-52b1-4447-9c1b-69f92d58aca4', 'default', 'brand', true, 1, true),
  ('087ba342-52b1-4447-9c1b-69f92d58aca4', 'default', 'colour', true, 2, true),
  ('087ba342-52b1-4447-9c1b-69f92d58aca4', 'default', 'size', true, 3, true)
ON CONFLICT DO NOTHING;
