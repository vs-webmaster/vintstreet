-- Create category_grid_images table
CREATE TABLE category_grid_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  button_text TEXT NOT NULL,
  link TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on category_id for faster queries
CREATE INDEX idx_category_grid_images_category_id ON category_grid_images(category_id);

-- Enable RLS
ALTER TABLE category_grid_images ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view category grid images
CREATE POLICY "Anyone can view category grid images"
  ON category_grid_images
  FOR SELECT
  USING (true);

-- Policy: Super admins can manage category grid images
CREATE POLICY "Super admins can manage category grid images"
  ON category_grid_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );