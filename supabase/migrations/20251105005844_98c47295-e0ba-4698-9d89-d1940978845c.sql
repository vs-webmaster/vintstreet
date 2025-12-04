-- Create footer_columns table
CREATE TABLE IF NOT EXISTS public.footer_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create footer_links table
CREATE TABLE IF NOT EXISTS public.footer_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id uuid NOT NULL REFERENCES public.footer_columns(id) ON DELETE CASCADE,
  label text NOT NULL,
  url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.footer_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for footer_columns
CREATE POLICY "Anyone can view footer columns"
  ON public.footer_columns FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admins can manage footer columns"
  ON public.footer_columns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for footer_links
CREATE POLICY "Anyone can view footer links"
  ON public.footer_links FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admins can manage footer links"
  ON public.footer_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Create indexes
CREATE INDEX idx_footer_columns_display_order ON public.footer_columns(display_order);
CREATE INDEX idx_footer_links_display_order ON public.footer_links(display_order);

-- Add updated_at triggers
CREATE TRIGGER update_footer_columns_updated_at
  BEFORE UPDATE ON public.footer_columns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_footer_links_updated_at
  BEFORE UPDATE ON public.footer_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();