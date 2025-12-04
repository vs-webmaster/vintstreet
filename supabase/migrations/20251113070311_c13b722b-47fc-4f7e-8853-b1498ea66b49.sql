-- Create table for multiple mega menu images
CREATE TABLE IF NOT EXISTS public.mega_menu_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id UUID NOT NULL REFERENCES public.mega_menu_layouts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_alt TEXT,
  image_link TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mega_menu_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active mega menu images"
  ON public.mega_menu_images
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage mega menu images"
  ON public.mega_menu_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Index for performance
CREATE INDEX idx_mega_menu_images_layout_id ON public.mega_menu_images(layout_id);
CREATE INDEX idx_mega_menu_images_display_order ON public.mega_menu_images(display_order);

-- Trigger for updated_at
CREATE TRIGGER update_mega_menu_images_updated_at
  BEFORE UPDATE ON public.mega_menu_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();