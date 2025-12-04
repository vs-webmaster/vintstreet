-- Create app_content_links table for text and link pairs
CREATE TABLE IF NOT EXISTS app_content_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  link text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_content_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view links"
  ON app_content_links
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage links"
  ON app_content_links
  FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );