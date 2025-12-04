-- Create table for custom mega menu lists
CREATE TABLE mega_menu_custom_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES master_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for custom list items
CREATE TABLE mega_menu_custom_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES mega_menu_custom_lists(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE mega_menu_custom_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE mega_menu_custom_list_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom lists
CREATE POLICY "Custom lists are viewable by everyone"
  ON mega_menu_custom_lists FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage custom lists"
  ON mega_menu_custom_lists FOR ALL
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

-- RLS policies for custom list items
CREATE POLICY "Custom list items are viewable by everyone"
  ON mega_menu_custom_list_items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage custom list items"
  ON mega_menu_custom_list_items FOR ALL
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

-- Create indexes for better performance
CREATE INDEX idx_custom_lists_category ON mega_menu_custom_lists(category_id);
CREATE INDEX idx_custom_list_items_list ON mega_menu_custom_list_items(list_id);
CREATE INDEX idx_custom_lists_active ON mega_menu_custom_lists(is_active);
CREATE INDEX idx_custom_list_items_active ON mega_menu_custom_list_items(is_active);