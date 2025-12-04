-- Create junction table for multiple Level 4 categories per product
CREATE TABLE product_level4_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  sub_sub_subcategory_id uuid NOT NULL REFERENCES product_sub_sub_subcategories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, sub_sub_subcategory_id)
);

-- Add indexes for performance
CREATE INDEX idx_product_level4_product ON product_level4_categories(product_id);
CREATE INDEX idx_product_level4_category ON product_level4_categories(sub_sub_subcategory_id);

-- Enable RLS
ALTER TABLE product_level4_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Level 4 categories are viewable by everyone"
  ON product_level4_categories FOR SELECT
  USING (true);

CREATE POLICY "Sellers can manage their product level 4 categories"
  ON product_level4_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = product_level4_categories.product_id 
      AND listings.seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = product_level4_categories.product_id 
      AND listings.seller_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all level 4 categories"
  ON product_level4_categories FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));