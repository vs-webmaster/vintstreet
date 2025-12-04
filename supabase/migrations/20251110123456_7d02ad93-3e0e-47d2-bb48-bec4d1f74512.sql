-- Create mega-menu-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('mega-menu-images', 'mega-menu-images', true);

-- RLS policies for mega-menu-images bucket
CREATE POLICY "Anyone can view mega menu images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'mega-menu-images');

CREATE POLICY "Admins can upload mega menu images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'mega-menu-images' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update mega menu images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'mega-menu-images' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can delete mega menu images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'mega-menu-images' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );