-- Create table for shop video section content
CREATE TABLE IF NOT EXISTS public.shop_video_section (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  subtitle TEXT,
  video_url TEXT,
  phone_mockup_url TEXT,
  button_text TEXT,
  button_link TEXT,
  button_bg_color TEXT DEFAULT '#000000',
  button_text_color TEXT DEFAULT '#FFFFFF',
  feature_1_image TEXT,
  feature_1_text TEXT,
  feature_1_link TEXT,
  feature_2_image TEXT,
  feature_2_text TEXT,
  feature_2_link TEXT,
  feature_3_image TEXT,
  feature_3_text TEXT,
  feature_3_link TEXT,
  feature_4_image TEXT,
  feature_4_text TEXT,
  feature_4_link TEXT,
  feature_5_image TEXT,
  feature_5_text TEXT,
  feature_5_link TEXT,
  feature_6_image TEXT,
  feature_6_text TEXT,
  feature_6_link TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_video_section ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active content
CREATE POLICY "Anyone can view shop video section"
  ON public.shop_video_section
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can manage shop video section
CREATE POLICY "Authenticated users can manage shop video section"
  ON public.shop_video_section
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Only super admins can insert
CREATE POLICY "Super admins can insert shop video section"
  ON public.shop_video_section
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Policy: Only super admins can update
CREATE POLICY "Super admins can update shop video section"
  ON public.shop_video_section
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Policy: Only super admins can delete
CREATE POLICY "Super admins can delete shop video section"
  ON public.shop_video_section
  FOR DELETE
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Add trigger for updated_at
CREATE TRIGGER update_shop_video_section_updated_at
  BEFORE UPDATE ON public.shop_video_section
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default content
INSERT INTO public.shop_video_section (title, subtitle, is_active)
VALUES ('Personal shopping that never sleeps', 'Ditch the baskets, shop what you want in real time.', true);