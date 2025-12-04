-- Create mega menu layouts table for template configuration
CREATE TABLE IF NOT EXISTS public.mega_menu_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL DEFAULT 'all-text-5col',
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_url TEXT,
  image_alt TEXT,
  image_column_start INTEGER,
  image_column_span INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id)
);

-- Add RLS policies
ALTER TABLE public.mega_menu_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mega menu layouts are viewable by everyone"
  ON public.mega_menu_layouts
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage mega menu layouts"
  ON public.mega_menu_layouts
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

-- Create trigger for updated_at
CREATE TRIGGER update_mega_menu_layouts_updated_at
  BEFORE UPDATE ON public.mega_menu_layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.mega_menu_layouts IS 'Stores layout configuration for each category mega menu including column content types and image placement';